"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { Gift, Copy, Check, Users, Percent } from "lucide-react";
import SettingsPage, { SettingsSection } from "@/components/SettingsPage";

export default function SettingsReferralPage() {
  const { user } = useApp();
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => {
    const slug = user.bookingSlug || user.name?.replace(/\s/g, "").toLowerCase() || "user";
    return `${slug.toUpperCase().slice(0, 6)}-${new Date().getFullYear()}`;
  }, [user.bookingSlug, user.name]);

  const rewards = [
    { need: 1, label: "-20% pendant 1 mois", icon: Percent },
    { need: 3, label: "1 mois offert", icon: Gift },
    { need: 5, label: "2 mois offerts", icon: Gift },
  ];

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <SettingsPage category="Programme privilège" title="Gagnez ensemble."
      description="Partagez votre expérience avec vos proches. À chaque parrainage réussi, vous bénéficiez de réductions sur votre abonnement.">

      <motion.button whileTap={{ scale: 0.97 }}
        className="w-full bg-accent text-white py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 fab-shadow mb-4">
        Inviter des amis →
      </motion.button>

      <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-card-premium mb-5">
        <span className="text-[12px] text-muted">Code :</span>
        <span className="text-[16px] font-bold text-foreground tracking-wider flex-1">{code}</span>
        <motion.button whileTap={{ scale: 0.9 }} onClick={copyCode}
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${copied ? "bg-success" : "bg-border-light"}`}>
          {copied ? <Check size={14} className="text-white" /> : <Copy size={14} className="text-muted" />}
        </motion.button>
      </div>

      <SettingsSection title="Récompenses abonnement" description="Chaque palier réduit le coût de votre abonnement.">
        <div className="space-y-3">
          {rewards.map((r, i) => {
            const Icon = r.icon;
            return (
              <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-border-light">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <Icon size={16} className="text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-foreground">{r.need} parrainage{r.need > 1 ? "s" : ""}</p>
                  <p className="text-[11px] text-accent font-bold">{r.label}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-border-light">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-muted">Progression</p>
            <p className="text-[12px] font-bold text-foreground">0 / 5</p>
          </div>
          <div className="w-full h-2 bg-border-light rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: "0%" }} />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Amis parrainés">
        <div className="text-center py-6">
          <Users size={28} className="text-muted mx-auto mb-2" />
          <p className="text-[13px] font-bold text-foreground">Aucun filleul</p>
          <p className="text-[11px] text-muted mt-1">Partagez votre code pour commencer.</p>
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
