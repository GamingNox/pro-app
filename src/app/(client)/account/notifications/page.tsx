"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import SettingsPage, { SettingsSection, SettingsRow, SettingsToggle } from "@/components/SettingsPage";

type Prefs = {
  bookingReminders: boolean;
  bookingConfirmations: boolean;
  promoEmails: boolean;
  loyaltyUpdates: boolean;
  pushEnabled: boolean;
};

const DEFAULTS: Prefs = {
  bookingReminders: true,
  bookingConfirmations: true,
  promoEmails: false,
  loyaltyUpdates: true,
  pushEnabled: true,
};

const STORAGE_KEY = "client-notification-prefs";

export default function ClientNotificationsPage() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Load persisted preferences on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Prefs>;
        setPrefs({ ...DEFAULTS, ...parsed });
      }
    } catch {}
  }, []);

  function toggle(key: keyof Prefs) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setDirty(true);
  }

  function handleSave() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <SettingsPage
      category="Compte client"
      title="Notifications"
      description="Choisissez comment vous souhaitez etre tenu informe de vos rendez-vous et offres."
      variant="notification"
    >
      <SettingsSection title="Rendez-vous" description="Notifications concernant vos reservations.">
        <SettingsRow label="Rappels de rendez-vous" hint="24h avant chaque rendez-vous">
          <SettingsToggle on={prefs.bookingReminders} onToggle={() => toggle("bookingReminders")} />
        </SettingsRow>
        <SettingsRow label="Confirmations" hint="A la validation d'une reservation" last>
          <SettingsToggle on={prefs.bookingConfirmations} onToggle={() => toggle("bookingConfirmations")} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Marketing" description="Offres et nouveautes de vos professionnels.">
        <SettingsRow label="Emails promotionnels" hint="Offres et evenements">
          <SettingsToggle on={prefs.promoEmails} onToggle={() => toggle("promoEmails")} />
        </SettingsRow>
        <SettingsRow label="Mises a jour fidelite" hint="Nouveaux paliers et recompenses" last>
          <SettingsToggle on={prefs.loyaltyUpdates} onToggle={() => toggle("loyaltyUpdates")} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Appareil" description="Notifications systeme sur ce dispositif.">
        <SettingsRow label="Notifications push" hint="Alertes instantanees" last>
          <SettingsToggle on={prefs.pushEnabled} onToggle={() => toggle("pushEnabled")} />
        </SettingsRow>
      </SettingsSection>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        disabled={!dirty}
        className={`w-full py-4 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 mb-5 ${
          dirty ? "bg-accent text-white fab-shadow" : "bg-border-light text-muted"
        }`}
      >
        {saved ? (
          <>
            <Check size={16} /> Preferences enregistrees
          </>
        ) : (
          "Enregistrer"
        )}
      </motion.button>
    </SettingsPage>
  );
}
