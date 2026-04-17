"use client";

import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { CalendarDays, Package, Star, CreditCard, CheckCircle2, Clock, Sparkles, Eye, ChevronRight, MessageSquare, BarChart3, Users, Bell, Mail, ArrowRight, X, BellRing, BellOff } from "lucide-react";
import SettingsPage, { SettingsSection, SettingsToggle, SaveButton } from "@/components/SettingsPage";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import {
  isPushSupported,
  getSubscriptionStatus,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";
import { useUserSettings } from "@/lib/user-settings";

// ── Push preference toggles ─────────────────────────────
interface PushPrefs {
  new_booking: boolean;
  cancelled_booking: boolean;
  new_message: boolean;
  waitlist_entry: boolean;
  low_stock: boolean;
}

const DEFAULT_PREFS: PushPrefs = {
  new_booking: true,
  cancelled_booking: true,
  new_message: true,
  waitlist_entry: true,
  low_stock: true,
};

const PREF_ITEMS: { key: keyof PushPrefs; emoji: string; label: string; desc: string }[] = [
  { key: "new_booking", emoji: "📅", label: "Nouvelles réservations", desc: "Quand un client réserve un créneau" },
  { key: "cancelled_booking", emoji: "❌", label: "Annulations", desc: "Quand un client annule son RDV" },
  { key: "new_message", emoji: "💬", label: "Nouveaux messages", desc: "Quand un client vous écrit dans le chat" },
  { key: "waitlist_entry", emoji: "🔔", label: "Liste d'attente", desc: "Quand quelqu'un s'inscrit en liste d'attente" },
  { key: "low_stock", emoji: "📦", label: "Alertes stock", desc: "Quand un produit passe sous le seuil minimum" },
];

// Dynamic premium feature rotation — each click shows a different value prop
const PREMIUM_FEATURES = [
  {
    icon: MessageSquare,
    title: "SMS automatises",
    desc: "Rappels SMS envoyes automatiquement avant chaque rendez-vous. Reduisez vos no-shows de 40%.",
  },
  {
    icon: Bell,
    title: "Rappels intelligents",
    desc: "Relancez automatiquement vos clients inactifs. Ne laissez plus personne vous oublier.",
  },
  {
    icon: BarChart3,
    title: "Statistiques avancees",
    desc: "Tableaux de bord detailles, previsions et insights. Pilotez votre activite en data.",
  },
  {
    icon: Users,
    title: "Segmentation clients",
    desc: "Groupez vos clients par comportement et ciblez vos meilleures opportunites commerciales.",
  },
  {
    icon: Mail,
    title: "Emails automatises",
    desc: "Messages de confirmation, remerciement et relance envoyes automatiquement a votre place.",
  },
  {
    icon: Sparkles,
    title: "Assistant IA",
    desc: "Recommandations personnalisees sur vos meilleurs clients et les opportunites a saisir.",
  },
];

interface Notif { id: string; icon: typeof CalendarDays; color: string; bg: string; title: string; desc: string; time: string; actions?: boolean; unread?: boolean; }

export default function SettingsNotificationsPage() {
  const { appointments, products, invoices, getLowStockProducts, user, userId } = useApp();
  const [saved, setSaved] = useState(false);
  // Rotating premium upsell — each click advances the feature shown
  const [upsellIdx, setUpsellIdx] = useState(0);

  // ── Push subscription state ──
  const [pushStatus, setPushStatus] = useState<
    "loading" | "unsupported" | "denied" | "default" | "granted" | "subscribed"
  >("loading");
  const [pushBusy, setPushBusy] = useState(false);
  const [prefs, setPrefs] = useUserSettings<PushPrefs>("push_preferences", DEFAULT_PREFS);

  useEffect(() => {
    (async () => {
      if (!isPushSupported()) { setPushStatus("unsupported"); return; }
      const status = await getSubscriptionStatus();
      setPushStatus(status);
    })();
  }, []);

  async function togglePush() {
    if (!userId) return;
    setPushBusy(true);
    try {
      if (pushStatus === "subscribed") {
        await unsubscribeFromPush();
        setPushStatus("default");
      } else {
        const res = await subscribeToPush(userId);
        if (res.ok) setPushStatus("subscribed");
        else if (res.error === "denied") setPushStatus("denied");
      }
    } finally {
      setPushBusy(false);
    }
  }

  // Build real notifications from actual data
  const notifications = useMemo(() => {
    const items: Notif[] = [];
    const todayStr = new Date().toISOString().split("T")[0];

    // Beta tester decision notification (from user_profiles.beta_status)
    if (user.betaStatus === "approved") {
      items.push({
        id: "beta-approved",
        icon: Sparkles,
        color: "text-accent",
        bg: "bg-accent-soft",
        title: "Vous êtes maintenant bêta testeur 🎉",
        desc: "Votre candidature a été acceptée. L'Espace bêta est désormais accessible depuis votre profil.",
        time: "Aujourd'hui",
        unread: true,
      });
    } else if (user.betaStatus === "rejected") {
      items.push({
        id: "beta-rejected",
        icon: X,
        color: "text-muted",
        bg: "bg-border-light",
        title: "Votre demande bêta n'a pas été acceptée",
        desc: "Merci pour votre intérêt. Vous pourrez soumettre une nouvelle demande plus tard.",
        time: "Aujourd'hui",
        unread: true,
      });
    } else if (user.betaStatus === "pending") {
      items.push({
        id: "beta-pending",
        icon: Clock,
        color: "text-warning",
        bg: "bg-warning-soft",
        title: "Demande bêta en cours d'examen",
        desc: "Notre équipe étudie votre candidature. Vous recevrez une réponse sous 24 à 48h.",
        time: "Aujourd'hui",
      });
    }

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
  }, [appointments, products, invoices, getLowStockProducts, user.betaStatus]);

  const todayNotifs = notifications.filter((n) => n.time === "Aujourd'hui");
  const olderNotifs = notifications.filter((n) => n.time !== "Aujourd'hui");

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 1500); }

  return (
    <SettingsPage category="Centre de notifications" title="Vos Notifications"
      description="Suivez l'activité de votre entreprise en temps réel."
      variant="notification">

      {/* ═══ PUSH NOTIFICATIONS TOGGLE ═══ */}
      <div
        className="rounded-2xl p-4 mb-5"
        style={{
          background: "linear-gradient(135deg, var(--color-primary-soft), #EEF0FF)",
          border: "1px solid color-mix(in srgb, var(--color-primary) 18%, white)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: pushStatus === "subscribed"
                ? "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))"
                : "white",
              border: pushStatus === "subscribed" ? "none" : "1px solid var(--color-border)",
            }}
          >
            {pushStatus === "subscribed" ? (
              <BellRing size={18} className="text-white" strokeWidth={2.4} />
            ) : pushStatus === "denied" || pushStatus === "unsupported" ? (
              <BellOff size={18} style={{ color: "var(--color-muted)" }} strokeWidth={2.4} />
            ) : (
              <Bell size={18} style={{ color: "var(--color-primary)" }} strokeWidth={2.4} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-foreground">Notifications push</p>
            <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
              {pushStatus === "subscribed"
                ? "Vous recevez les nouvelles réservations directement sur cet appareil."
                : pushStatus === "denied"
                ? "Notifications bloquées. Autorisez-les dans les réglages de votre navigateur."
                : pushStatus === "unsupported"
                ? "Votre navigateur ne supporte pas les notifications push. Installez l'app sur votre écran d'accueil pour les activer."
                : "Soyez prévenu en temps réel à chaque nouvelle réservation, même sans ouvrir l'app."}
            </p>
            {pushStatus !== "unsupported" && pushStatus !== "denied" && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={togglePush}
                disabled={pushBusy || !userId}
                className="mt-3 text-white text-[12px] font-bold px-4 py-2 rounded-xl disabled:opacity-60"
                style={{
                  background: pushStatus === "subscribed"
                    ? "#F4F4F5"
                    : "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
                  color: pushStatus === "subscribed" ? "var(--color-foreground)" : "white",
                  border: pushStatus === "subscribed" ? "1px solid var(--color-border)" : "none",
                  boxShadow: pushStatus === "subscribed" ? "none" : "0 6px 16px color-mix(in srgb, var(--color-primary) 30%, transparent)",
                }}
              >
                {pushBusy
                  ? "Patientez…"
                  : pushStatus === "subscribed"
                  ? "Désactiver"
                  : "Activer les notifications"}
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ PUSH PREFERENCES — only when subscribed ═══ */}
      {pushStatus === "subscribed" && (
        <SettingsSection
          title="Quelles notifications recevoir ?"
          description="Activez ou désactivez chaque type. Les changements sont sauvegardés automatiquement."
        >
          <div className="space-y-0.5">
            {PREF_ITEMS.map((item, i) => {
              const on = prefs[item.key] !== false;
              return (
                <div
                  key={item.key}
                  className={`flex items-center justify-between py-3 ${i < PREF_ITEMS.length - 1 ? "border-b border-border-light" : ""}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[20px] leading-none flex-shrink-0">{item.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground">{item.label}</p>
                      <p className="text-[10px] text-muted mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <SettingsToggle
                    on={on}
                    onToggle={() => setPrefs({ ...prefs, [item.key]: !on })}
                  />
                </div>
              );
            })}
          </div>
        </SettingsSection>
      )}

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
                      <motion.button whileTap={{ scale: 0.95 }} className="text-white px-4 py-2 rounded-xl text-[11px] font-bold"
                        style={{ backgroundColor: "var(--color-primary)" }}>
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

      {/* ═══ DYNAMIC PREMIUM UPSELL ═══ */}
      {/* Click anywhere on the card to rotate to the next premium feature */}
      <div
        onClick={() => setUpsellIdx((i) => (i + 1) % PREMIUM_FEATURES.length)}
        className="rounded-2xl p-5 mb-5 cursor-pointer relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #F3F0FF 0%, #EEF0FF 100%)",
          border: "1px solid #E0DCFF",
          boxShadow: "0 4px 14px rgba(139, 92, 246, 0.08), 0 1px 3px rgba(139, 92, 246, 0.04)",
        }}
      >
        {/* Decorative circle */}
        <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full" style={{ backgroundColor: "rgba(139, 92, 246, 0.08)" }} />

        <AnimatePresence mode="wait">
          <motion.div
            key={upsellIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-10"
          >
            {(() => {
              const f = PREMIUM_FEATURES[upsellIdx];
              const Icon = f.icon;
              return (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))", boxShadow: "0 4px 12px color-mix(in srgb, var(--color-primary) 35%, transparent)" }}
                    >
                      <Icon size={16} className="text-white" strokeWidth={2.5} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--color-primary-deep)" }}>
                      Premium
                    </p>
                  </div>
                  <p className="text-[16px] font-bold text-foreground tracking-tight">{f.title}</p>
                  <p className="text-[12px] text-muted mt-1 leading-relaxed">{f.desc}</p>
                </>
              );
            })()}
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 flex items-center justify-between mt-4 pt-3" style={{ borderTop: "1px solid rgba(139, 92, 246, 0.12)" }}>
          <div className="flex items-center gap-1.5">
            {PREMIUM_FEATURES.map((_, i) => (
              <motion.div
                key={i}
                className="h-[4px] rounded-full"
                animate={{
                  width: i === upsellIdx ? 16 : 4,
                  backgroundColor: i === upsellIdx ? "var(--color-primary)" : "var(--color-accent-light)",
                }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              />
            ))}
          </div>
          <Link href="/subscription" onClick={(e) => e.stopPropagation()}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="text-white rounded-xl text-[11px] font-bold px-4 py-2 flex items-center gap-1.5"
              style={{
                background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
                boxShadow: "0 4px 12px color-mix(in srgb, var(--color-primary) 35%, transparent)",
              }}
            >
              Decouvrir <ArrowRight size={12} strokeWidth={2.5} />
            </motion.button>
          </Link>
        </div>
      </div>
    </SettingsPage>
  );
}
