// ══ Account deletion endpoint ════════════════════════════
// POST /api/account/delete — deletes the auth.users row via
// the service role key. Called after the client has already
// wiped all data rows in the preferences page.
//
// Requires: SUPABASE_SERVICE_ROLE_KEY env var.
// The client must pass the userId it wants to delete; we verify
// it matches the currently authenticated session to prevent abuse.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  if (!SERVICE_KEY) {
    console.warn("[account/delete] SUPABASE_SERVICE_ROLE_KEY not set");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  let body: { userId?: string };
  try {
    body = (await req.json()) as { userId?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.userId) {
    return NextResponse.json({ error: "missing_user_id" }, { status: 400 });
  }

  // Verify the request comes from the user themselves by checking
  // the Supabase auth token in the request (passed as cookie or header).
  // We use the anon client for this check.
  const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });

  // Extract the access token from the Authorization header
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await anonClient.auth.getUser(token);

  if (!user || user.id !== body.userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Delete from auth.users using service role
  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });
  const { error } = await adminClient.auth.admin.deleteUser(body.userId);

  if (error) {
    console.error("[account/delete] auth deletion failed:", error.message);
    return NextResponse.json({ error: "deletion_failed", detail: error.message }, { status: 500 });
  }

  console.log("[account/delete] user deleted from auth.users:", body.userId);
  return NextResponse.json({ ok: true });
}
