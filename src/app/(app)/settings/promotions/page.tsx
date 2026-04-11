"use client";

import { motion } from "framer-motion";
import { Tag, Plus, Sparkles } from "lucide-react";
import SettingsPage, { SettingsSection } from "@/components/SettingsPage";

export default function SettingsPromotionsPage() {
  return (
    <SettingsPage
      category="Marketing"
      title="Gestionnaire de Promotions"
      description="Créez des offres stratégiques pour booster votre activité. Analysez les performances en temps réel."
    >
      {/* Empty state — no demo promos */}
      <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center mb-5">
        <Tag size={32} className="text-muted mx-auto mb-3" />
        <p className="text-[16px] font-bold text-foreground">Aucune promotion active</p>
        <p className="text-[12px] text-muted mt-1.5 max-w-[240px] mx-auto leading-relaxed">
          Créez votre première offre pour attirer de nouveaux clients et fidéliser les existants.
        </p>
        <motion.button whileTap={{ scale: 0.97 }}
          className="mt-4 bg-accent text-white py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 mx-auto px-6">
          <Plus size={15} /> Créer une offre
        </motion.button>
      </div>

      {/* Quick create ideas */}
      <h2 className="text-[18px] font-bold text-foreground mb-3">Idées d&apos;offres</h2>
      <div className="space-y-3 mb-5">
        {[
          { title: "Offre heures creuses", desc: "Attirez des clients pendant vos créneaux moins demandés avec une remise ciblée." },
          { title: "Offre duo", desc: "Encouragez les réservations à deux avec une remise groupée attractive." },
        ].map((offer) => (
          <div key={offer.title} className="bg-white rounded-2xl p-4 shadow-card-premium">
            <p className="text-[14px] font-bold text-foreground">{offer.title}</p>
            <p className="text-[11px] text-muted mt-1 leading-relaxed">{offer.desc}</p>
          </div>
        ))}
        <div className="bg-border-light rounded-2xl p-4 flex items-center justify-center gap-2">
          <Plus size={16} className="text-muted" />
          <span className="text-[13px] font-bold text-foreground">Sur mesure</span>
        </div>
      </div>

      {/* Premium CTA */}
      <div className="bg-accent-gradient rounded-2xl p-5 text-white mb-5">
        <Sparkles size={20} className="text-white/80 mx-auto mb-2" />
        <p className="text-[15px] font-bold text-center">Boostez vos promotions</p>
        <p className="text-[11px] text-white/70 text-center mt-1 leading-relaxed">
          Le plan Pro débloque les campagnes automatisées et le suivi de performance avancé.
        </p>
      </div>
    </SettingsPage>
  );
}
