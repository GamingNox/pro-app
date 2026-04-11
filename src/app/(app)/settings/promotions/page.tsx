"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Tag, Plus, Calendar, TrendingUp, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import SettingsPage, { SettingsSection } from "@/components/SettingsPage";

export default function SettingsPromotionsPage() {
  const [month] = useState(new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" }));

  return (
    <SettingsPage
      category="Marketing"
      title="Promotion Manager"
      description="Boostez votre activité en créant des offres stratégiques. Analysez vos performances en temps réel."
    >
      {/* Active offers */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[18px] font-bold text-foreground">Offres Actives</h2>
        <span className="text-[11px] text-accent font-bold flex items-center gap-1">Voir tout <ChevronRight size={12} /></span>
      </div>

      <div className="space-y-3 mb-5">
        <div className="bg-white rounded-2xl p-5 shadow-card-premium">
          <span className="text-[8px] font-bold text-accent bg-accent-soft px-2 py-0.5 rounded uppercase tracking-wider">Flash deal</span>
          <h3 className="text-[18px] font-bold text-foreground mt-2">Happy Hour -20%</h3>
          <p className="text-[11px] text-muted mt-1 leading-relaxed">Valable tous les mardis et jeudis de 14h à 17h.</p>
          <div className="flex gap-4 mt-3 pt-3 border-t border-border-light">
            <div><p className="text-[9px] text-muted uppercase">Utilisations</p><p className="text-[18px] font-bold text-foreground">142</p></div>
            <div><p className="text-[9px] text-muted uppercase">Expire le</p><p className="text-[12px] font-bold text-foreground mt-1">Dans 3 jours</p></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-card-premium">
          <span className="text-[8px] font-bold text-muted bg-border-light px-2 py-0.5 rounded uppercase tracking-wider">Duo offer</span>
          <h3 className="text-[18px] font-bold text-foreground mt-2">Offre Parrainage</h3>
          <p className="text-[11px] text-muted mt-1 leading-relaxed">Amenez un ami et profitez de -15% sur votre prochaine séance.</p>
          <div className="flex gap-4 mt-3 pt-3 border-t border-border-light">
            <div><p className="text-[9px] text-muted uppercase">Utilisations</p><p className="text-[18px] font-bold text-foreground">56</p></div>
            <div><p className="text-[9px] text-muted uppercase">Expire le</p><p className="text-[12px] font-bold text-foreground mt-1">31 Déc 2024</p></div>
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="bg-accent-gradient rounded-2xl p-5 text-white mb-5">
        <p className="text-[14px] font-bold">Performance Globale</p>
        <p className="text-[11px] text-white/70 mt-0.5">+12% de conversion ce mois-ci</p>
        <div className="flex items-end gap-[5px] h-[60px] mt-4">
          {[30, 45, 35, 55, 40, 65, 75].map((h, i) => (
            <motion.div key={i} className={`flex-1 rounded-[3px] ${i === 6 ? "bg-white" : "bg-white/30"}`}
              initial={{ height: "10%" }} animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.05, duration: 0.5 }} />
          ))}
        </div>
        <p className="text-[9px] text-white/50 uppercase tracking-wider mt-2">Trafic promotionnel</p>
      </div>

      {/* Quick create */}
      <h2 className="text-[18px] font-bold text-foreground mb-3">Créer une Offre Flash</h2>
      <div className="space-y-3 mb-5">
        {[
          { title: "-10% Slow Hours", desc: "Attirez des clients pendant vos heures creuses." },
          { title: "Duo Deal", desc: "Favorisez les réservations de groupe avec une remise groupée." },
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

      {/* Calendar */}
      <SettingsSection title="Calendrier des Promos" description="Planifiez vos campagnes saisonnières à l'avance.">
        <div className="flex items-center justify-between mb-4">
          <ChevronLeft size={16} className="text-muted" />
          <span className="text-[14px] font-bold text-foreground capitalize">{month}</span>
          <ChevronRight size={16} className="text-muted" />
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-muted font-bold mb-2">
          {["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"].map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[12px]">
          {Array.from({ length: 28 }, (_, i) => (
            <div key={i} className={`py-1.5 rounded-lg ${i === 5 || i === 6 ? "bg-accent text-white font-bold" : i === 14 ? "bg-warning-soft text-warning font-bold" : "text-foreground"}`}>
              {i + 1}
            </div>
          ))}
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
