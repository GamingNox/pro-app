"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { BellRing, BellOff, Loader2 } from "lucide-react";
import SettingsPage, { SettingsSection, SettingsToggle, SettingsRow } from "@/components/SettingsPage";
import {
  isPushSupported,
  getSubscriptionStatus,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";
import { useUserSettings } from "@/lib/user-settings";

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

const PREF_ITEMS: { key: keyof PushPrefs; label: string; hint: string }[] = [
  { key: "new_booking",       label: "Nouveaux rendez-vous", hint: "Quand un client réserve un créneau" },
  { key: "cancelled_booking", label: "Annulations",          hint: "Quand un client annule son RDV" },
  { key: "new_message",       label: "Messages reçus",       hint: "Quand un client vous écrit" },
  { key: "waitlist_entry",    label: "Liste d'attente",      hint: "Quand quelqu'un s'inscrit" },
  { key: "low_stock",         label: "Stock bas",            hint: "Quand un produit est bientôt épuisé" },
];

export default function SettingsNotificationsPage() {
  const { userId } = useApp();
  const [pushStatus, setPushStatus] = useState<"loading" | "unsupported" | "denied" | "default" | "granted" | "subscribed">("loading");
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

  const isSubscribed = pushStatus === "subscribed";

  return (
    <SettingsPage
      category="Messages & notifications"
      title="Mes alertes"
      description="Les notifications reçues directement sur votre téléphone."
    >
      <SettingsSection title="Activer les notifications">
        {pushStatus === "unsupported" ? (
          <div className="text-[13px] text-muted">
            Les notifications push ne sont pas disponibles sur votre navigateur.
          </div>
        ) : pushStatus === "denied" ? (
          <div className="text-[13px] text-muted">
            Les notifications sont bloquées. Autorisez-les dans les réglages de votre navigateur pour les réactiver.
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={togglePush}
            disabled={pushBusy || pushStatus === "loading"}
            className="w-full flex items-center gap-3 p-4 rounded-2xl text-left disabled:opacity-60"
            style={{
              background: isSubscribed ? "var(--color-primary)" : "var(--color-border-light)",
              color: isSubscribed ? "white" : "var(--color-foreground)",
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: isSubscribed ? "rgba(255,255,255,0.2)" : "white" }}>
              {pushBusy ? <Loader2 size={18} className="animate-spin" /> :
                isSubscribed ? <BellRing size={18} strokeWidth={2.2} /> :
                <BellOff size={18} strokeWidth={2.2} className="text-muted" />}
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold">
                {isSubscribed ? "Notifications activées" : "Activer les notifications"}
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: isSubscribed ? "rgba(255,255,255,0.8)" : "var(--color-muted)" }}>
                {isSubscribed ? "Vous recevrez les alertes sur ce téléphone" : "Appuyez pour recevoir les alertes"}
              </p>
            </div>
          </motion.button>
        )}
      </SettingsSection>

      {isSubscribed && (
        <SettingsSection title="Ce que vous recevez" description="Activez uniquement ce qui vous intéresse.">
          {PREF_ITEMS.map((it, i) => (
            <SettingsRow key={it.key} label={it.label} hint={it.hint} last={i === PREF_ITEMS.length - 1}>
              <SettingsToggle
                on={prefs[it.key]}
                onToggle={() => setPrefs({ ...prefs, [it.key]: !prefs[it.key] })}
              />
            </SettingsRow>
          ))}
        </SettingsSection>
      )}
    </SettingsPage>
  );
}
