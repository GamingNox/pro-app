"use client";

import { motion } from "framer-motion";
import { Copy, Clock, Gift, Tag, Sparkles } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { CATEGORIES } from "@/lib/categories";

// Demo-only content — shown exclusively when isDemo === true.
// Real users NEVER see any of this data.
const DEMO_PROMOS = [
  {
    label: "BIENVENUE",
    desc: "-15% sur votre prochain rendez-vous",
    code: "BIENVENUE15",
    expiry: "Dans 30 jours",
    status: "Valide",
  },
  {
    label: "SAISONNIER",
    desc: "1 boisson offerte",
    code: "CAFE-DEMO",
    expiry: "Dans 15 jours",
    status: "Actif",
  },
];

const DEMO_GIFT_CARD = {
  name: "Carte Evasion",
  from: "Offerte par Marie Dupont",
  amount: 50,
  codeMask: "•••• •••• 4821",
};

export default function ClientOffersPage() {
  const { isDemo } = useApp();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  // Client accounts use BLUE — consistent distinction from pro violet
  const scopeStyle = {
    ["--color-accent" as string]: CATEGORIES.clients.color,
    ["--color-accent-soft" as string]: CATEGORIES.clients.soft,
    ["--color-accent-deep" as string]: CATEGORIES.clients.deep,
  } as React.CSSProperties;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background" style={scopeStyle}>
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <h1 className="text-[24px] font-bold text-foreground tracking-tight">Offres</h1>
        <p className="text-[13px] text-muted mt-0.5">Vos promotions et cartes cadeaux.</p>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">

          {/* ═══ CODES PROMO ═══ */}
          <div className="flex items-center gap-2 mb-3 mt-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORIES.marketing.color }} />
            <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: CATEGORIES.marketing.color }}>Codes promo</p>
          </div>

          {isDemo ? (
            <div className="space-y-3 mb-6">
              {DEMO_PROMOS.map((promo) => (
                <div key={promo.code} className="bg-white rounded-2xl p-4 shadow-card-premium">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-accent font-bold uppercase tracking-wider">{promo.label}</span>
                    <span className="text-[9px] font-bold text-success bg-success-soft px-2 py-0.5 rounded-md">{promo.status}</span>
                  </div>
                  <p className="text-[15px] font-bold text-foreground">{promo.desc}</p>
                  <div className="flex items-center justify-between mt-3 bg-border-light rounded-xl px-4 py-2.5">
                    <span className="text-[13px] font-bold text-foreground tracking-wider">{promo.code}</span>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => copyCode(promo.code)}
                      className="text-[11px] font-bold text-accent flex items-center gap-1">
                      <Copy size={11} /> {copiedCode === promo.code ? "Copie !" : "Copier"}
                    </motion.button>
                  </div>
                  <p className="text-[10px] text-muted mt-2 flex items-center gap-1"><Clock size={10} /> Expire {promo.expiry}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center mb-6">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: CATEGORIES.marketing.soft }}>
                <Tag size={24} style={{ color: CATEGORIES.marketing.color }} />
              </div>
              <p className="text-[15px] font-bold text-foreground">Aucun code promo pour le moment</p>
              <p className="text-[12px] text-muted mt-1.5 max-w-[260px] mx-auto leading-relaxed">
                Vos professionnels vous enverront des codes ici. Pensez a revenir regulierement.
              </p>
            </div>
          )}

          {/* ═══ CARTES CADEAUX ═══ */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORIES.marketing.color }} />
            <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: CATEGORIES.marketing.color }}>Cartes cadeaux</p>
          </div>

          {isDemo ? (
            <div className="bg-white rounded-[22px] p-5 shadow-card-premium mb-5">
              <div className="rounded-2xl p-4 mb-3 text-center" style={{ background: "linear-gradient(135deg, #FFF8E1, #FEF3C7)" }}>
                <Gift size={32} style={{ color: "#D4A017" }} className="mx-auto mb-2" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-bold text-foreground">{DEMO_GIFT_CARD.name}</p>
                  <p className="text-[11px] text-muted">{DEMO_GIFT_CARD.from}</p>
                </div>
                <p className="text-[22px] font-bold" style={{ color: CATEGORIES.marketing.color }}>{DEMO_GIFT_CARD.amount} EUR</p>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light">
                <div>
                  <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Code</p>
                  <p className="text-[13px] font-bold text-foreground tracking-wider">{DEMO_GIFT_CARD.codeMask}</p>
                </div>
                <motion.button whileTap={{ scale: 0.95 }} className="bg-border-light rounded-xl px-4 py-2 text-[12px] font-bold text-foreground">
                  Utiliser
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center mb-5">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: CATEGORIES.marketing.soft }}>
                <Gift size={24} style={{ color: CATEGORIES.marketing.color }} />
              </div>
              <p className="text-[15px] font-bold text-foreground">Aucune carte cadeau</p>
              <p className="text-[12px] text-muted mt-1.5 max-w-[260px] mx-auto leading-relaxed">
                Vos cartes cadeaux recues apparaitront ici. Vous pourrez les utiliser a tout moment.
              </p>
            </div>
          )}

          {/* ═══ INDICATEUR DEMO ═══ */}
          {isDemo && (
            <div className="bg-accent-soft rounded-xl p-3 flex items-center gap-2 mt-2">
              <Sparkles size={13} style={{ color: CATEGORIES.marketing.color }} className="flex-shrink-0" />
              <p className="text-[10px] font-semibold leading-relaxed" style={{ color: CATEGORIES.marketing.deep }}>
                Donnees de demonstration — les vrais comptes commencent vides.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
