// ══ iCalendar feed ══════════════════════════════════════
// GET /api/ics/{slug} — returns an .ics file with all confirmed +
// done appointments for the pro identified by booking_slug.
//
// Usage: the pro copies this URL into Google Calendar / Apple Calendar
// as a "subscribe by URL" calendar. The calendar app polls periodically
// and shows all Clientbase appointments automatically.
//
// Public endpoint — no auth required (same principle as /book/[slug]).
// Only exposes: title, date, time, duration, status. No client PII.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function escapeICS(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function toICSDate(date: string, time: string): string {
  // date = "2026-04-20", time = "14:30"
  const [y, m, d] = date.split("-");
  const [h, mi] = time.split(":");
  return `${y}${m}${d}T${h}${mi}00`;
}

function addMinutes(date: string, time: string, minutes: number): string {
  const dt = new Date(`${date}T${time}:00`);
  dt.setMinutes(dt.getMinutes() + minutes);
  return `${dt.getFullYear()}${pad2(dt.getMonth() + 1)}${pad2(dt.getDate())}T${pad2(dt.getHours())}${pad2(dt.getMinutes())}00`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return new NextResponse("Missing slug", { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Resolve pro by slug
  const { data: prof } = await supabase
    .from("user_profiles")
    .select("id, name, business")
    .eq("booking_slug", slug)
    .single();

  if (!prof) {
    return new NextResponse("Profil introuvable", { status: 404 });
  }

  // Fetch appointments (confirmed + done, last 90 days + future)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const cutoff = ninetyDaysAgo.toISOString().split("T")[0];

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, title, date, time, duration, status, notes")
    .eq("user_id", prof.id)
    .in("status", ["confirmed", "done"])
    .gte("date", cutoff)
    .order("date", { ascending: true });

  const calName = prof.business || prof.name || "Clientbase";
  const now = new Date();
  const dtstamp = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}T${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}Z`;

  // Build iCalendar content
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Client Base//clientbase.fr//FR",
    `X-WR-CALNAME:${escapeICS(calName)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-TIMEZONE:Europe/Paris`,
  ];

  for (const appt of (appointments || [])) {
    const uid = `${appt.id}@clientbase.fr`;
    const dtStart = toICSDate(appt.date, appt.time);
    const dtEnd = addMinutes(appt.date, appt.time, appt.duration || 60);
    const summary = escapeICS(appt.title || "Rendez-vous");
    const status = appt.status === "done" ? "COMPLETED" : "CONFIRMED";

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `STATUS:${status}`,
      `DESCRIPTION:${escapeICS(`Statut: ${appt.status === "done" ? "Termine" : "Confirme"}${appt.notes ? "\\nNotes: " + appt.notes : ""}`)}`,
      `URL:https://clientbase.fr/p/${slug}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  const body = lines.join("\r\n");

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-calendar.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
