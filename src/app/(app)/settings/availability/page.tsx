"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Plus, X as XIcon, Lightbulb } from "lucide-react";
import SettingsPage, { SettingsSection, SettingsToggle } from "@/components/SettingsPage";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

export default function SettingsAvailabilityPage() {
  const [saved, setSaved] = useState(false);
  const [schedules] = useState([
    { day: "Lundi", slots: ["09:00 – 12:00", "14:00 – 18:00"], active: true },
    { day: "Mardi", slots: ["09:00 – 17:30"], active: true },
    { day: "Mercredi", slots: [], active: false },
    { day: "Jeudi", slots: ["09:00 – 18:00"], active: true },
    { day: "Vendredi", slots: ["09:00 – 16:00"], active: true },
  ]);
  const [cancelDelay, setCancelDelay] = useState("24 heures avant");
  const [lateCancel, setLateCancel] = useState("Jusqu'à 12h avant");
  const [visibility, setVisibility] = useState("60");
  const [autoConfirm, setAutoConfirm] = useState(true);

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 1500); }

  return (
    <SettingsPage
      category="Configuration"
      title="Disponibilités & Horaires"
      description="Définissez vos créneaux de travail et vos règles de réservation pour offrir une expérience fluide à vos clients."
    >
      {/* Weekly schedule */}
      <SettingsSection title="Semaine Type">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-medium text-foreground">Calendrier</span>
          <span className="text-[10px] font-bold text-accent bg-accent-soft px-2.5 py-1 rounded-full uppercase tracking-wider">Actif</span>
        </div>

        <div className="space-y-4">
          {schedules.map((s) => (
            <div key={s.day} className="flex items-start gap-3">
              <span className="text-[13px] font-medium text-foreground w-20 pt-2">{s.day}</span>
              <div className="flex-1">
                {s.active ? (
                  <div className="space-y-2">
                    {s.slots.map((slot, i) => (
                      <div key={i} className="bg-border-light rounded-xl px-4 py-2.5 text-[13px] text-foreground font-medium">{slot}</div>
                    ))}
                    <button className="text-accent text-[11px] font-bold flex items-center gap-1"><Plus size={12} /> Ajouter</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[12px] text-muted italic">Indisponible</span>
                    <button className="text-[11px] text-accent font-bold">Activer</button>
                  </div>
                )}
              </div>
              {s.active && <CalendarDays size={16} className="text-muted mt-2 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Exceptions */}
      <SettingsSection title="Congés & Exceptions" description="Ajoutez des dates spécifiques où vous ne serez pas disponible (vacances, jours fériés).">
        <motion.button whileTap={{ scale: 0.97 }}
          className="w-full bg-border-light rounded-xl py-3.5 text-[13px] font-bold text-accent flex items-center justify-center gap-2">
          <CalendarDays size={15} /> Ajouter une exception
        </motion.button>
      </SettingsSection>

      {/* Booking rules */}
      <SettingsSection title="Règles de Réservation">
        <div className="space-y-5">
          <div>
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Délai minimum</label>
            <div className="bg-border-light rounded-xl px-4 py-3 text-[13px] text-foreground">{cancelDelay}</div>
            <p className="text-[10px] text-muted mt-1">Temps minimum requis pour qu&apos;un client puisse réserver.</p>
          </div>
          <div>
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Annulation tardive</label>
            <div className="bg-border-light rounded-xl px-4 py-3 text-[13px] text-foreground">{lateCancel}</div>
            <p className="text-[10px] text-muted mt-1">Délai limite pour une annulation sans frais.</p>
          </div>
          <div>
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Plage de visibilité</label>
            <div className="flex items-center gap-3">
              <div className="bg-border-light rounded-xl px-4 py-3 text-[13px] text-foreground font-bold w-20 text-center">{visibility}</div>
              <span className="text-[13px] text-foreground">jours</span>
            </div>
            <p className="text-[10px] text-muted mt-1">Nombre de jours à l&apos;avance visibles sur votre profil.</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-foreground">Confirmation auto.</span>
            <SettingsToggle on={autoConfirm} onToggle={() => setAutoConfirm(!autoConfirm)} />
          </div>
        </div>
      </SettingsSection>

      {/* Expert tip */}
      <div className="bg-accent-gradient rounded-2xl p-5 text-white mb-5">
        <div className="flex items-start gap-3">
          <Lightbulb size={20} className="text-white/80 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[14px] font-bold">Conseil Expert</p>
            <p className="text-[12px] text-white/70 mt-1 leading-relaxed">
              Les créneaux de 45 minutes avec 15 minutes de pause sont les plus populaires auprès des clients actifs.
            </p>
          </div>
        </div>
      </div>

      <motion.button whileTap={{ scale: 0.97 }} onClick={flash}
        className="w-full bg-accent text-white py-4 rounded-2xl text-[14px] font-bold fab-shadow flex items-center justify-center gap-2 mb-5">
        {saved ? "Enregistré !" : "Enregistrer les modifications →"}
      </motion.button>
    </SettingsPage>
  );
}
