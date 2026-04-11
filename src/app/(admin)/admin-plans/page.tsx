"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { CreditCard, Users, TrendingUp, RefreshCw, ExternalLink } from "lucide-react";

interface DBUser {
  id: string;
  name: string;
  email: string;
  has_onboarded: boolean;
  created_at: string;
}

export default function AdminPlansPage() {
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from("user_profiles")
      .select("id, name, email, has_onboarded, created_at")
      .order("created_at", { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const activeUsers = users.filter((u) => u.has_onboarded);

  const newThisMonth = useMemo(() => {
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
    return users.filter((u) => new Date(u.created_at) >= monthAgo).length;
  }, [users]);

  // Growth chart (last 6 months)
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
        value: users.filter((u) => u.created_at >= start && u.created_at <= finish + "T23:59:59").length,
      });
    }
    return months;
  }, [users]);
  const maxChart = Math.max(...chartData.map((m) => m.value), 1);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-accent font-bold uppercase tracking-wider">Monétisation</p>
            <h1 className="text-[24px] font-bold text-foreground tracking-tight mt-1">Abonnements</h1>
            <p className="text-[12px] text-muted mt-1">Gestion des plans et revenus.</p>
          </div>
          <motion.button whileTap={{ scale: 0.85 }} onClick={loadData} className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
            <RefreshCw size={14} className={`text-muted ${loading ? "animate-spin" : ""}`} />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {/* Status banner — no payment system yet */}
          <div className="bg-warning-soft rounded-2xl p-5 mb-5">
            <div className="flex items-start gap-3">
              <CreditCard size={20} className="text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[14px] font-bold text-foreground">Aucun système de paiement</p>
                <p className="text-[12px] text-muted mt-1 leading-relaxed">
                  Connectez Stripe pour activer les abonnements et suivre les revenus en temps réel.
                </p>
                <motion.button whileTap={{ scale: 0.97 }}
                  className="mt-3 bg-white text-foreground px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 shadow-sm">
                  <ExternalLink size={12} /> Configurer Stripe
                </motion.button>
              </div>
            </div>
          </div>

          {/* User stats */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white rounded-2xl p-4 shadow-card-premium">
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Utilisateurs actifs</p>
              <p className="text-[22px] font-bold text-foreground leading-none mt-1">{activeUsers.length}</p>
              <p className="text-[10px] text-success font-bold mt-0.5">Comptes gratuits</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-card-premium">
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Ce mois</p>
              <p className="text-[22px] font-bold text-accent leading-none mt-1">+{newThisMonth}</p>
              <p className="text-[10px] text-muted mt-0.5">nouvelles inscriptions</p>
            </div>
          </div>

          {/* Growth chart */}
          <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-5">
            <p className="text-[13px] font-bold text-foreground mb-4">Croissance des inscriptions</p>
            <div className="flex items-end gap-[4px] h-[80px] mb-2">
              {chartData.map((m, i) => (
                <motion.div key={i} className={`flex-1 rounded-[3px] ${i === chartData.length - 1 ? "bg-accent" : "bg-accent/12"}`}
                  initial={{ height: "10%" }} animate={{ height: `${Math.max((m.value / maxChart) * 100, 6)}%` }}
                  transition={{ delay: i * 0.05, duration: 0.5 }} />
              ))}
            </div>
            <div className="flex justify-between text-[8px] text-muted">{chartData.map((m) => <span key={m.label}>{m.label}</span>)}</div>
          </div>

          {/* Revenue placeholder */}
          <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-5 text-center">
            <TrendingUp size={28} className="text-muted mx-auto mb-3" />
            <p className="text-[16px] font-bold text-foreground">Revenus : 0 €</p>
            <p className="text-[12px] text-muted mt-1 max-w-[240px] mx-auto leading-relaxed">
              Les revenus d&apos;abonnement apparaîtront ici une fois Stripe configuré.
            </p>
          </div>

          {/* Plan ideas */}
          <h2 className="text-[16px] font-bold text-foreground mb-3">Plans suggérés</h2>
          <div className="space-y-3">
            {[
              { name: "Gratuit", price: "0 €", features: "Jusqu'à 5 clients · 1 service", color: "bg-border-light", textColor: "text-foreground" },
              { name: "Pro", price: "19 €/mois", features: "Clients illimités · Tous les services", color: "bg-accent-soft", textColor: "text-accent" },
              { name: "Business", price: "49 €/mois", features: "Multi-équipe · Analytics avancés", color: "bg-accent-gradient", textColor: "text-white" },
            ].map((plan) => (
              <div key={plan.name} className={`${plan.color} rounded-2xl p-4 ${plan.name === "Business" ? "text-white" : ""}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-[14px] font-bold ${plan.name === "Business" ? "text-white" : "text-foreground"}`}>{plan.name}</p>
                    <p className={`text-[11px] mt-0.5 ${plan.name === "Business" ? "text-white/70" : "text-muted"}`}>{plan.features}</p>
                  </div>
                  <p className={`text-[16px] font-bold ${plan.textColor}`}>{plan.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
