"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { CreditCard, CalendarDays, Users, TrendingUp, Package } from "lucide-react";

export default function AdminAnalyticsPage() {
  const { clients, appointments, invoices, products, getMonthRevenue, getWeekRevenue, getLowStockProducts } = useApp();

  const monthRev = getMonthRevenue();
  const weekRev = getWeekRevenue();
  const totalPaid = invoices.filter((i) => i.status === "paid" && i.clientId !== "__expense__").reduce((s, i) => s + i.amount, 0);
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter((a) => a.date === todayStr && a.status !== "canceled");
  const doneAppts = appointments.filter((a) => a.status === "done").length;
  const lowStock = getLowStockProducts();

  // Weekly chart
  const weeklyChart = useMemo(() => {
    const days = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
    const now = new Date();
    return days.map((label, i) => {
      const d = new Date(now);
      const dayDiff = (now.getDay() + 6) % 7;
      d.setDate(d.getDate() - dayDiff + i);
      const ds = d.toISOString().split("T")[0];
      return { label, value: appointments.filter((a) => a.date === ds && a.status !== "canceled").length };
    });
  }, [appointments]);
  const maxWeek = Math.max(...weeklyChart.map((d) => d.value), 1);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <p className="text-[10px] text-accent font-bold uppercase tracking-wider">Console de suivi</p>
        <h1 className="text-[24px] font-bold text-foreground tracking-tight mt-1">Analytics</h1>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {/* KPI cards */}
          <div className="space-y-3 mb-5">
            <div className="bg-white rounded-2xl p-5 shadow-card-premium">
              <div className="flex items-center justify-between mb-1"><CreditCard size={16} className="text-accent" /><span className="text-[11px] font-bold text-success">+{monthRev > 0 ? Math.round((monthRev / Math.max(totalPaid, 1)) * 100) : 0}%</span></div>
              <p className="text-[10px] text-muted mt-2">Volume de paiements</p>
              <p className="text-[24px] font-bold text-foreground leading-none">{totalPaid.toFixed(0)} €</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-card-premium">
              <div className="flex items-center justify-between mb-1"><CalendarDays size={16} className="text-accent" /><span className="text-[11px] font-bold text-accent">{appointments.length} total</span></div>
              <p className="text-[10px] text-muted mt-2">Rendez-vous ce mois</p>
              <p className="text-[24px] font-bold text-foreground leading-none">{doneAppts}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-card-premium">
              <div className="flex items-center justify-between mb-1"><Users size={16} className="text-accent" /><span className="text-[10px] font-bold text-success bg-success-soft px-2 py-0.5 rounded">Actif</span></div>
              <p className="text-[10px] text-muted mt-2">Clients actifs</p>
              <p className="text-[24px] font-bold text-foreground leading-none">{clients.length}</p>
            </div>
          </div>

          {/* Weekly chart */}
          <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-bold text-foreground">Activité de la semaine</h3>
              <span className="text-[11px] text-accent font-bold">7 derniers jours</span>
            </div>
            <div className="flex items-end gap-[5px] h-[100px] mb-2">
              {weeklyChart.map((d, i) => (
                <motion.div key={i} className={`flex-1 rounded-[4px] ${i === new Date().getDay() - 1 || (new Date().getDay() === 0 && i === 6) ? "bg-accent" : "bg-accent/12"}`}
                  initial={{ height: "10%" }} animate={{ height: `${Math.max((d.value / maxWeek) * 100, 8)}%` }}
                  transition={{ delay: i * 0.05, duration: 0.5 }} />
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-muted">{weeklyChart.map((d) => <span key={d.label}>{d.label}</span>)}</div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white rounded-2xl p-4 shadow-card-premium"><p className="text-[9px] text-muted font-bold uppercase">Ce mois</p><p className="text-[20px] font-bold text-success mt-1">{monthRev.toFixed(0)} €</p></div>
            <div className="bg-white rounded-2xl p-4 shadow-card-premium"><p className="text-[9px] text-muted font-bold uppercase">Cette semaine</p><p className="text-[20px] font-bold text-accent mt-1">{weekRev.toFixed(0)} €</p></div>
            <div className="bg-white rounded-2xl p-4 shadow-card-premium"><p className="text-[9px] text-muted font-bold uppercase">Stock bas</p><p className={`text-[20px] font-bold mt-1 ${lowStock.length > 0 ? "text-danger" : "text-foreground"}`}>{lowStock.length}</p></div>
            <div className="bg-white rounded-2xl p-4 shadow-card-premium"><p className="text-[9px] text-muted font-bold uppercase">RDV aujourd&apos;hui</p><p className="text-[20px] font-bold text-foreground mt-1">{todayAppts.length}</p></div>
          </div>

          {/* System status */}
          <div className="bg-white rounded-2xl p-5 shadow-card-premium">
            <h3 className="text-[14px] font-bold text-foreground mb-3">État du système</h3>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-success" />
              <div>
                <p className="text-[13px] text-foreground">Tous les systèmes opérationnels.</p>
                <p className="text-[11px] text-muted mt-0.5">Dernière vérification : maintenant</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
