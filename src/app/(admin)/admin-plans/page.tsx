"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { TrendingUp, CheckCircle2, Receipt, CreditCard } from "lucide-react";

export default function AdminPlansPage() {
  const { invoices, clients, getMonthRevenue } = useApp();

  const monthRev = getMonthRevenue();
  const paidTotal = invoices.filter((i) => i.status === "paid" && i.clientId !== "__expense__").reduce((s, i) => s + i.amount, 0);
  const pendingTotal = invoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0);
  const paidCount = invoices.filter((i) => i.status === "paid" && i.clientId !== "__expense__").length;
  const pendingCount = invoices.filter((i) => i.status === "pending").length;

  // Revenue by month
  const monthlyData = useMemo(() => {
    const months: { label: string; value: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      months.push({
        label: d.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase(),
        value: invoices.filter((inv) => inv.clientId !== "__expense__" && inv.status === "paid" && inv.date >= d.toISOString().split("T")[0] && inv.date <= end.toISOString().split("T")[0]).reduce((s, inv) => s + inv.amount, 0),
      });
    }
    return months;
  }, [invoices]);

  // Conversion rate
  const convRate = clients.length > 0 ? Math.round((paidCount / Math.max(clients.length, 1)) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <p className="text-[10px] text-accent font-bold uppercase tracking-wider">Gestion financière</p>
        <h1 className="text-[24px] font-bold text-foreground tracking-tight mt-1">Abonnements & Revenus</h1>
        <p className="text-[12px] text-muted mt-1">Suivi des paiements et facturation.</p>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {/* Revenue */}
          <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-4">
            <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Revenu total</p>
            <p className="text-[28px] font-bold text-success leading-none mt-1">{paidTotal.toFixed(0)} €</p>
            <p className="text-[11px] text-success font-bold mt-1 flex items-center gap-1"><TrendingUp size={12} /> {monthRev.toFixed(0)} € ce mois</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-2xl p-4 shadow-card-premium">
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Payées</p>
              <p className="text-[22px] font-bold text-success leading-none mt-1">{paidCount}</p>
              <p className="text-[10px] text-muted mt-0.5">factures</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-card-premium">
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider">En attente</p>
              <p className="text-[22px] font-bold text-warning leading-none mt-1">{pendingCount}</p>
              <p className="text-[10px] text-muted mt-0.5">{pendingTotal.toFixed(0)} €</p>
            </div>
          </div>

          {/* Conversion */}
          <div className="bg-accent-soft rounded-2xl p-5 mb-4 text-center">
            <CheckCircle2 size={24} className="text-accent mx-auto mb-2" />
            <p className="text-[28px] font-bold text-foreground">{convRate}%</p>
            <p className="text-[12px] text-muted">Taux de conversion</p>
          </div>

          {/* Recent invoices */}
          <h2 className="text-[16px] font-bold text-foreground mb-3">Dernières factures</h2>
          {invoices.filter((i) => i.clientId !== "__expense__").length === 0 ? (
            <div className="bg-white rounded-2xl p-6 shadow-card-premium text-center"><Receipt size={24} className="text-muted mx-auto mb-2" /><p className="text-[13px] text-muted">Aucune facture.</p></div>
          ) : (
            <div className="space-y-2.5">
              {invoices.filter((i) => i.clientId !== "__expense__").sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map((inv) => (
                <div key={inv.id} className="bg-white rounded-2xl p-4 shadow-sm-apple flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${inv.status === "paid" ? "bg-success-soft" : "bg-warning-soft"}`}>
                    {inv.status === "paid" ? <CheckCircle2 size={17} className="text-success" /> : <CreditCard size={17} className="text-warning" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-foreground truncate">{inv.description}</p>
                    <p className="text-[10px] text-muted">{new Date(inv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                  </div>
                  <p className={`text-[14px] font-bold ${inv.status === "paid" ? "text-success" : "text-warning"}`}>{inv.amount} €</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
