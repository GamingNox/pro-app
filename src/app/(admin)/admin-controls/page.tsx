"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wrench, Lock, Megaphone, Rocket, Loader2, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Config {
  maintenance_mode: boolean;
  maintenance_message: string;
  site_closed: boolean;
  site_closed_message: string;
  announcement: string | null;
  announcement_type: "info" | "warning" | "critical";
  app_version: string;
}

const DEFAULT: Config = {
  maintenance_mode: false,
  maintenance_message: "Maintenance en cours, merci de patienter.",
  site_closed: false,
  site_closed_message: "Le site est temporairement fermé. Nous revenons très vite.",
  announcement: null,
  announcement_type: "info",
  app_version: "1.0.0",
};

export default function AdminControlsPage() {
  const [config, setConfig] = useState<Config>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("app_config").select("*").eq("id", 1).single();
      if (data) setConfig({ ...DEFAULT, ...data });
      setLoading(false);
    }
    load();
  }, []);

  async function save(patch: Partial<Config>) {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) { setSaving(false); return; }
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (res.ok && data?.config) {
        setConfig({ ...DEFAULT, ...data.config });
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1500);
      }
    } finally {
      setSaving(false);
    }
  }

  function bumpVersion() {
    const parts = config.app_version.split(".").map((p) => parseInt(p, 10) || 0);
    parts[2] = (parts[2] || 0) + 1;
    save({ app_version: parts.join(".") });
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-muted" size={24} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="px-6 pt-5 pb-32">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[24px] font-bold text-foreground tracking-tight">Contrôles du site</h1>
            <p className="text-[13px] text-muted mt-1">Maintenance, fermeture, annonce, déploiement.</p>
          </div>
          {savedFlash && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 text-[12px] font-bold text-success"
            >
              <Check size={12} strokeWidth={2.8} /> Enregistré
            </motion.div>
          )}
        </div>

        {/* Maintenance */}
        <Card icon={Wrench} iconBg="#FFFBEB" iconColor="#D97706"
              title="Mode maintenance"
              description="Affiche une bannière orange en haut de l'app. Les utilisateurs continuent à pouvoir tout utiliser."
        >
          <Toggle on={config.maintenance_mode} onToggle={(v) => save({ maintenance_mode: v })} disabled={saving} />
          <textarea
            value={config.maintenance_message}
            onChange={(e) => setConfig({ ...config, maintenance_message: e.target.value })}
            onBlur={() => save({ maintenance_message: config.maintenance_message })}
            rows={2}
            className="input-field w-full resize-none text-[13px] mt-3"
            placeholder="Message affiché dans la bannière"
          />
        </Card>

        {/* Site closed */}
        <Card icon={Lock} iconBg="#FEE2E2" iconColor="#B91C1C"
              title="Fermeture du site"
              description="Bloque totalement l'accès pour tout le monde sauf les admins. À utiliser pour un bug critique."
        >
          <Toggle on={config.site_closed} onToggle={(v) => save({ site_closed: v })} disabled={saving} />
          <textarea
            value={config.site_closed_message}
            onChange={(e) => setConfig({ ...config, site_closed_message: e.target.value })}
            onBlur={() => save({ site_closed_message: config.site_closed_message })}
            rows={3}
            className="input-field w-full resize-none text-[13px] mt-3"
            placeholder="Message affiché à l'utilisateur"
          />
        </Card>

        {/* Annonce */}
        <Card icon={Megaphone} iconBg="#EEF0FF" iconColor="#5B4FE9"
              title="Annonce globale"
              description="Une bannière en haut de l'app (ex : nouvelle fonctionnalité, panne Resend…). Laissez vide pour masquer."
        >
          <div className="flex gap-2 mb-3">
            {(["info", "warning", "critical"] as const).map((t) => {
              const active = config.announcement_type === t;
              const label = t === "info" ? "Info" : t === "warning" ? "Attention" : "Critique";
              const color = t === "info" ? "#5B4FE9" : t === "warning" ? "#D97706" : "#B91C1C";
              return (
                <motion.button
                  key={t}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => save({ announcement_type: t })}
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg text-[12px] font-bold"
                  style={{
                    background: active ? color : "var(--color-border-light)",
                    color: active ? "white" : "var(--color-muted)",
                  }}
                >
                  {label}
                </motion.button>
              );
            })}
          </div>
          <textarea
            value={config.announcement || ""}
            onChange={(e) => setConfig({ ...config, announcement: e.target.value })}
            onBlur={() => save({ announcement: config.announcement?.trim() || null })}
            rows={2}
            className="input-field w-full resize-none text-[13px]"
            placeholder="Laissez vide pour masquer la bannière"
          />
        </Card>

        {/* App version */}
        <Card icon={Rocket} iconBg="#F0FDF4" iconColor="#15803D"
              title="Version de l'app"
              description="Incrémente la version actuelle. Chaque client affiche un toast 'Nouvelle version disponible' jusqu'à rechargement."
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-border-light rounded-xl px-4 py-3 font-mono text-[13px]">
              {config.app_version}
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={bumpVersion}
              disabled={saving}
              className="px-5 py-3 rounded-xl text-[12px] font-bold text-white disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #15803D, #166534)",
              }}
            >
              Incrémenter
            </motion.button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  description,
  children,
}: {
  icon: typeof Wrench;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: iconBg }}>
          <Icon size={18} style={{ color: iconColor }} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-foreground">{title}</p>
          <p className="text-[12px] text-muted mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({
  on,
  onToggle,
  disabled,
}: {
  on: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.95 }}
      onClick={() => !disabled && onToggle(!on)}
      className={`w-12 h-[28px] rounded-full flex items-center px-0.5 transition-colors ${on ? "justify-end" : "justify-start"}`}
      style={{ backgroundColor: on ? "#5B4FE9" : "#E4E4E7" }}
    >
      <motion.div layout transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="w-[24px] h-[24px] rounded-full bg-white shadow-sm" />
    </motion.button>
  );
}
