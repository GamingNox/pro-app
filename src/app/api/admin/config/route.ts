// ══ Admin: app-wide config (maintenance, closed, announcement) ══
// GET  /api/admin/config   — reads the singleton (anyone)
// POST /api/admin/config   — updates; admin only via service role

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  if (!SERVICE_KEY) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.from("app_config").select("*").eq("id", 1).single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, config: data });
}

export async function POST(req: Request) {
  if (!SERVICE_KEY) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  // Verify caller is admin
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");
  const anon = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data: { user }, error: userErr } = await anon.auth.getUser(token);
  if (userErr || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const service = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: callerProfile } = await service.from("user_profiles").select("is_admin").eq("id", user.id).single();
  if (!callerProfile?.is_admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: {
    maintenance_mode?: boolean;
    maintenance_message?: string;
    site_closed?: boolean;
    site_closed_message?: string;
    announcement?: string | null;
    announcement_type?: "info" | "warning" | "critical";
    app_version?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.maintenance_mode === "boolean") patch.maintenance_mode = body.maintenance_mode;
  if (typeof body.maintenance_message === "string") patch.maintenance_message = body.maintenance_message;
  if (typeof body.site_closed === "boolean") patch.site_closed = body.site_closed;
  if (typeof body.site_closed_message === "string") patch.site_closed_message = body.site_closed_message;
  if (typeof body.announcement === "string" || body.announcement === null) patch.announcement = body.announcement;
  if (typeof body.announcement_type === "string") patch.announcement_type = body.announcement_type;
  if (typeof body.app_version === "string") patch.app_version = body.app_version;

  const { data, error } = await service.from("app_config").update(patch).eq("id", 1).select().single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the admin action
  await service.from("activity_log").insert({
    type: "admin_action",
    user_id: user.id,
    user_email: user.email,
    description: `Config mise à jour : ${Object.keys(patch).filter((k) => k !== "updated_at").join(", ")}`,
    metadata: patch,
  });

  return NextResponse.json({ ok: true, config: data });
}
