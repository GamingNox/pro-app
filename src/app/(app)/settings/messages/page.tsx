"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Bell,
  Megaphone,
  Heart,
  Users,
  Star,
  UserPlus,
  Mail,
  MousePointerClick,
  Eye,
  MessageSquare,
  ThumbsUp,
} from "lucide-react";
import SettingsPage, { SettingsToggle, PrimaryButton } from "@/components/SettingsPage";
import { useApp } from "@/lib/store";
import { hasAccess } from "@/lib/types";
import PremiumLockScreen from "@/components/PremiumLockScreen";
import { staggerItem, tabContentVariants, tabContentTransition } from "@/lib/motion";
import { useUserSettings } from "@/lib/user-settings";

// ── Types ──────────────────────────────────────────────────────────────
type MsgKey = "confirmation" | "reminder" | "promotion" | "thank_you" | "review_request";
type Segment = "all" | "manual" | "vip" | "reguliers" | "nouveaux" | "avec_email";
type Timing = "1h" | "4h" | "24h" | "48h";

interface MsgConfig {
  enabled: boolean;
  template: string;
  segment: Segment;
  timing?: Timing;
}

type State = Record<MsgKey, MsgConfig>;

// ── Defaults ───────────────────────────────────────────────────────────
const DEFAULT_STATE: State = {
  confirmation: {
    enabled: true,
    segment: "all",
    template: "Bonjour {nom}, votre rendez-vous chez {business} le {date} à {heure} pour {service} est confirmé. À bientôt !",
  },
  reminder: {
    enabled: true,
    segment: "all",
    timing: "24h",
    template: "Rappel {nom} : votre rendez-vous pour {service} est prévu {date} à {heure}. À tout de suite !",
  },
  promotion: {
    enabled: false,
    segment: "vip",
    template: "Offre exclusive pour vous, {nom} ! Profitez de -15% sur {service} chez {business}.",
  },
  thank_you: {
    enabled: false,
    segment: "all",
    template: "Merci {nom} pour votre visite chez {business} ! Au plaisir de vous revoir très bientôt.",
  },
  review_request: {
    enabled: true,
    segment: "all",
    template: "Bonjour {nom}, merci pour votre visite chez {business} ! Nous espérons que vous avez apprécié votre {service}. Pourriez-vous partager votre expérience en quelques mots ? Votre avis nous aide énormément.",
  },
};

// ── Meta ──────────────────────────────────────────────────────────────
const TABS: { key: MsgKey; label: string; icon: typeof Bell; hint: string }[] = [
  { key: "confirmation", label: "Confirmation", icon: CheckCircle2, hint: "Envoyé automatiquement dès qu'un client réserve un créneau." },
  { key: "reminder", label: "Rappel", icon: Bell, hint: "Envoyé quelques heures avant le rendez-vous pour éviter les oublis." },
  { key: "review_request", label: "Demande d'avis", icon: ThumbsUp, hint: "Envoyé automatiquement quand vous marquez un RDV comme terminé. Lien direct vers le formulaire d'avis." },
  { key: "promotion", label: "Promotion", icon: Megaphone, hint: "Envoyé à la demande — idéal pour une offre spéciale ou un événement." },
  { key: "thank_you", label: "Remerciement", icon: Heart, hint: "Envoyé après le rendez-vous pour fidéliser vos clients." },
];

const TIMINGS: { key: Timing; label: string }[] = [
  { key: "1h", label: "1 h avant" },
  { key: "4h", label: "4 h avant" },
  { key: "24h", label: "24 h avant" },
  { key: "48h", label: "48 h avant" },
];

const SEGMENTS: { key: Segment; label: string; icon: typeof Users }[] = [
  { key: "all", label: "Tous les clients", icon: Users },
  { key: "manual", label: "Clients choisis", icon: MousePointerClick },
  { key: "vip", label: "Clients VIP", icon: Star },
  { key: "reguliers", label: "Clients réguliers", icon: Heart },
  { key: "nouveaux", label: "Nouveaux clients", icon: UserPlus },
  { key: "avec_email", label: "Avec email", icon: Mail },
];

const VARIABLES = ["{nom}", "{date}", "{heure}", "{service}", "{business}"];

const SAMPLE = {
  "{nom}": "Marie",
  "{date}": "vendredi 17 avril",
  "{heure}": "14h30",
  "{service}": "Coupe & brushing",
  "{business}": "Nos Petites Aventures",
} as const;

function renderPreview(tpl: string): string {
  let out = tpl;
  for (const [k, v] of Object.entries(SAMPLE)) {
    out = out.split(k).join(v);
  }
  return out;
}

// ── Page ──────────────────────────────────────────────────────────────
export default function SettingsMessagesPage() {
  const { user } = useApp();
  const plan = user.plan || "essentiel";
  const canAccess = hasAccess("auto_reminders", plan);

  const [state, setState, saveStatus] = useUserSettings<State>("automated_messages", DEFAULT_STATE);
  const [activeTab, setActiveTab] = useState<MsgKey>("confirmation");
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const saved = saveStatus === "saved";

  async function sendTestEmail() {
    if (!user.email) {
      setTestStatus("error");
      setTimeout(() => setTestStatus("idle"), 2500);
      return;
    }
    setTestStatus("sending");
    try {
      const { wrapHtml, sendEmail } = await import("@/lib/email");
      const body = renderPreview(current.template);
      const html = wrapHtml({
        title: `Test - ${TABS.find((t) => t.key === activeTab)?.label}`,
        business: user.business || user.name || "Client Base",
        body,
      });
      const res = await sendEmail({
        to: user.email,
        subject: `[Test] ${TABS.find((t) => t.key === activeTab)?.label} - Client Base`,
        html,
        text: body,
        fromName: user.business || user.name || "Client Base",
      });
      setTestStatus(res.delivered ? "sent" : "error");
    } catch {
      setTestStatus("error");
    }
    setTimeout(() => setTestStatus("idle"), 3000);
  }

  const current = state[activeTab];

  function patchCurrent(patch: Partial<MsgConfig>) {
    setState({ ...state, [activeTab]: { ...state[activeTab], ...patch } });
  }

  function save() {
    // Force a re-save trigger by re-setting the same object (debounced hook)
    setState({ ...state });
  }

  function insertVariable(v: string) {
    const ta = textareaRef.current;
    if (!ta) {
      patchCurrent({ template: current.template + " " + v });
      return;
    }
    const start = ta.selectionStart ?? current.template.length;
    const end = ta.selectionEnd ?? current.template.length;
    const next = current.template.slice(0, start) + v + current.template.slice(end);
    patchCurrent({ template: next });
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + v.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  const preview = useMemo(() => renderPreview(current.template), [current.template]);

  if (!canAccess) {
    return <PremiumLockScreen feature="auto_reminders" />;
  }

  return (
    <SettingsPage
      category="Communication clients"
      title="Messages automatiques"
      description="Les messages partent tout seuls au bon moment, sans que vous ayez à y penser."
    >
      {/* ═══ EXPLAINER ═══ */}
      <div
        className="rounded-2xl p-4 mb-5 flex items-start gap-3"
        style={{ backgroundColor: "var(--color-primary-soft)", border: "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white"
        >
          <MessageSquare size={16} style={{ color: "var(--color-primary)" }} strokeWidth={2.4} />
        </div>
        <div className="flex-1">
          <p className="text-[12px] font-bold text-foreground mb-1">Comment ça marche</p>
          <p className="text-[11px] text-muted leading-relaxed">
            Choisissez un type de message ci-dessous (confirmation, rappel, avis…), activez-le,
            personnalisez le texte une fois, et c&apos;est terminé. Client Base enverra automatiquement
            le bon message à chaque client concerné.
          </p>
        </div>
      </div>

      {/* ═══ TAB PILLS ═══ */}
      <motion.div className="mb-5" {...staggerItem}>
        <div className="flex items-center gap-2 mb-3 px-1">
          <MessageSquare size={14} style={{ color: "#F59E0B" }} strokeWidth={2.6} />
          <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "#F59E0B" }}>
            Choisissez un message à configurer
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((t) => {
            const active = activeTab === t.key;
            const Icon = t.icon;
            const cfg = state[t.key];
            return (
              <motion.button
                key={t.key}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveTab(t.key)}
                className="flex-shrink-0 px-3.5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap"
                style={{
                  backgroundColor: active ? "var(--color-primary)" : "#FFFFFF",
                  color: active ? "#FFFFFF" : "var(--color-muted)",
                  border: active ? "none" : "1px solid var(--color-border)",
                  boxShadow: active
                    ? "0 6px 14px color-mix(in srgb, var(--color-primary) 28%, transparent)"
                    : "none",
                }}
              >
                <Icon size={12} strokeWidth={2.6} />
                {t.label}
                {cfg.enabled && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: active ? "#FFFFFF" : "var(--color-primary)" }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ TAB CONTENT ═══ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={tabContentVariants.initial}
          animate={tabContentVariants.animate}
          exit={tabContentVariants.exit}
          transition={tabContentTransition}
          className="space-y-4"
        >
          {/* Step 1: Enable + hint */}
          <div className="bg-white rounded-2xl p-5 shadow-card-premium">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                1
              </span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Activer ou désactiver</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-foreground">{TABS.find((t) => t.key === activeTab)?.label}</p>
                <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                  {TABS.find((t) => t.key === activeTab)?.hint}
                </p>
              </div>
              <SettingsToggle on={current.enabled} onToggle={() => patchCurrent({ enabled: !current.enabled })} />
            </div>
          </div>

          {/* Step 2a: Timing (reminder only) */}
          {activeTab === "reminder" && current.enabled && (
            <div className="bg-white rounded-2xl p-5 shadow-card-premium">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  2
                </span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Quand envoyer ?</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {TIMINGS.map((t) => {
                  const on = current.timing === t.key;
                  return (
                    <motion.button
                      key={t.key}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => patchCurrent({ timing: t.key })}
                      className="px-3.5 py-2 rounded-xl text-[11px] font-bold"
                      style={{
                        backgroundColor: on ? "var(--color-primary)" : "#FFFFFF",
                        color: on ? "#FFFFFF" : "var(--color-muted)",
                        border: on ? "none" : "1px solid var(--color-border)",
                      }}
                    >
                      {t.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2/3: Recipients segment */}
          {current.enabled && (
            <div className="bg-white rounded-2xl p-5 shadow-card-premium">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {activeTab === "reminder" ? 3 : 2}
                </span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">À qui l&apos;envoyer ?</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SEGMENTS.map((s) => {
                  const on = current.segment === s.key;
                  const Icon = s.icon;
                  return (
                    <motion.button
                      key={s.key}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => patchCurrent({ segment: s.key })}
                      className="px-3 py-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 text-left"
                      style={{
                        backgroundColor: on ? "var(--color-primary-soft)" : "#FFFFFF",
                        color: on ? "var(--color-primary-deep)" : "var(--color-muted)",
                        border: on
                          ? "1px solid var(--color-primary)"
                          : "1px solid var(--color-border)",
                        boxShadow: on
                          ? "0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent)"
                          : "none",
                      }}
                    >
                      <Icon size={12} strokeWidth={2.6} />
                      <span className="truncate">{s.label}</span>
                    </motion.button>
                  );
                })}
              </div>
              {current.segment === "manual" && (
                <div
                  className="mt-3 rounded-xl p-3 text-[11px] leading-relaxed"
                  style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary-deep)" }}
                >
                  Gérez la sélection manuelle depuis <b>Clients → Groupe</b>.
                </div>
              )}
            </div>
          )}

          {/* Step 3/4: Template editor */}
          {current.enabled && (
            <div className="bg-white rounded-2xl p-5 shadow-card-premium">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {activeTab === "reminder" ? 4 : 3}
                </span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Votre message</p>
              </div>
              <p className="text-[11px] text-muted mb-3 leading-relaxed">
                Tapez sur un mot-clé ci-dessous pour l&apos;insérer. Il sera remplacé par la vraie valeur lors de l&apos;envoi.
              </p>

              {/* Variable chips */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {VARIABLES.map((v) => (
                  <motion.button
                    key={v}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => insertVariable(v)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono"
                    style={{
                      backgroundColor: "var(--color-primary-soft)",
                      color: "var(--color-primary-deep)",
                      border: "1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)",
                    }}
                  >
                    {v}
                  </motion.button>
                ))}
              </div>

              <textarea
                ref={textareaRef}
                value={current.template}
                onChange={(e) => patchCurrent({ template: e.target.value })}
                rows={4}
                className="input-field resize-none w-full"
                placeholder="Écrivez votre message. Utilisez les variables ci-dessus."
              />

              {/* Preview */}
              <div className="mt-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Eye size={11} className="text-muted" strokeWidth={2.6} />
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Aperçu</p>
                </div>
                <div
                  className="rounded-xl p-3 text-[12px] leading-relaxed"
                  style={{
                    backgroundColor: "var(--color-primary-soft)",
                    color: "var(--color-primary-deep)",
                    border: "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)",
                  }}
                >
                  {preview || <span className="italic opacity-60">Aperçu vide.</span>}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Test send */}
      {current.enabled && user.email && (
        <div className="mt-5">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={sendTestEmail}
            disabled={testStatus === "sending"}
            className="w-full py-3 rounded-2xl text-[12px] font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{
              backgroundColor: testStatus === "sent" ? "#D1FAE5" : testStatus === "error" ? "#FEE2E2" : "var(--color-primary-soft)",
              color: testStatus === "sent" ? "#047857" : testStatus === "error" ? "#B91C1C" : "var(--color-primary-deep)",
              border: `1px solid ${testStatus === "sent" ? "#10B981" : testStatus === "error" ? "#EF4444" : "var(--color-primary)"}`,
            }}
          >
            {testStatus === "sending"
              ? "Envoi en cours..."
              : testStatus === "sent"
                ? `Envoyé à ${user.email}`
                : testStatus === "error"
                  ? "Échec — réessayer"
                  : `M'envoyer un test à ${user.email}`}
          </motion.button>
          <p className="text-[10px] text-muted text-center mt-2">
            Le test utilise le modèle actuel de ce type de message.
          </p>
        </div>
      )}

      <div className="mt-5">
        <PrimaryButton onClick={save}>
          {saved ? "Enregistré !" : "Enregistrer les modifications"}
        </PrimaryButton>
      </div>
    </SettingsPage>
  );
}
