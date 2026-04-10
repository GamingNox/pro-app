"use client";

import { motion } from "framer-motion";
import { Crown, Star, ChevronRight, Copy, Clock, Gift, Tag } from "lucide-react";
import { useState } from "react";

export default function ClientOffersPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <h1 className="text-[24px] font-bold text-foreground tracking-tight">Offres</h1>
        <p className="text-[13px] text-muted mt-0.5">Vos avantages et promotions exclusives.</p>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">

          {/* Premium banner */}
          <div className="bg-accent-gradient rounded-[22px] p-5 mb-5">
            <div className="flex items-center gap-1.5 mb-3">
              <Star size={12} className="text-white/70" />
              <span className="text-[9px] text-white/70 font-bold uppercase tracking-wider">Membre privilège</span>
            </div>
            <h3 className="text-[20px] font-bold text-white leading-snug">Libérez le potentiel Lumière Pro.</h3>
            <p className="text-[12px] text-white/70 mt-2 leading-relaxed">Accédez à des avantages exclusifs et une priorité absolue.</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-[10px] text-white/80 font-semibold flex items-center gap-1"><Crown size={10} /> Priorité Totale</span>
              <span className="text-[10px] text-white/80 font-semibold flex items-center gap-1"><Gift size={10} /> Récompenses x2</span>
            </div>
            <motion.button whileTap={{ scale: 0.97 }}
              className="mt-4 bg-white rounded-xl py-2.5 px-5 text-[13px] font-bold text-accent">
              Passer au Premium — 9,99€/mois
            </motion.button>
          </div>

          {/* Promo codes */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[17px] font-bold text-foreground">Codes Promo</h2>
            <span className="text-[12px] text-accent font-bold">Voir tout</span>
          </div>
          <div className="space-y-3 mb-6">
            {[
              { label: "BIENVENUE", desc: "-15% sur votre séjour", code: "ETHERE15", expiry: "31 Décembre 2024", status: "Valide", color: "text-success" },
              { label: "SAISONNIER", desc: "Petit-Déjeuner Offert", code: "MORNING", expiry: "15 Novembre 2024", status: "Actif", color: "text-accent" },
            ].map((promo, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-card-premium">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-accent font-bold uppercase tracking-wider">{promo.label}</span>
                  <span className={`text-[9px] font-bold ${promo.color} bg-border-light px-2 py-0.5 rounded-md`}>{promo.status}</span>
                </div>
                <p className="text-[15px] font-bold text-foreground">{promo.desc}</p>
                <div className="flex items-center justify-between mt-3 bg-border-light rounded-xl px-4 py-2.5">
                  <span className="text-[13px] font-bold text-foreground tracking-wider">{promo.code}</span>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => copyCode(promo.code)}
                    className="text-[11px] font-bold text-accent flex items-center gap-1">
                    <Copy size={11} /> {copiedCode === promo.code ? "Copié !" : "Copier"}
                  </motion.button>
                </div>
                <p className="text-[10px] text-muted mt-2 flex items-center gap-1"><Clock size={10} /> Expire le {promo.expiry}</p>
              </div>
            ))}
          </div>

          {/* Gift cards */}
          <h2 className="text-[17px] font-bold text-foreground mb-3">Mes Cartes Cadeaux</h2>
          <div className="bg-white rounded-[22px] p-5 shadow-card-premium mb-4">
            <div className="bg-gradient-to-br from-warning/20 to-warning/5 rounded-2xl p-4 mb-3 text-center">
              <Gift size={32} className="text-warning mx-auto mb-2" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-bold text-foreground">Carte Évasion</p>
                <p className="text-[11px] text-muted">Offerte par Jean Dupont</p>
              </div>
              <p className="text-[22px] font-bold text-accent">250€</p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light">
              <div><p className="text-[9px] text-muted font-bold uppercase tracking-wider">Code</p><p className="text-[13px] font-bold text-foreground tracking-wider">•••• •••• 4821</p></div>
              <motion.button whileTap={{ scale: 0.95 }} className="bg-border-light rounded-xl px-4 py-2 text-[12px] font-bold text-foreground">Utiliser</motion.button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <motion.button whileTap={{ scale: 0.98 }} className="w-full bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center"><Tag size={18} className="text-accent" /></div>
              <div className="flex-1 text-left"><p className="text-[14px] font-bold text-foreground">Ajouter une carte</p><p className="text-[11px] text-muted">Activez une carte cadeau reçue.</p></div>
            </motion.button>
            <motion.button whileTap={{ scale: 0.98 }} className="w-full bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center"><Gift size={18} className="text-accent" /></div>
              <div className="flex-1 text-left"><p className="text-[14px] font-bold text-foreground">Offrir une carte</p><p className="text-[11px] text-muted">Faites plaisir à vos proches.</p></div>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
