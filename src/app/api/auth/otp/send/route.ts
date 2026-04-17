// ══ Email OTP — send a fresh 6-digit code ═══════════════
// POST /api/auth/otp/send { email }
// Generates a random 6-digit code, stores it in email_otps with
// a 15-min expiry, sends it to the user via Resend. Rate-limited:
// max 1 code per email per 60 seconds.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "noreply@clientbase.fr";

function generateCode(): string {
  // 6 random digits. crypto is available in Node runtime.
  const buf = new Uint8Array(6);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => String(b % 10)).join("");
}

function buildEmailHtml(code: string): string {
  const accent = "#5B4FE9";
  const deep = "#3B30B5";
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#FAFAF9;font-family:-apple-system,system-ui,'Segoe UI',sans-serif;color:#18181B;">
  <div style="max-width:480px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,${accent},${deep});border-radius:20px 20px 0 0;padding:32px 28px;color:white;text-align:center;">
      <p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.16em;opacity:0.75;">Client Base</p>
      <h1 style="margin:10px 0 0;font-size:22px;font-weight:700;line-height:1.2;">Votre code de vérification</h1>
    </div>
    <div style="background:white;border:1px solid #E4E4E7;border-top:none;border-radius:0 0 20px 20px;padding:32px 28px;">
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#52525B;">Entrez ce code dans l'application pour confirmer votre adresse email :</p>
      <div style="background:linear-gradient(135deg,#F5F3FF,#EEF0FF);border:1px solid color-mix(in srgb, ${accent} 20%, white);border-radius:16px;padding:22px 16px;text-align:center;">
        <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:0.34em;color:${deep};font-family:'SF Mono',Menlo,Consolas,monospace;">${code}</p>
      </div>
      <p style="margin:18px 0 0;font-size:12px;color:#71717A;line-height:1.6;text-align:center;">
        Ce code expire dans <strong style="color:${deep};">15 minutes</strong>.<br>
        Ne le partagez avec personne.
      </p>
      <div style="height:1px;background:#E4E4E7;margin:24px 0;"></div>
      <p style="margin:0;font-size:11px;color:#A1A1AA;line-height:1.6;text-align:center;">
        Vous n'avez pas demandé ce code ? Ignorez simplement cet email.
      </p>
    </div>
    <p style="text-align:center;color:#A1A1AA;font-size:11px;margin:16px 0 0;">
      Envoyé via <a href="https://clientbase.fr" style="color:${accent};text-decoration:none;font-weight:600;">clientbase.fr</a>
    </p>
  </div>
</body></html>`;
}

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function POST(req: Request) {
  if (!SERVICE_KEY) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  let body: { email?: string };
  try {
    body = (await req.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Rate limit: one code per 60s per email
  const { data: recent } = await supabase
    .from("email_otps")
    .select("created_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1);
  if (recent && recent[0]) {
    const age = Date.now() - new Date(recent[0].created_at as string).getTime();
    if (age < 60_000) {
      return NextResponse.json({ error: "rate_limited", retry_after: Math.ceil((60_000 - age) / 1000) }, { status: 429 });
    }
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Invalidate previous unused codes
  await supabase.from("email_otps").update({ used_at: new Date().toISOString() })
    .eq("email", email).is("used_at", null);

  // Insert new code
  const { error: insertErr } = await supabase.from("email_otps").insert({
    email,
    code,
    expires_at: expiresAt,
  });
  if (insertErr) {
    console.error("[otp/send] insert failed:", insertErr.message);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  // Send email
  if (!RESEND_KEY) {
    console.warn("[otp/send] RESEND_API_KEY missing — code logged but not emailed:", code);
    return NextResponse.json({ ok: true, delivered: false, reason: "no_api_key" });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: `Client Base <${FROM_ADDRESS}>`,
        to: [email],
        subject: `${code} — Votre code Client Base`,
        html: buildEmailHtml(code),
        text: `Votre code de vérification Client Base : ${code}\n\nIl expire dans 15 minutes. Ne le partagez avec personne.`,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error("[otp/send] Resend error:", res.status, errBody);
      return NextResponse.json({ ok: true, delivered: false, reason: "resend_error" });
    }
  } catch (e) {
    console.error("[otp/send] fetch failed:", e);
    return NextResponse.json({ ok: true, delivered: false, reason: "network_error" });
  }

  return NextResponse.json({ ok: true, delivered: true });
}
