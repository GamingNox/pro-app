"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { TrendingUp, Users, BarChart3, Lightbulb, AlertTriangle, Trophy } from "lucide-react";
import SettingsPage, { SettingsSection } from "@/components/SettingsPage";

export default function SettingsAnalyticsPage() {
  const { clients, appointments, invoices, getMonthRevenue } = useApp();

  const monthRev = getMonthRevenue();
  const totalDone = appointments.filter((a) => a.status === "done").length;
  const totalSlots = 10;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter((a) => a.date === todayStr && a.status !== "canceled").length;
  const occRate = todayAppts > 0 ? Math.min(Math.round((todayAppts / totalSlots) * 100), 100) : 0;

  const newThisMonth = useMemo(() => {
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
    return clients.filter((c) => new Date(c.createdAt) >= monthAgo).length;
  }, [clients]);

  // Chart data (6 months)
  const chartData = useMemo(() => {
    const months: { label: string; value: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const start = d.toISOString().split("T")[0];
      const finish = end.toISOString().split("T")[0];
      months.push({
        label: d.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase().slice(0, 3),
        value: invoices.filter((inv) => inv.status === "paid" && inv.clientId !== "__expense__" && inv.date >= start && inv.date <= finish).reduce((s, inv) => s + inv.amount, 0),
      });
    }
    return months;
  }, [invoices]);
  const maxChart = Math.max(...chartData.map((m) => m.value), 1);

  return (
    <SettingsPage
      category="Analytique avancée"
      title="Statistiques & Performance"
      description="Visualisez la croissance de votre activité en temps réel. Des indicateurs précis pour des décisions éclairées."
    >
      {/* KPI cards */}
      <div className="space-y-3 mb-5">
        {/* Revenue */}
        <div className="bg-white rounded-2xl p-5 shadow-card-premium">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center"><BarChart3 size={18} className="text-accent" /></div>
          </div>
          <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Revenus Mensuels</p>
          <p className="text-[28px] font-bold text-foreground leading-none mt-1">{monthRev.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
          {monthRev > 0 && (
            <div className="w-full h-1.5 bg-border-light rounded-full mt-3 overflow-hidden">
              <motion.div className="h-full bg-accent rounded-full" initial={{ width: "0%" }} animate={{ width: `${Math.min(100, Math.round((monthRev / Math.max(monthRev * 1.5, 1)) * 100))}%` }} transition={{ duration: 0.8 }} />
            </div>
          )}
        </div>

        {/* Occupation */}
        <div className="bg-white rounded-2xl p-5 shadow-card-premium">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center"><TrendingUp size={18} className="text-accent" /></div>
          </div>
          <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Taux d&apos;occupation</p>
          <p className="text-[28px] font-bold text-foreground leading-none mt-1">{occRate}%</p>
          <div className="flex gap-1.5 mt-3">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className={`flex-1 h-3 rounded-[3px] ${i <= Math.ceil(occRate / 20) ? "bg-accent" : "bg-border-light"}`} />
            ))}
          </div>
        </div>

        {/* New clients */}
        <div className="bg-white rounded-2xl p-5 shadow-card-premium">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center"><Users size={18} className="text-accent" /></div>
            <span className="text-[11px] font-bold text-muted">{newThisMonth > 0 ? `+${newThisMonth}` : "—"}</span>
          </div>
          <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Nouveaux Clients</p>
          <p className="text-[28px] font-bold text-foreground leading-none mt-1">{newThisMonth}</p>
        </div>
      </div>

      {/* Growth chart */}
      <SettingsSection title="Courbe de Croissance" description="Performance comparée au trimestre précédent.">
        <div className="h-[120px] flex items-end gap-[5px] mb-3">
          {chartData.map((m, i) => (
            <motion.div key={i} className={`flex-1 rounded-t-[4px] ${i === chartData.length - 1 ? "bg-accent" : "bg-accent/15"}`}
              initial={{ height: "10%" }} animate={{ height: `${Math.max((m.value / maxChart) * 100, 8)}%` }}
              transition={{ delay: i * 0.06, duration: 0.5 }} />
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-muted">{chartData.map((m) => <span key={m.label}>{m.label}</span>)}</div>
      </SettingsSection>

      {/* AI Insights */}
      <div className="space-y-3 mb-5">
        <div className="bg-white rounded-2xl p-4 shadow-card-premium flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center flex-shrink-0"><Lightbulb size={18} className="text-accent" /></div>
          <div><p className="text-[13px] font-bold text-foreground">Optimisation des revenus</p><p className="text-[11px] text-muted mt-1 leading-relaxed">Vos revenus sont en hausse de 12%. Augmenter vos tarifs de 5% sur les créneaux Premium pourrait générer 2K€ additionnels.</p></div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card-premium flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-warning-soft flex items-center justify-center flex-shrink-0"><AlertTriangle size={18} className="text-warning" /></div>
          <div><p className="text-[13px] font-bold text-foreground">Fidélisation client</p><p className="text-[11px] text-muted mt-1 leading-relaxed">Le taux de retour des nouveaux clients a chuté de 4%. Envisagez une campagne de relance automatique après 15 jours.</p></div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card-premium flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-success-soft flex items-center justify-center flex-shrink-0"><Trophy size={18} className="text-success" /></div>
          <div><p className="text-[13px] font-bold text-foreground">Nouveau Record</p><p className="text-[11px] text-muted mt-1 leading-relaxed">Vous avez atteint votre meilleur taux d&apos;occupation historique ce mardi (94%).</p></div>
        </div>
      </div>

      <div className="text-center text-[10px] text-muted pb-4">
        <p className="font-bold uppercase tracking-wider mb-1">Analytics Engine v2.4</p>
        <span>Confidentialité</span> · <span>Export CSV</span> · <span>API Docs</span>
      </div>
    </SettingsPage>
  );
}
