"use client";

import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { Eye, Star, Camera, FileText, ChevronRight, Globe, Lock } from "lucide-react";
import SettingsPage, { SettingsSection, SettingsToggle } from "@/components/SettingsPage";
import { hasAccess } from "@/lib/types";
import Link from "next/link";

export default function SettingsVisibilityPage() {
  const { user, appointments, clients } = useApp();
  const plan = user.plan || "essentiel";
  const canAccess = hasAccess("custom_branding", plan); // Elite only

  const totalBookings = appointments.filter((a) => a.status !== "canceled").length;

  if (!canAccess) {
    return (
      <SettingsPage category="Tableau de bord" title="Profil Public" description="Analysez votre visibilité et transformez vos visiteurs en clients fidèles.">
        <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-accent" />
          </div>
          <h3 className="text-[20px] font-bold text-foreground">Fonctionnalité Elite</h3>
          <p className="text-[13px] text-muted mt-2 leading-relaxed max-w-[260px] mx-auto">
            Le profil public est disponible avec le plan Elite à 19,99€/mois. Boostez votre visibilité en ligne.
          </p>
          <Link href="/subscription">
            <motion.button whileTap={{ scale: 0.97 }}
              className="mt-5 bg-accent text-white py-3.5 rounded-2xl text-[14px] font-bold w-full fab-shadow">
              Passer au plan Elite
            </motion.button>
          </Link>
        </div>
      </SettingsPage>
    );
  }

  return (
    <SettingsPage category="Tableau de bord" title="Performance & Conversion"
      description="Analysez votre visibilité et transformez vos visiteurs en clients fidèles avec des données en temps réel.">

      <SettingsSection>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-foreground">Visibilité du Profil</p>
            <p className="text-[10px] text-muted mt-0.5">En ligne et prêt à recevoir des clients</p>
          </div>
          <SettingsToggle on={true} onToggle={() => {}} />
        </div>
      </SettingsSection>

      {/* Real KPIs */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-4 shadow-card-premium text-center">
          <Globe size={16} className="text-accent mx-auto mb-1.5" />
          <p className="text-[22px] font-bold text-foreground">{totalBookings}</p>
          <p className="text-[10px] text-muted">Réservations</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card-premium text-center">
          <Star size={16} className="text-warning mx-auto mb-1.5" />
          <p className="text-[22px] font-bold text-foreground">{clients.length}</p>
          <p className="text-[10px] text-muted">Clients actifs</p>
        </div>
      </div>

      {/* Tips */}
      <div className="mb-5">
        <h2 className="text-[18px] font-bold text-foreground mb-3">Conseils d&apos;Optimisation</h2>
        <div className="space-y-3">
          {[
            { icon: Camera, title: "Ajoutez des photos", desc: "Les profils avec photos augmentent leurs clics de 20%." },
            { icon: FileText, title: "Complétez votre bio", desc: "Décrivez votre spécialité pour un meilleur référencement." },
            { icon: Star, title: "Sollicitez des avis", desc: "Les avis clients renforcent la confiance de vos prospects." },
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

      {/* Preview */}
      <SettingsSection title="Aperçu">
        <div className="bg-foreground rounded-2xl p-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent-soft mx-auto mb-3 flex items-center justify-center"><Eye size={24} className="text-accent" /></div>
          <p className="text-[16px] font-bold text-white">{user.name || "Mon Profil"}</p>
          {user.business && <p className="text-[11px] text-white/60 mt-0.5">{user.business}</p>}
          <motion.button whileTap={{ scale: 0.97 }} className="mt-3 bg-accent text-white py-2.5 rounded-xl text-[12px] font-bold w-full">
            Réserver un créneau
          </motion.button>
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
