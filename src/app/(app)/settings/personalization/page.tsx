"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Palette } from "lucide-react";
import SettingsPage, { SettingsSection, SettingsToggle, SettingsRow } from "@/components/SettingsPage";

const COLORS = [
  { n: "Bleu", v: "#007AFF" }, { n: "Violet", v: "#7C3AED" }, { n: "Vert", v: "#10B981" },
  { n: "Rose", v: "#EC4899" }, { n: "Orange", v: "#F59E0B" }, { n: "Cyan", v: "#06B6D4" },
];

export default function SettingsPersonalizationPage() {
  const [saved, setSaved] = useState(false);
  const [accentColor, setAccentColor] = useState("#007AFF");
  const [tone, setTone] = useState<"friendly" | "pro" | "concise">("friendly");
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const c = localStorage.getItem("accent-color");
    if (c) setAccentColor(c);
  }, []);

  function applyColor(c: string) {
    setAccentColor(c);
    document.documentElement.style.setProperty("--color-accent", c);
    localStorage.setItem("accent-color", c);
  }

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 1500); }

  return (
    <SettingsPage
      category="Application"
      title="Personnalisation"
      description="Adaptez l'apparence et le comportement de l'application à votre image."
      icon={<div className="w-9 h-9 rounded-full bg-accent-soft flex items-center justify-center"><Palette size={16} className="text-accent" /></div>}
    >
      {/* Color */}
      <SettingsSection title="Couleur d'accent" description="Appliquée instantanément sur toute l'application.">
        <div className="flex gap-3 flex-wrap">
          {COLORS.map((c) => (
            <motion.button key={c.v} whileTap={{ scale: 0.9 }} onClick={() => applyColor(c.v)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${accentColor === c.v ? "ring-2 ring-offset-2 ring-foreground" : ""}`}
              style={{ backgroundColor: c.v }}>
              {accentColor === c.v && <CheckCircle2 size={18} className="text-white" />}
            </motion.button>
          ))}
        </div>
      </SettingsSection>

      {/* Tone */}
      <SettingsSection title="Style de l'assistant" description="Choisissez le ton des messages générés automatiquement.">
        <div className="space-y-2">
          {([["friendly", "Amical", "Ton chaleureux et décontracté"], ["pro", "Professionnel", "Ton formel et structuré"], ["concise", "Minimaliste", "Messages courts et directs"]] as const).map(([k, l, d]) => (
            <motion.button key={k} whileTap={{ scale: 0.98 }} onClick={() => setTone(k)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl text-left ${tone === k ? "bg-accent-soft ring-1 ring-accent/20" : "bg-border-light"}`}>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${tone === k ? "border-accent" : "border-border"}`}>
                {tone === k && <div className="w-2 h-2 rounded-full bg-accent" />}
              </div>
              <div>
                <p className="text-[13px] font-bold text-foreground">{l}</p>
                <p className="text-[11px] text-muted">{d}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </SettingsSection>

      {/* Display */}
      <SettingsSection title="Affichage">
        <SettingsRow label="Cartes compactes" hint="Affichage condensé des listes." last>
          <SettingsToggle on={compact} onToggle={() => setCompact(!compact)} />
        </SettingsRow>
      </SettingsSection>

      <motion.button whileTap={{ scale: 0.97 }} onClick={flash}
        className="w-full bg-accent text-white py-4 rounded-2xl text-[14px] font-bold fab-shadow mb-5">
        {saved ? "Enregistré !" : "Enregistrer"}
      </motion.button>
    </SettingsPage>
  );
}
