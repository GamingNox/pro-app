"use client";

import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/lib/store";
import { getInitials } from "@/lib/data";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plus, CalendarDays, UserPlus, Receipt, ChevronRight,
  CheckCircle2, Clock, Sparkles, Bell,
  FileText, Send, Copy, MessageCircle, Mail,
  Users, X, TrendingUp, Package, Gift, ArrowRight,
} from "lucide-react";
import { staggerItem } from "@/lib/motion";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";
import SmartInsights from "@/components/SmartInsights";

type RevPeriod = "jour" | "semaine" | "mois";

function isPhotoAvatar(avatar: string): boolean {
  return avatar.startsWith("data:") || avatar.startsWith("http");
}

export default function DashboardPage() {
  const {
    user, clients, appointments, invoices, products, services,
    getTodayAppointments, getWeekRevenue, getMonthRevenue, getTodayRevenue,
    getPendingAmount, getLowStockProducts, getClient, setAppointmentStatus,
  } = useApp();

  const [revPeriod, setRevPeriod] = useState<RevPeriod>("mois");

  // Progressive setup banner: shown when the user signed up in "quick" mode
  // OR abandoned the multi-step flow. Dismissible — the 1/0 flag is stored
  // in localStorage so we don't nag after a manual dismissal.
  const [setupDismissed, setSetupDismissed] = useState(true); // assume dismissed until hydrated
  useEffect(() => {
    try {
      setSetupDismissed(localStorage.getItem("setup-banner-dismissed") === "1");
    } catch {}
  }, []);

  // Compute how much of the onboarding has been filled. Each chunk is worth
  // the same percentage so the user sees visible progress after each step.
  const setupProgress = useMemo(() => {
    const checks = [
      Boolean(user.businessType || user.business),
      Boolean(user.phone),
      services.length > 0,
      Boolean(user.onboardingData?.workDays),
      Boolean(user.onboardingData?.notifications !== undefined),
    ];
    const done = checks.filter(Boolean).length;
    return { done, total: checks.length, pct: Math.round((done / checks.length) * 100) };
  }, [user.businessType, user.business, user.phone, services.length, user.onboardingData]);

  // Banner visible only when setup is not completed, progress < 100% and the
  // user hasn't dismissed it. Account must also be hydrated (non-empty name).
  const showSetupBanner = Boolean(user.name) && user.setupCompleted === false && setupProgress.pct < 100 && !setupDismissed;

  const todayAppts = useMemo(() => getTodayAppointments(), [getTodayAppointments]);
  const weekRev = useMemo(() => getWeekRevenue(), [getWeekRevenue]);
  const monthRev = useMemo(() => getMonthRevenue(), [getMonthRevenue]);
  const todayRev = useMemo(() => getTodayRevenue(), [getTodayRevenue]);
  const pending = useMemo(() => getPendingAmount(), [getPendingAmount]);
  const lowStock = useMemo(() => getLowStockProducts(), [getLowStockProducts]);
  const pendingInvoices = useMemo(() => invoices.filter((i) => i.status === "pending" && i.clientId !== "__expense__"), [invoices]);

  const displayRev = revPeriod === "jour" ? todayRev : revPeriod === "semaine" ? weekRev : monthRev;
  const periodLabel = revPeriod === "jour" ? "ce jour" : revPeriod === "semaine" ? "cette semaine" : "ce mois";

  const nextAppt = todayAppts.find((a) => {
    if (!a.time || typeof a.time !== "string") return false;
    const parts = a.time.split(":");
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return false;
    const now = new Date();
    return h > now.getHours() || (h === now.getHours() && m > now.getMinutes());
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  // Dynamic subtitle — contextual where possible, otherwise rotates through
  // a large pool of friendly messages. Cursor is persisted in sessionStorage
  // so each app open / navigation picks a different one.
  const subtitleIdeas = useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    const h = now.getHours();
    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();

    // Contextual — state-driven
    if (todayAppts.length >= 3) list.push(`${todayAppts.length} rendez-vous vous attendent aujourd'hui.`);
    if (pendingInvoices.length > 0) list.push(`${pendingInvoices.length} facture${pendingInvoices.length > 1 ? "s" : ""} en attente — ${pending.toFixed(0)} € à relancer.`);
    if (lowStock.length > 0) list.push("Pensez à vérifier votre stock.");

    // Time-aware
    if (h < 10) list.push("Bonne matinée pour avancer sereinement.");
    if (h >= 12 && h < 14) list.push("Pause déjeuner bien méritée.");
    if (h >= 17 && h < 20) list.push("Bilan de fin de journée, que d'accompli.");
    if (h >= 20) list.push("Un dernier coup d'oeil avant de refermer.");

    // Weekday
    if (dayOfWeek === 1 && h < 12) list.push("Nouvelle semaine, nouvelles opportunités.");
    if (dayOfWeek === 5 && h >= 15) list.push("Dernier effort avant le week-end.");
    if (dayOfWeek === 6) list.push("Samedi, les clients sont au rendez-vous.");

    // Month progress
    if (dayOfMonth >= 25) list.push("Fin du mois proche, objectif en vue.");
    if (dayOfMonth <= 3) list.push("Nouveau mois, nouvelle dynamique.");

    // Always-available rotation
    list.push(
      "Prêt à développer votre activité aujourd'hui ?",
      "Un petit effort de plus et vous y êtes.",
      "Vous avez déjà fait du bon travail.",
      "Tout roule, continuez comme ça.",
      "L'app est là pour vous simplifier la vie.",
      "Chaque client compte, chaque détail aussi.",
      "Votre temps vaut de l'or, on vous en fait gagner.",
      "Concentrez-vous sur l'essentiel, le reste on gère.",
      "Une journée bien pilotée, c'est une journée réussie.",
      "Prenez un café, regardons où vous en êtes.",
      "Quelques gestes, beaucoup d'impact.",
    );

    return list;
  }, [todayAppts.length, pendingInvoices.length, pending, lowStock.length]);

  const [subtitleIdx, setSubtitleIdx] = useState(0);
  useEffect(() => {
    try {
      const cursor = parseInt(sessionStorage.getItem("dashboard-subtitle-idx") || "0") || 0;
      const total = Math.max(subtitleIdeas.length, 1);
      sessionStorage.setItem("dashboard-subtitle-idx", String((cursor + 1) % total));
      setSubtitleIdx(cursor % total);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dynamicSubtitle = subtitleIdeas[subtitleIdx % Math.max(subtitleIdeas.length, 1)] || subtitleIdeas[0];

  // 7-day revenue chart
  const chartBars = useMemo(() => {
    const dl = ["D", "L", "M", "M", "J", "V", "S"];
    const now = new Date();
    const bars: { label: string; value: number; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      bars.push({
        label: dl[d.getDay()],
        value: invoices.filter((x) => x.date === ds && x.status === "paid" && x.clientId !== "__expense__").reduce((s, x) => s + x.amount, 0),
        isToday: i === 0,
      });
    }
    return bars;
  }, [invoices]);
  const maxBar = Math.max(...chartBars.map((b) => b.value), 1);

  const prevWeekRev = useMemo(() => {
    const now = new Date();
    const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const oneWeekAgo = new Date(now); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return invoices.filter((i) => i.status === "paid" && i.clientId !== "__expense__" && new Date(i.date) >= twoWeeksAgo && new Date(i.date) < oneWeekAgo).reduce((s, i) => s + i.amount, 0);
  }, [invoices]);
  const weekChange = prevWeekRev > 0 ? Math.round(((weekRev - prevWeekRev) / prevWeekRev) * 100) : 0;

  // Occupation rate (appointments with clients / total slots today)
  const occupationRate = useMemo(() => {
    const totalSlots = 10; // 8h-18h = 10 slots
    return todayAppts.length > 0 ? Math.min(Math.round((todayAppts.length / totalSlots) * 100), 100) : 0;
  }, [todayAppts]);

  // Notifications list for popup
  const allNotifs = useMemo(() => {
    const n: { title: string; subtitle: string; color: string; bg: string; href: string; icon: typeof Clock; type: string }[] = [];
    if (pendingInvoices.length > 0) n.push({
      title: `${pendingInvoices.length} facture${pendingInvoices.length > 1 ? "s" : ""} en attente`,
      subtitle: `${pending.toFixed(0)}\u00A0€ à encaisser`, color: "text-warning", bg: "bg-warning-soft",
      href: "/gestion?tab=payments", icon: FileText, type: "Paiement",
    });
    if (lowStock.length > 0) n.push({
      title: `Stock faible : ${lowStock[0].name}`,
      subtitle: `${lowStock[0].quantity} unité${lowStock[0].quantity !== 1 ? "s" : ""} restante${lowStock[0].quantity !== 1 ? "s" : ""}`,
      color: "text-danger", bg: "bg-danger-soft", href: "/gestion?tab=stock", icon: Package, type: "Stock",
    });
    if (todayAppts.length > 0 && nextAppt) {
      const c = getClient(nextAppt.clientId);
      n.push({
        title: `Prochain RDV à ${nextAppt.time}`,
        subtitle: c ? `${c.firstName} ${c.lastName} — ${nextAppt.title}` : nextAppt.title,
        color: "text-accent", bg: "bg-accent-soft", href: "/appointments", icon: CalendarDays, type: "Rendez-vous",
      });
    }
    // Smart suggestions as notifications — O(n) using pre-built map
    if (clients.length > 3) {
      const lastMap = new Map<string, string>();
      for (const a of appointments) {
        const prev = lastMap.get(a.clientId);
        if (!prev || a.date > prev) lastMap.set(a.clientId, a.date);
      }
      const cutoff = Date.now() - 30 * 86400000;
      const inactive = clients.find((c) => {
        const last = lastMap.get(c.id);
        return !last || new Date(last).getTime() < cutoff;
      });
      if (inactive) {
        n.push({
          title: `Relancer ${inactive.firstName} ${inactive.lastName}`,
          subtitle: "Pas de visite depuis plus de 30 jours",
          color: "text-accent", bg: "bg-accent-soft", href: "/clients", icon: Send, type: "Suggestion",
        });
      }
    }
    return n;
  }, [pendingInvoices, lowStock, todayAppts, nextAppt, pending, getClient, clients, appointments]);

  // Recent clients (last activity)
  const recentClients = useMemo(() => {
    return clients.map((c) => {
      const lastAppt = appointments.filter((a) => a.clientId === c.id).sort((a, b) => b.date.localeCompare(a.date))[0];
      return { client: c, lastAppt };
    }).filter((x) => x.lastAppt).sort((a, b) => b.lastAppt!.date.localeCompare(a.lastAppt!.date)).slice(0, 4);
  }, [clients, appointments]);

  // Time ago helper
  function timeAgo(dateStr: string): string {
    const diff = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
    if (diff < 1) return "À l'instant";
    if (diff < 24) return `Il y a ${Math.floor(diff)}h`;
    const days = Math.floor(diff / 24);
    if (days === 1) return "Hier";
    return `Il y a ${days} j.`;
  }

  function getClientTag(notes: string): string {
    const m = notes.match(/^\[tag:(\w+)\]/);
    return m ? m[1] : "";
  }

  const TAG_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    vip: { label: "VIP", color: "text-warning", bg: "bg-warning-soft" },
    regular: { label: "ACTIF", color: "text-accent", bg: "bg-accent-soft" },
    new: { label: "NOUVEAU", color: "text-success", bg: "bg-success-soft" },
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-background">

      {/* ═══ FIXED HEADER — dynamic greeting ═══ */}
      <div className="flex-shrink-0">
        <header className="px-6 pt-5 pb-3 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-[26px] font-bold text-foreground tracking-tight leading-[1.15]">
              {greeting()}{user.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
            </h1>
            <motion.p
              key={dynamicSubtitle}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="text-[13px] text-muted font-medium mt-1 leading-relaxed"
            >
              {dynamicSubtitle}
            </motion.p>
          </div>
          <Link href="/settings/notifications">
            <motion.div whileTap={{ scale: 0.95 }}
              className="relative w-10 h-10 rounded-xl bg-white shadow-card-premium flex items-center justify-center flex-shrink-0">
              <Bell size={18} className="text-accent" />
              {allNotifs.length > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))", boxShadow: "0 2px 6px color-mix(in srgb, var(--color-accent) 35%, transparent)" }}>
                  <span className="text-[9px] text-white font-bold">{allNotifs.length > 9 ? "9+" : allNotifs.length}</span>
                </div>
              )}
            </motion.div>
          </Link>
        </header>
      </div>

      {/* ═══ SCROLLABLE CONTENT ═══ */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">

          {/* ── Progressive setup banner ─────────────── */}
          {showSetupBanner && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-[22px] p-4 mb-5 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #5B4FE9 0%, #3B30B5 100%)",
                boxShadow: "0 14px 36px -12px rgba(91,79,233,0.45)",
              }}
            >
              <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10" />
              <div className="absolute right-6 bottom-4 w-14 h-14 rounded-full bg-white/5" />
              <div className="relative z-10">
                <div className="flex items-start gap-3.5 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
                    <Sparkles size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white">Terminer votre configuration</p>
                    <p className="text-[11px] text-white/75 mt-0.5 leading-relaxed">
                      {setupProgress.done} étape{setupProgress.done > 1 ? "s" : ""} sur {setupProgress.total} — votre espace sera prêt en 2 minutes.
                    </p>
                  </div>
                  <motion.button whileTap={{ scale: 0.8 }}
                    onClick={() => { setSetupDismissed(true); try { localStorage.setItem("setup-banner-dismissed", "1"); } catch {} }}>
                    <X size={14} className="text-white/60" />
                  </motion.button>
                </div>

                {/* Progress bar */}
                <div className="h-[3px] w-full rounded-full bg-white/20 overflow-hidden mb-3">
                  <motion.div
                    className="h-full rounded-full bg-white"
                    initial={{ width: 0 }}
                    animate={{ width: `${setupProgress.pct}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>

                <Link href="/onboarding?resume=1">
                  <motion.div whileTap={{ scale: 0.97 }}
                    className="w-full bg-white rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-[12px] font-bold text-accent">
                    Continuer la configuration <ArrowRight size={14} />
                  </motion.div>
                </Link>
              </div>
            </motion.div>
          )}

          {/* ── Revenue card (white, with period toggle) ─── */}
          <div className="bg-white rounded-[22px] p-5 shadow-card-premium mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Chiffre d&apos;affaires</p>
              <div className="flex bg-border-light rounded-lg p-[2px]">
                {(["jour", "semaine", "mois"] as RevPeriod[]).map((p) => (
                  <button key={p} onClick={() => setRevPeriod(p)}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${revPeriod === p ? "bg-white text-foreground shadow-sm" : "text-muted"}`}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end gap-2.5 mb-4">
              <p className="text-[34px] font-bold text-foreground tracking-tight leading-none">
                {displayRev.toFixed(0)}<span className="text-[18px]">€</span>
              </p>
              {weekChange !== 0 && revPeriod !== "jour" && (
                <span className={`text-[12px] font-bold mb-1 px-2 py-0.5 rounded-md flex items-center gap-1 ${weekChange > 0 ? "text-success bg-success-soft" : "text-danger bg-danger-soft"}`}>
                  <TrendingUp size={10} className={weekChange < 0 ? "rotate-180" : ""} />
                  {weekChange > 0 ? "+" : ""}{weekChange}%
                  <span className="font-medium text-muted ml-0.5">{periodLabel}</span>
                </span>
              )}
            </div>

            {/* Mini bar chart */}
            <div className="flex items-end gap-[5px] h-[72px] mb-4">
              {chartBars.map((b, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full h-[58px] flex items-end">
                    <motion.div
                      className={`w-full rounded-[4px] ${b.isToday ? "bg-accent" : "bg-accent/12"}`}
                      initial={{ height: "6%" }}
                      animate={{ height: `${Math.max((b.value / maxBar) * 100, 6)}%` }}
                      transition={{ delay: i * 0.03, duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                    />
                  </div>
                  <span className={`text-[9px] mt-1 ${b.isToday ? "text-accent font-bold" : "text-muted"}`}>{b.label}</span>
                </div>
              ))}
            </div>

            {/* KPI row */}
            <div className="flex gap-3 pt-3 border-t border-border-light">
              <div className="flex-1">
                <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Rendez-vous</p>
                <p className="text-[18px] font-bold text-foreground leading-none mt-1">{todayAppts.length}</p>
                <p className="text-[10px] text-muted">aujourd&apos;hui</p>
              </div>
              <div className="flex-1">
                <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Occupation</p>
                <p className="text-[18px] font-bold text-foreground leading-none mt-1">{occupationRate}%</p>
                <p className="text-[10px] text-muted">du planning</p>
              </div>
              <div className="flex-1">
                <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Évolution</p>
                <p className={`text-[18px] font-bold leading-none mt-1 flex items-center gap-1 ${weekChange >= 0 ? "text-success" : "text-danger"}`}>
                  <TrendingUp size={12} className={weekChange < 0 ? "rotate-180" : ""} />
                  {Math.abs(weekChange)}%
                </p>
                <p className="text-[10px] text-muted">/sem</p>
              </div>
            </div>
          </div>

          {/* ── Performance — visual KPIs ── */}
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted mb-2.5 px-1">Performance</p>
          {(() => {
            const now = Date.now();
            const thirtyDays = 30 * 86400000;
            const newClientsCount = clients.filter((c) => c.createdAt && now - new Date(c.createdAt).getTime() < thirtyDays).length;
            return (
              <div className="grid grid-cols-3 gap-2.5 mb-5">
                <Link href="/clients" className="block">
                  <motion.div whileTap={{ scale: 0.96 }} className="bg-white rounded-2xl p-3.5 shadow-card-premium h-full">
                    <div className="w-7 h-7 rounded-lg bg-accent-soft flex items-center justify-center mb-2">
                      <UserPlus size={12} className="text-accent" strokeWidth={2.4} />
                    </div>
                    <p className="text-[18px] font-bold text-foreground leading-none">{newClientsCount}</p>
                    <p className="text-[9px] text-muted mt-1 uppercase tracking-wider">Nouveaux (30 j)</p>
                  </motion.div>
                </Link>
                <Link href="/clients" className="block">
                  <motion.div whileTap={{ scale: 0.96 }} className="bg-white rounded-2xl p-3.5 shadow-card-premium h-full">
                    <div className="w-7 h-7 rounded-lg bg-accent-soft flex items-center justify-center mb-2">
                      <Users size={12} className="text-accent" strokeWidth={2.4} />
                    </div>
                    <p className="text-[18px] font-bold text-foreground leading-none">{clients.length}</p>
                    <p className="text-[9px] text-muted mt-1 uppercase tracking-wider">Clients</p>
                  </motion.div>
                </Link>
                <Link href="/gestion" className="block">
                  <motion.div whileTap={{ scale: 0.96 }} className="bg-white rounded-2xl p-3.5 shadow-card-premium h-full">
                    <div className="w-7 h-7 rounded-lg bg-accent-soft flex items-center justify-center mb-2">
                      <Receipt size={12} className="text-accent" strokeWidth={2.4} />
                    </div>
                    <p className="text-[18px] font-bold text-foreground leading-none">{pendingInvoices.length}</p>
                    <p className="text-[9px] text-muted mt-1 uppercase tracking-wider">En attente</p>
                  </motion.div>
                </Link>
              </div>
            );
          })()}

          {/* ── Referral — clean structured card ── */}
          <Link href="/settings/referral">
            <motion.div whileTap={{ scale: 0.99 }}
              className="w-full rounded-2xl p-4 mb-5 flex items-center gap-3 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 8%, white) 0%, color-mix(in srgb, var(--color-accent) 3%, white) 100%)",
                border: "1px solid color-mix(in srgb, var(--color-accent) 18%, transparent)",
              }}>
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 6%, transparent)" }} />
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10"
                style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))", boxShadow: "0 4px 12px color-mix(in srgb, var(--color-accent) 30%, transparent)" }}>
                <Gift size={16} className="text-white" strokeWidth={2.4} />
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--color-accent-deep)" }}>Parrainage pro</p>
                <p className="text-[13px] font-bold text-foreground leading-tight mt-0.5">
                  Parrainez un ami = <span className="text-accent">1 mois offert</span> 🎁
                </p>
              </div>
              <ChevronRight size={15} className="text-accent flex-shrink-0 relative z-10" strokeWidth={2.4} />
            </motion.div>
          </Link>

          {/* ── Lien de réservation — actionable share card ── */}
          {user.bookingSlug && (() => {
            const bookingUrl = `https://clientbase.fr/p/${user.bookingSlug}`;
            const shareMsg = `Prenez rendez-vous avec ${user.name || user.business || "moi"} : ${bookingUrl}`;
            return (
              <div
                className="w-full rounded-2xl p-4 mb-5 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #5B4FE9, #3B30B5)",
                  boxShadow: "0 12px 32px rgba(91,79,233,0.28)",
                }}
              >
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
                <div className="flex items-center gap-3 relative z-10 mb-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-white">
                    <Send size={18} style={{ color: "#5B4FE9" }} strokeWidth={2.4} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/80">
                      Votre lien de réservation
                    </p>
                    <p className="text-[13px] font-bold text-white mt-0.5 leading-tight truncate">
                      clientbase.fr/p/{user.bookingSlug}
                    </p>
                  </div>
                </div>

                {/* Action buttons — direct share */}
                <div className="grid grid-cols-3 gap-2 relative z-10">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(bookingUrl);
                        window.dispatchEvent(new CustomEvent("save-toast", { detail: { text: "Lien copié" } }));
                      } catch {
                        /* clipboard unavailable */
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm text-white text-[12px] font-bold"
                  >
                    <Copy size={13} strokeWidth={2.4} /> Copier
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      window.location.href = `sms:?&body=${encodeURIComponent(shareMsg)}`;
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm text-white text-[12px] font-bold"
                  >
                    <MessageCircle size={13} strokeWidth={2.4} /> SMS
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      window.location.href = `mailto:?subject=${encodeURIComponent("Mon lien de réservation")}&body=${encodeURIComponent(shareMsg)}`;
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm text-white text-[12px] font-bold"
                  >
                    <Mail size={13} strokeWidth={2.4} /> Email
                  </motion.button>
                </div>
              </div>
            );
          })()}

          {/* ── Smart Insights — real-time business advice ── */}
          <SmartInsights />

          {/* ── Derniers Clients ──────────────────────── */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[17px] font-bold text-foreground">Derniers Clients</h2>
              <Link href="/clients" className="text-[12px] text-accent font-bold flex items-center gap-0.5">
                Voir tout <ChevronRight size={13} />
              </Link>
            </div>

            {recentClients.length === 0 ? (
              <div className="bg-white rounded-[22px] p-7 shadow-card-premium text-center">
                <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-3">
                  <Users size={24} className="text-accent" />
                </div>
                <p className="text-[15px] font-bold text-foreground mb-1">Pas encore de clients</p>
                <p className="text-[13px] text-muted mb-4">Ajoutez votre premier client.</p>
                <Link href="/clients?new=1">
                  <motion.span whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 bg-accent-gradient text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl fab-shadow">
                    <Plus size={15} /> Ajouter
                  </motion.span>
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-card-premium overflow-hidden">
                {recentClients.map(({ client: c, lastAppt }, i) => {
                  const tag = getClientTag(c.notes);
                  const tagCfg = TAG_CONFIG[tag];
                  return (
                    <Link key={c.id} href="/clients">
                      <motion.div whileTap={{ scale: 0.99 }}
                        className={`flex items-center gap-3.5 px-4 py-3.5 ${i < recentClients.length - 1 ? "border-b border-border-light" : ""}`}>
                        <div className="w-[48px] h-[48px] rounded-full overflow-hidden flex-shrink-0">
                          {isPhotoAvatar(c.avatar) ? (
                            <img src={c.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full rounded-full flex items-center justify-center text-white text-[16px] font-bold" style={{ backgroundColor: c.avatar }}>
                              {getInitials(c.firstName, c.lastName)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-bold text-foreground truncate">{c.firstName} {c.lastName}</p>
                          <p className="text-[12px] text-muted mt-0.5">
                            {lastAppt ? `${lastAppt.title} · ${timeAgo(lastAppt.date)}` : "—"}
                          </p>
                        </div>
                        {tagCfg && (
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${tagCfg.color} ${tagCfg.bg} px-2 py-1 rounded-md flex-shrink-0`}>
                            {tagCfg.label}
                          </span>
                        )}
                        {!tagCfg && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-accent bg-accent-soft px-2 py-1 rounded-md flex-shrink-0">
                            ACTIF
                          </span>
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
