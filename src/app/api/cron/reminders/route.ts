// ══ Automated reminder cron ══════════════════════════════
// Runs periodically via Vercel Cron (see vercel.json).
// Scans upcoming appointments and sends reminder emails according
// to each pro's automated_messages.reminder config (timing + segment).
//
// This endpoint is protected with the Vercel-provided CRON_SECRET
// header: if the request doesn't carry the matching Bearer token
// it returns 401.
//
// REQUIRED ENV:
//   CRON_SECRET                  — arbitrary secret, shared with Vercel Cron
//   SUPABASE_SERVICE_ROLE_KEY    — bypasses RLS; set in Vercel env vars
//   NEXT_PUBLIC_SUPABASE_URL     — already set
//   RESEND_API_KEY               — already set
//
// Idempotency: stores a marker in user_profiles.settings.reminder_sent
// (an array of appointmentId-timing pairs) so the same reminder is not
// fired twice. Kept small by pruning entries older than 7 days.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ── Types ──────────────────────────────────────────────
type Timing = "1h" | "4h" | "24h" | "48h";

interface MsgConfig {
  enabled: boolean;
  template: string;
  segment: string;
  timing?: Timing;
}

interface ReminderSentMarker {
  appointmentId: string;
  timing: Timing;
  sentAt: string; // ISO
}

interface UserProfileRow {
  id: string;
  name: string | null;
  business: string | null;
  email: string | null;
  settings: Record<string, unknown> | null;
}

interface AppointmentRow {
  id: string;
  user_id: string;
  client_id: string;
  date: string;
  time: string;
  title: string;
  status: string;
}

interface ClientRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  notes?: string | null;
}

// ── Supabase admin client (service role) ──────────────
function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  // Import here to avoid bundling at module scope if unused
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── Timing window match ────────────────────────────────
// Primary trigger: Supabase pg_cron (hourly). Fallback: Vercel Cron
// (daily at 9am, Hobby-plan constraint). With pg_cron every hour, a
// ±1h window catches every reminder reliably. The idempotency marker
// prevents double-sends if both triggers fire on the same appointment.
const WINDOW_MS = 60 * 60 * 1000;

function minutesFromTiming(t: Timing): number {
  return { "1h": 60, "4h": 240, "24h": 1440, "48h": 2880 }[t];
}

function matchesTimingWindow(appointmentDate: Date, nowMs: number, timing: Timing): boolean {
  const diff = appointmentDate.getTime() - nowMs;
  const target = minutesFromTiming(timing) * 60 * 1000;
  return diff > 0 && Math.abs(diff - target) <= WINDOW_MS;
}

// ── Segment filter ─────────────────────────────────────
function clientMatchesSegment(client: ClientRow, segment: string): boolean {
  if (segment === "all") return true;
  if (segment === "avec_email") return !!client.email;
  const notes = (client.notes || "").toLowerCase();
  if (segment === "vip") return notes.includes("[tag:vip]");
  if (segment === "reguliers") return notes.includes("[tag:regular]");
  if (segment === "nouveaux") return notes.includes("[tag:new]");
  // "manual" segment can't be resolved in a cron — treat as skip
  return false;
}

// ── Template rendering ─────────────────────────────────
function fillTemplate(tpl: string, vars: Record<string, string>): string {
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(v);
  }
  return out;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapHtml(title: string, body: string, business: string): string {
  const accent = "#5B4FE9";
  const deep = "#3B30B5";
  return `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#FAFAF9;font-family:-apple-system,system-ui,sans-serif;color:#18181B;">
  <div style="max-width:560px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,${accent},${deep});border-radius:16px 16px 0 0;padding:24px;color:white;">
      <p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;opacity:0.85;">${escapeHtml(business)}</p>
      <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;">${escapeHtml(title)}</h1>
    </div>
    <div style="background:white;border:1px solid #E4E4E7;border-top:none;border-radius:0 0 16px 16px;padding:24px;">
      <p style="margin:0;font-size:14px;line-height:1.6;">${escapeHtml(body).replace(/\n/g, "<br>")}</p>
    </div>
    <p style="text-align:center;color:#A1A1AA;font-size:11px;margin:16px 0 0;">clientbase.fr</p>
  </div>
</body></html>`;
}

// ── Resend send ────────────────────────────────────────
async function sendReminderEmail(to: string, subject: string, html: string, text: string, fromName: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { delivered: false, reason: "no_api_key" };
  const cleanFromName = fromName.replace(/[<>"']/g, "");
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: `${cleanFromName} <onboarding@resend.dev>`,
        to: [to],
        subject,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[cron-reminders] Resend error:", res.status, body);
      return { delivered: false, reason: "resend_error" };
    }
    return { delivered: true };
  } catch (e) {
    console.error("[cron-reminders] fetch threw:", e);
    return { delivered: false, reason: "network" };
  }
}

// ── Main handler ───────────────────────────────────────
async function runCron() {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return { ok: false, error: "missing_env", processed: 0, sent: 0 };
  }

  const now = new Date();
  const nowMs = now.getTime();
  // Only look at appointments in the next 72 hours (biggest window we care about)
  const futureCutoff = new Date(nowMs + 72 * 60 * 60 * 1000);
  const todayIso = now.toISOString().slice(0, 10);
  const cutoffIso = futureCutoff.toISOString().slice(0, 10);

  // 1. Fetch all pros that have a reminder config enabled
  const { data: profiles, error: profilesErr } = await supabase
    .from("user_profiles")
    .select("id, name, business, email, settings");
  if (profilesErr) {
    console.error("[cron-reminders] profiles fetch failed:", profilesErr);
    return { ok: false, error: "profiles_fetch", processed: 0, sent: 0 };
  }

  const eligible = ((profiles as unknown) as UserProfileRow[]).filter((p) => {
    const msgs = (p.settings?.["automated_messages"] as Record<string, MsgConfig> | undefined) || undefined;
    return msgs?.reminder?.enabled === true;
  });

  let processed = 0;
  let sent = 0;

  for (const pro of eligible) {
    const reminderCfg = (pro.settings!["automated_messages"] as Record<string, MsgConfig>).reminder;
    const timing = (reminderCfg.timing || "24h") as Timing;

    // 2. Fetch appointments for this pro in the next 72h, status confirmed
    const { data: appts } = await supabase
      .from("appointments")
      .select("id, user_id, client_id, date, time, title, status")
      .eq("user_id", pro.id)
      .eq("status", "confirmed")
      .gte("date", todayIso)
      .lte("date", cutoffIso);

    if (!appts || appts.length === 0) continue;

    // Idempotency: read the marker list from settings
    const markers = (pro.settings!["reminder_sent"] as ReminderSentMarker[] | undefined) || [];
    // Prune markers older than 7 days
    const cutoffSent = new Date(nowMs - 7 * 24 * 60 * 60 * 1000).toISOString();
    const prunedMarkers = markers.filter((m) => m.sentAt >= cutoffSent);
    let markersDirty = prunedMarkers.length !== markers.length;

    // 3. For each appointment, check if it's in the timing window
    for (const row of (appts as unknown) as AppointmentRow[]) {
      processed++;
      const [h, m] = row.time.split(":").map(Number);
      const apptDate = new Date(row.date);
      apptDate.setHours(h, m, 0, 0);

      if (!matchesTimingWindow(apptDate, nowMs, timing)) continue;

      // Already sent?
      const alreadySent = prunedMarkers.find((mk) => mk.appointmentId === row.id && mk.timing === timing);
      if (alreadySent) continue;

      // 4. Fetch the client
      const { data: clientData } = await supabase
        .from("clients")
        .select("id, first_name, last_name, email, notes")
        .eq("id", row.client_id)
        .single();
      if (!clientData) continue;
      const client = (clientData as unknown) as ClientRow;

      // Must have email
      if (!client.email) continue;

      // Segment filter
      if (!clientMatchesSegment(client, reminderCfg.segment || "all")) continue;

      // 5. Render template and send
      const dateFr = apptDate.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const timeFr = row.time;
      const businessName = pro.business || pro.name || "Client Base";

      const body = fillTemplate(reminderCfg.template, {
        nom: client.first_name,
        business: businessName,
        service: row.title,
        date: dateFr,
        heure: timeFr,
      });

      const subject = `Rappel — rendez-vous ${dateFr}`;
      const html = wrapHtml("Rappel rendez-vous", body, businessName);

      const result = await sendReminderEmail(client.email, subject, html, body, businessName);
      if (result.delivered) {
        sent++;
        prunedMarkers.push({ appointmentId: row.id, timing, sentAt: now.toISOString() });
        markersDirty = true;
      }
    }

    // Persist updated markers if anything changed
    if (markersDirty) {
      const nextSettings = { ...pro.settings, reminder_sent: prunedMarkers };
      await supabase.from("user_profiles").update({ settings: nextSettings }).eq("id", pro.id);
    }
  }

  return { ok: true, processed, sent, eligible: eligible.length };
}

// ── Auth + dispatch ────────────────────────────────────
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev mode: no protection
  const header = req.headers.get("authorization") || "";
  return header === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const result = await runCron();
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  return GET(req);
}
