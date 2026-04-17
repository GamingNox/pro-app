// ══ Admin email notifications ════════════════════════════
// POST /api/notify — sends an email to the admin address whenever a
// significant event occurs (new signup, beta request, support ticket...).
//
// Uses the Resend HTTP API (https://resend.com). Free tier: 100 emails/day,
// no domain verification needed when sending from onboarding@resend.dev.
//
// REQUIRED ENV VARS (set in Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY   — get one at https://resend.com/api-keys (free account)
//   ADMIN_EMAIL      — override recipient (defaults to clientbase.fr@gmail.com)
//
// If RESEND_API_KEY is missing, the route still returns 200 and logs a
// warning — so the app keeps working while the key isn't set.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function logActivity(payload: NotifyPayload): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const typeMap: Record<string, string> = {
      signup: "signup",
      beta_request: "beta_request",
      beta_approved: "admin_action",
      beta_rejected: "admin_action",
      support_request: "support",
      generic: "generic",
    };
    const description =
      payload.type === "signup" ? `Nouveau compte : ${payload.userName || payload.userEmail || "?"}`
      : payload.type === "beta_request" ? `Demande bêta : ${payload.userEmail || "?"}`
      : payload.type === "support_request" ? `Message support : ${payload.userEmail || "?"}`
      : payload.message || `Événement : ${payload.type}`;
    await supabase.from("activity_log").insert({
      type: typeMap[payload.type] || payload.type,
      user_email: payload.userEmail || null,
      description,
      metadata: payload.metadata || null,
    });
  } catch (e) {
    console.warn("[notify] activity_log insert failed:", e);
  }
}

// IMPORTANT: this version of Next.js treats route handlers as static by
// default. Force dynamic so every call hits the server.
export const dynamic = "force-dynamic";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "clientbase.fr@gmail.com";
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "noreply@clientbase.fr";
const FROM = `Client Base <${FROM_ADDRESS}>`;

type NotifyPayload = {
  type:
    | "signup"
    | "beta_request"
    | "support_request"
    | "beta_approved"
    | "beta_rejected"
    | "generic";
  userName?: string;
  userEmail?: string;
  message?: string;
  metadata?: Record<string, unknown>;
};

function formatBody(payload: NotifyPayload): { subject: string; html: string; text: string } {
  const when = new Date().toLocaleString("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  });
  const who = payload.userName || payload.userEmail || "un utilisateur";

  const labels: Record<NotifyPayload["type"], string> = {
    signup: "Nouvelle inscription",
    beta_request: "Nouvelle demande bêta",
    support_request: "Nouveau message de support",
    beta_approved: "Accès bêta accordé",
    beta_rejected: "Demande bêta refusée",
    generic: "Événement système",
  };

  const subject = `[Client Base] ${labels[payload.type]} — ${who}`;
  const summary = payload.message || "(aucun détail)";
  const metaLines = payload.metadata
    ? Object.entries(payload.metadata).map(([k, v]) => `  • ${k}: ${String(v)}`).join("\n")
    : "";

  const text = [
    `▪ ${labels[payload.type]}`,
    ``,
    `Quand  : ${when}`,
    `Qui    : ${who}`,
    payload.userEmail ? `Email  : ${payload.userEmail}` : null,
    ``,
    `Résumé : ${summary}`,
    metaLines ? `\n${metaLines}` : null,
    ``,
    `— clientbase.fr`,
  ].filter(Boolean).join("\n");

  const html = `
    <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px; color: #18181B;">
      <div style="background: linear-gradient(135deg, #8B5CF6, #6D28D9); border-radius: 16px; padding: 20px; color: white;">
        <p style="margin: 0; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.85;">Notification admin</p>
        <h1 style="margin: 6px 0 0; font-size: 22px; font-weight: 700;">${labels[payload.type]}</h1>
      </div>
      <div style="background: white; border: 1px solid #E4E4E7; border-radius: 16px; padding: 20px; margin-top: 12px;">
        <table cellpadding="4" style="width: 100%; font-size: 14px;">
          <tr><td style="color: #71717A; width: 80px;">Quand</td><td style="font-weight: 600;">${when}</td></tr>
          <tr><td style="color: #71717A;">Qui</td><td style="font-weight: 600;">${who}</td></tr>
          ${payload.userEmail ? `<tr><td style="color: #71717A;">Email</td><td style="font-weight: 600;">${payload.userEmail}</td></tr>` : ""}
        </table>
        <hr style="border: 0; border-top: 1px solid #F4F4F5; margin: 16px 0;" />
        <p style="margin: 0; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(summary)}</p>
        ${metaLines ? `<pre style="margin-top: 12px; padding: 12px; background: #FAFAF9; border-radius: 10px; font-size: 12px; overflow: auto;">${escapeHtml(metaLines)}</pre>` : ""}
      </div>
      <p style="margin-top: 16px; text-align: center; color: #A1A1AA; font-size: 11px;">clientbase.fr — notification automatique</p>
    </div>
  `;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: Request) {
  let payload: NotifyPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!payload?.type) {
    return NextResponse.json({ ok: false, error: "missing_type" }, { status: 400 });
  }

  // Fire-and-forget: log to activity_log so admins can see the event
  // in /admin-logs even if the email fails to deliver.
  void logActivity(payload);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[notify] RESEND_API_KEY is not set — event logged but no email sent");
    console.log("[notify]", payload);
    return NextResponse.json({ ok: true, delivered: false, reason: "no_api_key" });
  }

  const { subject, html, text } = formatBody(payload);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [ADMIN_EMAIL],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[notify] Resend API error:", res.status, body);
      return NextResponse.json({ ok: false, error: "resend_error", status: res.status, body }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, delivered: true, id: data?.id });
  } catch (e) {
    console.error("[notify] fetch threw:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
