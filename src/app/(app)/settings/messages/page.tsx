"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Bell, ThumbsUp, Check } from "lucide-react";
import SettingsPage, { SettingsSection, SettingsToggle } from "@/components/SettingsPage";
import { useUserSettings } from "@/lib/user-settings";

type MsgKey = "confirmation" | "reminder" | "review_request";

interface MsgConfig {
  enabled: boolean;
  template: string;
}

type State = Record<MsgKey, MsgConfig>;

// ── Pre-written templates — one click to use ──────────────
const TEMPLATES: Record<MsgKey, { name: string; text: string }[]> = {
  confirmation: [
    { name: "Classique", text: "Bonjour {nom}, votre rendez-vous chez {business} le {date} à {heure} pour {service} est confirmé. À bientôt !" },
    { name: "Chaleureux", text: "Bonjour {nom} ! C'est confirmé : on se voit le {date} à {heure} pour votre {service}. Vraiment hâte de vous voir !" },
    { name: "Concis",  text: "Confirmé : {service} chez {business}, {date} à {heure}." },
  ],
  reminder: [
    { name: "Classique", text: "Rappel {nom} : votre rendez-vous pour {service} est prévu {date} à {heure}. À tout de suite !" },
    { name: "Amical",    text: "Hello {nom} ! Petit rappel : on se retrouve {date} à {heure} pour votre {service}. À tout de suite !" },
    { name: "Concis",    text: "Rappel : {service} {date} à {heure}. À tout de suite." },
  ],
  review_request: [
    { name: "Sincère",   text: "Bonjour {nom}, merci d'être venu(e) chez {business} pour votre {service} ! Votre avis compte énormément. Pourriez-vous prendre 30 secondes pour le partager ?" },
    { name: "Simple",    text: "Bonjour {nom}, comment s'est passé votre {service} ? Votre avis nous aide beaucoup !" },
    { name: "Incitatif", text: "Merci {nom} ! Un petit avis ferait vraiment plaisir et aide d'autres clients à nous découvrir. Ça ne prend que 30 secondes." },
  ],
};

const DEFAULT_STATE: State = {
  confirmation: { enabled: true, template: TEMPLATES.confirmation[0].text },
  reminder: { enabled: true, template: TEMPLATES.reminder[0].text },
  review_request: { enabled: true, template: TEMPLATES.review_request[0].text },
};

const MESSAGES: { key: MsgKey; label: string; description: string; icon: typeof Bell; iconColor: string; when: string }[] = [
  {
    key: "confirmation",
    label: "Confirmation",
    description: "Envoyé automatiquement dès qu'un client réserve.",
    icon: CheckCircle2,
    iconColor: "#16A34A",
    when: "Dès la réservation",
  },
  {
    key: "reminder",
    label: "Rappel",
    description: "Envoyé 24h avant le rendez-vous pour éviter les oublis.",
    icon: Bell,
    iconColor: "#F59E0B",
    when: "24h avant le RDV",
  },
  {
    key: "review_request",
    label: "Demande d'avis",
    description: "Envoyé quand vous marquez un RDV comme terminé.",
    icon: ThumbsUp,
    iconColor: "#5B4FE9",
    when: "Après le RDV",
  },
];

export default function SettingsMessagesPage() {
  const [state, setState] = useUserSettings<State>("automated_messages", DEFAULT_STATE);
  const [expanded, setExpanded] = useState<MsgKey | null>(null);
  const [customMode, setCustomMode] = useState<Record<MsgKey, boolean>>({
    confirmation: false,
    reminder: false,
    review_request: false,
  });

  function updateMsg(key: MsgKey, patch: Partial<MsgConfig>) {
    setState({ ...state, [key]: { ...state[key], ...patch } });
  }

  return (
    <SettingsPage
      category="Messages"
      title="Messages automatiques"
      description="Les emails envoyés à vos clients. Choisissez simplement un modèle, ou écrivez le vôtre."
    >
      <SettingsSection title="Variables disponibles" description="Utilisez ces mots-clés dans vos messages — ils seront remplacés automatiquement.">
        <div className="flex flex-wrap gap-1.5">
          {["{nom}", "{business}", "{service}", "{date}", "{heure}"].map((v) => (
            <span key={v} className="px-2.5 py-1 rounded-md bg-border-light text-[12px] font-semibold text-muted">
              {v}
            </span>
          ))}
        </div>
      </SettingsSection>

      {MESSAGES.map((msg) => {
        const Icon = msg.icon;
        const cfg = state[msg.key] || DEFAULT_STATE[msg.key];
        const isExpanded = expanded === msg.key;
        const isCustom = customMode[msg.key] || !TEMPLATES[msg.key].some((t) => t.text === cfg.template);

        return (
          <div key={msg.key} className="bg-white rounded-2xl p-5 shadow-card-premium mb-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${msg.iconColor}20` }}>
                <Icon size={18} style={{ color: msg.iconColor }} strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-foreground">{msg.label}</p>
                <p className="text-[12px] text-muted mt-0.5 leading-relaxed">{msg.description}</p>
                <p className="text-[11px] mt-1 font-semibold" style={{ color: msg.iconColor }}>{msg.when}</p>
              </div>
              <SettingsToggle on={cfg.enabled} onToggle={() => updateMsg(msg.key, { enabled: !cfg.enabled })} />
            </div>

            {cfg.enabled && (
              <>
                <motion.button
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setExpanded(isExpanded ? null : msg.key)}
                  className="w-full text-left py-2 text-[12px] font-bold"
                  style={{ color: "var(--color-primary)" }}
                >
                  {isExpanded ? "Masquer le message" : "Voir / modifier le message"}
                </motion.button>

                {isExpanded && (
                  <div className="mt-2">
                    {!isCustom ? (
                      <>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">Choisir un modèle</p>
                        <div className="space-y-2 mb-3">
                          {TEMPLATES[msg.key].map((t) => {
                            const active = cfg.template === t.text;
                            return (
                              <motion.button
                                key={t.name}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => updateMsg(msg.key, { template: t.text })}
                                className="w-full text-left p-3 rounded-xl transition-colors"
                                style={{
                                  backgroundColor: active ? "var(--color-primary-soft)" : "var(--color-border-light)",
                                  border: active ? "1.5px solid var(--color-primary)" : "1.5px solid transparent",
                                }}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-[13px] font-bold" style={{ color: active ? "var(--color-primary-deep)" : "var(--color-foreground)" }}>
                                    {t.name}
                                  </p>
                                  {active && <Check size={14} strokeWidth={2.8} style={{ color: "var(--color-primary)" }} />}
                                </div>
                                <p className="text-[12px] text-muted leading-relaxed">{t.text}</p>
                              </motion.button>
                            );
                          })}
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setCustomMode((p) => ({ ...p, [msg.key]: true }))}
                          className="w-full text-[12px] font-bold py-2"
                          style={{ color: "var(--color-primary)" }}
                        >
                          Écrire mon propre message →
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">Mon message</p>
                        <textarea
                          value={cfg.template}
                          onChange={(e) => updateMsg(msg.key, { template: e.target.value })}
                          rows={4}
                          className="input-field w-full resize-none text-[13px] leading-relaxed"
                          placeholder="Votre message…"
                        />
                        <motion.button
                          whileTap={{ scale: 0.99 }}
                          onClick={() => {
                            setCustomMode((p) => ({ ...p, [msg.key]: false }));
                            updateMsg(msg.key, { template: TEMPLATES[msg.key][0].text });
                          }}
                          className="w-full text-[12px] font-bold py-2 mt-2"
                          style={{ color: "var(--color-muted)" }}
                        >
                          ← Revenir aux modèles
                        </motion.button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </SettingsPage>
  );
}
