// ══ Admin: delete any user ═══════════════════════════════
// POST /api/admin/delete-user
// Deletes auth.users + all cascaded data (RLS ON DELETE CASCADE
// already wipes user_profiles + business tables via FK).
// Must be called by an authenticated admin (is_admin = true).

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  if (!SERVICE_KEY) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  // Extract caller's access token
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");

  const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data: { user }, error: userErr } = await anonClient.auth.getUser(token);
  if (userErr || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Confirm caller is an admin
  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });
  const { data: callerProfile, error: profileErr } = await adminClient
    .from("user_profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (profileErr || !callerProfile?.is_admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Parse target user id
  let body: { userId?: string };
  try {
    body = (await req.json()) as { userId?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.userId) {
    return NextResponse.json({ error: "missing_user_id" }, { status: 400 });
  }

  // Prevent an admin from accidentally deleting themselves here
  // (they should use the standard /api/account/delete flow if they want to)
  if (body.userId === user.id) {
    return NextResponse.json({ error: "cannot_delete_self" }, { status: 400 });
  }

  // Best-effort cleanup of app tables (RLS policies + FKs may not cascade
  // everywhere, so wipe explicitly). Ignore individual errors.
  const tables = [
    "appointments", "invoices", "products", "services",
    "clients", "loyalty_cards", "loyalty_templates",
    "reviews", "push_subscriptions", "waitlist",
  ];
  for (const t of tables) {
    await adminClient.from(t).delete().eq("user_id", body.userId);
  }
  await adminClient.from("user_profiles").delete().eq("id", body.userId);

  // Finally, delete from auth.users
  const { error: delErr } = await adminClient.auth.admin.deleteUser(body.userId);
  if (delErr) {
    console.error("[admin/delete-user] auth deletion failed:", delErr.message);
    return NextResponse.json({ error: "deletion_failed", detail: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
