"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { getInitials } from "@/lib/data";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plus, CalendarDays, UserPlus, Receipt, ChevronRight, Package,
  CheckCircle2, Clock, Sparkles, TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const {
    user, clients, appointments, invoices,
    getTodayAppointments, getTodayRevenue, getWeekRevenue,
    getPendingAmount, getLowStockProducts, getClient, setAppointmentStatus,
  } = useApp();

  const todayAppts = getTodayAppointments();
  const todayRev = getTodayRevenue();
  const weekRev = getWeekRevenue();
  const pending = getPendingAmount();
  const lowStock = getLowStockProducts();
  const pendingInvoices = invoices.filter((i) => i.status === "pending");

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

  const todayStr = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  // 7-day revenue chart data
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
        value: invoices.filter((x) => x.date === ds && x.status === "paid").reduce((s, x) => s + x.amount, 0),
        isToday: i === 0,
      });
    }
    return bars;
  }, [invoices]);
  const maxBar = Math.max(...chartBars.map((b) => b.value), 1);

  // Smart alerts
  const alerts = useMemo(() => {
    const a: { text: string; color: string; bg: string; href: string }[] = [];
    if (pendingInvoices.length > 0) a.push({ text: `${pendingInvoices.length} facture${pendingInvoices.length > 1 ? "s" : ""} en attente`, color: "text-warning", bg: "bg-warning-soft", href: "/gestion?tab=payments" });
    if (lowStock.length > 0) a.push({ text: `${lowStock.length} produit${lowStock.length > 1 ? "s" : ""} stock faible`, color: "text-danger", bg: "bg-danger-soft", href: "/gestion?tab=stock" });
    return a;
  }, [pendingInvoices, lowStock]);

  return (
    <div className="flex-1 custom-scroll">
      {/* ── Header ────────────────────────────────────── */}
      <header className="px-6 pt-7 pb-1">
        <p className="text-[13px] text-muted capitalize">{todayStr}</p>
        <h1 className="text-[26px] font-bold text-foreground tracking-tight mt-0.5">
          {greeting()}{user.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
      </header>

      {/* ── Quick actions ─────────────────────────────── */}
      <div className="px-6 pt-5 pb-5">
        <div className="flex gap-2.5">
          {[
            { icon: Plus, label: "+ RDV", href: "/appointments?new=1", primary: true },
            { icon: UserPlus, label: "+ Client", href: "/clients?new=1", primary: false },
            { icon: Receipt, label: "+ Facture", href: "/gestion?new=1", primary: false },
          ].map((action, i) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href} className="flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`rounded-2xl py-3.5 flex flex-col items-center gap-1.5 ${
                    action.primary
                      ? "bg-accent text-white fab-shadow"
                      : "bg-white text-foreground shadow-apple"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span className="text-[11px] font-semibold">{action.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Revenue card with chart ───────────────────── */}
      <div className="px-6 pb-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white rounded-2xl p-5 shadow-apple"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="section-label">Revenus</p>
            <Link href="/gestion" className="text-[11px] text-accent font-medium flex items-center gap-0.5">
              Voir tout <ChevronRight size={12} />
            </Link>
          </div>

          {/* Numbers */}
          <div className="flex items-end gap-4 mb-4">
            <div>
              <p className="text-[30px] font-bold text-foreground tracking-tight leading-none">
                {weekRev.toFixed(0)}<span className="text-[14px] text-muted font-medium ml-0.5">€</span>
              </p>
              <p className="text-[11px] text-muted mt-1">cette semaine</p>
            </div>
            <div className="h-8 w-px bg-border-light" />
            <div>
              <p className="text-[18px] font-bold text-foreground tracking-tight leading-none">
                {todayRev.toFixed(0)}<span className="text-[12px] text-muted font-medium ml-0.5">€</span>
              </p>
              <p className="text-[11px] text-muted mt-1">aujourd&apos;hui</p>
            </div>
          </div>

          {/* Mini chart */}
          <div className="flex items-end gap-[5px] h-[52px] mb-1">
            {chartBars.map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full h-[40px] flex items-end">
                  <motion.div
                    className={`w-full rounded-[3px] ${b.isToday ? "bg-accent" : "bg-accent/12"}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max((b.value / maxBar) * 100, 6)}%` }}
                    transition={{ delay: 0.15 + i * 0.04, duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <span className={`text-[8px] mt-1 ${b.isToday ? "text-accent font-semibold" : "text-muted"}`}>{b.label}</span>
              </div>
            ))}
          </div>

          {/* Pending */}
          {pending > 0 && (
            <div className="mt-3 pt-3 border-t border-border-light flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-warning pulse-dot" />
                <span className="text-[11px] text-warning font-medium">{pending.toFixed(0)} € en attente</span>
              </div>
              <Link href="/gestion?tab=payments" className="text-[11px] text-accent font-semibold">Encaisser</Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Smart alerts ──────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex flex-col gap-1.5">
            {alerts.map((a, i) => (
              <Link key={i} href={a.href}>
                <div className={`${a.bg} rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 tap-scale`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current" style={{ color: "inherit" }} />
                  <p className={`text-[11px] font-medium ${a.color} flex-1`}>{a.text}</p>
                  <ChevronRight size={13} className={a.color} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Today's appointments ──────────────────────── */}
      <div className="px-6 pb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold text-foreground">Aujourd&apos;hui</h2>
          <Link href="/appointments" className="text-[11px] text-accent font-medium flex items-center gap-0.5">
            Agenda <ChevronRight size={12} />
          </Link>
        </div>

        {todayAppts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-white rounded-2xl p-6 shadow-apple text-center"
          >
            <div className="w-11 h-11 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-2.5">
              <Sparkles size={20} className="text-accent" />
            </div>
            <p className="text-[14px] font-semibold text-foreground mb-0.5">Journée libre</p>
            <p className="text-[12px] text-muted mb-4">Aucun rendez-vous prévu.</p>
            <Link href="/appointments?new=1">
              <motion.span whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-1.5 bg-accent text-white text-[12px] font-semibold px-4 py-2 rounded-xl">
                <Plus size={14} /> Planifier
              </motion.span>
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-2">
            {todayAppts.map((appt, i) => {
              const client = getClient(appt.clientId);
              const isNext = nextAppt?.id === appt.id;
              return (
                <motion.div key={appt.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                  className={`bg-white rounded-2xl p-3.5 shadow-apple flex items-center gap-3 ${isNext ? "ring-1.5 ring-accent/15" : ""}`}
                >
                  <div className={`w-[46px] flex-shrink-0 text-center py-2 rounded-xl ${isNext ? "bg-accent text-white" : "bg-border-light"}`}>
                    <p className={`text-[13px] font-bold leading-none ${isNext ? "text-white" : "text-foreground"}`}>{appt.time}</p>
                    <p className={`text-[9px] mt-0.5 ${isNext ? "text-white/70" : "text-muted"}`}>{appt.duration}m</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{appt.title}</p>
                    {client && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[6px] font-bold" style={{ backgroundColor: client.avatar }}>
                          {getInitials(client.firstName, client.lastName)}
                        </div>
                        <span className="text-[11px] text-muted">{client.firstName} {client.lastName}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {appt.price > 0 && <span className="text-[13px] font-bold text-foreground">{appt.price} €</span>}
                    {appt.status === "confirmed" && (
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setAppointmentStatus(appt.id, "done")}
                        className="text-[9px] font-semibold text-success bg-success-soft px-2 py-0.5 rounded-md flex items-center gap-0.5">
                        <CheckCircle2 size={8} /> Fait
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Stats footer ──────────────────────────────── */}
      <div className="px-6 pb-8">
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: clients.length, label: "Clients" },
            { value: todayAppts.length, label: "RDV aujourd'hui" },
            { value: `${invoices.length}`, label: "Factures" },
          ].map((stat, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.04 }}
              className="bg-white rounded-xl p-3 text-center shadow-sm-apple"
            >
              <p className="text-[18px] font-bold text-foreground leading-none">{stat.value}</p>
              <p className="text-[9px] text-muted mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
