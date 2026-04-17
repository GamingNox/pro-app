"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays, Receipt, Star, Gift, MessageSquare, UserPlus, CheckCircle2, XCircle, Clock,
} from "lucide-react";
import type { Appointment, Invoice } from "@/lib/types";

interface TimelineEvent {
  id: string;
  date: string;
  time?: string;
  type: "appointment_done" | "appointment_confirmed" | "appointment_canceled" | "invoice_paid" | "invoice_pending" | "first_visit" | "loyalty" | "review";
  title: string;
  subtitle?: string;
  amount?: number;
  icon: typeof CalendarDays;
  color: string;
  soft: string;
}

const TYPE_META: Record<TimelineEvent["type"], { icon: typeof CalendarDays; color: string; soft: string }> = {
  appointment_done:      { icon: CheckCircle2, color: "#16A34A", soft: "#F0FDF4" },
  appointment_confirmed: { icon: CalendarDays, color: "#8B5CF6", soft: "#F5F3FF" },
  appointment_canceled:  { icon: XCircle,      color: "#EF4444", soft: "#FEF2F2" },
  invoice_paid:          { icon: Receipt,      color: "#16A34A", soft: "#F0FDF4" },
  invoice_pending:       { icon: Clock,        color: "#F59E0B", soft: "#FFFBEB" },
  first_visit:           { icon: UserPlus,     color: "#5B4FE9", soft: "#EEF0FF" },
  loyalty:               { icon: Gift,         color: "#EC4899", soft: "#FDF2F8" },
  review:                { icon: Star,         color: "#F59E0B", soft: "#FFFBEB" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`;
  if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`;
  return `Il y a ${Math.floor(days / 365)} an${Math.floor(days / 365) > 1 ? "s" : ""}`;
}

/**
 * Unified chronological timeline for a single client.
 * Merges appointments + invoices into one sorted view.
 */
export default function ClientTimeline({
  clientId,
  appointments,
  invoices,
  createdAt,
}: {
  clientId: string;
  appointments: Appointment[];
  invoices: Invoice[];
  createdAt: string;
}) {
  const events = useMemo(() => {
    const all: TimelineEvent[] = [];

    // First visit marker
    all.push({
      id: "first-visit",
      date: createdAt,
      type: "first_visit",
      title: "Client ajouté",
      subtitle: formatDate(createdAt),
      ...TYPE_META.first_visit,
    });

    // Appointments
    const clientAppts = appointments
      .filter((a) => a.clientId === clientId)
      .sort((a, b) => b.date.localeCompare(a.date));

    clientAppts.forEach((a) => {
      const type: TimelineEvent["type"] =
        a.status === "done" ? "appointment_done"
        : a.status === "canceled" ? "appointment_canceled"
        : "appointment_confirmed";
      const meta = TYPE_META[type];
      all.push({
        id: `appt-${a.id}`,
        date: a.date,
        time: a.time,
        type,
        title: a.title || "Rendez-vous",
        subtitle: `${a.time} · ${a.duration}min${a.price ? ` · ${a.price} €` : ""}`,
        amount: a.price,
        ...meta,
      });
    });

    // Invoices
    const clientInvoices = invoices
      .filter((i) => i.clientId === clientId)
      .sort((a, b) => b.date.localeCompare(a.date));

    clientInvoices.forEach((i) => {
      const type: TimelineEvent["type"] = i.status === "paid" ? "invoice_paid" : "invoice_pending";
      const meta = TYPE_META[type];
      all.push({
        id: `inv-${i.id}`,
        date: i.date,
        type,
        title: i.description || "Facture",
        subtitle: `${i.amount.toFixed(0)} € · ${i.status === "paid" ? "Payée" : "En attente"}`,
        amount: i.amount,
        ...meta,
      });
    });

    // Sort by date descending (most recent first)
    return all.sort((a, b) => b.date.localeCompare(a.date));
  }, [clientId, appointments, invoices, createdAt]);

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    events.forEach((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      label: items[0] ? new Date(items[0].date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : key,
      items,
    }));
  }, [events]);

  if (events.length <= 1) {
    return (
      <div className="text-center py-6">
        <p className="text-[12px] text-muted">Aucune activité pour ce client.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {grouped.map((group) => (
        <div key={group.key}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2 px-1">
            {group.label}
          </p>
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-border-light rounded-full" />

            <div className="space-y-2.5">
              {group.items.map((event, i) => {
                const Icon = event.icon;
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    className="relative flex items-start gap-3"
                  >
                    {/* Dot on the line */}
                    <div
                      className="absolute -left-6 top-1.5 w-[22px] h-[22px] rounded-full flex items-center justify-center z-10 border-2 border-white"
                      style={{ backgroundColor: event.soft }}
                    >
                      <Icon size={10} style={{ color: event.color }} strokeWidth={3} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[12px] font-bold text-foreground truncate">{event.title}</p>
                        <p className="text-[9px] text-subtle flex-shrink-0">{timeAgo(event.date)}</p>
                      </div>
                      {event.subtitle && (
                        <p className="text-[11px] text-muted mt-0.5">{event.subtitle}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
