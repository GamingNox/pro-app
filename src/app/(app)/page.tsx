"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { getInitials } from "@/lib/data";
import { APP_NAME } from "@/lib/constants";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plus, CalendarDays, UserPlus, Receipt, ChevronRight, Package,
  CheckCircle2, Clock, Sparkles, AlertTriangle, Bell, TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const {
    user, clients, appointments, invoices,
    getTodayAppointments, getTodayRevenue, getWeekRevenue, getMonthRevenue,
    getPendingAmount, getLowStockProducts, getClient, setAppointmentStatus, setInvoiceStatus,
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

  // Smart notifications
  const notifications = useMemo(() => {
    const n: { icon: typeof Bell; text: string; color: string; bg: string; href: string }[] = [];
    if (todayAppts.length === 0) n.push({ icon: CalendarDays, text: "Aucun RDV aujourd'hui", color: "text-muted", bg: "bg-border-light", href: "/appointments?new=1" });
    if (pendingInvoices.length > 0) n.push({ icon: Clock, text: `${pendingInvoices.length} facture${pendingInvoices.length > 1 ? "s" : ""} en attente (${pending.toFixed(0)} €)`, color: "text-warning", bg: "bg-warning-soft", href: "/gestion?tab=payments" });
    if (lowStock.length > 0) n.push({ icon: Package, text: `${lowStock.length} produit${lowStock.length > 1 ? "s" : ""} en stock faible`, color: "text-danger", bg: "bg-danger-soft", href: "/gestion?tab=stock" });
    return n;
  }, [todayAppts, pendingInvoices, lowStock, pending]);

  // Recent activity (last completed appointments + recent invoices)
  const recentActivity = useMemo(() => {
    const items: { id: string; type: "appt" | "invoice"; title: string; subtitle: string; date: string; color: string }[] = [];
    appointments.filter((a) => a.status === "done").sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).forEach((a) => {
      const c = getClient(a.clientId);
      items.push({ id: a.id, type: "appt", title: a.title, subtitle: c ? `${c.firstName} ${c.lastName}` : "—", date: a.date, color: "text-success" });
    });
    invoices.filter((i) => i.status === "paid").sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2).forEach((i) => {
      items.push({ id: i.id, type: "invoice", title: `${i.amount} € encaissé`, subtitle: i.description, date: i.date, color: "text-accent" });
    });
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  }, [appointments, invoices, getClient]);

  return (
    <div className="flex-1 custom-scroll animate-in">
      {/* Header */}
      <header className="px-6 pt-7 pb-2">
        <p className="text-[13px] text-muted capitalize">{todayStr}</p>
        <h1 className="text-[28px] font-bold text-foreground tracking-tight mt-0.5">
          {greeting()}{user.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
      </header>

      {/* Quick actions */}
      <div className="px-6 pt-4 pb-5">
        <div className="flex gap-2.5">
          {[
            { icon: Plus, label: "+ RDV", href: "/appointments?new=1", color: "bg-accent text-white", shadow: "fab-shadow" },
            { icon: UserPlus, label: "+ Client", href: "/clients?new=1", color: "bg-foreground text-white", shadow: "shadow-apple" },
            { icon: Receipt, label: "+ Facture", href: "/gestion?new=1", color: "bg-foreground text-white", shadow: "shadow-apple" },
          ].map((action, i) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href} className="flex-1">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${action.color} ${action.shadow} rounded-2xl py-3.5 flex flex-col items-center gap-1.5`}>
                  <Icon size={19} strokeWidth={1.8} />
                  <span className="text-[11px] font-semibold">{action.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Smart notifications */}
      {notifications.length > 0 && (
        <div className="px-6 pb-5">
          <div className="flex flex-col gap-1.5">
            {notifications.map((n, i) => {
              const Icon = n.icon;
              return (
                <Link key={i} href={n.href}>
                  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                    className={`${n.bg} rounded-xl p-3 flex items-center gap-3 tap-scale`}>
                    <Icon size={16} className={n.color} />
                    <p className={`text-[12px] font-medium ${n.color} flex-1`}>{n.text}</p>
                    <ChevronRight size={14} className={n.color} />
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Revenue */}
      <div className="px-6 pb-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-apple">
          <div className="flex items-center justify-between mb-4">
            <p className="section-label">Revenus</p>
            <Link href="/gestion" className="text-[12px] text-accent font-medium flex items-center gap-0.5">
              Détails <ChevronRight size={13} />
            </Link>
          </div>
          <div className="flex items-end gap-5">
            <div className="flex-1">
              <p className="number-xl">{weekRev.toFixed(0)}<span className="text-[16px] text-muted font-medium ml-0.5">€</span></p>
              <p className="text-[12px] text-muted mt-1">cette semaine</p>
            </div>
            <div className="h-10 w-px bg-border-light" />
            <div>
              <p className="number-lg">{todayRev.toFixed(0)}<span className="text-[13px] text-muted font-medium ml-0.5">€</span></p>
              <p className="text-[11px] text-muted mt-1">aujourd&apos;hui</p>
            </div>
          </div>
          {pending > 0 && (
            <div className="mt-4 pt-3 border-t border-border-light flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning pulse-dot" />
                <span className="text-[12px] text-warning font-medium">{pending.toFixed(0)} € en attente</span>
              </div>
              <Link href="/gestion?tab=payments" className="text-[12px] text-accent font-medium">Encaisser</Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* Today's appointments */}
      <div className="px-6 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-bold text-foreground">Aujourd&apos;hui</h2>
            {todayAppts.length > 0 && (
              <span className="text-[11px] font-semibold text-accent bg-accent-soft px-2 py-0.5 rounded-full">{todayAppts.length} RDV</span>
            )}
          </div>
          <Link href="/appointments" className="text-[12px] text-accent font-medium flex items-center gap-0.5">
            Agenda <ChevronRight size={13} />
          </Link>
        </div>

        {todayAppts.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-7 shadow-apple text-center">
            <div className="w-12 h-12 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-3">
              <Sparkles size={22} className="text-accent" />
            </div>
            <p className="text-[14px] font-semibold text-foreground mb-1">Journée libre</p>
            <p className="text-[12px] text-muted mb-4">Aucun rendez-vous prévu.</p>
            <Link href="/appointments?new=1">
              <motion.span whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-1.5 bg-accent text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl">
                <Plus size={15} /> Planifier
              </motion.span>
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-2">
            {todayAppts.map((appt, i) => {
              const client = getClient(appt.clientId);
              const isNext = nextAppt?.id === appt.id;
              return (
                <motion.div key={appt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.04 }}
                  className={`bg-white rounded-2xl p-4 shadow-apple flex items-center gap-3.5 ${isNext ? "ring-1.5 ring-accent/20" : ""}`}>
                  <div className={`w-[48px] flex-shrink-0 text-center py-2 rounded-xl ${isNext ? "bg-accent text-white" : "bg-border-light"}`}>
                    <p className={`text-[14px] font-bold leading-none ${isNext ? "text-white" : "text-foreground"}`}>{appt.time}</p>
                    <p className={`text-[9px] mt-0.5 ${isNext ? "text-white/70" : "text-muted"}`}>{appt.duration}m</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{appt.title}</p>
                    {client && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[6px] font-bold" style={{ backgroundColor: client.avatar }}>
                          {getInitials(client.firstName, client.lastName)}
                        </div>
                        <span className="text-[11px] text-muted">{client.firstName} {client.lastName}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {appt.price > 0 && <span className="text-[13px] font-bold text-foreground">{appt.price} €</span>}
                    {appt.status === "confirmed" && (
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setAppointmentStatus(appt.id, "done")}
                        className="text-[9px] font-semibold text-success bg-success-soft px-2 py-1 rounded-lg flex items-center gap-0.5">
                        <CheckCircle2 size={9} /> Terminer
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Activity feed */}
      {recentActivity.length > 0 && (
        <div className="px-6 pb-8">
          <p className="section-label mb-3">Activité récente</p>
          <div className="flex flex-col gap-1.5">
            {recentActivity.map((item, i) => (
              <motion.div key={item.id + item.type} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.04 }}
                className="bg-white rounded-xl p-3 shadow-sm-apple flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.type === "appt" ? "bg-success-soft" : "bg-accent-soft"}`}>
                  {item.type === "appt" ? <CheckCircle2 size={14} className="text-success" /> : <TrendingUp size={14} className="text-accent" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-foreground truncate">{item.title}</p>
                  <p className="text-[10px] text-muted">{item.subtitle}</p>
                </div>
                <p className="text-[10px] text-subtle">{new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
