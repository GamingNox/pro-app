"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import {
  Lightbulb, UserPlus, TrendingDown, Clock, Gift, AlertTriangle,
  Star, Target, CalendarDays, Zap,
} from "lucide-react";

interface Insight {
  icon: typeof Lightbulb;
  text: string;
  action?: string;
  href?: string;
  priority: number; // lower = more important
  color: string;
  soft: string;
}

/**
 * Computes real-time business insights from the pro's data.
 * No AI — just smart rules on actual numbers.
 * Displays the top 3 most relevant insights.
 */
export default function SmartInsights() {
  const { clients, appointments, invoices, services, getLowStockProducts } = useApp();

  const insights = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const h = now.getHours();
    const dayOfWeek = now.getDay();
    const all: Insight[] = [];

    // ── Inactive clients (no visit in 45+ days) ──────────
    const doneAppts = appointments.filter((a) => a.status === "done");
    const lastVisit = new Map<string, string>();
    doneAppts.forEach((a) => {
      const prev = lastVisit.get(a.clientId);
      if (!prev || a.date > prev) lastVisit.set(a.clientId, a.date);
    });
    const cutoff45 = new Date(now);
    cutoff45.setDate(cutoff45.getDate() - 45);
    const cutoff45Str = cutoff45.toISOString().split("T")[0];
    const inactiveClients = clients.filter((c) => {
      const lv = lastVisit.get(c.id);
      return lv && lv < cutoff45Str;
    });
    if (inactiveClients.length > 0) {
      all.push({
        icon: UserPlus,
        text: `${inactiveClients.length} client${inactiveClients.length > 1 ? "s" : ""} n'${inactiveClients.length > 1 ? "ont" : "a"} pas réservé depuis 45 jours. Envoyez-leur un message ou une promo pour les faire revenir.`,
        action: "Voir les clients",
        href: "/clients",
        priority: 1,
        color: "#F59E0B",
        soft: "#FFFBEB",
      });
    }

    // ── Loyalty close to reward ──────────────────────────
    // Check if any client has 80%+ progress on a loyalty card
    // (This would need loyaltyCards — skip if not available from store)

    // ── Low-fill days ────────────────────────────────────
    const next7days: { date: string; count: number; label: string }[] = [];
    const dayLabels = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const ds = d.toISOString().split("T")[0];
      const count = appointments.filter((a) => a.date === ds && a.status === "confirmed").length;
      next7days.push({ date: ds, count, label: dayLabels[d.getDay()] });
    }
    const emptyDays = next7days.filter((d) => d.count === 0);
    if (emptyDays.length >= 3) {
      all.push({
        icon: CalendarDays,
        text: `${emptyDays.length} jours vides cette semaine (${emptyDays.slice(0, 3).map((d) => d.label).join(", ")}). Proposez une offre flash pour remplir votre agenda.`,
        action: "Créer une promo",
        href: "/settings/promotions",
        priority: 2,
        color: "#8B5CF6",
        soft: "#F5F3FF",
      });
    }

    // ── Busiest day pattern ──────────────────────────────
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    doneAppts.forEach((a) => {
      const d = new Date(a.date).getDay();
      dayCounts[d]++;
    });
    let bestDay = 0;
    dayCounts.forEach((c, i) => { if (c > dayCounts[bestDay]) bestDay = i; });
    let worstDay = 0;
    dayCounts.forEach((c, i) => { if (c < dayCounts[worstDay] && i !== 0) worstDay = i; }); // skip dimanche
    if (doneAppts.length >= 10 && dayCounts[worstDay] < dayCounts[bestDay] * 0.3) {
      all.push({
        icon: TrendingDown,
        text: `Votre ${dayLabels[worstDay]} est sous-utilisé (${dayCounts[worstDay]} RDV vs ${dayCounts[bestDay]} le ${dayLabels[bestDay]}). Une promo ciblée sur ce jour pourrait rééquilibrer votre semaine.`,
        priority: 3,
        color: "#EC4899",
        soft: "#FDF2F8",
      });
    }

    // ── Pending invoices aging ────────────────────────────
    const pendingOld = invoices.filter((i) => {
      if (i.status !== "pending" || i.clientId === "__expense__") return false;
      const age = (now.getTime() - new Date(i.date).getTime()) / (1000 * 60 * 60 * 24);
      return age > 7;
    });
    if (pendingOld.length > 0) {
      const total = pendingOld.reduce((s, i) => s + i.amount, 0);
      all.push({
        icon: AlertTriangle,
        text: `${pendingOld.length} facture${pendingOld.length > 1 ? "s" : ""} impayée${pendingOld.length > 1 ? "s" : ""} depuis plus de 7 jours (${total.toFixed(0)} €). Relancez vos clients.`,
        action: "Voir la gestion",
        href: "/gestion",
        priority: 1,
        color: "#EF4444",
        soft: "#FEF2F2",
      });
    }

    // ── Stock alert ──────────────────────────────────────
    const lowStock = getLowStockProducts();
    if (lowStock.length > 0) {
      all.push({
        icon: AlertTriangle,
        text: `${lowStock.length} produit${lowStock.length > 1 ? "s" : ""} en stock critique. Pensez à restocker avant la pénurie.`,
        action: "Gérer le stock",
        href: "/settings/stock",
        priority: 2,
        color: "#F59E0B",
        soft: "#FFFBEB",
      });
    }

    // ── Morning / afternoon context ──────────────────────
    const todayAppts = appointments.filter((a) => a.date === todayStr && a.status === "confirmed");
    const afternoonAppts = todayAppts.filter((a) => parseInt(a.time.split(":")[0]) >= 14);
    if (h >= 12 && h < 14 && afternoonAppts.length === 0) {
      all.push({
        icon: Clock,
        text: "Aucun rendez-vous cet après-midi. Profitez-en pour mettre à jour vos fiches clients ou préparer une campagne.",
        priority: 5,
        color: "#0891B2",
        soft: "#ECFEFF",
      });
    }

    // ── Growth opportunity ───────────────────────────────
    if (clients.length > 0 && clients.length < 10) {
      all.push({
        icon: Zap,
        text: `Vous avez ${clients.length} client${clients.length > 1 ? "s" : ""}. Partagez votre lien de réservation pour en attirer de nouveaux — les 10 premiers sont les plus importants.`,
        action: "Copier mon lien",
        href: "/settings/booking-link",
        priority: 4,
        color: "#5B4FE9",
        soft: "#EEF0FF",
      });
    }

    // ── No services configured ───────────────────────────
    if (services.length === 0) {
      all.push({
        icon: Star,
        text: "Vous n'avez aucun service configuré. Ajoutez-en au moins un pour que vos clients puissent réserver.",
        action: "Ajouter un service",
        href: "/settings/services",
        priority: 0,
        color: "#EF4444",
        soft: "#FEF2F2",
      });
    }

    // ── Monthly target proximity ─────────────────────────
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const monthRev = invoices
      .filter((i) => i.status === "paid" && i.clientId !== "__expense__" && i.date >= monthStart)
      .reduce((s, i) => s + i.amount, 0);
    if (monthRev > 800) {
      const target = 1500;
      const pct = (monthRev / target) * 100;
      if (pct >= 70 && pct < 100) {
        all.push({
          icon: Target,
          text: `${Math.round(pct)}% de votre objectif mensuel atteint (${monthRev.toFixed(0)} € / ${target} €). Encore ${(target - monthRev).toFixed(0)} € pour y arriver !`,
          priority: 3,
          color: "#16A34A",
          soft: "#F0FDF4",
        });
      }
    }

    // Sort by priority and take top 3
    return all.sort((a, b) => a.priority - b.priority).slice(0, 3);
  }, [clients, appointments, invoices, services, getLowStockProducts]);

  if (insights.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5 px-1">
        <Lightbulb size={13} style={{ color: "#5B4FE9" }} strokeWidth={2.6} />
        <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: "#5B4FE9" }}>
          Conseils du jour
        </p>
      </div>
      <div className="space-y-2">
        {insights.map((insight, i) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
              className="bg-white rounded-2xl p-4 shadow-card-premium"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: insight.soft }}
                >
                  <Icon size={16} style={{ color: insight.color }} strokeWidth={2.4} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-foreground leading-relaxed">{insight.text}</p>
                  {insight.action && insight.href && (
                    <a
                      href={insight.href}
                      className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold"
                      style={{ color: insight.color }}
                    >
                      {insight.action} →
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
