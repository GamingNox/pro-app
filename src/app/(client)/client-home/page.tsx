"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Bell, Sparkles, ChevronRight, CalendarDays, CreditCard,
  TrendingUp, Star, Tag,
} from "lucide-react";

export default function ClientHomePage() {
  const { user, appointments, invoices, getClient } = useApp();

  const totalSpent = useMemo(() =>
    invoices.filter((i) => i.status === "paid" && i.clientId !== "__expense__").reduce((s, i) => s + i.amount, 0)
  , [invoices]);

  const upcomingAppts = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return appointments.filter((a) => a.date >= today && a.status !== "canceled")
      .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 2);
  }, [appointments]);

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
            <motion.button whileTap={{ scale: 0.88 }} className="relative w-10 h-10 rounded-xl bg-white shadow-card-premium flex items-center justify-center">
              <Bell size={18} className="text-muted" />
            </motion.button>
          </div>
        </header>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32 pt-4">

          {/* Smart insight */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-accent-gradient rounded-2xl p-4 flex items-center gap-3.5 mb-5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white">Smart Insight</p>
              <p className="text-[11px] text-white/70 mt-0.5">Vous avez 2 récompenses disponibles !</p>
            </div>
            <Link href="/loyalty">
              <motion.div whileTap={{ scale: 0.95 }} className="bg-white rounded-lg px-3 py-1.5 text-[11px] font-bold text-accent">
                Voir
              </motion.div>
            </Link>
          </motion.div>

          {/* Spending card */}
          <div className="bg-white rounded-[22px] p-5 shadow-card-premium mb-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Total dépensé</p>
              <CreditCard size={16} className="text-muted" />
            </div>
            <div className="flex items-end gap-2 mt-2 mb-4">
              <p className="text-[32px] font-bold text-foreground tracking-tight leading-none">{totalSpent.toFixed(2)} €</p>
              <span className="text-[11px] font-bold text-success mb-1">+12%</span>
            </div>
            {/* Mini chart placeholder */}
            <div className="flex items-end gap-[5px] h-[48px]">
              {[30, 45, 35, 55, 40, 65, 80].map((h, i) => (
                <motion.div key={i} className={`flex-1 rounded-[3px] ${i === 6 ? "bg-accent" : "bg-accent/12"}`}
                  initial={{ height: "10%" }} animate={{ height: `${h}%` }}
                  transition={{ delay: 0.1 + i * 0.04, duration: 0.5 }} />
              ))}
            </div>
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
                        <motion.div whileTap={{ scale: 0.97 }}
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
                <Tag size={16} className="text-accent" /><span className="text-[13px] font-bold text-foreground">Voir Fidélité</span>
              </motion.div>
            </Link>
          </div>

          {/* Loyalty cards preview */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[17px] font-bold text-foreground">Mes Cartes</h2>
            <Link href="/loyalty" className="text-[12px] text-accent font-bold flex items-center gap-0.5">
              Tout voir <ChevronRight size={13} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            <div className="min-w-[260px] bg-accent-gradient rounded-2xl p-5 text-white flex-shrink-0">
              <p className="text-[9px] text-white/60 font-bold uppercase tracking-wider">Platinum member</p>
              <p className="text-[18px] font-bold mt-3">{user.name || "Membre"}</p>
              <p className="text-[11px] text-white/50 mt-1">8842 3319 0054</p>
            </div>
            <div className="min-w-[200px] bg-success rounded-2xl p-5 text-white flex-shrink-0">
              <p className="text-[9px] text-white/60 font-bold uppercase tracking-wider">Spa Rewards</p>
              <p className="text-[22px] font-bold mt-3">950</p>
              <p className="text-[10px] text-white/60 mt-0.5">Points</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
