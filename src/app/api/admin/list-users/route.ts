// ══ Admin: list all users with aggregated stats ══════════
// Returns every user_profile + client count, appointment count,
// and total revenue. Uses the service role key to bypass RLS
// because the admin panel does not authenticate via Supabase Auth.
//
// Simple shared-secret auth: client sends X-Admin-Secret header
// that must match ADMIN_API_SECRET env var.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_API_SECRET || "clientbase-admin-2026";

interface UserRow {
  id: string;
  name?: string;
  email?: string;
  business?: string;
  subscription_plan?: string;
  has_onboarded?: boolean;
  created_at?: string;
  beta_status?: string;
  [k: string]: unknown;
}

interface ApptRow {
  user_id: string;
  status?: string;
  price?: number;
}

interface InvoiceRow {
  user_id: string;
  amount?: number;
  status?: string;
  client_id?: string;
}

interface ClientRow {
  user_id: string;
}

export async function GET(req: Request) {
  // Auth gate
  const providedSecret = req.headers.get("x-admin-secret");
  if (providedSecret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!SERVICE_KEY) {
    return NextResponse.json({ error: "service_role_missing" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const [usersRes, clientsRes, apptsRes, invsRes] = await Promise.all([
      supabase.from("user_profiles").select("*"),
      supabase.from("clients").select("user_id"),
      supabase.from("appointments").select("user_id, status, price"),
      supabase.from("invoices").select("user_id, amount, status, client_id"),
    ]);

    if (usersRes.error) {
      console.error("[admin/list-users] users fetch failed:", usersRes.error);
      return NextResponse.json({ error: "db_failed", detail: usersRes.error.message }, { status: 500 });
    }

    const users = (usersRes.data as UserRow[]) || [];
    const clients = (clientsRes.data as ClientRow[]) || [];
    const appts = (apptsRes.data as ApptRow[]) || [];
    const invs = (invsRes.data as InvoiceRow[]) || [];

    // Aggregate per user
    const aggregated = users.map((u) => {
      const userClients = clients.filter((c) => c.user_id === u.id).length;
      const userAppts = appts.filter((a) => a.user_id === u.id);
      const userInvs = invs.filter((i) => i.user_id === u.id && i.client_id !== "__expense__");
      const revenue = userInvs
        .filter((i) => i.status === "paid")
        .reduce((s, i) => s + Number(i.amount || 0), 0);

      return {
        id: u.id,
        name: u.name || "",
        email: u.email || "",
        business: u.business || "",
        plan: u.subscription_plan || "essentiel",
        has_onboarded: !!u.has_onboarded,
        beta_status: u.beta_status || null,
        created_at: u.created_at,
        client_count: userClients,
        appointment_count: userAppts.length,
        revenue,
      };
    });

    return NextResponse.json({
      ok: true,
      users: aggregated,
      total_users: users.length,
      total_clients: clients.length,
      total_appointments: appts.length,
      total_revenue: invs
        .filter((i) => i.status === "paid" && i.client_id !== "__expense__")
        .reduce((s, i) => s + Number(i.amount || 0), 0),
    });
  } catch (e) {
    console.error("[admin/list-users] failed:", e);
    return NextResponse.json({ error: "unexpected", detail: String(e) }, { status: 500 });
  }
}
