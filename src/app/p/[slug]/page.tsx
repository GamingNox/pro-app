"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Share2, Calendar, Clock, ArrowRight, MapPin, Mail,
  Sparkles, MessageCircle, Check, Heart, Edit3, X, Send,
} from "lucide-react";

interface ProProfile {
  id: string;
  name: string;
  business: string;
  email?: string | null;
  description?: string | null;
  city?: string | null;
  address?: string | null;
}

interface PublicService {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string | null;
}

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  created_at: string;
}

function formatReviewDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "aujourd'hui";
  if (days < 7) return `il y a ${days} jour${days > 1 ? "s" : ""}`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} semaine${Math.floor(days / 7) > 1 ? "s" : ""}`;
  if (days < 365) return `il y a ${Math.floor(days / 30)} mois`;
  return `il y a ${Math.floor(days / 365)} an${Math.floor(days / 365) > 1 ? "s" : ""}`;
}

export default function PublicProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [profile, setProfile] = useState<ProProfile | null>(null);
  const [services, setServices] = useState<PublicService[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsAvg, setReviewsAvg] = useState(0);
  const [shared, setShared] = useState(false);

  // Review submission state — auto-open if ?review=1 in URL
  const [showReviewForm, setShowReviewForm] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("review") === "1";
  });

  // Scroll to the review form if deep-linked
  useEffect(() => {
    if (loading) return;
    if (!showReviewForm) return;
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("review") !== "1") return;
    const id = setTimeout(() => {
      const el = document.getElementById("reviews-section");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 450);
    return () => clearTimeout(id);
  }, [loading, showReviewForm]);
  const [rvName, setRvName] = useState("");
  const [rvEmail, setRvEmail] = useState("");
  const [rvRating, setRvRating] = useState(5);
  const [rvText, setRvText] = useState("");
  const [rvSubmitting, setRvSubmitting] = useState(false);
  const [rvError, setRvError] = useState<string | null>(null);
  const [rvSubmitted, setRvSubmitted] = useState(false);

  async function submitReview() {
    if (rvSubmitting) return;
    setRvError(null);
    if (rvName.trim().length < 2) {
      setRvError("Merci d'indiquer votre prénom (min. 2 caractères).");
      return;
    }
    if (rvText.trim().length < 10) {
      setRvError("Votre avis doit contenir au moins 10 caractères.");
      return;
    }
    setRvSubmitting(true);
    const { data, error: rpcErr } = await supabase.rpc("public_submit_review", {
      p_slug: slug,
      p_author_name: rvName.trim(),
      p_author_email: rvEmail.trim() || null,
      p_rating: rvRating,
      p_text: rvText.trim(),
    });
    setRvSubmitting(false);
    if (rpcErr || (data as { error?: string })?.error) {
      setRvError("Une erreur est survenue. Veuillez réessayer.");
      return;
    }
    setRvSubmitted(true);
    setRvName("");
    setRvEmail("");
    setRvRating(5);
    setRvText("");
  }

  useEffect(() => {
    async function load() {
      if (!slug) return;
      const { data: prof } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("booking_slug", slug)
        .single();

      if (!prof) {
        setError(true);
        setLoading(false);
        return;
      }

      setProfile({
        id: prof.id,
        name: prof.name,
        business: prof.business,
        email: prof.email ?? null,
        description: prof.description ?? prof.bio ?? null,
        city: prof.city ?? null,
        address: prof.address ?? null,
      });

      const { data: svcs } = await supabase
        .from("services")
        .select("id, name, duration, price, description")
        .eq("user_id", prof.id)
        .eq("active", true);
      setServices(svcs || []);

      // Reviews: fetch real published reviews via RPC
      try {
        const { data: rvData } = await supabase.rpc("public_get_reviews", { p_slug: slug });
        if (rvData) {
          const payload = rvData as { reviews: Review[]; count: number; average: number };
          setReviews(payload.reviews || []);
          setReviewsAvg(Number(payload.average) || 0);
        }
      } catch { /* ignore */ }

      // SEO: best-effort client-side title + meta description
      try {
        let seoTitle = `${prof.business || prof.name} — Réservation en ligne`;
        let seoDescription = `Réservez facilement en ligne avec ${prof.business || prof.name}. Consultez les services et disponibilités.`;
        const cfgRaw = localStorage.getItem("profile_visibility_config");
        if (cfgRaw) {
          const cfg = JSON.parse(cfgRaw);
          if (cfg.seoTitle) seoTitle = cfg.seoTitle;
          if (cfg.seoDescription) seoDescription = cfg.seoDescription;
        }
        document.title = seoTitle;
        let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement("meta");
          metaDesc.setAttribute("name", "description");
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute("content", seoDescription);
      } catch { /* ignore */ }

      setLoading(false);
    }
    load();
  }, [slug]);

  const displayName = profile?.business || profile?.name || "Professionnel";
  const subtitle = profile?.business && profile?.name ? profile.name : "Prestataire qualifié";
  const initial = (displayName[0] || "P").toUpperCase();

  const rating = reviewsAvg || (reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0);

  async function handleShare() {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const text = `Réservez avec ${displayName}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: displayName, text, url });
        return;
      } catch {
        /* user cancelled or failed — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      /* ignore */
    }
  }

  // ── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--color-background)]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full border-[3px] border-[var(--color-border)] border-t-[var(--color-primary)]"
        />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────
  if (error || !profile) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6 bg-[var(--color-background)]">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: "var(--color-primary-soft)" }}>
            <Sparkles size={26} className="text-[var(--color-primary)]" />
          </div>
          <h1 className="text-[22px] font-bold text-[var(--color-foreground)] mb-2">Profil introuvable</h1>
          <p className="text-[13px] text-[var(--color-muted)] leading-relaxed mb-6">
            Ce lien n&apos;existe pas ou n&apos;est plus actif. Vérifiez l&apos;adresse ou revenez à l&apos;accueil.
          </p>
          <a
            href="https://clientbase.fr"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white text-[13px] font-bold"
            style={{ background: "var(--color-primary)" }}
          >
            Retour à clientbase.fr
          </a>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-[var(--color-background)] overflow-y-auto">
      <div className="max-w-[600px] mx-auto pb-16">
        {/* ── Cover Hero ───────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden text-white px-6 pt-14 pb-20"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary, #5B4FE9) 0%, var(--color-primary-deep, #3B30B5) 100%)",
          }}
        >
          {/* decorative blobs */}
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute right-10 bottom-6 w-16 h-16 rounded-full bg-white/5" />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.45 }}
            className="relative z-10 flex flex-col items-center text-center"
          >
            {/* Avatar */}
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-4 text-[42px] font-bold shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
              style={{
                background: "rgba(255,255,255,0.95)",
                color: "var(--color-primary-deep, #3B30B5)",
              }}
            >
              {initial}
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.4 }}
              className="text-[28px] font-bold leading-tight tracking-tight"
            >
              {displayName}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.4 }}
              className="text-[13px] text-white/85 mt-1.5 font-medium"
            >
              {subtitle}
            </motion.p>

            {profile.city || profile.address ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.22, duration: 0.4 }}
                className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-white/85"
              >
                <MapPin size={12} />
                <span>{profile.city || profile.address}</span>
              </motion.div>
            ) : null}

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.4 }}
              className="mt-4 flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5"
            >
              <Star size={13} className="text-[#FFD84D] fill-[#FFD84D]" />
              <span className="text-[13px] font-bold">
                {rating > 0 ? rating.toFixed(1) : "—"}
              </span>
              <span className="text-[12px] text-white/80">
                ({reviews.length} avis)
              </span>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* ── Sticky action bar ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="sticky top-0 z-30 -mt-10 mx-4"
        >
          <div
            className="bg-white rounded-2xl p-2.5 flex items-center gap-2"
            style={{ boxShadow: "0 10px 30px rgba(17,17,27,0.12), 0 2px 6px rgba(17,17,27,0.06)" }}
          >
            <Link
              href={`/book/${slug}`}
              className="flex-1 rounded-xl py-3 text-white text-[13px] font-bold flex items-center justify-center gap-1.5"
              style={{
                background: "linear-gradient(135deg, var(--color-primary, #5B4FE9), var(--color-primary-deep, #3B30B5))",
              }}
            >
              <Calendar size={14} strokeWidth={2.6} />
              Réserver maintenant
            </Link>
            <button
              onClick={handleShare}
              aria-label="Partager"
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "var(--color-primary-soft, #EEF0FF)",
                color: "var(--color-primary, #5B4FE9)",
              }}
            >
              <AnimatePresence mode="wait">
                {shared ? (
                  <motion.div
                    key="ok"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                  >
                    <Check size={16} strokeWidth={3} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="share"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                  >
                    <Share2 size={16} strokeWidth={2.5} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.div>

        {/* ── Body sections ────────────────────────────────── */}
        <div className="px-4 pt-6 space-y-5">
          {/* About */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="bg-white rounded-2xl p-5 shadow-card-premium"
          >
            <div className="flex items-center gap-2 mb-2">
              <Heart size={14} className="text-[var(--color-primary)]" />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                À propos
              </h2>
            </div>
            <p className="text-[13px] text-[var(--color-foreground)] leading-relaxed">
              {profile.description ||
                "Professionnel passionné par son métier, dédié à la qualité et à la satisfaction de ses clients."}
            </p>
          </motion.section>

          {/* Services */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                Prestations
              </h2>
              <span className="text-[11px] text-[var(--color-subtle)] font-medium">
                {services.length} {services.length > 1 ? "services" : "service"}
              </span>
            </div>

            {services.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center shadow-card-premium">
                <p className="text-[13px] text-[var(--color-muted)]">
                  Aucune prestation disponible pour le moment.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {services.map((svc, i) => (
                  <motion.div
                    key={svc.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.42 + i * 0.04, duration: 0.35 }}
                  >
                    <Link
                      href={`/book/${slug}?service=${svc.id}`}
                      className="bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3 active:scale-[0.99] transition-transform"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-[var(--color-foreground)] leading-tight truncate">
                          {svc.name}
                        </p>
                        {svc.description ? (
                          <p className="text-[11.5px] text-[var(--color-muted)] mt-1 line-clamp-2 leading-relaxed">
                            {svc.description}
                          </p>
                        ) : null}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-muted)] font-medium">
                            <Clock size={11} />
                            {svc.duration} min
                          </span>
                          <span
                            className="text-[13px] font-bold"
                            style={{ color: "var(--color-primary)" }}
                          >
                            {svc.price.toLocaleString("fr-FR")} €
                          </span>
                        </div>
                      </div>
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "var(--color-primary-soft, #EEF0FF)",
                          color: "var(--color-primary, #5B4FE9)",
                        }}
                      >
                        <ArrowRight size={15} strokeWidth={2.6} />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>

          {/* Reviews */}
          <motion.section
            id="reviews-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="scroll-mt-4"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                Avis clients ({reviews.length})
              </h2>
              <div className="flex items-center gap-3">
                {reviews.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-[#F5B400] fill-[#F5B400]" />
                    <span className="text-[11px] font-bold text-[var(--color-foreground)]">
                      {rating > 0 ? rating.toFixed(1) : "—"}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setShowReviewForm((v) => !v)}
                  className="text-[11px] font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-lg"
                  style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary-deep)" }}
                >
                  {showReviewForm ? <X size={11} /> : <Edit3 size={11} />}
                  {showReviewForm ? "Fermer" : "Laisser un avis"}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showReviewForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden mb-3"
                >
                  <div className="bg-white rounded-2xl p-5 shadow-card-premium">
                    {rvSubmitted ? (
                      <div className="text-center py-3">
                        <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                          style={{ background: "var(--color-primary-soft)" }}>
                          <Check size={22} className="text-[var(--color-primary)]" strokeWidth={3} />
                        </div>
                        <p className="text-[14px] font-bold text-foreground">Merci pour votre avis !</p>
                        <p className="text-[11px] text-muted mt-1 leading-relaxed">
                          Il apparaîtra sur la page après validation par {displayName}.
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-[13px] font-bold text-foreground mb-3">Partagez votre expérience</p>

                        {/* Rating stars */}
                        <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-2">Note</p>
                        <div className="flex gap-1.5 mb-4">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setRvRating(n)}
                              className="transition-transform active:scale-90"
                            >
                              <Star
                                size={28}
                                className={n <= rvRating ? "text-[#F5B400] fill-[#F5B400]" : "text-[var(--color-border)]"}
                                strokeWidth={2}
                              />
                            </button>
                          ))}
                        </div>

                        {/* Name */}
                        <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5">Votre prénom</p>
                        <input
                          value={rvName}
                          onChange={(e) => setRvName(e.target.value)}
                          placeholder="Marie"
                          maxLength={80}
                          className="input-field mb-3"
                        />

                        {/* Email (optional) */}
                        <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5">
                          Email (optionnel)
                        </p>
                        <input
                          value={rvEmail}
                          onChange={(e) => setRvEmail(e.target.value)}
                          type="email"
                          placeholder="marie@email.com"
                          className="input-field mb-3"
                        />

                        {/* Text */}
                        <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5">Votre avis</p>
                        <textarea
                          value={rvText}
                          onChange={(e) => setRvText(e.target.value)}
                          placeholder="Partagez votre expérience en quelques mots..."
                          rows={4}
                          maxLength={1000}
                          className="input-field resize-none mb-2"
                        />
                        <p className="text-[10px] text-muted mb-3">
                          {rvText.length} / 1000 caractères — minimum 10
                        </p>

                        {rvError && (
                          <div className="rounded-xl px-3 py-2 mb-3"
                            style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5" }}>
                            <p className="text-[11px] font-semibold" style={{ color: "#B91C1C" }}>{rvError}</p>
                          </div>
                        )}

                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={submitReview}
                          disabled={rvSubmitting}
                          className="w-full text-white py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                          style={{
                            background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
                            boxShadow: "0 10px 24px color-mix(in srgb, var(--color-primary) 30%, transparent)",
                          }}
                        >
                          <Send size={13} strokeWidth={2.6} />
                          {rvSubmitting ? "Envoi en cours..." : "Publier mon avis"}
                        </motion.button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {reviews.length === 0 && !showReviewForm && (
              <div className="bg-white rounded-2xl p-6 shadow-card-premium text-center mb-3">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "var(--color-primary-soft)" }}>
                  <Star size={22} className="text-[var(--color-primary)]" />
                </div>
                <p className="text-[13px] font-bold text-foreground">Aucun avis pour le moment</p>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">Soyez le premier à partager votre expérience !</p>
              </div>
            )}

            <div className="space-y-2.5">
              {reviews.slice(0, 5).map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.52 + i * 0.04, duration: 0.35 }}
                  className="bg-white rounded-2xl p-4 shadow-card-premium"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                        style={{
                          background: "var(--color-primary-soft, #EEF0FF)",
                          color: "var(--color-primary-deep, #3B30B5)",
                        }}
                      >
                        {r.author[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-bold text-[var(--color-foreground)] truncate">
                          {r.author}
                        </p>
                        <p className="text-[10.5px] text-[var(--color-subtle)]">{formatReviewDate(r.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          size={11}
                          className={
                            idx < r.rating
                              ? "text-[#F5B400] fill-[#F5B400]"
                              : "text-[var(--color-border)]"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[12.5px] text-[var(--color-foreground)] leading-relaxed">
                    {r.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Contact / info footer card */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="rounded-2xl p-5 text-white relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary, #5B4FE9) 0%, var(--color-primary-deep, #3B30B5) 100%)",
            }}
          >
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle size={13} className="text-white/85" />
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/85">
                  Contact
                </p>
              </div>
              <h3 className="text-[17px] font-bold tracking-tight">Prêt(e) à réserver ?</h3>
              <p className="text-[12px] text-white/85 mt-1 leading-relaxed">
                Réservez en ligne en quelques secondes, confirmation instantanée.
              </p>

              {profile.email ? (
                <div className="mt-3 flex items-center gap-2 text-[12px] text-white/90">
                  <Mail size={12} />
                  <span className="truncate">{profile.email}</span>
                </div>
              ) : null}

              <Link
                href={`/book/${slug}`}
                className="mt-4 w-full bg-white rounded-xl py-3 text-[13px] font-bold flex items-center justify-center gap-1.5"
                style={{ color: "var(--color-primary-deep, #3B30B5)" }}
              >
                <Calendar size={13} strokeWidth={2.6} />
                Réserver maintenant
              </Link>
            </div>
          </motion.section>

          {/* Page footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="pt-6 pb-2 text-center"
          >
            <p className="text-[11px] text-[var(--color-subtle)]">
              Propulsé par{" "}
              <Link
                href="/"
                className="font-bold"
                style={{ color: "var(--color-primary, #5B4FE9)" }}
              >
                Clientbase
              </Link>
            </p>
          </motion.footer>
        </div>
      </div>
    </div>
  );
}
