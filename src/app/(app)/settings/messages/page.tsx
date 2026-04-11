"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Bell, Heart, MessageCircle, Send, Clock } from "lucide-react";
import SettingsPage, { SettingsSection, SettingsToggle } from "@/components/SettingsPage";

export default function SettingsMessagesPage() {
  const [saved, setSaved] = useState(false);
  const [msgs, setMsgs] = useState([
    { id: "confirm", icon: CheckCircle2, color: "bg-accent-soft", iconColor: "text-accent", label: "Confirmation", desc: "Envoyé immédiatement après une réservation.", active: true, text: "Votre RDV est confirmé !" },
    { id: "reminder", icon: Bell, color: "bg-warning-soft", iconColor: "text-warning", label: "Rappel", desc: "Envoyé 24h avant l'événement prévu.", active: true, text: "Rappel : RDV demain." },
    { id: "thanks", icon: Heart, color: "bg-border-light", iconColor: "text-muted", label: "Remerciement", desc: "Envoyé 2h après la fin de la prestation.", active: false, text: "Merci pour votre visite !" },
  ]);

  function toggleMsg(id: string) {
    setMsgs(msgs.map((m) => m.id === id ? { ...m, active: !m.active } : m));
  }
  function updateText(id: string, text: string) {
    setMsgs(msgs.map((m) => m.id === id ? { ...m, text } : m));
  }
  function flash() { setSaved(true); setTimeout(() => setSaved(false), 1500); }

  return (
    <SettingsPage
      category="Communication clients"
      title="Messages Automatisés"
      description="Configurez et personnalisez vos flux de messagerie pour offrir une expérience client irréprochable sans lever le petit doigt."
    >
      {/* Message toggles */}
      <div className="space-y-3 mb-6">
        {msgs.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.id} className="bg-white rounded-2xl p-5 shadow-card-premium">
              <div className="flex items-start gap-3">
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
            </div>
          );
        })}
      </div>

      {/* Preview */}
      <SettingsSection title="Prévisualisation directe">
        <div className="bg-border-light rounded-2xl p-4">
          <div className="space-y-3">
            {/* Incoming message */}
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[80%]">
                <p className="text-[12px] text-foreground">Bonjour Jean ! Votre séance est confirmée pour demain à 14h00. À très vite !</p>
              </div>
            </div>
            {/* Reply */}
            <div className="flex justify-end">
              <div className="bg-accent rounded-2xl rounded-tr-sm px-4 py-3 max-w-[70%]">
                <p className="text-[12px] text-white">Super, merci beaucoup !</p>
              </div>
            </div>
            {/* Auto reminder */}
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm max-w-[85%]">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock size={10} className="text-accent" />
                  <span className="text-[9px] text-accent font-bold uppercase tracking-wider">Rappel automatique</span>
                </div>
                <p className="text-[11px] text-muted">Prévu le 12 Mars à 03:00</p>
                <div className="mt-2 bg-border-light rounded-xl px-3 py-2">
                  <p className="text-[11px] text-foreground italic">&quot;Bonjour [Client], c&apos;est un petit rappel pour votre rendez-vous de demain. Au plaisir de vous voir !&quot;</p>
                </div>
              </div>
            </div>
          </div>
          {/* Input mock */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
            <div className="flex-1 bg-white rounded-xl px-4 py-2.5 text-[12px] text-muted">Écrire un message...</div>
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center"><Send size={14} className="text-white" /></div>
          </div>
        </div>
      </SettingsSection>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-4 shadow-card-premium text-center">
          <p className="text-[24px] font-bold text-foreground">98%</p>
          <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-1">Taux de réponse</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card-premium text-center">
          <p className="text-[24px] font-bold text-foreground">4.2h</p>
          <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-1">Temps gagné / sem</p>
        </div>
      </div>

      <motion.button whileTap={{ scale: 0.97 }} onClick={flash}
        className="w-full bg-accent text-white py-4 rounded-2xl text-[14px] font-bold fab-shadow mb-5">
        {saved ? "Enregistré !" : "Enregistrer"}
      </motion.button>
    </SettingsPage>
  );
}
