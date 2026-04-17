"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Users, UserPlus, CreditCard, Shield, BarChart3, RefreshCw, TrendingUp, CheckCircle2, Gift, Sparkles, ArrowRight, MessageSquareHeart } from "lucide-react";
import { countPendingBetaRequests, getUnseenBetaCount } from "@/lib/beta";

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
  const [pendingBeta, setPendingBeta] = useState(0);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from("user_profiles")
      .select("id, name, email, business, has_onboarded, created_at")
      .order("created_at", { ascending: false });
    if (data) setUsers(data);
    const count = await countPendingBetaRequests();
    setPendingBeta(count);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  // Live-update the pending badge whenever the AdminBetaRealtime listener
  // fires the "admin-beta-unseen" custom event (a new INSERT occurred).
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail === "number") setPendingBeta((prev) => Math.max(prev, detail));
    };
    window.addEventListener("admin-beta-unseen", handler);
    // Also hydrate from localStorage on mount
    const cached = getUnseenBetaCount();
    if (cached > 0) setPendingBeta((prev) => Math.max(prev, cached));
    return () => window.removeEventListener("admin-beta-unseen", handler);
  }, []);

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
        <motion.button whileTap={{ scale: 0.95 }} onClick={loadData} className="w-10 h-10 rounded-xl bg-white shadow-card-premium flex items-center justify-center">
          <RefreshCw size={16} className={`text-muted ${loading ? "animate-spin" : ""}`} />
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">

          {/* ═══ PRIORITY BETA ALERT ═══ */}
          {pendingBeta > 0 && (
            <Link href="/admin-beta">
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.99 }}
                className="rounded-2xl p-4 mb-5 text-white relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                  boxShadow: "0 10px 28px rgba(139, 92, 246, 0.35)",
                }}
              >
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <Sparkles size={18} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/85">Action requise</p>
                    <p className="text-[14px] font-bold leading-tight mt-0.5">
                      {pendingBeta} demande{pendingBeta > 1 ? "s" : ""} bêta en attente
                    </p>
                    <p className="text-[11px] text-white/80 mt-0.5">Examiner et valider ces candidatures</p>
                  </div>
                  <ArrowRight size={16} className="text-white flex-shrink-0" strokeWidth={2.5} />
                </div>
              </motion.div>
            </Link>
          )}

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

            {/* Plans overview */}
            <Link href="/admin-plans">
              <motion.div whileTap={{ scale: 0.98 }} className="bg-white rounded-2xl p-4 shadow-card-premium block">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Plans</p>
                  <CreditCard size={16} className="text-accent" />
                </div>
                <p className="text-[14px] text-foreground font-semibold mt-1">3 plans actifs</p>
                <p className="text-[10px] text-muted mt-0.5">Essentiel · Pro · Elite</p>
              </motion.div>
            </Link>
          </div>

          {/* User growth chart */}
          <div className="bg-white rounded-2xl p-4 shadow-card-premium mb-5">
            <p className="text-[13px] font-bold text-foreground mb-4">Inscriptions par mois</p>
            <div className="flex items-end gap-[4px] h-[80px] mb-2">
              {chartData.map((m, i) => (
                <motion.div key={i} className={`flex-1 rounded-[3px] ${i === chartData.length - 1 ? "bg-accent" : "bg-accent/12"}`}
                  initial={{ height: "10%" }} animate={{ height: `${Math.max((m.value / maxChart) * 100, 6)}%` }}
                  transition={{ delay: i * 0.05, duration: 0.2 }} />
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
              { icon: Sparkles, label: "Demandes bêta", href: "/admin-beta", violet: true, badge: pendingBeta > 0 ? pendingBeta : undefined },
              { icon: MessageSquareHeart, label: "Retours bêta", href: "/admin-feedback", violet: true },
              { icon: Gift, label: "Codes cadeaux", href: "/admin-gifts", violet: true },
              { icon: BarChart3, label: "Analytics", href: "/admin-analytics" },
              { icon: Shield, label: "Reglages", href: "/admin-settings" },
            ].map((a) => {
              const Icon = a.icon;
              const hasViolet = "violet" in a && a.violet;
              const iconBg = hasViolet ? "#F3F0FF" : undefined;
              const iconColor = hasViolet ? "#8B5CF6" : "var(--color-accent)";
              return (
                <Link key={a.label} href={a.href}>
                  <motion.div whileTap={{ scale: 0.95 }} className="bg-white rounded-2xl p-4 shadow-card-premium flex flex-col items-center gap-2 relative">
                    {a.badge && a.badge > 0 && (
                      <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #EF4444, #BE123C)", boxShadow: "0 2px 6px rgba(239, 68, 68, 0.35)" }}>
                        {a.badge > 99 ? "99+" : a.badge}
                      </span>
                    )}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${!iconBg ? "bg-border-light" : ""}`}
                      style={iconBg ? { backgroundColor: iconBg } : undefined}>
                      <Icon size={18} style={{ color: iconColor }} />
                    </div>
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
