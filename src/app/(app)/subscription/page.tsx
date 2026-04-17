"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Check, X, Crown, Zap, Shield, Sparkles,
  TrendingUp, CheckCircle2, Gift, Star,
} from "lucide-react";
import { PLAN_NAMES, PLAN_PRICES, type PlanTier } from "@/lib/types";
import { redeemGiftCode } from "@/lib/giftCodes";

// ── Plan definitions ────────────────────────────────────
const PLANS: {
  id: PlanTier;
  icon: typeof Zap;
  tagline: string;
  popular: boolean;
  features: { text: string; ok: boolean }[];
  cta: string;
}[] = [
  {
    id: "essentiel", icon: Zap, tagline: "Pour démarrer", popular: false,
    features: [
      { text: "Jusqu'à 15 clients dans votre carnet", ok: true },
      { text: "30 rendez-vous par mois", ok: true },
      { text: "Lien de réservation à partager", ok: true },
      { text: "QR code et carte de visite imprimables", ok: true },
      { text: "Email de confirmation automatique", ok: true },
      { text: "Rappels 24h avant le RDV", ok: false },
      { text: "Cartes de fidélité pour vos habitués", ok: false },
      { text: "Statistiques de revenus", ok: false },
    ],
    cta: "Plan actuel",
  },
  {
    id: "croissance", icon: TrendingUp, tagline: "Le plus utilisé", popular: true,
    features: [
      { text: "Jusqu'à 150 clients", ok: true },
      { text: "200 rendez-vous par mois", ok: true },
      { text: "3 modèles de messages automatiques au choix", ok: true },
      { text: "Rappel automatique 24h avant", ok: true },
      { text: "Demande d'avis après un RDV", ok: true },
      { text: "Cartes de fidélité (points et récompenses)", ok: true },
      { text: "Promotions à envoyer par email", ok: true },
      { text: "Statistiques de revenus et RDV", ok: true },
    ],
    cta: "Passer à Pro",
  },
  {
    id: "entreprise", icon: Crown, tagline: "Sans limite", popular: false,
    features: [
      { text: "Clients et rendez-vous illimités", ok: true },
      { text: "Tout ce qui est inclus dans Pro", ok: true },
      { text: "Accès aux fonctionnalités en bêta", ok: true },
      { text: "Parrainage : 1 mois offert par filleul", ok: true },
      { text: "Support par email prioritaire", ok: true },
      { text: "Accès anticipé aux nouveautés", ok: true },
    ],
    cta: "Passer à Elite",
  },
];

export default function SubscriptionPage() {
  const { user, updateUser } = useApp();
  const router = useRouter();
  const currentPlan = user.plan || "essentiel";
  const [showConfirm, setShowConfirm] = useState<PlanTier | null>(null);

  // Gift code redemption
  const [giftCode, setGiftCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [giftResult, setGiftResult] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function handleSelectPlan(planId: PlanTier) {
    if (planId === currentPlan) return;
    setShowConfirm(planId);
  }

  function confirmPlan() {
    if (!showConfirm) return;
    updateUser({ plan: showConfirm });
    setShowConfirm(null);
  }

  async function handleRedeemCode() {
    if (!giftCode.trim() || redeeming) return;
    setRedeeming(true);
    setGiftResult(null);
    const userId = user.email || "client-user";
    const result = await redeemGiftCode(giftCode, userId);
    if (result) {
      const msg = result.rewardType === "free_month"
        ? `${result.rewardValue} mois offert${result.rewardValue > 1 ? "s" : ""} applique !`
        : `Reduction de ${result.rewardValue}% appliquee !`;
      setGiftResult({ type: "success", msg });
      setGiftCode("");
    } else {
      setGiftResult({ type: "error", msg: "Code invalide, expire ou deja utilise." });
    }
    setRedeeming(false);
    setTimeout(() => setGiftResult(null), 3500);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-1">
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center" style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}>
            <ArrowLeft size={17} className="text-foreground" />
          </motion.button>
          <div>
            <p className="text-[10px] text-accent font-bold uppercase tracking-wider">Aperçu stratégique</p>
            <h1 className="text-[22px] font-bold text-foreground tracking-tight leading-tight">
              Gestion des <span className="text-accent">Abonnements.</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">

          {/* Current plan card */}
          <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Votre abonnement</p>
                <p className="text-[18px] font-bold text-foreground mt-1">{PLAN_NAMES[currentPlan]}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center">
                {currentPlan === "entreprise" ? <Crown size={18} className="text-accent" /> : currentPlan === "croissance" ? <TrendingUp size={18} className="text-accent" /> : <Zap size={18} className="text-accent" />}
              </div>
            </div>
            <div className="flex items-end gap-1.5">
              <span className="text-[32px] font-bold text-foreground leading-none">{PLAN_PRICES[currentPlan]}€</span>
              <span className="text-[13px] text-muted mb-1">/ mois</span>
              {currentPlan !== "essentiel" && (
                <span className="text-[11px] font-bold text-success ml-2 mb-1 flex items-center gap-1"><CheckCircle2 size={11} /> Actif</span>
              )}
            </div>
          </div>

          {/* Free trial CTA — only for free plan users */}
          {currentPlan === "essentiel" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 text-white mb-5 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #5B4FE9 0%, #3B30B5 100%)", boxShadow: "0 10px 28px rgba(91, 79, 233, 0.35)" }}>
              {/* Decorative sparkles */}
              <div className="absolute top-3 right-3 opacity-20"><Sparkles size={40} /></div>
              <div className="absolute bottom-2 right-10 opacity-10"><Star size={24} /></div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Gift size={20} className="text-white" />
                  <p className="text-[17px] font-bold">1 mois d&apos;essai gratuit</p>
                </div>
                <p className="text-[13px] text-white/85 leading-relaxed">
                  Essayez le plan Pro avec toutes les fonctionnalites. Sans engagement.
                </p>
                <p className="text-[11px] text-white/70 mt-1">Annulable a tout moment.</p>

                <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleSelectPlan("croissance")}
                  className="mt-4 bg-white py-3 rounded-xl text-[14px] font-bold text-center w-full shadow-sm"
                  style={{ color: "#3B30B5" }}>
                  Demarrer l&apos;essai gratuit
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ═══ GIFT CODE REDEMPTION ═══ */}
          <div className="rounded-2xl p-5 mb-5 shadow-card-premium relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #F3F0FF 0%, #EEF0FF 100%)", border: "1px solid #E0DCFF" }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)", boxShadow: "0 4px 12px rgba(139, 92, 246, 0.35)" }}>
                <Gift size={15} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "#6D28D9" }}>Premium</p>
                <p className="text-[14px] font-bold" style={{ color: "#3B30B5" }}>Vous avez un code cadeau ?</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                value={giftCode}
                onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                placeholder="GIFT-XXXXXX"
                disabled={redeeming}
                className="flex-1 bg-white rounded-xl px-4 py-3 text-[13px] font-bold tracking-wider text-foreground placeholder:text-subtle outline-none"
                style={{ border: "1px solid rgba(139, 92, 246, 0.25)" }}
              />
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleRedeemCode}
                disabled={!giftCode.trim() || redeeming}
                className="px-5 rounded-xl text-[13px] font-bold text-white flex-shrink-0"
                style={{
                  background: giftCode.trim() && !redeeming ? "linear-gradient(135deg, #8B5CF6, #6D28D9)" : "#E4E4E7",
                  color: giftCode.trim() && !redeeming ? "white" : "#A1A1AA",
                  boxShadow: giftCode.trim() && !redeeming ? "0 4px 12px rgba(139, 92, 246, 0.35)" : undefined,
                }}
              >
                {redeeming ? "..." : "Valider"}
              </motion.button>
            </div>
            <AnimatePresence>
              {giftResult && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-3 px-3 py-2 rounded-lg text-[11px] font-bold flex items-center gap-2 ${
                    giftResult.type === "success" ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                  }`}
                >
                  {giftResult.type === "success" ? <CheckCircle2 size={12} /> : <X size={12} />}
                  {giftResult.msg}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Plans header */}
          <h2 className="text-[18px] font-bold text-foreground mb-4">Plans Disponibles</h2>

          {/* Plan cards */}
          <div className="space-y-4 mb-6">
            {PLANS.map((plan, idx) => {
              const isCurrent = currentPlan === plan.id;
              const Icon = plan.icon;
              return (
                <motion.div key={plan.id} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.08 }}
                  className={`bg-white rounded-2xl shadow-card-premium overflow-hidden ${plan.popular ? "ring-2 ring-accent" : ""}`}>

                  <div className="p-5 pb-4">
                    {/* Plan name + badge */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${plan.popular ? "bg-accent-soft" : "bg-border-light"}`}>
                          <Icon size={15} className={plan.popular ? "text-accent" : "text-muted"} />
                        </div>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-wider">{PLAN_NAMES[plan.id]}</p>
                      </div>
                      {plan.popular && (
                        <span className="text-[8px] font-bold text-white bg-accent px-2.5 py-0.5 rounded-full uppercase tracking-wider">Plus populaire</span>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="flex items-end gap-1 mt-3 mb-4">
                      <span className="text-[32px] font-bold text-foreground leading-none">{PLAN_PRICES[plan.id]}€</span>
                      <span className="text-[13px] text-muted mb-1">/ mois</span>
                    </div>

                    {/* Features */}
                    <div className="space-y-2.5">
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          {f.ok ? (
                            <div className="w-[18px] h-[18px] rounded-full bg-accent-soft flex items-center justify-center flex-shrink-0">
                              <Check size={10} className="text-accent" strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-[18px] h-[18px] rounded-full bg-border-light flex items-center justify-center flex-shrink-0">
                              <X size={10} className="text-subtle" />
                            </div>
                          )}
                          <span className={`text-[12px] ${f.ok ? "text-foreground" : "text-subtle"}`}>{f.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA — indigo for paid/upgrade plans, neutral for current */}
                  <div className="px-5 pb-5">
                    <motion.button whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isCurrent}
                      className="w-full py-3.5 rounded-xl text-[13px] font-bold text-center transition-all"
                      style={
                        isCurrent
                          ? { backgroundColor: "var(--color-border-light)", color: "var(--color-muted)" }
                          : plan.id === "essentiel"
                          ? { backgroundColor: "white", color: "var(--color-foreground)", border: "2px solid var(--color-border)" }
                          : {
                              background: "linear-gradient(135deg, #5B4FE9 0%, #3B30B5 100%)",
                              color: "white",
                              boxShadow: "0 4px 14px rgba(91, 79, 233, 0.35), 0 1px 3px rgba(91, 79, 233, 0.18)",
                            }
                      }>
                      {isCurrent ? "Plan actuel" : plan.popular ? "Commencer l'essai gratuit" : plan.cta}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Social proof */}
          <div className="bg-white rounded-2xl p-4 shadow-card-premium mb-4 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["#7C3AED", "#3B82F6", "#10B981"].map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: c }}>
                  {["A", "M", "S"][i]}
                </div>
              ))}
            </div>
            <div className="flex-1">
              <p className="text-[12px] font-bold text-foreground">+2 000 professionnels</p>
              <p className="text-[10px] text-muted">font confiance à Client Base</p>
            </div>
            <div className="flex gap-0.5">{[1,2,3,4,5].map((i) => <Star key={i} size={10} className="text-warning fill-warning" />)}</div>
          </div>

          {/* Guarantee */}
          <div className="bg-border-light rounded-2xl p-4 text-center">
            <Shield size={16} className="text-muted mx-auto mb-1.5" />
            <p className="text-[12px] font-bold text-foreground">Satisfait ou remboursé</p>
            <p className="text-[10px] text-muted mt-0.5">14 jours pour essayer, sans risque.</p>
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={() => setShowConfirm(null)}>
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[28px] w-full max-w-lg p-6 pb-10">
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={28} className="text-accent" />
                </div>
                <h3 className="text-[20px] font-bold text-foreground">Passer au plan {PLAN_NAMES[showConfirm]} ?</h3>
                <p className="text-[13px] text-muted mt-2 leading-relaxed">
                  {showConfirm === "croissance"
                    ? "1 mois gratuit, puis 9,99€ / mois. Annulable à tout moment."
                    : "Vous serez facturé 19,99€ / mois. Annulable à tout moment."}
                </p>
              </div>
              <motion.button whileTap={{ scale: 0.98 }} onClick={confirmPlan}
                className="w-full bg-accent text-white py-4 rounded-2xl text-[15px] font-bold fab-shadow">
                Confirmer le changement
              </motion.button>
              <button onClick={() => setShowConfirm(null)}
                className="w-full text-[13px] text-muted font-semibold mt-3 py-2">Annuler</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
