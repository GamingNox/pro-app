"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Users, TrendingUp, RefreshCw, UserPlus, Activity } from "lucide-react";

interface DBUser {
  id: string;
  name: string;
  email: string;
  business: string;
  has_onboarded: boolean;
  created_at: string;
}

export default function AdminAnalyticsPage() {
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from("user_profiles")
      .select("id, name, email, business, has_onboarded, created_at")
      .order("created_at", { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const activeUsers = users.filter((u) => u.has_onboarded);
  const proUsers = users.filter((u) => u.has_onboarded && u.business);
  const clientUsers = users.filter((u) => u.has_onboarded && !u.business);

  const newThisWeek = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return users.filter((u) => new Date(u.created_at) >= weekAgo).length;
  }, [users]);

  const newThisMonth = useMemo(() => {
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
    return users.filter((u) => new Date(u.created_at) >= monthAgo).length;
  }, [users]);

  // Weekly registration chart
  const weeklyChart = useMemo(() => {
    const days = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
    const now = new Date();
    return days.map((label, i) => {
      const d = new Date(now);
      const dayDiff = (now.getDay() + 6) % 7;
      d.setDate(d.getDate() - dayDiff + i);
      const ds = d.toISOString().split("T")[0];
      return { label, value: users.filter((u) => u.created_at.startsWith(ds)).length };
    });
  }, [users]);
  const maxWeek = Math.max(...weeklyChart.map((d) => d.value), 1);

  // Activation rate: onboarded / total
  const activationRate = users.length > 0 ? Math.round((activeUsers.length / users.length) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-accent font-bold uppercase tracking-wider">Console de suivi</p>
            <h1 className="text-[24px] font-bold text-foreground tracking-tight mt-1">Analytics</h1>
            <p className="text-[12px] text-muted">Métriques utilisateurs en temps réel</p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={loadData} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center" style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}>
            <RefreshCw size={14} className={`text-muted ${loading ? "animate-spin" : ""}`} />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {/* KPI cards — users only */}
          <div className="space-y-3 mb-5">
            <div className="bg-white rounded-2xl p-5 shadow-card-premium">
              <div className="flex items-center justify-between mb-1">
                <Users size={16} className="text-accent" />
                <span className="text-[10px] font-bold text-success bg-success-soft px-2 py-0.5 rounded">+{newThisMonth} ce mois</span>
              </div>
              <p className="text-[10px] text-muted mt-2">Utilisateurs actifs</p>
              <p className="text-[24px] font-bold text-foreground leading-none">{activeUsers.length}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-card-premium">
                <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Professionnels</p>
                <p className="text-[22px] font-bold text-accent leading-none mt-1">{proUsers.length}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-card-premium">
                <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Clients</p>
                <p className="text-[22px] font-bold text-foreground leading-none mt-1">{clientUsers.length}</p>
              </div>
            </div>

            <div className="bg-accent-soft rounded-2xl p-5 text-center">
              <Activity size={20} className="text-accent mx-auto mb-2" />
              <p className="text-[28px] font-bold text-foreground">{activationRate}%</p>
              <p className="text-[12px] text-muted">Taux d&apos;activation (inscrits actifs / total)</p>
            </div>
          </div>

          {/* Weekly registration chart */}
          <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-bold text-foreground">Inscriptions cette semaine</h3>
              <span className="text-[11px] text-accent font-bold">+{newThisWeek}</span>
            </div>
            <div className="flex items-end gap-[5px] h-[100px] mb-2">
              {weeklyChart.map((d, i) => (
                <motion.div key={i} className={`flex-1 rounded-[4px] ${i === (new Date().getDay() + 6) % 7 ? "bg-accent" : "bg-accent/12"}`}
                  initial={{ height: "10%" }} animate={{ height: `${Math.max((d.value / maxWeek) * 100, 8)}%` }}
                  transition={{ delay: i * 0.05, duration: 0.2 }} />
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-muted">{weeklyChart.map((d) => <span key={d.label}>{d.label}</span>)}</div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white rounded-2xl p-4 shadow-card-premium">
              <p className="text-[9px] text-muted font-bold uppercase">Cette semaine</p>
              <p className="text-[20px] font-bold text-accent mt-1">+{newThisWeek}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-card-premium">
              <p className="text-[9px] text-muted font-bold uppercase">Ce mois</p>
              <p className="text-[20px] font-bold text-success mt-1">+{newThisMonth}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-card-premium">
              <p className="text-[9px] text-muted font-bold uppercase">Total profils</p>
              <p className="text-[20px] font-bold text-foreground mt-1">{users.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-card-premium">
              <p className="text-[9px] text-muted font-bold uppercase">Plans</p>
              <p className="text-[20px] font-bold text-accent mt-1">3</p>
              <p className="text-[8px] text-subtle">Essentiel · Pro · Elite</p>
            </div>
          </div>

          {/* System status */}
          <div className="bg-white rounded-2xl p-5 shadow-card-premium">
            <h3 className="text-[14px] font-bold text-foreground mb-3">État du système</h3>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-success" />
              <div>
                <p className="text-[13px] text-foreground">Tous les systèmes opérationnels.</p>
                <p className="text-[11px] text-muted mt-0.5">Dernière vérification : {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
