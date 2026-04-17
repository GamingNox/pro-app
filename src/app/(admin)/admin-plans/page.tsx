"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { CreditCard, RefreshCw, ArrowLeft } from "lucide-react";

interface DBUser {
  id: string;
  name: string;
  email: string;
  has_onboarded: boolean;
  created_at: string;
}

export default function AdminPlansPage() {
  const router = useRouter();
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
      <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
            style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}>
            <ArrowLeft size={18} className="text-foreground" strokeWidth={2.4} />
          </motion.button>
          <div>
            <p className="text-[10px] text-accent font-bold uppercase tracking-wider">Monétisation</p>
            <h1 className="text-[22px] font-bold text-foreground tracking-tight leading-tight">Abonnements</h1>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={loadData} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center" style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}>
          <RefreshCw size={14} className={`text-muted ${loading ? "animate-spin" : ""}`} />
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {/* Overview banner */}
          <div className="bg-accent-soft rounded-2xl p-5 mb-5">
            <div className="flex items-start gap-3">
              <CreditCard size={20} className="text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[14px] font-bold text-foreground">Gestion des plans</p>
                <p className="text-[12px] text-muted mt-1 leading-relaxed">
                  Consultez et modifiez les plans d&apos;abonnement. Les changements sont appliques immediatement aux utilisateurs.
                </p>
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
                  transition={{ delay: i * 0.05, duration: 0.2 }} />
              ))}
            </div>
            <div className="flex justify-between text-[8px] text-muted">{chartData.map((m) => <span key={m.label}>{m.label}</span>)}</div>
          </div>

          {/* Real plans — synced with /subscription page */}
          <h2 className="text-[16px] font-bold text-foreground mb-3">Plans actifs</h2>
          <div className="space-y-3">
            {[
              {
                tier: "essentiel" as const,
                name: "Essentiel",
                price: "0 €",
                features: "15 clients · 30 RDV/mois · Page de reservation",
                variant: "free",
              },
              {
                tier: "croissance" as const,
                name: "Pro",
                price: "9,99 €/mois",
                features: "Clients illimites · Fidelite · Stock · Factures PDF",
                variant: "popular",
              },
              {
                tier: "entreprise" as const,
                name: "Elite",
                price: "19,99 €/mois",
                features: "Tout Pro + 5 collaborateurs · API · Support prioritaire",
                variant: "premium",
              },
            ].map((plan) => {
              const isPopular = plan.variant === "popular";
              const isPremium = plan.variant === "premium";
              return (
                <div
                  key={plan.tier}
                  className={`rounded-2xl p-4 ${isPremium ? "bg-accent-gradient" : isPopular ? "bg-accent-soft ring-1 ring-accent/20" : "bg-border-light"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-[14px] font-bold ${isPremium ? "text-white" : "text-foreground"}`}>{plan.name}</p>
                      {isPopular && (
                        <span className="text-[8px] font-bold text-accent bg-white px-1.5 py-0.5 rounded uppercase tracking-wider">Populaire</span>
                      )}
                    </div>
                    <p className={`text-[15px] font-bold ${isPremium ? "text-white" : isPopular ? "text-accent" : "text-foreground"}`}>{plan.price}</p>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${isPremium ? "text-white/75" : "text-muted"}`}>{plan.features}</p>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted mt-3 text-center">Les plans sont synchronises avec la page abonnement des utilisateurs.</p>
        </div>
      </div>
    </div>
  );
}
