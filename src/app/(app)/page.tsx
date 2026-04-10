"use client";

import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/lib/store";
import { getInitials } from "@/lib/data";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Plus, CalendarDays, UserPlus, Receipt, ChevronRight,
  CheckCircle2, Clock, Sparkles, Bell, BarChart3,
  FileText, AlertTriangle, Lightbulb, Send, RefreshCw,
  Users, X, TrendingUp, Package, BookOpen,
} from "lucide-react";

type RevPeriod = "jour" | "semaine" | "mois";

function isPhotoAvatar(avatar: string): boolean {
  return avatar.startsWith("data:") || avatar.startsWith("http");
}

export default function DashboardPage() {
  const {
    user, clients, appointments, invoices, products,
    getTodayAppointments, getWeekRevenue, getMonthRevenue, getTodayRevenue,
    getPendingAmount, getLowStockProducts, getClient, setAppointmentStatus,
  } = useApp();

  const [revPeriod, setRevPeriod] = useState<RevPeriod>("mois");
  const [showNotifs, setShowNotifs] = useState(false);
  const [showGuidePrompt, setShowGuidePrompt] = useState(false);

  // Show guide prompt once
  useEffect(() => {
    const seen = localStorage.getItem("guide-prompt-seen");
    if (!seen) setShowGuidePrompt(true);
  }, []);

  const todayAppts = getTodayAppointments();
  const weekRev = getWeekRevenue();
  const monthRev = getMonthRevenue();
  const todayRev = getTodayRevenue();
  const pending = getPendingAmount();
  const lowStock = getLowStockProducts();
  const pendingInvoices = invoices.filter((i) => i.status === "pending" && i.clientId !== "__expense__");

  const displayRev = revPeriod === "jour" ? todayRev : revPeriod === "semaine" ? weekRev : monthRev;
  const periodLabel = revPeriod === "jour" ? "ce jour" : revPeriod === "semaine" ? "cette semaine" : "ce mois";

  const nextAppt = todayAppts.find((a) => {
    const [h, m] = a.time.split(":").map(Number);
    const now = new Date();
    return h > now.getHours() || (h === now.getHours() && m > now.getMinutes());
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  };

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

  // Smart insights — enhanced with more context
  const insights = useMemo(() => {
    const lines: { text: string; bold?: string }[] = [];
    const doneAppts = appointments.filter((a) => a.status === "done").length;
    const totalAppts = appointments.filter((a) => a.status !== "canceled").length;
    const h = new Date().getHours();

    // Time-aware messages
    if (h >= 12 && h < 14 && todayAppts.filter((a) => { const ah = parseInt(a.time.split(":")[0]); return ah >= 14; }).length === 0) {
      lines.push({ text: "Aucun rendez-vous cet après-midi. Moment idéal pour la gestion." });
    }

    if (totalAppts > 5) {
      const rate = Math.round((doneAppts / totalAppts) * 100);
      if (rate > 70) lines.push({ text: `Fidélisation à ${rate}%. Excellent travail !`, bold: `${rate}%` });
    }

    // Goal proximity
    if (monthRev > 0) {
      const goalPct = (monthRev / 15000) * 100;
      if (goalPct >= 80 && goalPct < 100) {
        lines.push({ text: `Objectif mensuel bientôt atteint ! Plus que ${(15000 - monthRev).toFixed(0)} €.`, bold: `${(15000 - monthRev).toFixed(0)} €` });
      }
    }

    if (nextAppt) {
      const c = getClient(nextAppt.clientId);
      if (c) {
        lines.push({ text: `Prochain RDV avec ${c.firstName} à ${nextAppt.time}.`, bold: `${c.firstName}` });
      }
    }

    // Inactive client suggestion
    if (clients.length > 3) {
      const inactive = clients.find((c) => {
        const last = appointments.filter((a) => a.clientId === c.id).sort((a, b) => b.date.localeCompare(a.date))[0];
        return last && (Date.now() - new Date(last.date).getTime()) / (1000 * 60 * 60 * 24) > 30;
      });
      if (inactive) lines.push({ text: `Pensez à relancer ${inactive.firstName} ${inactive.lastName}.`, bold: inactive.firstName });
    }

    if (pendingInvoices.length > 0) {
      lines.push({ text: `${pendingInvoices.length} facture${pendingInvoices.length > 1 ? "s" : ""} à relancer.`, bold: `${pendingInvoices.length}` });
    }
    if (lowStock.length > 0) {
      lines.push({ text: `Stock faible : ${lowStock[0].name}. Commander bientôt.`, bold: lowStock[0].name });
    }

    // Revenue optimization hints
    if (occupationRate >= 80 && todayAppts.length >= 4) {
      lines.push({ text: "Forte demande aujourd'hui. Envisagez d'ajuster vos tarifs à la hausse." });
    }
    if (weekChange > 15) {
      lines.push({ text: `Revenus en hausse de ${weekChange}% cette semaine. Excellente dynamique !`, bold: `${weekChange}%` });
    }

    if (lines.length === 0) {
      lines.push({ text: "Tout est en ordre. Continuez comme ça !" });
    }
    return lines.slice(0, 4);
  }, [appointments, nextAppt, pendingInvoices, lowStock]);

  // Notifications list for popup
  const allNotifs = useMemo(() => {
    const n: { title: string; subtitle: string; color: string; bg: string; href: string; icon: typeof Clock; type: string }[] = [];
    if (pendingInvoices.length > 0) n.push({
      title: `${pendingInvoices.length} facture${pendingInvoices.length > 1 ? "s" : ""} en attente`,
      subtitle: `${pending.toFixed(0)} € à encaisser`, color: "text-warning", bg: "bg-warning-soft",
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
    // Smart suggestions as notifications
    if (clients.length > 3) {
      const inactive = clients.filter((c) => {
        const lastAppt = appointments.filter((a) => a.clientId === c.id).sort((a, b) => b.date.localeCompare(a.date))[0];
        if (!lastAppt) return true;
        const diff = (Date.now() - new Date(lastAppt.date).getTime()) / (1000 * 60 * 60 * 24);
        return diff > 30;
      });
      if (inactive.length > 0) {
        n.push({
          title: `Relancer ${inactive[0].firstName} ${inactive[0].lastName}`,
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

      {/* ═══ FIXED HEADER ═══ */}
      <div className="flex-shrink-0">
        <header className="px-6 pt-5 pb-1 flex items-center justify-between">
          <h1 className="text-[22px] font-bold text-foreground tracking-tight">Tableau de bord</h1>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowNotifs(true)}
            className="relative w-10 h-10 rounded-xl bg-white shadow-card-premium flex items-center justify-center">
            <Bell size={18} className="text-accent" />
            {allNotifs.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                <span className="text-[9px] text-white font-bold">{allNotifs.length}</span>
              </div>
            )}
          </motion.button>
        </header>
        {/* Personal greeting */}
        <div className="px-6 pb-3">
          <p className="text-[15px] text-muted font-medium">
            {greeting()}{user.name ? ` ${user.name.split(" ")[0]}` : ""}, {(() => {
              const h = new Date().getHours();
              if (h < 12) return "bonne matinée ☀️";
              if (h < 18) return "bonne après-midi";
              return "bonne soirée 🌙";
            })()}
          </p>
        </div>
      </div>

      {/* ═══ SCROLLABLE CONTENT ═══ */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">

          {/* ── Guide prompt ───────────────────────────── */}
          {showGuidePrompt && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-accent-soft rounded-2xl p-4 mb-5 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <BookOpen size={18} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-accent">Découvrir l&apos;application</p>
                <p className="text-[11px] text-accent/70 mt-0.5">Un guide rapide pour tout comprendre.</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href="/guide">
                  <motion.div whileTap={{ scale: 0.95 }}
                    className="bg-accent text-white text-[11px] font-bold px-3 py-1.5 rounded-lg">
                    Voir
                  </motion.div>
                </Link>
                <motion.button whileTap={{ scale: 0.8 }} onClick={() => { setShowGuidePrompt(false); localStorage.setItem("guide-prompt-seen", "1"); }}>
                  <X size={14} className="text-accent/50" />
                </motion.button>
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
                      transition={{ delay: 0.1 + i * 0.04, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
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

          {/* ── Votre assistant ────────────────────────── */}
          <div className="bg-white rounded-[22px] p-5 shadow-card-premium mb-5 border-l-[3px] border-l-accent">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-accent" />
              <p className="text-[12px] text-accent font-bold tracking-tight">Votre assistant</p>
            </div>
            <div className="space-y-2.5">
              {insights.map((insight, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <p className="text-[13px] text-foreground leading-relaxed">{insight.text}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Smart quick actions (context-aware) ───── */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {(() => {
              const actions: { icon: typeof CalendarDays; label: string; href: string; bg: string; color: string; highlight?: boolean }[] = [];
              // Context-smart: adapt actions to current state
              if (todayAppts.length === 0) {
                actions.push({ icon: CalendarDays, label: "Ajouter un RDV", href: "/appointments?new=1", bg: "bg-accent-soft", color: "text-accent", highlight: true });
              } else {
                actions.push({ icon: CalendarDays, label: "Voir planning", href: "/appointments", bg: "bg-accent-soft", color: "text-accent" });
              }
              if (pendingInvoices.length > 0) {
                actions.push({ icon: Receipt, label: `Relancer (${pendingInvoices.length})`, href: "/gestion?tab=payments", bg: "bg-warning-soft", color: "text-warning", highlight: true });
              } else {
                actions.push({ icon: Receipt, label: "Nouvelle facture", href: "/gestion?new=1", bg: "bg-accent-soft", color: "text-accent" });
              }
              if (lowStock.length > 0) {
                actions.push({ icon: Package, label: `Stock bas (${lowStock.length})`, href: "/gestion?tab=stock", bg: "bg-danger-soft", color: "text-danger" });
              } else {
                actions.push({ icon: Users, label: "Mes clients", href: "/clients", bg: "bg-accent-soft", color: "text-accent" });
              }
              actions.push({ icon: BarChart3, label: "Rapports", href: "/gestion?tab=analytics", bg: "bg-accent-soft", color: "text-accent" });
              return actions;
            })().map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.label} href={action.href}>
                  <motion.div whileTap={{ scale: 0.95 }}
                    className={`bg-white rounded-2xl p-5 shadow-card-premium flex flex-col items-center gap-3 ${action.highlight ? "ring-1 ring-accent/10" : ""}`}>
                    <div className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center`}>
                      <Icon size={22} className={action.color} />
                    </div>
                    <span className="text-[13px] font-bold text-foreground">{action.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>

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

      {/* ═══ NOTIFICATIONS POPUP ═══ */}
      <AnimatePresence>
        {showNotifs && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-12" onClick={() => setShowNotifs(false)}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-[calc(100%-32px)] max-w-md bg-white rounded-[24px] shadow-apple-lg overflow-hidden"
            >
              {/* Popup header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-accent" />
                  <h3 className="text-[16px] font-bold text-foreground">Notifications</h3>
                  {allNotifs.length > 0 && (
                    <span className="text-[10px] font-bold text-white bg-accent rounded-full px-2 py-0.5">{allNotifs.length}</span>
                  )}
                </div>
                <motion.button whileTap={{ scale: 0.8 }} onClick={() => setShowNotifs(false)}
                  className="w-8 h-8 rounded-full bg-border-light flex items-center justify-center">
                  <X size={14} className="text-muted" />
                </motion.button>
              </div>

              {/* Notification items */}
              <div className="px-5 pb-6 max-h-[60vh] overflow-y-auto overscroll-contain custom-scroll">
                {allNotifs.length === 0 ? (
                  <div className="text-center py-10">
                    <CheckCircle2 size={32} className="text-success mx-auto mb-3" />
                    <p className="text-[14px] font-bold text-foreground">Tout est en ordre</p>
                    <p className="text-[12px] text-muted mt-1">Aucune notification pour le moment.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allNotifs.map((n, i) => {
                      const NIcon = n.icon;
                      return (
                        <Link key={i} href={n.href} onClick={() => setShowNotifs(false)}>
                          <motion.div
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            whileTap={{ scale: 0.98 }}
                            className={`${n.bg} rounded-2xl px-4 py-4 flex items-center gap-3.5`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0">
                              <NIcon size={17} className={n.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[13px] font-bold ${n.color} truncate`}>{n.title}</p>
                              <p className="text-[11px] text-foreground/50 mt-1">{n.subtitle}</p>
                            </div>
                            <ChevronRight size={14} className={n.color} />
                          </motion.div>
                        </Link>
                      );
                    })}

                    {/* Smart suggestions */}
                    <div className="pt-4 border-t border-border-light mt-3">
                      <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Lightbulb size={10} /> Suggestions
                      </p>
                      <div className="space-y-2">
                        {[
                          clients.length === 0 ? { label: "Ajouter votre premier client", href: "/clients?new=1" } : null,
                          todayAppts.length === 0 ? { label: "Planifier un rendez-vous", href: "/appointments?new=1" } : null,
                          pendingInvoices.length > 0 ? { label: "Relancer les paiements", href: "/gestion?tab=payments" } : null,
                        ].filter(Boolean).slice(0, 2).map((s, i) => (
                          <Link key={i} href={s!.href} onClick={() => setShowNotifs(false)}>
                            <motion.div whileTap={{ scale: 0.97 }}
                              className="flex items-center gap-3 bg-border-light rounded-xl px-4 py-3">
                              <Sparkles size={13} className="text-accent flex-shrink-0" />
                              <span className="text-[13px] font-semibold text-foreground">{s!.label}</span>
                              <ChevronRight size={13} className="text-muted ml-auto" />
                            </motion.div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
