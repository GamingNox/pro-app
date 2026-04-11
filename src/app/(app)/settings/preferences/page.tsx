"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Shield, Smartphone, Trash2 } from "lucide-react";
import SettingsPage, { SettingsSection, SettingsToggle, SettingsRow, SaveButton } from "@/components/SettingsPage";

export default function SettingsPreferencesPage() {
  const [saved, setSaved] = useState(false);
  const [nRdv, setNRdv] = useState(true);
  const [nPay, setNPay] = useState(true);
  const [nStk, setNStk] = useState(true);
  const [nEmail, setNEmail] = useState(true);
  const [nPush, setNPush] = useState(false);

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 1500); }

  return (
    <SettingsPage
      category="Application"
      title="Préférences"
      description="Configurez les notifications, la confidentialité et le comportement de l'application."
    >
      {/* Notifications */}
      <SettingsSection title="Notifications" description="Choisissez les alertes que vous souhaitez recevoir.">
        <SettingsRow label="Nouveau rendez-vous" hint="Alerte lors d'une nouvelle réservation.">
          <SettingsToggle on={nRdv} onToggle={() => setNRdv(!nRdv)} />
        </SettingsRow>
        <SettingsRow label="Paiement reçu" hint="Confirmation de paiement.">
          <SettingsToggle on={nPay} onToggle={() => setNPay(!nPay)} />
        </SettingsRow>
        <SettingsRow label="Alerte stock" hint="Quand un produit est en rupture." last>
          <SettingsToggle on={nStk} onToggle={() => setNStk(!nStk)} />
        </SettingsRow>
      </SettingsSection>

      {/* Channels */}
      <SettingsSection title="Canaux">
        <SettingsRow label="Email" hint="Recevoir les notifications par email.">
          <SettingsToggle on={nEmail} onToggle={() => setNEmail(!nEmail)} />
        </SettingsRow>
        <SettingsRow label="Push" hint="Notifications sur votre appareil." last>
          <SettingsToggle on={nPush} onToggle={() => setNPush(!nPush)} />
        </SettingsRow>
      </SettingsSection>

      {/* Privacy */}
      <SettingsSection title="Confidentialité">
        <div className="flex items-start gap-3 mb-3">
          <Shield size={16} className="text-accent flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-muted leading-relaxed">Vos données sont chiffrées et stockées de manière sécurisée. Nous ne partageons jamais vos informations personnelles.</p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }}
          className="w-full bg-border-light text-foreground py-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2">
          <Smartphone size={14} /> Télécharger mes données
        </motion.button>
      </SettingsSection>

      {/* Danger zone */}
      <SettingsSection title="Zone danger">
        <motion.button whileTap={{ scale: 0.97 }}
          className="w-full bg-danger-soft text-danger py-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2">
          <Trash2 size={14} /> Supprimer mon compte
        </motion.button>
        <p className="text-[10px] text-muted mt-2 text-center">Cette action est irréversible.</p>
      </SettingsSection>

      <SaveButton onClick={flash} saving={saved} />
    </SettingsPage>
  );
}
