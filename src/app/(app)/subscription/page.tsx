"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Check, X, Crown, Zap, Shield, Star, Sparkles,
  TrendingUp, BarChart3, Users, CheckCircle2, ChevronRight,
} from "lucide-react";
import { PLAN_NAMES, PLAN_PRICES, type PlanTier, type Feature } from "@/lib/types";

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
      { text: "15 clients maximum", ok: true },
      { text: "30 RDV / mois", ok: true },
      { text: "Tableau de bord", ok: true },
      { text: "Page de réservation", ok: true },
      { text: "Support email 24/7", ok: true },
      { text: "Gestion de stock", ok: false },
      { text: "Suivi financier", ok: false },
      { text: "Programme fidélité", ok: false },
      { text: "Rapports PDF", ok: false },
      { text: "Support prioritaire", ok: false },
    ],
    cta: "Plan actuel",
  },
  {
    id: "croissance", icon: TrendingUp, tagline: "Le plus populaire", popular: true,
    features: [
      { text: "Clients illimités", ok: true },
      { text: "RDV illimités", ok: true },
      { text: "Tableau de bord complet", ok: true },
      { text: "Page de réservation", ok: true },
      { text: "Support email 24/7", ok: true },
      { text: "Gestion de stock", ok: true },
      { text: "Suivi financier complet", ok: true },
      { text: "Programme fidélité", ok: true },
      { text: "Rapports PDF blancs", ok: true },
      { text: "Rappels automatiques", ok: true },
      { text: "Intégrations avancées", ok: false },
      { text: "Support prioritaire", ok: false },
    ],
    cta: "Passer à Croissance",
  },
  {
    id: "entreprise", icon: Crown, tagline: "Tout inclus", popular: false,
    features: [
      { text: "Clients illimités", ok: true },
      { text: "RDV illimités", ok: true },
      { text: "Infrastructure dédiée", ok: true },
      { text: "Intégrations avancées", ok: true },
      { text: "Support prioritaire", ok: true },
      { text: "SLA garanti 99.9%", ok: true },
      { text: "Account Manager", ok: true },
      { text: "Branding personnalisé", ok: true },
      { text: "Accès API", ok: true },
      { text: "Multi-collaborateurs", ok: true },
    ],
    cta: "Passer à Entreprise",
  },
];

export default function SubscriptionPage() {
  const { user, updateUser } = useApp();
  const router = useRouter();
  const currentPlan = user.plan || "essentiel";
  const [showConfirm, setShowConfirm] = useState<PlanTier | null>(null);

  function handleSelectPlan(planId: PlanTier) {
    if (planId === currentPlan) return;
    setShowConfirm(planId);
  }

  function confirmPlan() {
    if (!showConfirm) return;
    updateUser({ plan: showConfirm });
    setShowConfirm(null);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
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

          {/* Current plan MRR card */}
          <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Votre abonnement</p>
                <p className="text-[18px] font-bold text-foreground mt-1">{PLAN_NAMES[currentPlan]}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center">
                <BarChart3 size={18} className="text-accent" />
              </div>
            </div>
            <div className="flex items-end gap-1.5">
              <span className="text-[32px] font-bold text-foreground leading-none">{PLAN_PRICES[currentPlan]}€</span>
              <span className="text-[13px] text-muted mb-1">/mois</span>
              {currentPlan !== "essentiel" && (
                <span className="text-[11px] font-bold text-success ml-2 mb-1 flex items-center gap-1"><TrendingUp size={11} /> Actif</span>
              )}
            </div>
          </div>

          {/* Performance chart */}
          <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-bold text-foreground">Performance Mensuelle</h3>
              <button className="text-muted"><BarChart3 size={16} /></button>
            </div>
            <div className="flex items-end gap-[5px] h-[80px]">
              {[35, 50, 40, 65, 55, 75].map((h, i) => (
                <motion.div key={i} className={`flex-1 rounded-[4px] ${i === 5 ? "bg-accent" : "bg-accent/15"}`}
                  initial={{ height: "10%" }} animate={{ height: `${h}%` }}
                  transition={{ delay: i * 0.06, duration: 0.5 }} />
              ))}
            </div>
          </div>

          {/* New plan CTA */}
          {currentPlan === "essentiel" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-accent-gradient rounded-2xl p-5 text-white mb-5">
              <div className="flex items-start gap-3">
                <Sparkles size={20} className="text-white/80 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[15px] font-bold">Nouveau Plan</p>
                  <p className="text-[12px] text-white/70 mt-1 leading-relaxed">
                    Créez une offre personnalisée pour vos clients VIP.
                  </p>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleSelectPlan("croissance")}
                className="mt-4 bg-white text-accent py-2.5 rounded-xl text-[13px] font-bold text-center w-full">
                Lancer l&apos;offre
              </motion.button>
            </motion.div>
          )}

          {/* Plans */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-foreground">Plans Disponibles</h2>
            <span className="text-[11px] text-accent font-bold flex items-center gap-1">Voir tous les tarifs <ChevronRight size={12} /></span>
          </div>

          <div className="space-y-4 mb-6">
            {PLANS.map((plan, idx) => {
              const isCurrent = currentPlan === plan.id;
              const Icon = plan.icon;
              return (
                <motion.div key={plan.id} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.08 }}
                  className={`bg-white rounded-2xl shadow-card-premium overflow-hidden ${plan.popular ? "ring-2 ring-accent" : ""}`}>

                  {/* Plan header */}
                  <div className="p-5 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[9px] text-muted font-bold uppercase tracking-wider">{PLAN_NAMES[plan.id]}</p>
                      {plan.popular && (
                        <span className="text-[8px] font-bold text-white bg-accent px-2.5 py-0.5 rounded-full uppercase tracking-wider">Plus populaire</span>
                      )}
                    </div>
                    <div className="flex items-end gap-1 mt-2">
                      {plan.id === "entreprise" ? (
                        <p className="text-[26px] font-bold text-foreground leading-none">Sur Mesure</p>
                      ) : (
                        <>
                          <span className="text-[32px] font-bold text-foreground leading-none">{PLAN_PRICES[plan.id]}€</span>
                          <span className="text-[13px] text-muted mb-1">/mo</span>
                        </>
                      )}
                    </div>

                    {/* Features */}
                    <div className="mt-4 space-y-2.5">
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

                  {/* CTA */}
                  <div className="px-5 pb-5">
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isCurrent}
                      className={`w-full py-3.5 rounded-xl text-[13px] font-bold text-center transition-all ${
                        isCurrent ? "bg-border-light text-muted"
                        : plan.popular ? "bg-accent text-white"
                        : "bg-white border-2 border-border text-foreground"
                      }`}>
                      {isCurrent ? "Plan actuel" : plan.cta}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Guarantee */}
          <div className="bg-border-light rounded-2xl p-4 text-center mb-4">
            <Shield size={16} className="text-muted mx-auto mb-1.5" />
            <p className="text-[12px] text-muted">Satisfait ou remboursé pendant 14 jours</p>
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={() => setShowConfirm(null)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[28px] w-full max-w-lg p-6 pb-10">
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={28} className="text-accent" />
                </div>
                <h3 className="text-[20px] font-bold text-foreground">Passer au plan {PLAN_NAMES[showConfirm]} ?</h3>
                <p className="text-[13px] text-muted mt-2">
                  {showConfirm === "entreprise"
                    ? "Contactez-nous pour un devis personnalisé."
                    : `Vous serez facturé ${PLAN_PRICES[showConfirm]}€/mois. Annulable à tout moment.`}
                </p>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={confirmPlan}
                className="w-full bg-accent text-white py-4 rounded-2xl text-[15px] font-bold fab-shadow">
                Confirmer
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
