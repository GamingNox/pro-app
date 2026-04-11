"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { Eye, TrendingUp, Star, Camera, FileText, ChevronRight, Globe } from "lucide-react";
import SettingsPage, { SettingsSection, SettingsToggle } from "@/components/SettingsPage";

export default function SettingsVisibilityPage() {
  const { user, appointments } = useApp();
  const [visible, setVisible] = useState(true);

  const weeklyViews = [25, 38, 30, 52, 45, 60, 48];
  const maxView = Math.max(...weeklyViews);
  const totalBookings = appointments.filter((a) => a.status !== "canceled").length;

  return (
    <SettingsPage
      category="Tableau de bord"
      title="Performance & Conversion"
      description="Analysez votre visibilité et transformez vos visiteurs en clients fidèles avec des données en temps réel."
    >
      {/* Visibility toggle */}
      <SettingsSection>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-foreground">Visibilité du Profil</p>
            <p className="text-[10px] text-muted mt-0.5">En ligne et prêt à recevoir des clients</p>
          </div>
          <SettingsToggle on={visible} onToggle={() => setVisible(!visible)} />
        </div>
      </SettingsSection>

      {/* Profile views chart */}
      <SettingsSection title="Vues du Profil" description="7 derniers jours">
        <div className="flex items-center justify-end gap-2 mb-3">
          <TrendingUp size={14} className="text-success" />
          <span className="text-[12px] font-bold text-success">+12.5%</span>
        </div>
        <div className="flex items-end gap-[6px] h-[100px] mb-3">
          {weeklyViews.map((v, i) => (
            <motion.div key={i} className={`flex-1 rounded-[4px] ${i === weeklyViews.length - 1 ? "bg-accent" : "bg-accent/15"}`}
              initial={{ height: "10%" }} animate={{ height: `${Math.max((v / maxView) * 100, 8)}%` }}
              transition={{ delay: i * 0.06, duration: 0.5 }} />
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-muted">
          {["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"].map((d) => <span key={d}>{d}</span>)}
        </div>
      </SettingsSection>

      {/* Bookings KPI */}
      <div className="bg-accent-gradient rounded-2xl p-5 text-white mb-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Clics bouton</span>
          <Globe size={16} className="text-white/40" />
        </div>
        <p className="text-[28px] font-bold leading-none">{totalBookings}</p>
        <p className="text-[11px] text-white/60 mt-0.5">Réservations initiées</p>
      </div>

      {/* Rating */}
      <SettingsSection>
        <div className="flex items-center gap-2 mb-1">
          <Star size={18} className="text-warning fill-warning" />
          <span className="text-[9px] text-muted font-bold uppercase tracking-wider">Note globale</span>
        </div>
        <p className="text-[32px] font-bold text-foreground leading-none mt-2">4.9</p>
        <p className="text-[12px] text-muted mt-1">Sur 38 avis clients</p>
      </SettingsSection>

      {/* Tips */}
      <div className="mb-5">
        <h2 className="text-[18px] font-bold text-foreground mb-3">Conseils d&apos;Optimisation</h2>
        <div className="space-y-3">
          {[
            { icon: Camera, title: "Ajoutez 2 photos", desc: "Les profils avec plus de 5 photos augmentent leurs clics de 20%." },
            { icon: FileText, title: "Bio Incomplète", desc: "Décrivez votre spécialité en 200 mots pour un meilleur référencement." },
            { icon: Star, title: "Sollicitez des Avis", desc: "3 nouveaux avis cette semaine pourraient vous placer en top liste." },
          ].map((tip) => {
            const Icon = tip.icon;
            return (
              <div key={tip.title} className="bg-white rounded-2xl p-4 shadow-card-premium flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0"><Icon size={18} className="text-accent" /></div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-foreground">{tip.title}</p>
                  <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{tip.desc}</p>
                </div>
                <ChevronRight size={16} className="text-muted mt-2" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile preview */}
      <SettingsSection title="Aperçu Mobile">
        <div className="bg-foreground rounded-2xl p-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent-soft mx-auto mb-3 flex items-center justify-center">
            <Eye size={24} className="text-accent" />
          </div>
          <p className="text-[16px] font-bold text-white">{user.name || "Mon Profil"}</p>
          {user.business && <p className="text-[11px] text-white/60 mt-0.5">{user.business}</p>}
          <p className="text-[11px] text-warning mt-1 flex items-center justify-center gap-1"><Star size={10} className="fill-warning" /> 4.9 (38 avis)</p>
          <motion.button whileTap={{ scale: 0.97 }} className="mt-3 bg-accent text-white py-2.5 rounded-xl text-[12px] font-bold w-full">
            Réserver un créneau
          </motion.button>
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
