"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { CheckCircle2, Bell, Heart, Lock } from "lucide-react";
import SettingsPage, { SettingsToggle, SaveButton } from "@/components/SettingsPage";
import { hasAccess } from "@/lib/types";
import Link from "next/link";

export default function SettingsMessagesPage() {
  const { user } = useApp();
  const plan = user.plan || "essentiel";
  const canAccess = hasAccess("auto_reminders", plan);

  const [saved, setSaved] = useState(false);
  const [msgs, setMsgs] = useState([
    { id: "confirm", icon: CheckCircle2, color: "bg-accent-soft", iconColor: "text-accent", label: "Confirmation", desc: "Envoyé après une réservation.", active: true, text: "Votre RDV est confirmé !" },
    { id: "reminder", icon: Bell, color: "bg-warning-soft", iconColor: "text-warning", label: "Rappel", desc: "Envoyé 24h avant le RDV.", active: true, text: "Rappel : votre RDV est demain." },
    { id: "thanks", icon: Heart, color: "bg-border-light", iconColor: "text-muted", label: "Remerciement", desc: "Envoyé après la prestation.", active: false, text: "Merci pour votre visite !" },
  ]);

  function toggleMsg(id: string) { setMsgs(msgs.map((m) => m.id === id ? { ...m, active: !m.active } : m)); }
  function updateText(id: string, text: string) { setMsgs(msgs.map((m) => m.id === id ? { ...m, text } : m)); }
  function flash() { setSaved(true); setTimeout(() => setSaved(false), 1500); }

  if (!canAccess) {
    return (
      <SettingsPage category="Communication clients" title="Messages Automatisés"
        description="Configurez vos messages de confirmation, rappel et remerciement.">
        <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-4"><Lock size={28} className="text-accent" /></div>
          <h3 className="text-[20px] font-bold text-foreground">Fonctionnalité Pro</h3>
          <p className="text-[13px] text-muted mt-2 leading-relaxed max-w-[260px] mx-auto">
            Les messages automatisés sont disponibles avec le plan Pro à 9,99€/mois.
          </p>
          <Link href="/subscription">
            <motion.button whileTap={{ scale: 0.97 }} className="mt-5 bg-accent text-white py-3.5 rounded-2xl text-[14px] font-bold w-full fab-shadow">
              Passer au plan Pro
            </motion.button>
          </Link>
        </div>
      </SettingsPage>
    );
  }

  return (
    <SettingsPage category="Communication clients" title="Messages Automatisés"
      description="Configurez et personnalisez vos messages envoyés automatiquement à vos clients.">

      <div className="space-y-3 mb-6">
        {msgs.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.id} className="bg-white rounded-2xl p-5 shadow-card-premium">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full ${m.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} className={m.iconColor} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-bold text-foreground">{m.label}</p>
                    <SettingsToggle on={m.active} onToggle={() => toggleMsg(m.id)} />
                  </div>
                  <p className="text-[11px] text-muted mt-0.5">{m.desc}</p>
                </div>
              </div>
              {/* Editable message text */}
              {m.active && (
                <textarea value={m.text} onChange={(e) => updateText(m.id, e.target.value)}
                  rows={2} className="w-full bg-border-light rounded-xl px-4 py-3 text-[13px] text-foreground outline-none resize-none focus:ring-1 focus:ring-accent/20" />
              )}
            </div>
          );
        })}
      </div>

      <SaveButton onClick={flash} saving={saved} />
    </SettingsPage>
  );
}
