"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  CreditCard,
  Sparkles,
  Gift,
  MessageSquareHeart,
  BarChart3,
  Settings as SettingsIcon,
  Wrench,
  Activity,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { countPendingBetaRequests, getUnseenBetaCount } from "@/lib/beta";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";

interface Tool {
  key: string;
  label: string;
  subtitle: string;
  icon: typeof Users;
  href: string;
  category: CategoryKey;
  badge?: number;
}

export default function AdminToolsPage() {
  // Data is optional — the page renders instantly with 0s and fills in
  // when available. No entrance animations, no loading flicker.
  const [userCount, setUserCount] = useState(0);
  const [pendingBeta, setPendingBeta] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { count } = await supabase
          .from("user_profiles")
          .select("id", { count: "exact", head: true });
        if (!cancelled) setUserCount(count ?? 0);
        const c = await countPendingBetaRequests();
        if (!cancelled) setPendingBeta(c);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail === "number") setPendingBeta((prev) => Math.max(prev, detail));
    };
    window.addEventListener("admin-beta-unseen", handler);
    const cached = getUnseenBetaCount();
    if (cached > 0) setPendingBeta((prev) => Math.max(prev, cached));
    return () => window.removeEventListener("admin-beta-unseen", handler);
  }, []);

  // Each tool is mapped to a semantic CATEGORY key so colors are never random.
  // The mapping follows the same logic as settings routes:
  //   users → clients (blue)
  //   plans → finance (green)
  //   beta + feedback → beta (violet)
  //   gifts → marketing (orange)
  //   analytics → finance (green)
  //   activity → system (grey)
  //   settings → system (grey)
  const tools = useMemo<Tool[]>(() => [
    { key: "users",    label: "Utilisateurs", subtitle: `${userCount} comptes`,      icon: Users,             href: "/admin-users",    category: "clients" },
    { key: "plans",    label: "Abonnements",  subtitle: "Plans & tarifs",            icon: CreditCard,        href: "/admin-plans",    category: "finance" },
    { key: "beta",     label: "Demandes bêta",subtitle: "Validation candidats",      icon: Sparkles,          href: "/admin-beta",     category: "beta", badge: pendingBeta },
    { key: "feedback", label: "Retours bêta", subtitle: "Bugs & suggestions",        icon: MessageSquareHeart,href: "/admin-feedback", category: "beta" },
    { key: "gifts",    label: "Codes cadeaux",subtitle: "Récompenses Premium",       icon: Gift,              href: "/admin-gifts",    category: "marketing" },
    { key: "activity", label: "Activité",     subtitle: "Timeline globale",          icon: Activity,          href: "/admin-activity", category: "system" },
    { key: "analytics",label: "Statistiques", subtitle: "Vue globale",               icon: BarChart3,         href: "/admin-analytics",category: "finance" },
    { key: "settings", label: "Réglages",     subtitle: "Configuration",             icon: SettingsIcon,      href: "/admin-settings", category: "system" },
  ], [userCount, pendingBeta]);

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden bg-background"
      style={{
        ["--color-accent" as string]: "#8B5CF6",
        ["--color-accent-soft" as string]: "#F3F0FF",
        ["--color-accent-deep" as string]: "#6D28D9",
      } as React.CSSProperties}
    >
      {/* ═══ HEADER ═══ */}
      <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#6D28D9" }}>Admin</p>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight leading-tight">Outils admin</h1>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))", boxShadow: "0 4px 12px rgba(139, 92, 246, 0.35)" }}>
          <Wrench size={16} className="text-white" strokeWidth={2.5} />
        </div>
      </div>

      {/* ═══ SCROLLABLE CONTENT ═══ */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">

          {/* Hero — rendered instantly, counts fill in live */}
          <div
            className="rounded-[22px] p-5 mb-5 text-white relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-deep) 100%)",
              boxShadow: "0 14px 36px color-mix(in srgb, var(--color-accent) 35%, transparent)",
            }}
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -right-4 -bottom-12 w-28 h-28 rounded-full bg-white/10" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/85">Tableau de contrôle</p>
              </div>
              <h2 className="text-[22px] font-bold tracking-tight leading-tight">Toutes les commandes en un lieu</h2>
              <p className="text-[12px] text-white/85 mt-2 leading-relaxed max-w-[280px]">
                Utilisateurs, demandes bêta, codes cadeaux, activité — accès direct à chaque outil.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/20">
                <div>
                  <p className="text-[22px] font-bold leading-none">{userCount}</p>
                  <p className="text-[9px] text-white/70 mt-1 uppercase tracking-wider">Comptes</p>
                </div>
                <div>
                  <p className="text-[22px] font-bold leading-none">{pendingBeta}</p>
                  <p className="text-[9px] text-white/70 mt-1 uppercase tracking-wider">Bêta en attente</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tools grid — instant render, no stagger animations */}
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted mb-2.5 px-1">Applications</p>
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {tools.map((t) => {
              const Icon = t.icon;
              const meta = CATEGORIES[t.category];
              return (
                <Link key={t.key} href={t.href} className="block">
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="bg-white rounded-2xl p-3 shadow-card-premium flex flex-col items-center gap-2 text-center relative"
                  >
                    <div
                      className="w-11 h-11 rounded-[14px] flex items-center justify-center"
                      style={{
                        backgroundColor: meta.soft,
                        border: `1px solid color-mix(in srgb, ${meta.color} 20%, white)`,
                      }}
                    >
                      <Icon size={17} style={{ color: meta.color }} strokeWidth={2.4} />
                    </div>
                    <p className="text-[11px] font-bold text-foreground leading-tight">{t.label}</p>
                    {t.badge !== undefined && t.badge > 0 && (
                      <span className="absolute top-2 right-2 min-w-[16px] h-[16px] px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #EF4444, #BE123C)" }}>
                        {t.badge > 9 ? "9+" : t.badge}
                      </span>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Quick jump list with subtitles — category-coded */}
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted mb-2.5 px-1">Accès rapide</p>
          <div className="bg-white rounded-2xl shadow-card-premium overflow-hidden mb-5">
            {tools.slice(0, 7).map((t, i) => {
              const Icon = t.icon;
              const meta = CATEGORIES[t.category];
              return (
                <Link key={`row-${t.key}`} href={t.href}>
                  <div className={`flex items-center gap-3 px-4 py-3.5 ${i < 6 ? "border-b border-border-light" : ""}`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: meta.soft }}>
                      <Icon size={15} style={{ color: meta.color }} strokeWidth={2.4} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-foreground">{t.label}</p>
                      <p className="text-[11px] text-muted mt-0.5 truncate">{t.subtitle}</p>
                    </div>
                    {t.badge !== undefined && t.badge > 0 && (
                      <span className="min-w-[20px] h-[20px] px-1.5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                        style={{ backgroundColor: meta.color }}>
                        {t.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Footer tip */}
          <div className="bg-accent-soft rounded-2xl p-4">
            <div className="flex items-start gap-2.5">
              <Wrench size={14} className="text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[12px] font-bold text-foreground">Couleurs par catégorie</p>
                <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                  Chaque outil hérite de la couleur de sa famille dans les paramètres pour une navigation plus rapide par mémoire visuelle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
