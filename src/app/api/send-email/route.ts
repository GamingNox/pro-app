// ══ User-facing email sender ════════════════════════════
// POST /api/send-email — sends emails FROM a pro TO their clients.
// Distinct from /api/notify which sends ADMIN notifications.
//
// Uses Resend (https://resend.com). Same env var as /api/notify:
//   RESEND_API_KEY
//
// Payload (JSON):
//   {
//     to: string | string[]           — client email(s)
//     subject: string
//     html: string                    — body HTML (escaped by caller)
//     text?: string                   — plaintext fallback
//     fromName?: string               — display name (defaults to "Client Base")
//     replyTo?: string                — optional reply-to header
//     attachments?: Array<{
//       filename: string
//       content: string               — base64-encoded file content
//       contentType?: string          — e.g. "application/pdf"
//     }>
//   }
//
// If RESEND_API_KEY is missing, returns 200 with delivered:false so the UI
// can still show a friendly message.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Attachment = {
  filename: string;
  content: string; // base64
  contentType?: string;
};

type Payload = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  replyTo?: string;
  attachments?: Attachment[];
};

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!payload?.to || !payload?.subject || !payload?.html) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const toList = Array.isArray(payload.to) ? payload.to : [payload.to];
  const cleanTo = toList.filter((e) => typeof e === "string" && isValidEmail(e.trim())).map((e) => e.trim());
  if (cleanTo.length === 0) {
    return NextResponse.json({ ok: false, error: "no_valid_recipient" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[send-email] RESEND_API_KEY missing — email NOT sent");
    return NextResponse.json({ ok: true, delivered: false, reason: "no_api_key" });
  }

  const fromName = (payload.fromName || "Client Base").replace(/[<>"']/g, "");
  const from = `${fromName} <onboarding@resend.dev>`;

  const body: Record<string, unknown> = {
    from,
    to: cleanTo,
    subject: payload.subject,
    html: payload.html,
  };
  if (payload.text) body.text = payload.text;
  if (payload.replyTo && isValidEmail(payload.replyTo)) body.reply_to = payload.replyTo;
  if (payload.attachments && payload.attachments.length > 0) {
    body.attachments = payload.attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
    }));
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[send-email] Resend API error:", res.status, errBody);
      return NextResponse.json({ ok: false, error: "resend_error", status: res.status, body: errBody }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, delivered: true, id: data?.id });
  } catch (e) {
    console.error("[send-email] fetch threw:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
