"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { getInitials } from "@/lib/data";
import { APP_NAME } from "@/lib/constants";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plus,
  CalendarDays,
  UserPlus,
  Receipt,
  ChevronRight,
  Package,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const {
    user,
    clients,
    appointments,
    invoices,
    getTodayAppointments,
    getTodayRevenue,
    getWeekRevenue,
    getMonthRevenue,
    getPendingAmount,
    getLowStockProducts,
    getClient,
    setAppointmentStatus,
  } = useApp();

  const todayAppts = getTodayAppointments();
  const todayRev = getTodayRevenue();
  const weekRev = getWeekRevenue();
  const monthRev = getMonthRevenue();
  const pending = getPendingAmount();
  const lowStock = getLowStockProducts();

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

  const todayStr = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const totalDuration = todayAppts.reduce((s, a) => s + a.duration, 0);

  return (
    <div className="flex-1 custom-scroll animate-in">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="px-6 pt-7 pb-2">
        <p className="text-[13px] text-muted capitalize">{todayStr}</p>
        <h1 className="text-[28px] font-bold text-foreground tracking-tight mt-0.5">
          {greeting()}{user.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
      </header>

      {/* ── Quick actions ───────────────────────────────── */}
      <div className="px-6 pt-4 pb-5">
        <div className="flex gap-2.5">
          {[
            { icon: Plus, label: "+ RDV", href: "/appointments?new=1", color: "bg-accent text-white", shadow: "fab-shadow" },
            { icon: UserPlus, label: "+ Client", href: "/clients?new=1", color: "bg-foreground text-white", shadow: "shadow-apple" },
            { icon: Receipt, label: "+ Facture", href: "/finances?new=1", color: "bg-foreground text-white", shadow: "shadow-apple" },
          ].map((action, i) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href} className="flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${action.color} ${action.shadow} rounded-2xl py-3.5 flex flex-col items-center gap-1.5`}
                >
                  <Icon size={19} strokeWidth={1.8} />
                  <span className="text-[11px] font-semibold">{action.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Revenue ─────────────────────────────────────── */}
      <div className="px-6 pb-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-apple"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="section-label">Revenus</p>
            <Link href="/finances" className="text-[12px] text-accent font-medium flex items-center gap-0.5">
              Détails <ChevronRight size={13} />
            </Link>
          </div>

          <div className="flex items-end gap-5">
            <div className="flex-1">
              <p className="number-xl">
                {weekRev.toFixed(0)}<span className="text-[16px] text-muted font-medium ml-0.5">€</span>
              </p>
              <p className="text-[12px] text-muted mt-1">cette semaine</p>
            </div>
            <div className="h-10 w-px bg-border-light" />
            <div>
              <p className="number-lg">
                {todayRev.toFixed(0)}<span className="text-[13px] text-muted font-medium ml-0.5">€</span>
              </p>
              <p className="text-[11px] text-muted mt-1">aujourd&apos;hui</p>
            </div>
            <div className="h-10 w-px bg-border-light" />
            <div>
              <p className="number-lg">
                {monthRev.toFixed(0)}<span className="text-[13px] text-muted font-medium ml-0.5">€</span>
              </p>
              <p className="text-[11px] text-muted mt-1">ce mois</p>
            </div>
          </div>

          {pending > 0 && (
            <div className="mt-4 pt-3 border-t border-border-light flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning pulse-dot" />
                <span className="text-[12px] text-warning font-medium">{pending.toFixed(0)} € en attente</span>
              </div>
              <Link href="/finances?filter=pending" className="text-[12px] text-accent font-medium">
                Encaisser
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Aujourd'hui ─────────────────────────────────── */}
      <div className="px-6 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-bold text-foreground">Aujourd&apos;hui</h2>
            {todayAppts.length > 0 && (
              <span className="text-[11px] font-semibold text-accent bg-accent-soft px-2 py-0.5 rounded-full">
                {todayAppts.length} RDV
              </span>
            )}
          </div>
          <Link href="/appointments" className="text-[12px] text-accent font-medium flex items-center gap-0.5">
            Agenda <ChevronRight size={13} />
          </Link>
        </div>

        {todayAppts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-8 shadow-apple text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-3">
              <Sparkles size={24} className="text-accent" />
            </div>
            <p className="text-[15px] font-semibold text-foreground mb-1">Journée libre</p>
            <p className="text-[13px] text-muted mb-5 leading-relaxed">
              Vous n&apos;avez pas de rendez-vous aujourd&apos;hui.
              <br />Profitez-en pour organiser votre semaine.
            </p>
            <Link href="/appointments?new=1">
              <motion.span
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-1.5 bg-accent text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl"
              >
                <Plus size={15} />
                Planifier un RDV
              </motion.span>
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-2">
            {todayAppts.map((appt, i) => {
              const client = getClient(appt.clientId);
              const isNext = nextAppt?.id === appt.id;
              return (
                <motion.div
                  key={appt.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.04 }}
                  className={`bg-white rounded-2xl p-4 shadow-apple flex items-center gap-3.5 ${
                    isNext ? "ring-1.5 ring-accent/20" : ""
                  }`}
                >
                  <div className={`w-[50px] flex-shrink-0 text-center py-2.5 rounded-xl ${
                    isNext ? "bg-accent text-white" : "bg-border-light"
                  }`}>
                    <p className={`text-[14px] font-bold leading-none ${isNext ? "text-white" : "text-foreground"}`}>
                      {appt.time}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${isNext ? "text-white/70" : "text-muted"}`}>{appt.duration}m</p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground truncate">{appt.title}</p>
                    {client && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div
                          className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-[7px] font-bold"
                          style={{ backgroundColor: client.avatar }}
                        >
                          {getInitials(client.firstName, client.lastName)}
                        </div>
                        <span className="text-[12px] text-muted">{client.firstName} {client.lastName}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {appt.price > 0 && (
                      <span className="text-[14px] font-bold text-foreground">{appt.price} €</span>
                    )}
                    {appt.status === "confirmed" && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setAppointmentStatus(appt.id, "done")}
                        className="text-[10px] font-semibold text-success bg-success-soft px-2 py-1 rounded-lg flex items-center gap-0.5"
                      >
                        <CheckCircle2 size={10} />
                        Terminer
                      </motion.button>
                    )}
                    {appt.status === "done" && (
                      <span className="text-[10px] font-semibold text-success flex items-center gap-0.5">
                        <CheckCircle2 size={10} />
                        Terminé
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Summary bar */}
            {todayAppts.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-4 py-2 mt-1"
              >
                <span className="text-[11px] text-muted flex items-center gap-1">
                  <Clock size={11} /> {totalDuration}min au total
                </span>
                <span className="text-[11px] text-muted">
                  {todayAppts.reduce((s, a) => s + a.price, 0)} € potentiel
                </span>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* ── Alerts ──────────────────────────────────────── */}
      {lowStock.length > 0 && (
        <div className="px-6 pb-5">
          <Link href="/stock">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl p-4 shadow-apple flex items-center gap-3 tap-scale"
            >
              <div className="w-10 h-10 rounded-xl bg-warning-soft flex items-center justify-center flex-shrink-0">
                <Package size={18} className="text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-foreground">
                  Stock faible
                </p>
                <p className="text-[11px] text-muted mt-0.5">
                  {lowStock.length} produit{lowStock.length > 1 ? "s" : ""} à réapprovisionner
                </p>
              </div>
              <ChevronRight size={16} className="text-subtle" />
            </motion.div>
          </Link>
        </div>
      )}

      {/* ── Activity ────────────────────────────────────── */}
      <div className="px-6 pb-8">
        <p className="section-label mb-3">Activité</p>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { value: clients.length, label: "Clients", icon: "👥" },
            { value: todayAppts.length, label: "RDV aujourd'hui", icon: "📅" },
            { value: `${totalDuration}m`, label: "Durée totale", icon: "⏱" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="bg-white rounded-2xl p-4 text-center shadow-sm-apple"
            >
              <p className="text-[10px] mb-1.5">{stat.icon}</p>
              <p className="text-[20px] font-bold text-foreground leading-none">{stat.value}</p>
              <p className="text-[10px] text-muted mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
