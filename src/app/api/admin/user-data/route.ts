// ══ Admin: fetch aggregated data for one user ═══════════
// Returns client list + recent appointments + recent invoices
// for a specific user_id. Uses service role to bypass RLS.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_API_SECRET || "clientbase-admin-2026";

export async function POST(req: Request) {
  const providedSecret = req.headers.get("x-admin-secret");
  if (providedSecret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!SERVICE_KEY) {
    return NextResponse.json({ error: "service_role_missing" }, { status: 500 });
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

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const [clientsRes, apptsRes, invsRes] = await Promise.all([
      supabase.from("clients").select("id, first_name, last_name, email, phone").eq("user_id", body.userId),
      supabase.from("appointments").select("id, title, date, time, status, price").eq("user_id", body.userId).order("date", { ascending: false }).limit(10),
      supabase.from("invoices").select("id, amount, status, date, description, invoice_number").eq("user_id", body.userId).order("date", { ascending: false }).limit(10),
    ]);

    const clients = clientsRes.data || [];
    const appointments = apptsRes.data || [];
    const invoices = invsRes.data || [];

    const revenue = (invoices as Array<{ status?: string; amount?: number }>)
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + Number(i.amount || 0), 0);

    return NextResponse.json({
      ok: true,
      clientCount: clients.length,
      appointmentCount: appointments.length,
      revenue,
      recentClients: clients.slice(0, 5),
      recentAppointments: appointments,
      recentInvoices: invoices,
    });
  } catch (e) {
    console.error("[admin/user-data] failed:", e);
    return NextResponse.json({ error: "unexpected", detail: String(e) }, { status: 500 });
  }
}
