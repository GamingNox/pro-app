"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { Gift, Share2, Copy, Check, CheckCircle2, Bell, Users } from "lucide-react";
import SettingsPage, { SettingsSection } from "@/components/SettingsPage";

export default function SettingsReferralPage() {
  const { user } = useApp();
  const [copied, setCopied] = useState(false);
  const [refCount] = useState(3);

  const code = useMemo(() => {
    const slug = user.bookingSlug || user.name?.replace(/\s/g, "").toLowerCase() || "user";
    return `${slug.toUpperCase().slice(0, 6)}-${new Date().getFullYear()}`;
  }, [user.bookingSlug, user.name]);

  const rewards = [
    { need: 1, label: "15€ de crédit", done: refCount >= 1 },
    { need: 3, label: "50€ Bonus", done: refCount >= 3 },
    { need: 5, label: "1 Mois Offert", done: refCount >= 5 },
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
      description="Partagez votre expérience avec vos proches. À chaque parrainage réussi, nous vous offrons des avantages exclusifs ainsi qu'à votre filleul."
    >
      {/* CTA + code */}
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

      {/* Earnings */}
      <SettingsSection>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center"><Gift size={18} className="text-accent" /></div>
          <span className="text-[12px] text-muted">Gains cumulés</span>
        </div>
        <p className="text-[32px] font-bold text-foreground leading-none">450,00€</p>
        <p className="text-[12px] text-muted mt-1">Crédits disponibles sur votre compte</p>
      </SettingsSection>

      {/* Reward tiers */}
      <SettingsSection title="Paliers de récompenses" description="Plus vous parrainez, plus vous gagnez.">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="w-full h-2 bg-border-light rounded-full overflow-hidden">
              <motion.div className="h-full bg-accent rounded-full" initial={{ width: "0%" }} animate={{ width: `${Math.min((refCount / 5) * 100, 100)}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>
          <span className="text-[13px] font-bold text-foreground ml-3">{refCount}/5</span>
        </div>
        <div className="flex gap-2">
          {rewards.map((r) => (
            <div key={r.need} className={`flex-1 text-center p-3 rounded-xl ${r.done ? "bg-accent-soft" : "bg-border-light"}`}>
              <div className={`w-6 h-6 rounded-full mx-auto mb-1.5 flex items-center justify-center ${r.done ? "bg-accent text-white" : "bg-white text-muted shadow-sm"}`}>
                {r.done ? <CheckCircle2 size={12} /> : <span className="text-[9px] font-bold">{r.need}</span>}
              </div>
              <p className={`text-[11px] font-bold ${r.done ? "text-accent" : "text-muted"}`}>{r.label}</p>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Referral list */}
      <SettingsSection title="Amis parrainés">
        <div className="space-y-3">
          {[
            { name: "Marie Claire", date: "12 Fév 2024", status: "Confirmé", amount: "+15,00€" },
            { name: "Thomas Durant", date: "08 Fév 2024", status: "1er RDV prévu", amount: "En attente" },
            { name: "Sophie Laurent", date: "02 Jan 2024", status: "Confirmé", amount: "+15,00€" },
          ].map((ref, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center text-accent text-[12px] font-bold">
                {ref.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-foreground">{ref.name}</p>
                <p className="text-[10px] text-muted">Inscrit le {ref.date}</p>
              </div>
              <div className="text-right">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${ref.status === "Confirmé" ? "text-success bg-success-soft" : "text-accent bg-accent-soft"}`}>
                  {ref.status}
                </span>
                <p className="text-[12px] font-bold text-foreground mt-0.5 italic">{ref.amount}</p>
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
