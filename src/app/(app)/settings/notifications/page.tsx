"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { CalendarDays, Package, Star, CreditCard, CheckCircle2, Clock, Sparkles, Eye, ChevronRight } from "lucide-react";
import SettingsPage, { SettingsSection, SettingsToggle, SaveButton } from "@/components/SettingsPage";
import Link from "next/link";

interface Notif { id: string; icon: typeof CalendarDays; color: string; bg: string; title: string; desc: string; time: string; actions?: boolean; unread?: boolean; }

export default function SettingsNotificationsPage() {
  const { appointments, products, invoices, getLowStockProducts } = useApp();
  const [saved, setSaved] = useState(false);

  // Build real notifications from actual data
  const notifications = useMemo(() => {
    const items: Notif[] = [];
    const todayStr = new Date().toISOString().split("T")[0];

    // Upcoming appointments today
    const todayAppts = appointments.filter((a) => a.date === todayStr && a.status === "confirmed");
    todayAppts.forEach((a) => {
      items.push({ id: `appt-${a.id}`, icon: CalendarDays, color: "text-accent", bg: "bg-accent-soft", title: "Rappel de rendez-vous",
        desc: `${a.title} à ${a.time}.`, time: "Aujourd'hui", actions: true, unread: true });
    });

    // Low stock alerts
    const lowStock = getLowStockProducts();
    lowStock.forEach((p) => {
      items.push({ id: `stock-${p.id}`, icon: Package, color: "text-warning", bg: "bg-warning-soft", title: "Alerte de stock critique",
        desc: `Stock bas : ${p.name} (${p.quantity} restants). Prévoyez une commande.`, time: "Aujourd'hui", unread: true });
    });

    // Recent paid invoices
    const recent = invoices.filter((i) => i.status === "paid" && i.clientId !== "__expense__").slice(0, 2);
    recent.forEach((inv) => {
      items.push({ id: `inv-${inv.id}`, icon: CreditCard, color: "text-success", bg: "bg-success-soft", title: "Paiement reçu",
        desc: `Paiement reçu : ${inv.amount}€ (${inv.description}).`, time: new Date(inv.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) });
    });

    return items;
  }, [appointments, products, invoices, getLowStockProducts]);

  const todayNotifs = notifications.filter((n) => n.time === "Aujourd'hui");
  const olderNotifs = notifications.filter((n) => n.time !== "Aujourd'hui");

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 1500); }

  return (
    <SettingsPage category="Centre de notifications" title="Vos Notifications"
      description="Suivez l'activité de votre entreprise en temps réel.">

      {/* Today */}
      {todayNotifs.length > 0 && (
        <>
          <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-3">Aujourd&apos;hui</p>
          <div className="space-y-3 mb-5">
            {todayNotifs.map((n) => {
              const Icon = n.icon;
              return (
                <div key={n.id} className="bg-white rounded-2xl p-4 shadow-card-premium">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full ${n.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={18} className={n.color} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-bold text-foreground">{n.title}</p>
                        <span className="text-[10px] text-muted">{n.time}</span>
                        {n.unread && <div className="w-2 h-2 rounded-full bg-accent" />}
                      </div>
                      <p className="text-[12px] text-muted mt-1 leading-relaxed">{n.desc}</p>
                    </div>
                  </div>
                  {n.actions && (
                    <div className="flex gap-2 mt-3 ml-13">
                      <motion.button whileTap={{ scale: 0.95 }} className="bg-accent text-white px-4 py-2 rounded-xl text-[11px] font-bold">
                        Voir détails
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} className="bg-white border border-border text-foreground px-4 py-2 rounded-xl text-[11px] font-bold">
                        Reporter
                      </motion.button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Older */}
      {olderNotifs.length > 0 && (
        <>
          <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-3">Récentes</p>
          <div className="space-y-3 mb-5">
            {olderNotifs.map((n) => {
              const Icon = n.icon;
              return (
                <div key={n.id} className="bg-white rounded-2xl p-4 shadow-card-premium">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full ${n.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={18} className={n.color} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-bold text-foreground">{n.title}</p>
                        <span className="text-[10px] text-muted">{n.time}</span>
                      </div>
                      <p className="text-[12px] text-muted mt-1 leading-relaxed">{n.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Empty state */}
      {notifications.length === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center mb-5">
          <CheckCircle2 size={32} className="text-success mx-auto mb-3" />
          <p className="text-[16px] font-bold text-foreground">Tout est à jour</p>
          <p className="text-[12px] text-muted mt-1.5">Aucune notification pour le moment.</p>
        </div>
      )}

      {/* Upsell */}
      <div className="bg-accent-gradient rounded-2xl p-5 text-white mb-5">
        <p className="text-[16px] font-bold">Boostez votre activité</p>
        <p className="text-[12px] text-white/70 mt-1 leading-relaxed">Activez les SMS de rappel pour réduire vos no-shows de 40%.</p>
        <Link href="/subscription">
          <motion.button whileTap={{ scale: 0.97 }}
            className="mt-4 bg-white text-accent py-2.5 rounded-xl text-[12px] font-bold px-5">
            Essai gratuit
          </motion.button>
        </Link>
      </div>
    </SettingsPage>
  );
}
