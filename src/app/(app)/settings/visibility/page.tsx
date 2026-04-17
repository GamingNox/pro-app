"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, Star, Camera, FileText, Globe, Copy, Check, ExternalLink, Share2, Info,
  Edit3, Megaphone, Sparkles, Search, Type, AlignLeft, Tag, Link2,
} from "lucide-react";
import SettingsPage, { SettingsSection, SettingsRow, SettingsToggle, PrimaryButton } from "@/components/SettingsPage";
import { useUserSettings } from "@/lib/user-settings";

interface VisibilityConfig {
  tagline: string;
  bio: string;
  showReviews: boolean;
  showStats: boolean;
  showEmail: boolean;
  showPhone: boolean;
  allowGuestBooking: boolean;
  highlightNewService: boolean;
  featuredBadge: "" | "new" | "promo" | "closing" | "top";
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  customSlug: string;
}

const DEFAULT_CONFIG: VisibilityConfig = {
  tagline: "",
  bio: "",
  showReviews: true,
  showStats: false,
  showEmail: false,
  showPhone: true,
  allowGuestBooking: true,
  highlightNewService: false,
  featuredBadge: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  customSlug: "",
};

function sanitizeSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
}

const BADGE_OPTIONS: { key: VisibilityConfig["featuredBadge"]; label: string; emoji: string }[] = [
  { key: "", label: "Aucun", emoji: "—" },
  { key: "new", label: "Nouveau", emoji: "✨" },
  { key: "promo", label: "Promo", emoji: "🔥" },
  { key: "top", label: "Populaire", emoji: "⭐" },
  { key: "closing", label: "Fermeture", emoji: "⏰" },
];

export default function SettingsVisibilityPage() {
  const { user, appointments, clients } = useApp();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [config, setConfigRaw] = useUserSettings<VisibilityConfig>("visibility_config", DEFAULT_CONFIG);
  const setConfig = (next: VisibilityConfig | ((prev: VisibilityConfig) => VisibilityConfig)) => {
    const val = typeof next === "function" ? (next as (p: VisibilityConfig) => VisibilityConfig)(config) : next;
    setConfigRaw({ ...DEFAULT_CONFIG, ...val });
  };
  const [editingTagline, setEditingTagline] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [editingSeoTitle, setEditingSeoTitle] = useState(false);
  const [editingSeoDesc, setEditingSeoDesc] = useState(false);
  const [editingSeoKeywords, setEditingSeoKeywords] = useState(false);
  const [editingSlug, setEditingSlug] = useState(false);
  const [draftSeoTitle, setDraftSeoTitle] = useState("");
  const [draftSeoDesc, setDraftSeoDesc] = useState("");
  const [draftSeoKeywords, setDraftSeoKeywords] = useState("");
  const [draftSlug, setDraftSlug] = useState("");

  function save(patch: Partial<VisibilityConfig>) {
    setConfigRaw({ ...config, ...patch });
  }

  function flashSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const publicUrl = useMemo(() => {
    const slug =
      config.customSlug ||
      user.bookingSlug ||
      user.name?.replace(/\s/g, "").toLowerCase() ||
      "pro";
    return `https://clientbase.fr/p/${slug}`;
  }, [config.customSlug, user.bookingSlug, user.name]);

  const totalBookings = appointments.filter((a) => a.status !== "canceled").length;
  const completedBookings = appointments.filter((a) => a.status === "done").length;

  function copyLink() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareLink() {
    const text = `Prenez rendez-vous avec ${user.name || user.business || "moi"} : ${publicUrl}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: user.business || user.name || "Réservation", text, url: publicUrl });
      } catch {
        copyLink();
      }
    } else {
      copyLink();
    }
  }

  function openLink() {
    window.open(publicUrl, "_blank");
  }

  // Completion score — rewards filling out visibility fields
  const completion = useMemo(() => {
    let score = 0;
    if (config.tagline.trim()) score += 20;
    if (config.bio.trim().length >= 40) score += 25;
    if (config.showReviews) score += 15;
    if (config.allowGuestBooking) score += 15;
    if (config.featuredBadge) score += 10;
    if (user.business) score += 15;
    return Math.min(100, score);
  }, [config, user.business]);

  return (
    <SettingsPage
      category="Profil public"
      title="Votre page publique"
      description="Configurez ce que vos visiteurs voient — tagline, bio, statistiques, mode de réservation, et plus."
    >
      {/* ── Hero — shareable link ── */}
      <div
        className="rounded-[22px] p-5 mb-5 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
          boxShadow: "0 14px 36px color-mix(in srgb, var(--color-primary) 35%, transparent)",
        }}
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-4 -bottom-12 w-28 h-28 rounded-full bg-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/85">Votre lien public</p>
          </div>
          <h2 className="text-[20px] font-bold tracking-tight leading-tight">{user.business || user.name || "Votre profil"}</h2>
          <p className="text-[12px] text-white/85 mt-1.5 leading-relaxed">
            Partagez ce lien partout — réseaux sociaux, signature email, QR code, flyer.
          </p>

          <div className="mt-4 bg-white/15 backdrop-blur-sm rounded-xl p-3 flex items-center gap-2">
            <Globe size={14} className="text-white/80 flex-shrink-0" />
            <p className="flex-1 text-[12px] font-semibold truncate">{publicUrl}</p>
          </div>

          {/* Primary CTA: explicit "Ouvrir la page publique" */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={openLink}
            className="w-full mt-4 bg-white rounded-xl py-3 text-[13px] font-bold flex items-center justify-center gap-2"
            style={{ color: "var(--color-primary-deep)" }}>
            <ExternalLink size={14} strokeWidth={2.6} /> Ouvrir ma page publique
          </motion.button>

          {/* Secondary actions */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <motion.button whileTap={{ scale: 0.97 }} onClick={shareLink}
              className="bg-white/15 backdrop-blur-sm rounded-xl py-2.5 text-[11px] font-bold text-white flex items-center justify-center gap-1.5 border border-white/20">
              <Share2 size={12} strokeWidth={2.5} /> Partager le lien
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={copyLink}
              className="bg-white/15 backdrop-blur-sm rounded-xl py-2.5 text-[11px] font-bold text-white flex items-center justify-center gap-1.5 border border-white/20">
              {copied ? <Check size={12} strokeWidth={2.8} /> : <Copy size={12} strokeWidth={2.5} />}
              {copied ? "Copié !" : "Copier le lien"}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Completion bar ── */}
      <div className="bg-white rounded-2xl p-4 shadow-card-premium mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] text-muted font-bold uppercase tracking-wider">Profil complété</p>
          <p className="text-[16px] font-bold" style={{ color: "#5B4FE9" }}>{completion}%</p>
        </div>
        <div className="h-2 bg-border-light rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #5B4FE9, #8B5CF6)" }}
            initial={{ width: 0 }}
            animate={{ width: `${completion}%` }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
        <p className="text-[10px] text-muted mt-2">
          {completion < 50
            ? "Complétez votre profil pour attirer plus de clients."
            : completion < 100
              ? "Presque parfait — activez les derniers réglages pour atteindre 100%."
              : "Parfait — votre profil est 100% optimisé."}
        </p>
      </div>

      {/* ── Editable identity ── */}
      <SettingsSection title="Identité publique" description="Ce que vos visiteurs voient en premier.">
        {/* Tagline */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider">Tagline / Slogan</label>
            {!editingTagline && (
              <button onClick={() => setEditingTagline(true)} className="text-[10px] font-bold flex items-center gap-1" style={{ color: "#5B4FE9" }}>
                <Edit3 size={10} strokeWidth={2.8} /> Modifier
              </button>
            )}
          </div>
          <AnimatePresence mode="wait">
            {editingTagline ? (
              <motion.div
                key="edit-tag"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
              >
                <input
                  value={config.tagline}
                  onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                  placeholder="Ex : Coaching sur mesure, résultats garantis"
                  className="input-field mb-2"
                  maxLength={80}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      save({ tagline: config.tagline });
                      setEditingTagline(false);
                      flashSave();
                    }}
                    className="flex-1 py-2 rounded-xl text-[11px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)" }}
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setEditingTagline(false)}
                    className="flex-1 py-2 rounded-xl text-[11px] font-bold text-muted bg-border-light"
                  >
                    Annuler
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="view-tag"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[13px] text-foreground bg-border-light rounded-xl px-3.5 py-3"
              >
                {config.tagline || <span className="text-subtle italic">Aucun slogan — tapez Modifier pour en ajouter un.</span>}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Bio */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider">Bio / À propos</label>
            {!editingBio && (
              <button onClick={() => setEditingBio(true)} className="text-[10px] font-bold flex items-center gap-1" style={{ color: "#5B4FE9" }}>
                <Edit3 size={10} strokeWidth={2.8} /> Modifier
              </button>
            )}
          </div>
          <AnimatePresence mode="wait">
            {editingBio ? (
              <motion.div
                key="edit-bio"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
              >
                <textarea
                  value={config.bio}
                  onChange={(e) => setConfig({ ...config, bio: e.target.value })}
                  placeholder="Présentez votre activité en quelques phrases. Parlez de votre expérience, vos spécialités, ce qui vous rend unique."
                  className="input-field resize-none mb-2"
                  rows={5}
                  maxLength={320}
                  autoFocus
                />
                <p className="text-[10px] text-muted mb-2">{config.bio.length} / 320 caractères</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      save({ bio: config.bio });
                      setEditingBio(false);
                      flashSave();
                    }}
                    className="flex-1 py-2 rounded-xl text-[11px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)" }}
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setEditingBio(false)}
                    className="flex-1 py-2 rounded-xl text-[11px] font-bold text-muted bg-border-light"
                  >
                    Annuler
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="view-bio"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[13px] text-foreground bg-border-light rounded-xl px-3.5 py-3 leading-relaxed"
              >
                {config.bio || <span className="text-subtle italic">Aucune bio — tapez Modifier pour présenter votre activité.</span>}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </SettingsSection>

      {/* ── Google search visibility (was: SEO) ── */}
      <SettingsSection
        title="Être trouvé sur Google"
        description="Ces infos s'affichent quand quelqu'un vous cherche sur Internet."
      >
        {/* Titre de la page */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider flex items-center gap-1">
              <Type size={10} strokeWidth={2.8} /> Votre titre sur Google
            </label>
            {!editingSeoTitle && (
              <button
                onClick={() => {
                  setDraftSeoTitle(config.seoTitle);
                  setEditingSeoTitle(true);
                }}
                className="text-[10px] font-bold flex items-center gap-1"
                style={{ color: "var(--color-primary)" }}
              >
                <Edit3 size={10} strokeWidth={2.8} /> Modifier
              </button>
            )}
          </div>
          <AnimatePresence mode="wait">
            {editingSeoTitle ? (
              <motion.div key="edit-seo-title" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}>
                <input
                  value={draftSeoTitle}
                  onChange={(e) => setDraftSeoTitle(e.target.value)}
                  placeholder="Ex : Coiffeur à Paris — Salon Harmonie"
                  className="input-field mb-1.5"
                  maxLength={60}
                  autoFocus
                />
                <p className="text-[10px] text-muted mb-2">{draftSeoTitle.length} / 60 caractères</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      save({ seoTitle: draftSeoTitle });
                      setEditingSeoTitle(false);
                      flashSave();
                    }}
                    className="flex-1 py-2 rounded-xl text-[11px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))" }}
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setEditingSeoTitle(false)}
                    className="flex-1 py-2 rounded-xl text-[11px] font-bold text-muted bg-border-light"
                  >
                    Annuler
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="view-seo-title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[13px] text-foreground bg-border-light rounded-xl px-3.5 py-3"
              >
                {config.seoTitle || (
                  <span className="text-subtle italic">Aucun titre — par défaut, votre nom s&apos;affichera.</span>
                )}
              </motion.p>
            )}
          </AnimatePresence>
          <p className="text-[10.5px] text-muted mt-1.5 leading-relaxed">
            C&apos;est le gros titre bleu que les gens voient quand ils vous cherchent. Soyez simple et clair.
          </p>
        </div>

        {/* Description courte */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider flex items-center gap-1">
              <AlignLeft size={10} strokeWidth={2.8} /> Phrase d&apos;accroche sous le titre
            </label>
            {!editingSeoDesc && (
              <button
                onClick={() => {
                  setDraftSeoDesc(config.seoDescription);
                  setEditingSeoDesc(true);
                }}
                className="text-[10px] font-bold flex items-center gap-1"
                style={{ color: "var(--color-primary)" }}
              >
                <Edit3 size={10} strokeWidth={2.8} /> Modifier
              </button>
            )}
          </div>
          <AnimatePresence mode="wait">
            {editingSeoDesc ? (
              <motion.div key="edit-seo-desc" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}>
                <textarea
                  value={draftSeoDesc}
                  onChange={(e) => setDraftSeoDesc(e.target.value)}
                  placeholder="Ex : Réservez votre coupe en ligne chez Salon Harmonie, votre coiffeur de quartier à Paris."
                  className="input-field resize-none mb-1.5"
                  rows={2}
                  maxLength={160}
                  autoFocus
                />
                <p className="text-[10px] text-muted mb-2">{draftSeoDesc.length} / 160 caractères</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      save({ seoDescription: draftSeoDesc });
                      setEditingSeoDesc(false);
                      flashSave();
                    }}
                    className="flex-1 py-2 rounded-xl text-[11px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))" }}
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setEditingSeoDesc(false)}
                    className="flex-1 py-2 rounded-xl text-[11px] font-bold text-muted bg-border-light"
                  >
                    Annuler
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="view-seo-desc"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[13px] text-foreground bg-border-light rounded-xl px-3.5 py-3 leading-relaxed"
              >
                {config.seoDescription || (
                  <span className="text-subtle italic">Aucune description — ajoutez-en une pour améliorer votre visibilité.</span>
                )}
              </motion.p>
            )}
          </AnimatePresence>
          <p className="text-[10.5px] text-muted mt-1.5 leading-relaxed">
            La petite phrase sous le titre qui donne envie de cliquer. Pensez à ce qui distingue votre offre.
          </p>
        </div>

        {/* Mots-clés */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider flex items-center gap-1">
              <Tag size={10} strokeWidth={2.8} /> Comment on vous cherche
            </label>
            {!editingSeoKeywords && (
              <button
                onClick={() => {
                  setDraftSeoKeywords(config.seoKeywords);
                  setEditingSeoKeywords(true);
                }}
                className="text-[10px] font-bold flex items-center gap-1"
                style={{ color: "var(--color-primary)" }}
              >
                <Edit3 size={10} strokeWidth={2.8} /> Modifier
              </button>
            )}
          </div>
          <AnimatePresence mode="wait">
            {editingSeoKeywords ? (
              <motion.div key="edit-seo-kw" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}>
                <input
                  value={draftSeoKeywords}
                  onChange={(e) => setDraftSeoKeywords(e.target.value)}
                  placeholder="Ex : coiffeur, paris, coupe"
                  className="input-field mb-2"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      save({ seoKeywords: draftSeoKeywords });
                      setEditingSeoKeywords(false);
                      flashSave();
                    }}
                    className="flex-1 py-2 rounded-xl text-[11px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))" }}
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setEditingSeoKeywords(false)}
                    className="flex-1 py-2 rounded-xl text-[11px] font-bold text-muted bg-border-light"
                  >
                    Annuler
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="view-seo-kw"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[13px] text-foreground bg-border-light rounded-xl px-3.5 py-3"
              >
                {config.seoKeywords || (
                  <span className="text-subtle italic">Aucun mot-clé.</span>
                )}
              </motion.p>
            )}
          </AnimatePresence>
          <p className="text-[10.5px] text-muted mt-1.5 leading-relaxed">
            Les mots que vos clients tapent dans Google. Séparez-les par des virgules. Ex : coiffeur, paris, coupe.
          </p>
        </div>

        {/* Slug personnalisé */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider flex items-center gap-1">
              <Link2 size={10} strokeWidth={2.8} /> Votre adresse personnalisée
            </label>
            {!editingSlug && (
              <button
                onClick={() => {
                  setDraftSlug(config.customSlug);
                  setEditingSlug(true);
                }}
                className="text-[10px] font-bold flex items-center gap-1"
                style={{ color: "var(--color-primary)" }}
              >
                <Edit3 size={10} strokeWidth={2.8} /> Modifier
              </button>
            )}
          </div>
          <AnimatePresence mode="wait">
            {editingSlug ? (
              <motion.div key="edit-slug" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}>
                <div className="flex items-stretch rounded-xl overflow-hidden mb-2 border border-border-light">
                  <span className="px-3 flex items-center text-[12px] font-semibold text-muted bg-border-light">
                    clientbase.fr/p/
                  </span>
                  <input
                    value={draftSlug}
                    onChange={(e) => setDraftSlug(sanitizeSlug(e.target.value))}
                    placeholder="mon-salon"
                    className="flex-1 px-3 py-2.5 text-[13px] text-foreground bg-white outline-none"
                    autoFocus
                  />
                </div>
                <div className="bg-border-light rounded-xl px-3 py-2 mb-2 flex items-center gap-2">
                  <Globe size={11} className="text-muted flex-shrink-0" />
                  <p className="text-[11px] font-semibold text-foreground truncate">
                    https://clientbase.fr/p/{draftSlug || "…"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      save({ customSlug: draftSlug });
                      setEditingSlug(false);
                      flashSave();
                    }}
                    className="flex-1 py-2 rounded-xl text-[11px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))" }}
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setEditingSlug(false)}
                    className="flex-1 py-2 rounded-xl text-[11px] font-bold text-muted bg-border-light"
                  >
                    Annuler
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="view-slug"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-border-light rounded-xl px-3.5 py-3 flex items-center gap-2"
              >
                <Globe size={12} className="text-muted flex-shrink-0" />
                <p className="text-[13px] font-semibold text-foreground truncate">
                  clientbase.fr/p/{config.customSlug || user.bookingSlug || "pro"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="text-[10.5px] text-muted mt-1.5 leading-relaxed">
            L&apos;adresse de votre page publique. Plus c&apos;est court et mémorisable, mieux c&apos;est. Uniquement des lettres, chiffres et tirets.
          </p>
        </div>

        <div
          className="mt-4 rounded-xl p-3.5 flex items-start gap-2.5"
          style={{ backgroundColor: "var(--color-primary-soft)" }}
        >
          <Search size={13} style={{ color: "var(--color-primary)" }} className="mt-0.5 flex-shrink-0" strokeWidth={2.4} />
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-primary-deep)" }}>
            <strong>À quoi ça sert&nbsp;?</strong> Ces 4 infos s&apos;affichent sur Google et quand quelqu&apos;un partage votre lien sur WhatsApp ou les réseaux sociaux.
          </p>
        </div>
      </SettingsSection>

      {/* ── Visibility toggles ── */}
      <SettingsSection title="Affichage public" description="Contrôlez ce qui apparaît sur votre page publique.">
        <SettingsRow label="Afficher les avis clients" hint="Vos avis vérifiés apparaissent sur la page.">
          <SettingsToggle on={config.showReviews} onToggle={() => { save({ showReviews: !config.showReviews }); flashSave(); }} />
        </SettingsRow>
        <SettingsRow label="Afficher les statistiques" hint="Nombre de réservations, clients fidèles, etc.">
          <SettingsToggle on={config.showStats} onToggle={() => { save({ showStats: !config.showStats }); flashSave(); }} />
        </SettingsRow>
        <SettingsRow label="Afficher mon email" hint="Visible publiquement — laissez désactivé si non souhaité.">
          <SettingsToggle on={config.showEmail} onToggle={() => { save({ showEmail: !config.showEmail }); flashSave(); }} />
        </SettingsRow>
        <SettingsRow label="Afficher mon téléphone" hint="Utile pour les clients qui préfèrent appeler.">
          <SettingsToggle on={config.showPhone} onToggle={() => { save({ showPhone: !config.showPhone }); flashSave(); }} />
        </SettingsRow>
        <SettingsRow label="Réservation sans compte" hint="Les visiteurs peuvent réserver sans créer de compte." last>
          <SettingsToggle on={config.allowGuestBooking} onToggle={() => { save({ allowGuestBooking: !config.allowGuestBooking }); flashSave(); }} />
        </SettingsRow>
      </SettingsSection>

      {/* ── Featured badge ── */}
      {/* ── Mettre une promotion en avant ── */}
      <SettingsSection title="Promotion en avant" description="Affichez votre dernière promotion en haut de votre page publique.">
        <SettingsRow
          label="Mettre en avant mon dernier service"
          hint="Le dernier service que vous avez créé apparaîtra en premier aux visiteurs."
          last
        >
          <SettingsToggle on={config.highlightNewService} onToggle={() => { save({ highlightNewService: !config.highlightNewService }); flashSave(); }} />
        </SettingsRow>
      </SettingsSection>

      {/* ── Live stats KPI ── */}
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted mb-2.5 px-1">Statistiques en direct</p>
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <div className="bg-white rounded-2xl p-4 shadow-card-premium text-center">
          <Globe size={14} className="text-accent mx-auto mb-1.5" />
          <p className="text-[20px] font-bold text-foreground leading-none">{totalBookings}</p>
          <p className="text-[9px] text-muted mt-1 uppercase tracking-wider">Réservations</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card-premium text-center">
          <Eye size={14} className="text-accent mx-auto mb-1.5" />
          <p className="text-[20px] font-bold text-foreground leading-none">{clients.length}</p>
          <p className="text-[9px] text-muted mt-1 uppercase tracking-wider">Clients</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card-premium text-center">
          <Star size={14} className="text-accent mx-auto mb-1.5" />
          <p className="text-[20px] font-bold text-foreground leading-none">{completedBookings}</p>
          <p className="text-[9px] text-muted mt-1 uppercase tracking-wider">Terminés</p>
        </div>
      </div>

      {/* ── Reviews moderation shortcut ── */}
      <a href="/settings/reviews" className="block mb-5">
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3.5"
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--color-primary-soft)" }}
          >
            <Star size={18} style={{ color: "var(--color-primary)" }} strokeWidth={2.4} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-foreground">Modérer les avis</p>
            <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
              Validez, masquez ou supprimez les avis laissés sur votre page publique.
            </p>
          </div>
          <ExternalLink size={15} className="text-subtle flex-shrink-0" strokeWidth={2.4} />
        </motion.div>
      </a>

      {/* ── QR code + business card shortcut ── */}
      <a href="/settings/qr-code" className="block mb-5">
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3.5"
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--color-primary-soft)" }}
          >
            <Tag size={18} style={{ color: "var(--color-primary)" }} strokeWidth={2.4} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-foreground">QR code & cartes de visite</p>
            <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
              Générez un QR code qui pointe vers votre page publique et imprimez vos cartes.
            </p>
          </div>
          <ExternalLink size={15} className="text-subtle flex-shrink-0" strokeWidth={2.4} />
        </motion.div>
      </a>

      {/* ── Optimisation tips ── */}
      <SettingsSection title="Améliorer votre visibilité">
        <div className="space-y-3">
          {[
            { icon: Camera, title: "Ajoutez des photos", desc: "Les profils avec photos obtiennent +20% de clics." },
            { icon: FileText, title: "Complétez votre bio", desc: "Une description claire améliore votre référencement." },
            { icon: Star, title: "Sollicitez des avis", desc: "Les avis renforcent la confiance des nouveaux clients." },
          ].map((tip) => {
            const Icon = tip.icon;
            return (
              <div key={tip.title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-accent" strokeWidth={2.4} />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-foreground leading-tight">{tip.title}</p>
                  <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </SettingsSection>

      {/* ── How to share ── */}
      <div className="bg-accent-soft rounded-2xl p-4 mb-4">
        <div className="flex items-start gap-2.5">
          <Info size={14} className="text-accent mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[12px] font-bold text-foreground">Où partager votre lien</p>
            <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
              Signature email, bio Instagram, WhatsApp, QR code sur votre carte de visite, Google My Business, flyer papier…
              Partout où vos clients potentiels peuvent le scanner ou le cliquer.
            </p>
          </div>
        </div>
      </div>

      {/* ── Save feedback ── */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 z-50"
            style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)", boxShadow: "0 12px 28px rgba(91,79,233,0.35)" }}
          >
            <Check size={16} strokeWidth={2.8} /> <span className="text-[13px] font-bold">Enregistré</span>
          </motion.div>
        )}
      </AnimatePresence>

      <PrimaryButton onClick={() => { flashSave(); openLink(); }}>
        <Sparkles size={14} strokeWidth={2.6} /> Aperçu de ma page publique
      </PrimaryButton>
    </SettingsPage>
  );
}
