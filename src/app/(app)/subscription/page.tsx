"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { APP_NAME } from "@/lib/constants";
import { Check, X, Sparkles, Crown, Zap } from "lucide-react";

type PlanId = "free" | "pro" | "premium";

const plans: { id: PlanId; name: string; price: string; period: string; tagline: string; popular: boolean; features: { text: string; ok: boolean }[]; cta: string }[] = [
  {
    id: "free", name: "Gratuit", price: "0 €", period: "pour toujours", tagline: "Pour commencer", popular: false,
    features: [
      { text: "5 clients maximum", ok: true }, { text: "10 RDV / mois", ok: true }, { text: "Tableau de bord", ok: true },
      { text: "Gestion de stock", ok: false }, { text: "Suivi des finances", ok: false }, { text: "Support prioritaire", ok: false },
    ],
    cta: "Plan actuel",
  },
  {
    id: "pro", name: "Pro", price: "9,99 €", period: "/ mois", tagline: "Le plus populaire", popular: true,
    features: [
      { text: "Clients illimités", ok: true }, { text: "RDV illimités", ok: true }, { text: "Tableau de bord complet", ok: true },
      { text: "Gestion de stock", ok: true }, { text: "Suivi des finances", ok: true }, { text: "Support prioritaire", ok: false },
    ],
    cta: "Passer au Pro",
  },
  {
    id: "premium", name: "Premium", price: "19,99 €", period: "/ mois", tagline: "Tout inclus", popular: false,
    features: [
      { text: "Clients illimités", ok: true }, { text: "RDV illimités", ok: true }, { text: "Tableau de bord complet", ok: true },
      { text: "Gestion de stock", ok: true }, { text: "Suivi des finances", ok: true }, { text: "Support prioritaire", ok: true },
    ],
    cta: "Passer au Premium",
  },
];

export default function SubscriptionPage() {
  const [selected, setSelected] = useState<PlanId>("pro");
  const [annual, setAnnual] = useState(false);

  return (
    <div className="flex-1 custom-scroll">
      <header className="px-6 pt-6 pb-2 text-center">
        <h1 className="text-[22px] font-bold text-foreground">Choisissez votre plan</h1>
        <p className="text-[13px] text-muted mt-1">Débloquez tout le potentiel de {APP_NAME}</p>
      </header>

      <div className="flex justify-center py-4">
        <div className="flex bg-border-light rounded-xl p-[3px]">
          <button onClick={() => setAnnual(false)} className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-all ${!annual ? "bg-white shadow-sm-apple text-foreground" : "text-muted"}`}>Mensuel</button>
          <button onClick={() => setAnnual(true)} className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1.5 ${annual ? "bg-white shadow-sm-apple text-foreground" : "text-muted"}`}>
            Annuel <span className="text-[10px] text-success font-bold">-20%</span>
          </button>
        </div>
      </div>

      <div className="px-6 pb-5 space-y-3">
        {plans.map((plan, i) => {
          const isSel = selected === plan.id;
          const price = annual && plan.id !== "free"
            ? `${(parseFloat(plan.price.replace(",", ".").replace(" €", "")) * 0.8).toFixed(2).replace(".", ",")} €`
            : plan.price;

          return (
            <motion.button key={plan.id} initial={{ y: 6 }} animate={{ y: 0 }} transition={{ delay: i * 0.08 }}
              onClick={() => setSelected(plan.id)}
              className={`w-full text-left rounded-2xl p-[2px] transition-all ${isSel ? "bg-accent" : "bg-border"}`}>
              <div className="bg-white rounded-[14px] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-bold text-foreground">{plan.name}</h3>
                    {plan.popular && <span className="text-[9px] font-bold bg-accent text-white px-2 py-0.5 rounded-full">POPULAIRE</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-[16px] font-bold text-foreground">{price}</span>
                    <span className="text-[11px] text-muted ml-0.5">{plan.period}</span>
                  </div>
                </div>

                {isSel && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="space-y-2 pt-3 border-t border-border-light">
                    {plan.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-2.5">
                        {f.ok ? (
                          <div className="w-[18px] h-[18px] rounded-full bg-success-soft flex items-center justify-center"><Check size={10} className="text-success" strokeWidth={3} /></div>
                        ) : (
                          <div className="w-[18px] h-[18px] rounded-full bg-border-light flex items-center justify-center"><X size={10} className="text-subtle" /></div>
                        )}
                        <span className={`text-[12px] ${f.ok ? "text-foreground" : "text-subtle"}`}>{f.text}</span>
                      </div>
                    ))}
                    <motion.div whileTap={{ scale: 0.97 }}
                      className={`mt-3 w-full py-3 rounded-xl text-[13px] font-semibold text-center ${plan.id === "free" ? "bg-border-light text-muted" : "bg-accent text-white"}`}>
                      {plan.cta}
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="px-6 pb-8">
        <div className="bg-border-light rounded-2xl p-4 text-center">
          <p className="text-[12px] text-muted">Satisfait ou remboursé pendant 14 jours</p>
        </div>
      </div>
    </div>
  );
}
