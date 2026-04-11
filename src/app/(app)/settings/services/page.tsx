"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { Plus, Clock, CreditCard, Globe, Sparkles } from "lucide-react";
import SettingsPage, { SettingsSection, SettingsToggle, SaveButton } from "@/components/SettingsPage";

export default function SettingsServicesPage() {
  const { services } = useApp();
  const [saved, setSaved] = useState(false);

  return (
    <SettingsPage
      category="Catalogue"
      title="Gestion des Services"
      description="Organisez votre catalogue de prestations professionnelles. Définissez vos tarifs, durées et visibilité pour la réservation en ligne."
    >
      {/* Add new service */}
      <motion.button whileTap={{ scale: 0.97 }}
        className="w-full bg-accent text-white py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 fab-shadow mb-5">
        <Plus size={16} /> Nouveau service
      </motion.button>

      {/* Service list */}
      <div className="space-y-3 mb-5">
        {services.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center">
            <Sparkles size={28} className="text-muted mx-auto mb-3" />
            <p className="text-[15px] font-bold text-foreground">Aucun service</p>
            <p className="text-[12px] text-muted mt-1">Créez votre premier service pour commencer.</p>
          </div>
        ) : (
          services.map((svc) => (
            <div key={svc.id} className="bg-white rounded-2xl p-5 shadow-card-premium">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[16px] font-bold text-foreground">{svc.name}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[12px] text-muted flex items-center gap-1"><Clock size={12} /> {svc.duration} min</span>
                    <span className="text-[12px] text-muted flex items-center gap-1"><CreditCard size={12} /> {svc.price},00 €</span>
                  </div>
                </div>
                <SettingsToggle on={svc.active} onToggle={() => {}} />
              </div>
              {svc.description && <p className="text-[11px] text-muted">{svc.description}</p>}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-light">
                <Globe size={12} className="text-accent" />
                <span className="text-[10px] text-accent font-bold uppercase tracking-wider">Booking en ligne</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Premium upsell */}
      <div className="bg-foreground rounded-2xl p-5 text-white text-center mb-5">
        <Sparkles size={22} className="text-white/60 mx-auto mb-2" />
        <p className="text-[15px] font-bold">Boostez votre visibilité avec le pack Premium</p>
        <p className="text-[11px] text-white/60 mt-1 leading-relaxed">Indexation prioritaire et badges de certification pour rassurer vos clients.</p>
        <motion.button whileTap={{ scale: 0.97 }}
          className="mt-4 bg-white text-foreground py-2.5 rounded-xl text-[12px] font-bold w-full">
          Découvrir l&apos;offre
        </motion.button>
      </div>
    </SettingsPage>
  );
}
