"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Bell, Sparkles, ChevronRight, CalendarDays, CreditCard,
  Tag, Gift,
} from "lucide-react";

export default function ClientHomePage() {
  const { user, appointments, invoices, loyaltyCards, loyaltyTemplates } = useApp();

  const totalSpent = useMemo(() =>
    invoices.filter((i) => i.status === "paid" && i.clientId !== "__expense__").reduce((s, i) => s + i.amount, 0)
  , [invoices]);

  const upcomingAppts = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return appointments.filter((a) => a.date >= today && a.status !== "canceled")
      .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 2);
  }, [appointments]);

  // Real monthly revenue comparison
  const monthlyChange = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
    const thisMonth = invoices.filter((i) => i.status === "paid" && i.date >= thisMonthStart).reduce((s, i) => s + i.amount, 0);
    const lastMonth = invoices.filter((i) => i.status === "paid" && i.date >= lastMonthStart && i.date < thisMonthStart).reduce((s, i) => s + i.amount, 0);
    if (lastMonth === 0) return null;
    return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
  }, [invoices]);

  // Real spending chart from last 7 invoices
  const chartData = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "paid" && i.clientId !== "__expense__")
      .sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
    if (paid.length === 0) return [];
    const max = Math.max(...paid.map((i) => i.amount), 1);
    return paid.map((i) => Math.max(Math.round((i.amount / max) * 100), 8));
  }, [invoices]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-background">
      <div className="flex-shrink-0">
        <header className="px-6 pt-5 pb-1 flex items-center justify-between">
          <div>
            <h1 className="text-[24px] font-bold text-foreground tracking-tight">
              {greeting()}, {user.name ? user.name.split(" ")[0] : ""}
            </h1>
            <p className="text-[13px] text-muted mt-0.5">Ravi de vous revoir.</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.95 }} className="relative w-10 h-10 rounded-xl bg-white shadow-card-premium flex items-center justify-center">
              <Bell size={18} className="text-muted" />
            </motion.button>
          </div>
        </header>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32 pt-4">

          {/* Smart insight — only show if there are real loyalty cards */}
          {loyaltyCards.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-accent-gradient rounded-2xl p-4 flex items-center gap-3.5 mb-5">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Gift size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-white">Vos cartes fidélité</p>
                <p className="text-[11px] text-white/70 mt-0.5">{loyaltyCards.length} carte{loyaltyCards.length > 1 ? "s" : ""} active{loyaltyCards.length > 1 ? "s" : ""}.</p>
              </div>
              <Link href="/loyalty">
                <motion.div whileTap={{ scale: 0.95 }} className="bg-white rounded-lg px-3 py-1.5 text-[11px] font-bold text-accent">
                  Voir
                </motion.div>
              </Link>
            </motion.div>
          )}

          {/* Spending card — real data only */}
          <div className="bg-white rounded-[22px] p-5 shadow-card-premium mb-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Total dépensé</p>
              <CreditCard size={16} className="text-muted" />
            </div>
            <div className="flex items-end gap-2 mt-2 mb-4">
              <p className="text-[32px] font-bold text-foreground tracking-tight leading-none">{totalSpent.toFixed(2)} €</p>
              {monthlyChange !== null && (
                <span className={`text-[11px] font-bold mb-1 ${monthlyChange >= 0 ? "text-success" : "text-danger"}`}>
                  {monthlyChange >= 0 ? "+" : ""}{monthlyChange}%
                </span>
              )}
            </div>
            {chartData.length > 0 ? (
              <div className="flex items-end gap-[5px] h-[48px]">
                {chartData.map((h, i) => (
                  <motion.div key={i} className={`flex-1 rounded-[3px] ${i === chartData.length - 1 ? "bg-accent" : "bg-accent/12"}`}
                    initial={{ height: "10%" }} animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.03, duration: 0.2 }} />
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted text-center py-3">Aucune dépense enregistrée.</p>
            )}
          </div>

          {/* Upcoming appointments */}
          <div className="bg-white rounded-[22px] p-5 shadow-card-premium mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider">À venir</p>
              <Link href="/reservations"><CalendarDays size={16} className="text-muted" /></Link>
            </div>
            {upcomingAppts.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-[14px] font-bold text-foreground">Aucun rendez-vous</p>
                <p className="text-[12px] text-muted mt-1">Réservez votre prochain créneau.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppts.map((appt) => {
                  const d = new Date(appt.date);
                  const monthNames = ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUN", "JUL", "AOÛ", "SEP", "OCT", "NOV", "DÉC"];
                  return (
                    <div key={appt.id} className="bg-border-light rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white rounded-xl px-3 py-2 text-center shadow-sm-apple">
                          <p className="text-[9px] text-accent font-bold">{monthNames[d.getMonth()]}</p>
                          <p className="text-[18px] font-bold text-foreground leading-none">{d.getDate()}</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-[14px] font-bold text-foreground">{appt.title}</p>
                          <p className="text-[12px] text-muted">{appt.time} · {appt.duration}min</p>
                        </div>
                      </div>
                      <Link href="/reservations">
                        <motion.div whileTap={{ scale: 0.98 }}
                          className="mt-3 bg-white rounded-xl py-2.5 text-center text-[12px] font-bold text-foreground shadow-sm-apple">
                          Détails du RDV
                        </motion.div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex gap-3 mb-5">
            <Link href="/reservations" className="flex-1">
              <motion.div whileTap={{ scale: 0.95 }} className="bg-accent text-white rounded-2xl py-4 flex items-center justify-center gap-2 fab-shadow">
                <CalendarDays size={16} /><span className="text-[13px] font-bold">Réserver</span>
              </motion.div>
            </Link>
            <Link href="/loyalty" className="flex-1">
              <motion.div whileTap={{ scale: 0.95 }} className="bg-white rounded-2xl py-4 flex items-center justify-center gap-2 shadow-card-premium">
                <Tag size={16} className="text-accent" /><span className="text-[13px] font-bold text-foreground">Fidélité</span>
              </motion.div>
            </Link>
          </div>

          {/* Real loyalty cards — only show if user has any */}
          {loyaltyCards.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[17px] font-bold text-foreground">Mes Cartes</h2>
                <Link href="/loyalty" className="text-[12px] text-accent font-bold flex items-center gap-0.5">
                  Tout voir <ChevronRight size={13} />
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {loyaltyCards.slice(0, 3).map((card) => {
                  const template = loyaltyTemplates.find((t) => t.id === card.templateId);
                  return (
                    <div key={card.id} className="min-w-[240px] rounded-2xl p-5 text-white flex-shrink-0" style={{ backgroundColor: template?.color || "#7C3AED" }}>
                      <p className="text-[9px] text-white/60 font-bold uppercase tracking-wider">{template?.emoji} {template?.name || "Carte fidélité"}</p>
                      <p className="text-[22px] font-bold mt-3">{card.progress}<span className="text-[14px] text-white/40">/{template?.goal || "?"}</span></p>
                      <p className="text-[10px] text-white/60 mt-0.5">{template?.mode === "points" ? "Points" : "Visites"}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
