"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { Gift, Copy, Check, CheckCircle2, Users } from "lucide-react";
import SettingsPage, { SettingsSection } from "@/components/SettingsPage";

export default function SettingsReferralPage() {
  const { user } = useApp();
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => {
    const slug = user.bookingSlug || user.name?.replace(/\s/g, "").toLowerCase() || "user";
    return `${slug.toUpperCase().slice(0, 6)}-${new Date().getFullYear()}`;
  }, [user.bookingSlug, user.name]);

  const rewards = [
    { need: 1, label: "15€ de crédit", done: false },
    { need: 3, label: "50€ Bonus", done: false },
    { need: 5, label: "1 Mois Offert", done: false },
  ];

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <SettingsPage
      category="Programme privilège"
      title="Gagnez ensemble."
      description="Partagez votre expérience avec vos proches. À chaque parrainage réussi, nous vous offrons des avantages exclusifs."
    >
      {/* CTA */}
      <motion.button whileTap={{ scale: 0.97 }}
        className="w-full bg-accent text-white py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 fab-shadow mb-4">
        Inviter des amis →
      </motion.button>

      {/* Code */}
      <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-card-premium mb-5">
        <span className="text-[12px] text-muted">Code :</span>
        <span className="text-[16px] font-bold text-foreground tracking-wider flex-1">{code}</span>
        <motion.button whileTap={{ scale: 0.9 }} onClick={copyCode}
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${copied ? "bg-success" : "bg-border-light"}`}>
          {copied ? <Check size={14} className="text-white" /> : <Copy size={14} className="text-muted" />}
        </motion.button>
      </div>

      {/* Earnings */}
      <SettingsSection>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center"><Gift size={18} className="text-accent" /></div>
          <span className="text-[12px] text-muted">Gains cumulés</span>
        </div>
        <p className="text-[32px] font-bold text-foreground leading-none">0,00€</p>
        <p className="text-[12px] text-muted mt-1">Parrainez pour gagner des crédits.</p>
      </SettingsSection>

      {/* Reward tiers */}
      <SettingsSection title="Paliers de récompenses" description="Plus vous parrainez, plus vous gagnez.">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="w-full h-2 bg-border-light rounded-full overflow-hidden">
              <div className="h-full bg-border-light rounded-full" style={{ width: "0%" }} />
            </div>
          </div>
          <span className="text-[13px] font-bold text-foreground ml-3">0/5</span>
        </div>
        <div className="flex gap-2">
          {rewards.map((r) => (
            <div key={r.need} className="flex-1 text-center p-3 rounded-xl bg-border-light">
              <div className="w-6 h-6 rounded-full mx-auto mb-1.5 flex items-center justify-center bg-white text-muted shadow-sm">
                <span className="text-[9px] font-bold">{r.need}</span>
              </div>
              <p className="text-[11px] font-bold text-muted">{r.label}</p>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Empty referral list */}
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
