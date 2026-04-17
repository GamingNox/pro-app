"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag,
  Plus,
  Trash2,
  X,
  Check,
  Sparkles,
  Sun,
  Heart,
  Users,
  Zap,
  Clock,
} from "lucide-react";
import SettingsPage, { PrimaryButton } from "@/components/SettingsPage";
import { tabContentVariants, tabContentTransition, staggerItem } from "@/lib/motion";

// ── Storage ────────────────────────────────────────────────────────────
const STORAGE_KEY = "active_promos";

// ── Types ──────────────────────────────────────────────────────────────
type Intent = "saison" | "fidelite" | "parrainage" | "flash";

interface Promo {
  id: string;
  name: string;
  emoji: string;
  type: "percent" | "fixed";
  value: string;
  desc: string;
  expiresAt: string; // ISO date
}

interface Template {
  id: string;
  intent: Intent;
  emoji: string;
  name: string;
  type: "percent" | "fixed";
  value: string;
  desc: string;
  days: number;
}

// ── Templates (grouped by intent) ─────────────────────────────────────
const TEMPLATES: Template[] = [
  // Saison
  { id: "noel", intent: "saison", emoji: "🎄", name: "Offre de Noël", type: "percent", value: "20", desc: "Fêtes de fin d'année : -20% sur vos prestations préférées.", days: 21 },
  { id: "valentin", intent: "saison", emoji: "❤️", name: "Saint-Valentin", type: "percent", value: "15", desc: "Célébrez l'amour avec un soin en duo, -15% sur les packages.", days: 14 },
  { id: "ete", intent: "saison", emoji: "☀️", name: "Offre d'été", type: "percent", value: "15", desc: "Rayonnez tout l'été : -15% sur toutes vos prestations.", days: 30 },
  { id: "rentree", intent: "saison", emoji: "📚", name: "Rentrée", type: "percent", value: "10", desc: "Reprenez la saison en beauté avec -10% de remise.", days: 21 },

  // Fidélité
  { id: "fidelite", intent: "fidelite", emoji: "💎", name: "Offre fidélité", type: "percent", value: "10", desc: "Merci de votre loyauté : -10% pour nos clients réguliers.", days: 60 },
  { id: "vip", intent: "fidelite", emoji: "👑", name: "Offre VIP", type: "percent", value: "15", desc: "Traitement exclusif : -15% réservé à nos membres VIP.", days: 60 },
  { id: "anniversaire", intent: "fidelite", emoji: "🎂", name: "Anniversaire", type: "percent", value: "20", desc: "Votre cadeau : -20% le mois de votre anniversaire.", days: 30 },

  // Parrainage
  { id: "parrainage", intent: "parrainage", emoji: "🤝", name: "Parrainage", type: "percent", value: "10", desc: "Parrainez un ami : -10% pour vous deux sur la prochaine visite.", days: 90 },
  { id: "premiere", intent: "parrainage", emoji: "🎁", name: "Bienvenue", type: "percent", value: "10", desc: "Bienvenue chez nous : -10% sur votre premier rendez-vous.", days: 60 },

  // Flash
  { id: "flash", intent: "flash", emoji: "⚡", name: "Offre flash", type: "percent", value: "25", desc: "24h chrono : -25% sur vos prochains rendez-vous.", days: 1 },
  { id: "limitee", intent: "flash", emoji: "⏳", name: "Offre limitée", type: "percent", value: "15", desc: "Valable 7 jours seulement : -15% sur toutes les prestations.", days: 7 },
  { id: "derniere", intent: "flash", emoji: "🏃", name: "Dernière minute", type: "percent", value: "30", desc: "Créneaux de dernière minute : -30% pour combler l'agenda.", days: 3 },
];

const INTENTS: { key: Intent; label: string; icon: typeof Sun }[] = [
  { key: "saison", label: "Saison", icon: Sun },
  { key: "fidelite", label: "Fidélité", icon: Heart },
  { key: "parrainage", label: "Parrainage", icon: Users },
  { key: "flash", label: "Flash", icon: Zap },
];

// ── Helpers ───────────────────────────────────────────────────────────
function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysLeft(iso: string): number {
  const target = new Date(iso).getTime();
  const diff = target - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatExpiration(iso: string): string {
  const n = daysLeft(iso);
  if (n === 0) return "Expire aujourd'hui";
  if (n === 1) return "Expire demain";
  return `Expire dans ${n} jours`;
}

// ── Page ──────────────────────────────────────────────────────────────
export default function SettingsPromotionsPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [creating, setCreating] = useState(false);
  const [activeIntent, setActiveIntent] = useState<Intent>("saison");
  const [selectedTpl, setSelectedTpl] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; emoji: string; type: "percent" | "fixed"; value: string; desc: string; expiresAt: string }>(
    { name: "", emoji: "🎁", type: "percent", value: "", desc: "", expiresAt: addDaysISO(14) }
  );

  // Persist load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPromos(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // Persist save
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(promos));
    } catch { /* ignore */ }
  }, [promos]);

  const visibleTemplates = useMemo(
    () => TEMPLATES.filter((t) => t.intent === activeIntent),
    [activeIntent]
  );

  function pickTemplate(t: Template) {
    setSelectedTpl(t.id);
    setForm({
      name: t.name,
      emoji: t.emoji,
      type: t.type,
      value: t.value,
      desc: t.desc,
      expiresAt: addDaysISO(t.days),
    });
  }

  function resetCreation() {
    setCreating(false);
    setSelectedTpl(null);
    setForm({ name: "", emoji: "🎁", type: "percent", value: "", desc: "", expiresAt: addDaysISO(14) });
  }

  function activate() {
    if (!form.name.trim() || !form.value.trim() || !selectedTpl) return;
    const newPromo: Promo = { id: Date.now().toString(36), ...form };
    setPromos([newPromo, ...promos]);
    resetCreation();
  }

  function deactivate(id: string) {
    setPromos(promos.filter((p) => p.id !== id));
  }

  const canActivate = selectedTpl !== null && form.name.trim() && form.value.trim();

  return (
    <SettingsPage
      category="Outil marketing"
      title="Promotions"
      description="Lancez une offre en deux étapes : choisissez un modèle, personnalisez-le et activez-le."
    >
      {/* ═══ ACTIVE PROMOS ═══ */}
      <motion.div className="mb-5" {...staggerItem}>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Tag size={14} style={{ color: "#F59E0B" }} strokeWidth={2.6} />
          <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "#F59E0B" }}>
            Offres actives
          </p>
        </div>

        {promos.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-card-premium text-center">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center"
              style={{ backgroundColor: "var(--color-primary-soft)" }}>
              <Tag size={18} style={{ color: "var(--color-primary-deep)" }} />
            </div>
            <p className="text-[13px] font-bold text-foreground">Aucune offre active</p>
            <p className="text-[11px] text-muted mt-1 leading-relaxed">
              Créez une promo pour la faire apparaître ici avec son compte à rebours.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {promos.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-[20px] flex-shrink-0"
                  style={{ backgroundColor: "var(--color-primary-soft)" }}
                >
                  {p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-foreground truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[11px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary-deep)" }}
                    >
                      {p.type === "percent" ? `-${p.value}%` : `-${p.value} EUR`}
                    </span>
                    <span className="text-[10px] text-muted flex items-center gap-1">
                      <Clock size={10} /> {formatExpiration(p.expiresAt)}
                    </span>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => deactivate(p.id)}
                  className="px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5"
                  style={{ backgroundColor: "#FEE2E2", color: "#B91C1C" }}
                >
                  <Trash2 size={12} /> Désactiver
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ═══ CREATE CTA / INLINE CREATION ═══ */}
      <motion.div className="mb-3" {...staggerItem}>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sparkles size={14} style={{ color: "#F59E0B" }} strokeWidth={2.6} />
          <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "#F59E0B" }}>
            Créer une promo
          </p>
        </div>

        {!creating && (
          <PrimaryButton onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={2.6} /> Créer une nouvelle promo
          </PrimaryButton>
        )}

        <AnimatePresence mode="wait">
          {creating && (
            <motion.div
              key="creation"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-2xl p-5 shadow-card-premium">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-primary-deep)" }}>
                      Étape {selectedTpl ? "2" : "1"} sur 2
                    </p>
                    <h3 className="text-[15px] font-bold text-foreground">
                      {selectedTpl ? "Personnaliser et activer" : "Choisir un modèle"}
                    </h3>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={resetCreation}
                    className="w-8 h-8 rounded-lg bg-border-light flex items-center justify-center"
                  >
                    <X size={14} className="text-muted" />
                  </motion.button>
                </div>

                {/* Step 1 — Intent tabs + templates */}
                {!selectedTpl && (
                  <>
                    <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                      {INTENTS.map((i) => {
                        const active = activeIntent === i.key;
                        const Icon = i.icon;
                        return (
                          <motion.button
                            key={i.key}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveIntent(i.key)}
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
                            <Icon size={12} strokeWidth={2.6} /> {i.label}
                          </motion.button>
                        );
                      })}
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeIntent}
                        initial={tabContentVariants.initial}
                        animate={tabContentVariants.animate}
                        exit={tabContentVariants.exit}
                        transition={tabContentTransition}
                        className="grid grid-cols-2 gap-2.5"
                      >
                        {visibleTemplates.map((t) => (
                          <motion.button
                            key={t.id}
                            whileTap={{ scale: 0.97 }}
                            whileHover={{ y: -1 }}
                            onClick={() => pickTemplate(t)}
                            className="rounded-2xl p-3 text-left flex flex-col gap-1.5"
                            style={{
                              backgroundColor: "#FFFFFF",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px]"
                                style={{ backgroundColor: "var(--color-primary-soft)" }}
                              >
                                {t.emoji}
                              </div>
                              <span
                                className="text-[11px] font-bold px-1.5 py-0.5 rounded-md"
                                style={{ color: "var(--color-primary-deep)", backgroundColor: "var(--color-primary-soft)" }}
                              >
                                -{t.value}%
                              </span>
                            </div>
                            <p className="text-[12px] font-bold text-foreground leading-tight">{t.name}</p>
                            <p className="text-[10px] text-muted leading-snug line-clamp-2">{t.desc}</p>
                          </motion.button>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </>
                )}

                {/* Step 2 — Customize form */}
                {selectedTpl && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                        Titre
                      </label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                        Type de réduction
                      </label>
                      <div className="flex gap-2">
                        {(["percent", "fixed"] as const).map((k) => {
                          const on = form.type === k;
                          return (
                            <motion.button
                              key={k}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => setForm({ ...form, type: k })}
                              className="flex-1 py-2.5 rounded-xl text-[12px] font-bold"
                              style={{
                                backgroundColor: on ? "var(--color-primary)" : "#FFFFFF",
                                color: on ? "#FFFFFF" : "var(--color-muted)",
                                border: on ? "none" : "1px solid var(--color-border)",
                              }}
                            >
                              {k === "percent" ? "Pourcentage (%)" : "Montant (EUR)"}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                        Valeur
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={form.value}
                        onChange={(e) => setForm({ ...form, value: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                        Description
                      </label>
                      <textarea
                        value={form.desc}
                        onChange={(e) => setForm({ ...form, desc: e.target.value })}
                        rows={3}
                        className="input-field resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                        Expire le
                      </label>
                      <input
                        type="date"
                        value={form.expiresAt}
                        onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedTpl(null)}
                        className="flex-1 py-3.5 rounded-2xl text-[13px] font-bold"
                        style={{ backgroundColor: "#FFFFFF", border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
                      >
                        Retour
                      </motion.button>
                      <div className="flex-1">
                        <PrimaryButton onClick={activate} disabled={!canActivate}>
                          <Check size={15} strokeWidth={2.6} /> Activer
                        </PrimaryButton>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </SettingsPage>
  );
}
