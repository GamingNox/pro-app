"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Users, UserPlus, CreditCard, Shield, BarChart3, RefreshCw, TrendingUp, CheckCircle2 } from "lucide-react";

interface DBUser {
  id: string;
  name: string;
  email: string;
  business: string;
  has_onboarded: boolean;
  created_at: string;
}

export default function AdminDashboardPage() {
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

  // User registration chart (last 6 months)
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

  // Recent signups
  const recentSignups = users.filter((u) => u.has_onboarded).slice(0, 4);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight">Tableau de bord</h1>
          <p className="text-[12px] text-muted mt-0.5">Vue d&apos;ensemble de la plateforme</p>
        </div>
        <motion.button whileTap={{ scale: 0.85 }} onClick={loadData} className="w-10 h-10 rounded-xl bg-white shadow-card-premium flex items-center justify-center">
          <RefreshCw size={16} className={`text-muted ${loading ? "animate-spin" : ""}`} />
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {/* KPI — Users only */}
          <div className="space-y-3 mb-5">
            <div className="bg-accent-gradient rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] text-white/60 font-bold uppercase tracking-wider">Utilisateurs actifs</p>
                <Users size={16} className="text-white/60" />
              </div>
              <p className="text-[28px] font-bold leading-none mt-1">{activeUsers.length}</p>
              {newThisWeek > 0 && <p className="text-[11px] text-white/70 mt-1">+{newThisWeek} cette semaine</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-card-premium">
                <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Professionnels</p>
                <p className="text-[22px] font-bold text-foreground leading-none mt-1">{proUsers.length}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-card-premium">
                <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Clients</p>
                <p className="text-[22px] font-bold text-foreground leading-none mt-1">{clientUsers.length}</p>
              </div>
            </div>

            {/* Subscription placeholder — shows when Stripe is connected */}
            <div className="bg-white rounded-2xl p-4 shadow-card-premium">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Abonnements</p>
                <CreditCard size={16} className="text-muted" />
              </div>
              <p className="text-[14px] text-muted mt-1">Aucun système de paiement configuré.</p>
              <p className="text-[10px] text-subtle mt-0.5">Connectez Stripe pour suivre les abonnements.</p>
            </div>
          </div>

          {/* User growth chart */}
          <div className="bg-white rounded-2xl p-4 shadow-card-premium mb-5">
            <p className="text-[13px] font-bold text-foreground mb-4">Inscriptions par mois</p>
            <div className="flex items-end gap-[4px] h-[80px] mb-2">
              {chartData.map((m, i) => (
                <motion.div key={i} className={`flex-1 rounded-[3px] ${i === chartData.length - 1 ? "bg-accent" : "bg-accent/12"}`}
                  initial={{ height: "10%" }} animate={{ height: `${Math.max((m.value / maxChart) * 100, 6)}%` }}
                  transition={{ delay: i * 0.05, duration: 0.5 }} />
              ))}
            </div>
            <div className="flex justify-between text-[8px] text-muted">{chartData.map((m) => <span key={m.label}>{m.label}</span>)}</div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-border-light">
              <div><p className="text-[9px] text-muted font-bold uppercase">Ce mois</p><p className="text-[16px] font-bold text-foreground">+{newThisMonth}</p></div>
              <div><p className="text-[9px] text-muted font-bold uppercase">Total</p><p className="text-[16px] font-bold text-foreground">{users.length}</p></div>
            </div>
          </div>

          {/* Recent signups */}
          <div className="mb-5">
            <h2 className="text-[16px] font-bold text-foreground mb-3">Dernières inscriptions</h2>
            {recentSignups.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 shadow-card-premium text-center">
                <Users size={24} className="text-muted mx-auto mb-2" />
                <p className="text-[13px] text-muted">Aucun utilisateur inscrit.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentSignups.map((u) => (
                  <div key={u.id} className="bg-white rounded-2xl p-4 shadow-sm-apple flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center text-accent text-[14px] font-bold">
                      {u.name ? u.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-foreground truncate">{u.name || "Sans nom"}</p>
                      <p className="text-[10px] text-muted truncate">{u.email} · {new Date(u.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                  </div>
                ))}
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
