"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import Link from "next/link";
import { Users, TrendingUp, UserPlus, Bell, CreditCard, FileText, Shield, BarChart3, CalendarDays, Package, Receipt } from "lucide-react";

export default function AdminDashboardPage() {
  const { clients, appointments, invoices, products, getMonthRevenue, getLowStockProducts } = useApp();

  const monthRev = getMonthRevenue();
  const lowStock = getLowStockProducts();
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter((a) => a.date === todayStr && a.status !== "canceled");
  const paidInvoices = invoices.filter((i) => i.status === "paid" && i.clientId !== "__expense__");
  const pendingInvoices = invoices.filter((i) => i.status === "pending" && i.clientId !== "__expense__");
  const totalRevenue = paidInvoices.reduce((s, i) => s + i.amount, 0);

  // New clients this week
  const newThisWeek = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return clients.filter((c) => new Date(c.createdAt) >= weekAgo).length;
  }, [clients]);

  // Revenue chart (last 6 months)
  const chartData = useMemo(() => {
    const months: { label: string; value: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      months.push({
        label: d.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase(),
        value: paidInvoices.filter((inv) => inv.date >= d.toISOString().split("T")[0] && inv.date <= end.toISOString().split("T")[0]).reduce((s, inv) => s + inv.amount, 0),
      });
    }
    return months;
  }, [paidInvoices]);
  const maxChart = Math.max(...chartData.map((m) => m.value), 1);

  // Recent activity
  const recentActivity = useMemo(() => {
    const items: { title: string; sub: string; color: string; bg: string; icon: typeof Users }[] = [];
    const sortedAppts = [...appointments].sort((a, b) => b.date.localeCompare(a.date));
    if (sortedAppts[0]) items.push({ title: `RDV : ${sortedAppts[0].title}`, sub: new Date(sortedAppts[0].date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), color: "text-accent", bg: "bg-accent-soft", icon: CalendarDays });
    const sortedInv = [...invoices].filter((i) => i.clientId !== "__expense__").sort((a, b) => b.date.localeCompare(a.date));
    if (sortedInv[0]) items.push({ title: `Facture : ${sortedInv[0].description}`, sub: `${sortedInv[0].amount} € · ${sortedInv[0].status === "paid" ? "Payée" : "En attente"}`, color: sortedInv[0].status === "paid" ? "text-success" : "text-warning", bg: sortedInv[0].status === "paid" ? "bg-success-soft" : "bg-warning-soft", icon: Receipt });
    if (lowStock.length > 0) items.push({ title: `Stock bas : ${lowStock[0].name}`, sub: `${lowStock[0].quantity} unités restantes`, color: "text-danger", bg: "bg-danger-soft", icon: Package });
    if (newThisWeek > 0) items.push({ title: `${newThisWeek} nouveau${newThisWeek > 1 ? "x" : ""} client${newThisWeek > 1 ? "s" : ""}`, sub: "Cette semaine", color: "text-accent", bg: "bg-accent-soft", icon: UserPlus });
    return items.slice(0, 4);
  }, [appointments, invoices, lowStock, newThisWeek]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight">Tableau de bord</h1>
          <p className="text-[12px] text-muted mt-0.5">Vue d&apos;ensemble de votre plateforme.</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white shadow-card-premium flex items-center justify-center"><Bell size={18} className="text-muted" /></div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {/* KPI */}
          <div className="space-y-3 mb-5">
            <div className="bg-white rounded-2xl p-4 shadow-card-premium">
              <div className="flex items-center justify-between mb-1"><p className="text-[9px] text-muted font-bold uppercase tracking-wider">Utilisateurs totaux</p><Users size={16} className="text-accent" /></div>
              <p className="text-[28px] font-bold text-foreground leading-none mt-1">{clients.length}</p>
              {newThisWeek > 0 && <p className="text-[11px] text-success font-bold mt-1">+{newThisWeek} cette semaine</p>}
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-card-premium">
              <div className="flex items-center justify-between mb-1"><p className="text-[9px] text-muted font-bold uppercase tracking-wider">RDV aujourd&apos;hui</p><CalendarDays size={16} className="text-accent" /></div>
              <p className="text-[28px] font-bold text-foreground leading-none mt-1">{todayAppts.length}</p>
              <p className="text-[11px] text-muted mt-1">{todayAppts.filter((a) => a.status === "confirmed").length} confirmé{todayAppts.filter((a) => a.status === "confirmed").length > 1 ? "s" : ""}</p>
            </div>
            <div className="bg-accent-gradient rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between mb-1"><p className="text-[9px] text-white/60 font-bold uppercase tracking-wider">Revenu total</p><CreditCard size={16} className="text-white/60" /></div>
              <p className="text-[28px] font-bold leading-none mt-1">{totalRevenue.toFixed(0)} €</p>
              <p className="text-[11px] text-white/70 mt-1">{pendingInvoices.length} facture{pendingInvoices.length !== 1 ? "s" : ""} en attente</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="bg-white rounded-2xl p-4 shadow-card-premium mb-5">
            <div className="flex items-center justify-between mb-3"><p className="text-[9px] text-muted font-bold uppercase tracking-wider">Répartition</p></div>
            <div className="flex items-center justify-between py-2 border-b border-border-light"><span className="text-[13px] text-foreground">Clients</span><span className="text-[13px] font-bold text-foreground">{clients.length}</span></div>
            <div className="flex items-center justify-between py-2 border-b border-border-light"><span className="text-[13px] text-foreground">RDV total</span><span className="text-[13px] font-bold text-foreground">{appointments.length}</span></div>
            <div className="flex items-center justify-between py-2"><span className="text-[13px] text-foreground">Produits</span><span className="text-[13px] font-bold text-foreground">{products.length}</span></div>
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
              <div><p className="text-[9px] text-muted font-bold uppercase">Moyenne/client</p><p className="text-[16px] font-bold text-foreground">{clients.length > 0 ? (totalRevenue / clients.length).toFixed(0) : 0} €</p></div>
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
