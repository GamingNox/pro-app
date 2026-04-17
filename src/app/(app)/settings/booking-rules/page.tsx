"use client";

import { motion } from "framer-motion";
import { Ban, CalendarClock, Phone, Mail, MessageSquare } from "lucide-react";
import SettingsPage, {
  SettingsSection,
  SettingsToggle,
  SaveButton,
} from "@/components/SettingsPage";
import { useUserSettings } from "@/lib/user-settings";

interface BookingRules {
  cancelLimit: string;          // "none" | "4" | "12" | "24" | "48" | "72"
  cancelMessage: string;
  minDelay: string;             // "0" | "1" | "4" | "12" | "24" | "48"
  maxAdvanceDays: string;       // "7" | "14" | "30" | "60" | "90"
  requirePhone: boolean;
  requireEmail: boolean;
  customInstructions: string;
}

const DEFAULTS: BookingRules = {
  cancelLimit: "24",
  cancelMessage:
    "Toute annulation doit etre effectuee au moins 24h avant le rendez-vous. Passe ce delai, elle ne sera pas prise en compte.",
  minDelay: "1",
  maxAdvanceDays: "60",
  requirePhone: true,
  requireEmail: true,
  customInstructions: "",
};

const CANCEL_OPTIONS: { value: string; label: string }[] = [
  { value: "none", label: "Aucune" },
  { value: "4", label: "4h" },
  { value: "12", label: "12h" },
  { value: "24", label: "24h" },
  { value: "48", label: "48h" },
  { value: "72", label: "72h" },
];

const MIN_DELAY_OPTIONS: { value: string; label: string }[] = [
  { value: "0", label: "Immediat" },
  { value: "1", label: "1h" },
  { value: "4", label: "4h" },
  { value: "12", label: "12h" },
  { value: "24", label: "24h" },
  { value: "48", label: "48h" },
];

const MAX_ADVANCE_OPTIONS: { value: string; label: string }[] = [
  { value: "7", label: "7j" },
  { value: "14", label: "14j" },
  { value: "30", label: "30j" },
  { value: "60", label: "60j" },
  { value: "90", label: "90j" },
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
            className={`px-3.5 py-2 rounded-xl text-[12px] font-bold transition-colors ${
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

  function save() {
    setRules({ ...rules });
  }

  return (
    <SettingsPage
      category="Réservations"
      title="Règles de réservation"
      description="Contrôlez quand vos clients peuvent réserver et comment ils peuvent annuler."
    >
      {/* ═══ 1. CANCEL POLICY — most critical, goes first ═══ */}
      <SettingsSection
        title="Annulation"
        description="Jusqu'à quand un client peut annuler son rendez-vous sans pénalité."
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--color-accent-soft)" }}
          >
            <Ban size={16} style={{ color: "var(--color-accent)" }} />
          </div>
          <p className="text-[13px] font-bold" style={{ color: "var(--color-accent)" }}>
            Délai d&apos;annulation
          </p>
        </div>

        <ChipSelector
          options={CANCEL_OPTIONS}
          value={rules.cancelLimit}
          onChange={(v) => update("cancelLimit", v)}
        />

        <div className="mt-5">
          <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
            Message affiché à vos clients
          </label>
          <textarea
            value={rules.cancelMessage}
            onChange={(e) => update("cancelMessage", e.target.value)}
            rows={3}
            placeholder="Expliquez votre politique d'annulation…"
            className="input-field w-full resize-none"
          />
          <p className="text-[10px] text-muted mt-1.5 leading-relaxed">
            Ce texte apparaît lors de la réservation pour prévenir vos clients.
          </p>
        </div>
      </SettingsSection>

      {/* ═══ 2. BOOKING WINDOW — when can they book? ═══ */}
      <SettingsSection
        title="Quand peuvent-ils réserver ?"
        description="Définissez à quel moment les créneaux sont disponibles."
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--color-accent-soft)" }}
          >
            <CalendarClock size={16} style={{ color: "var(--color-accent)" }} />
          </div>
          <p className="text-[13px] font-bold" style={{ color: "var(--color-accent)" }}>
            Fenêtre de réservation
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-[11px] text-foreground font-semibold mb-2 block">
              Délai minimum avant un rendez-vous
            </label>
            <ChipSelector
              options={MIN_DELAY_OPTIONS}
              value={rules.minDelay}
              onChange={(v) => update("minDelay", v)}
            />
            <p className="text-[10px] text-muted mt-2">
              Empêche les réservations de dernière minute.
            </p>
          </div>

          <div className="pt-4 border-t border-border-light">
            <label className="text-[11px] text-foreground font-semibold mb-2 block">
              Jusqu&apos;à combien de jours à l&apos;avance ?
            </label>
            <ChipSelector
              options={MAX_ADVANCE_OPTIONS}
              value={rules.maxAdvanceDays}
              onChange={(v) => update("maxAdvanceDays", v)}
            />
            <p className="text-[10px] text-muted mt-2">
              Les clients ne verront pas de créneaux au-delà de cette durée.
            </p>
          </div>
        </div>
      </SettingsSection>

      {/* ═══ 3. REQUIRED INFO — simple toggles ═══ */}
      <SettingsSection
        title="Informations demandées"
        description="Ce que vous voulez savoir sur vos clients lors de la réservation."
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "var(--color-primary-soft)" }}
              >
                <Phone size={15} style={{ color: "var(--color-primary)" }} strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground">Téléphone</p>
                <p className="text-[10px] text-muted">Obligatoire à la réservation</p>
              </div>
            </div>
            <SettingsToggle
              on={rules.requirePhone}
              onToggle={() => update("requirePhone", !rules.requirePhone)}
            />
          </div>

          <div className="flex items-center justify-between py-2.5 border-t border-border-light">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "var(--color-primary-soft)" }}
              >
                <Mail size={15} style={{ color: "var(--color-primary)" }} strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground">Email</p>
                <p className="text-[10px] text-muted">Obligatoire à la réservation</p>
              </div>
            </div>
            <SettingsToggle
              on={rules.requireEmail}
              onToggle={() => update("requireEmail", !rules.requireEmail)}
            />
          </div>
        </div>
      </SettingsSection>

      {/* ═══ 4. CUSTOM INSTRUCTIONS — its own card for focus ═══ */}
      <SettingsSection
        title="Instructions personnalisées"
        description="Un mot d'accueil qui s'affichera en début de réservation."
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--color-primary-soft)" }}
          >
            <MessageSquare size={15} style={{ color: "var(--color-primary)" }} strokeWidth={2.4} />
          </div>
          <p className="text-[13px] font-bold text-foreground">Message d&apos;accueil</p>
        </div>
        <textarea
          value={rules.customInstructions}
          onChange={(e) => update("customInstructions", e.target.value)}
          rows={4}
          placeholder="Ex : Parking disponible à l'arrière. Merci d'arriver 5 minutes en avance."
          className="input-field w-full resize-none"
        />
        <p className="text-[10px] text-muted mt-2 leading-relaxed">
          Accès, parking, préparation, stationnement — toute info utile pour le client.
        </p>
      </SettingsSection>

      <SaveButton onClick={save} saving={saved} />
    </SettingsPage>
  );
}
