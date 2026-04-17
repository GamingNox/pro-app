// ══ Email OTP — verify a 6-digit code ═══════════════════
// POST /api/auth/otp/verify { email, code, userId? }
// Validates the code. On success, marks it as used and (if userId
// is provided) flips user_profiles.email_verified = true.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  if (!SERVICE_KEY) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  let body: { email?: string; code?: string; userId?: string };
  try {
    body = (await req.json()) as { email?: string; code?: string; userId?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();

  if (!email || !code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data: rows, error } = await supabase
    .from("email_otps")
    .select("id, code, expires_at, used_at, attempts")
    .eq("email", email)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  const row = rows?.[0];
  if (!row) {
    return NextResponse.json({ error: "no_active_code" }, { status: 400 });
  }

  if (new Date(row.expires_at as string).getTime() < Date.now()) {
    return NextResponse.json({ error: "expired" }, { status: 400 });
  }

  if ((row.attempts as number) >= MAX_ATTEMPTS) {
    // Invalidate further attempts
    await supabase.from("email_otps").update({ used_at: new Date().toISOString() }).eq("id", row.id);
    return NextResponse.json({ error: "too_many_attempts" }, { status: 429 });
  }

  if (row.code !== code) {
    await supabase.from("email_otps").update({ attempts: (row.attempts as number) + 1 }).eq("id", row.id);
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }

  // Success: mark used
  await supabase.from("email_otps").update({ used_at: new Date().toISOString() }).eq("id", row.id);

  // If the caller supplied a userId, also mark their profile as verified
  if (body.userId) {
    await supabase.from("user_profiles").update({ email_verified: true }).eq("id", body.userId);
  }

  return NextResponse.json({ ok: true, verified: true });
}
