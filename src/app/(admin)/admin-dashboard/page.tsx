"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Users, TrendingUp, UserPlus, Bell, CreditCard, Shield, BarChart3, CalendarDays, Package, Receipt, RefreshCw } from "lucide-react";

interface DBUser { id: string; name: string; email: string; business: string; has_onboarded: boolean; created_at: string; }
interface DBAppointment { id: string; date: string; status: string; price: number; title: string; user_id: string; }
interface DBInvoice { id: string; amount: number; status: string; date: string; description: string; client_id: string; user_id: string; }

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<DBUser[]>([]);
  const [appointments, setAppointments] = useState<DBAppointment[]>([]);
  const [invoices, setInvoices] = useState<DBInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const [uRes, aRes, iRes] = await Promise.all([
      supabase.from("user_profiles").select("id, name, email, business, has_onboarded, created_at").order("created_at", { ascending: false }),
      supabase.from("appointments").select("id, date, status, price, title, user_id"),
      supabase.from("invoices").select("id, amount, status, date, description, client_id, user_id"),
    ]);
    if (uRes.data) setUsers(uRes.data);
    if (aRes.data) setAppointments(aRes.data);
    if (iRes.data) setInvoices(iRes.data);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const onboardedUsers = users.filter((u) => u.has_onboarded);
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter((a) => a.date === todayStr && a.status !== "canceled");
  const paidInvoices = invoices.filter((i) => i.status === "paid" && i.client_id !== "__expense__");
  const pendingInvoices = invoices.filter((i) => i.status === "pending");
  const totalRevenue = paidInvoices.reduce((s, i) => s + Number(i.amount), 0);

  const newThisWeek = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return users.filter((u) => new Date(u.created_at) >= weekAgo).length;
  }, [users]);

  // Revenue chart (last 6 months)
  const chartData = useMemo(() => {
    const months: { label: string; value: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const start = d.toISOString().split("T")[0];
      const finish = end.toISOString().split("T")[0];
      months.push({
        label: d.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase(),
        value: paidInvoices.filter((inv) => inv.date >= start && inv.date <= finish).reduce((s, inv) => s + Number(inv.amount), 0),
      });
    }
    return months;
  }, [paidInvoices]);
  const maxChart = Math.max(...chartData.map((m) => m.value), 1);

  // Recent activity from real data
  const recentActivity = useMemo(() => {
    const items: { title: string; sub: string; color: string; bg: string; icon: typeof Users }[] = [];
    const sortedAppts = [...appointments].sort((a, b) => b.date.localeCompare(a.date));
    if (sortedAppts[0]) items.push({ title: `RDV : ${sortedAppts[0].title}`, sub: new Date(sortedAppts[0].date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), color: "text-accent", bg: "bg-accent-soft", icon: CalendarDays });
    const sortedInv = [...invoices].filter((i) => i.client_id !== "__expense__").sort((a, b) => b.date.localeCompare(a.date));
    if (sortedInv[0]) items.push({ title: `Facture : ${sortedInv[0].description}`, sub: `${sortedInv[0].amount} € · ${sortedInv[0].status === "paid" ? "Payée" : "En attente"}`, color: sortedInv[0].status === "paid" ? "text-success" : "text-warning", bg: sortedInv[0].status === "paid" ? "bg-success-soft" : "bg-warning-soft", icon: Receipt });
    if (newThisWeek > 0) items.push({ title: `${newThisWeek} nouveau${newThisWeek > 1 ? "x" : ""} utilisateur${newThisWeek > 1 ? "s" : ""}`, sub: "Cette semaine", color: "text-accent", bg: "bg-accent-soft", icon: UserPlus });
    return items.slice(0, 4);
  }, [appointments, invoices, newThisWeek]);

  const monthRev = useMemo(() => {
    const now = new Date();
    const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30);
    const start = monthAgo.toISOString().split("T")[0];
    return paidInvoices.filter((i) => i.date >= start).reduce((s, i) => s + Number(i.amount), 0);
  }, [paidInvoices]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight">Tableau de bord</h1>
          <p className="text-[12px] text-muted mt-0.5">Vue d&apos;ensemble de la plateforme · Données réelles</p>
        </div>
        <motion.button whileTap={{ scale: 0.85 }} onClick={loadData} className="w-10 h-10 rounded-xl bg-white shadow-card-premium flex items-center justify-center">
          <RefreshCw size={16} className={`text-muted ${loading ? "animate-spin" : ""}`} />
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {/* KPI */}
          <div className="space-y-3 mb-5">
            <div className="bg-white rounded-2xl p-4 shadow-card-premium">
              <div className="flex items-center justify-between mb-1"><p className="text-[9px] text-muted font-bold uppercase tracking-wider">Utilisateurs inscrits</p><Users size={16} className="text-accent" /></div>
              <p className="text-[28px] font-bold text-foreground leading-none mt-1">{onboardedUsers.length}</p>
              {newThisWeek > 0 && <p className="text-[11px] text-success font-bold mt-1">+{newThisWeek} cette semaine</p>}
              <p className="text-[10px] text-muted mt-0.5">{users.length} profils totaux</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-card-premium">
              <div className="flex items-center justify-between mb-1"><p className="text-[9px] text-muted font-bold uppercase tracking-wider">RDV aujourd&apos;hui</p><CalendarDays size={16} className="text-accent" /></div>
              <p className="text-[28px] font-bold text-foreground leading-none mt-1">{todayAppts.length}</p>
              <p className="text-[11px] text-muted mt-1">{appointments.length} RDV au total</p>
            </div>
            <div className="bg-accent-gradient rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between mb-1"><p className="text-[9px] text-white/60 font-bold uppercase tracking-wider">Revenu plateforme</p><CreditCard size={16} className="text-white/60" /></div>
              <p className="text-[28px] font-bold leading-none mt-1">{totalRevenue.toFixed(0)} €</p>
              <p className="text-[11px] text-white/70 mt-1">{pendingInvoices.length} facture{pendingInvoices.length !== 1 ? "s" : ""} en attente</p>
            </div>
          </div>

          {/* Revenue chart */}
          <div className="bg-white rounded-2xl p-4 shadow-card-premium mb-5">
            <p className="text-[13px] font-bold text-foreground mb-4">Évolution des revenus</p>
            <div className="flex items-end gap-[4px] h-[80px] mb-2">
              {chartData.map((m, i) => (
                <motion.div key={i} className={`flex-1 rounded-[3px] ${i === chartData.length - 1 ? "bg-accent" : "bg-accent/12"}`}
                  initial={{ height: "10%" }} animate={{ height: `${Math.max((m.value / maxChart) * 100, 6)}%` }}
                  transition={{ delay: i * 0.05, duration: 0.5 }} />
              ))}
            </div>
            <div className="flex justify-between text-[8px] text-muted">{chartData.map((m) => <span key={m.label}>{m.label}</span>)}</div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-border-light">
              <div><p className="text-[9px] text-muted font-bold uppercase">Ce mois</p><p className="text-[16px] font-bold text-foreground">{monthRev.toFixed(0)} €</p></div>
              <div><p className="text-[9px] text-muted font-bold uppercase">Moy. / utilisateur</p><p className="text-[16px] font-bold text-foreground">{onboardedUsers.length > 0 ? (totalRevenue / onboardedUsers.length).toFixed(0) : 0} €</p></div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="mb-5">
            <h2 className="text-[16px] font-bold text-foreground mb-3">Activité récente</h2>
            {recentActivity.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 shadow-card-premium text-center"><p className="text-[13px] text-muted">Aucune activité récente.</p></div>
            ) : (
              <div className="space-y-2.5">
                {recentActivity.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <div key={i} className="bg-white rounded-2xl p-4 shadow-sm-apple flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center`}><Icon size={17} className={a.color} /></div>
                      <div className="flex-1"><p className="text-[13px] font-bold text-foreground">{a.title}</p><p className="text-[10px] text-muted">{a.sub}</p></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <h2 className="text-[16px] font-bold text-foreground mb-3">Actions rapides</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: UserPlus, label: "Utilisateurs", href: "/admin-users" },
              { icon: CreditCard, label: "Abonnements", href: "/admin-plans" },
              { icon: BarChart3, label: "Analytics", href: "/admin-analytics" },
              { icon: Shield, label: "Réglages", href: "/admin-settings" },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.label} href={a.href}>
                  <motion.div whileTap={{ scale: 0.95 }} className="bg-white rounded-2xl p-4 shadow-card-premium flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-border-light flex items-center justify-center"><Icon size={18} className="text-accent" /></div>
                    <span className="text-[11px] font-bold text-foreground">{a.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
