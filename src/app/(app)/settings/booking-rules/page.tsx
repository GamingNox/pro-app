"use client";

import { motion } from "framer-motion";
import SettingsPage, {
  SettingsSection,
  SettingsToggle,
  SettingsRow,
  SaveButton,
} from "@/components/SettingsPage";
import { useUserSettings } from "@/lib/user-settings";

interface BookingRules {
  cancelLimit: string;
  cancelMessage: string;
  minDelay: string;
  maxAdvanceDays: string;
  requirePhone: boolean;
  requireEmail: boolean;
  customInstructions: string;
}

const DEFAULTS: BookingRules = {
  cancelLimit: "24",
  cancelMessage: "Les annulations doivent être faites au moins 24h à l'avance.",
  minDelay: "1",
  maxAdvanceDays: "60",
  requirePhone: true,
  requireEmail: true,
  customInstructions: "",
};

const CANCEL_OPTIONS = [
  { value: "none", label: "Aucune" },
  { value: "24",   label: "24h à l'avance" },
  { value: "48",   label: "48h à l'avance" },
];

const WINDOW_OPTIONS = [
  { value: "14", label: "2 semaines" },
  { value: "30", label: "1 mois" },
  { value: "60", label: "2 mois" },
  { value: "90", label: "3 mois" },
];

function ChipSelector({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <motion.button
            key={opt.value}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2.5 rounded-xl text-[13px] font-bold transition-colors ${
              active ? "text-white" : "bg-border-light text-muted"
            }`}
            style={active ? { backgroundColor: "var(--color-primary)" } : undefined}
          >
            {opt.label}
          </motion.button>
        );
      })}
    </div>
  );
}

export default function SettingsBookingRulesPage() {
  const [rules, setRules, saveStatus] = useUserSettings<BookingRules>("booking_rules", DEFAULTS);
  const saved = saveStatus === "saved";

  function update<K extends keyof BookingRules>(key: K, val: BookingRules[K]) {
    setRules({ ...rules, [key]: val });
  }

  return (
    <SettingsPage
      category="Réservations"
      title="Règles"
      description="Quand vos clients peuvent réserver et annuler."
    >
      <SettingsSection title="Annulation" description="Délai minimum pour annuler un RDV sans frais.">
        <ChipSelector
          options={CANCEL_OPTIONS}
          value={rules.cancelLimit}
          onChange={(v) => update("cancelLimit", v)}
        />
      </SettingsSection>

      <SettingsSection title="Fenêtre de réservation" description="Jusqu'à combien de temps à l'avance un client peut-il réserver ?">
        <ChipSelector
          options={WINDOW_OPTIONS}
          value={rules.maxAdvanceDays}
          onChange={(v) => update("maxAdvanceDays", v)}
        />
      </SettingsSection>

      <SettingsSection title="Informations obligatoires" description="Ce que le client doit remplir pour réserver.">
        <SettingsRow label="Téléphone">
          <SettingsToggle on={rules.requirePhone} onToggle={() => update("requirePhone", !rules.requirePhone)} />
        </SettingsRow>
        <SettingsRow label="Email" last>
          <SettingsToggle on={rules.requireEmail} onToggle={() => update("requireEmail", !rules.requireEmail)} />
        </SettingsRow>
      </SettingsSection>

      <SaveButton onClick={() => setRules({ ...rules })} saving={saved} />
    </SettingsPage>
  );
}
