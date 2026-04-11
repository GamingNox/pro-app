"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { spring, settingsVariants, settingsTransition, staggerItem } from "@/lib/motion";

interface SettingsPageProps {
  category: string;
  title: string;
  description: string;
  children: ReactNode;
}

export default function SettingsPage({ category, title, description, children }: SettingsPageProps) {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Back bar */}
      <div className="flex-shrink-0 px-6 pt-5 pb-2 flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} transition={spring.snappy} onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center btn-hover">
          <ArrowLeft size={17} className="text-foreground" />
        </motion.button>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          className="text-[15px] font-semibold text-foreground">Paramètres</motion.span>
      </div>

      {/* All content scrolls together with entrance animation */}
      <motion.div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}
        initial={settingsVariants.initial} animate={settingsVariants.animate} transition={settingsTransition}>
        <div className="px-6 pb-32">
          {/* Header */}
          <motion.div className="pt-3 pb-5" {...staggerItem}>
            <p className="text-[10px] text-accent font-bold uppercase tracking-wider mb-2">{category}</p>
            <h1 className="text-[28px] font-bold text-foreground tracking-tight leading-tight">{title}</h1>
            <p className="text-[13px] text-muted mt-2 leading-relaxed">{description}</p>
          </motion.div>

          {/* Page content */}
          {children}
        </div>
      </motion.div>
    </div>
  );
}

export function SettingsSection({ title, description, children }: { title?: string; description?: string; children: ReactNode }) {
  return (
    <motion.div className="mb-5" {...staggerItem}>
      {title && <h2 className="text-[18px] font-bold text-foreground mb-1">{title}</h2>}
      {description && <p className="text-[12px] text-muted mb-3 leading-relaxed">{description}</p>}
      <div className="bg-white rounded-2xl p-5 shadow-card-premium card-hover">{children}</div>
    </motion.div>
  );
}

export function SaveButton({ onClick, saving = false, label = "Enregistrer les modifications" }: { onClick: () => void; saving?: boolean; label?: string }) {
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick}
      className="w-full bg-accent text-white py-4 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 fab-shadow mb-5 btn-hover">
      {saving ? "Enregistré !" : label}
    </motion.button>
  );
}

export function SettingsToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.9 }} onClick={onToggle}
      className={`w-11 h-[26px] rounded-full flex items-center px-0.5 transition-all duration-200 ${on ? "justify-end" : "justify-start"}`}
      style={{ backgroundColor: on ? "var(--color-accent)" : "var(--color-border)" }}>
      <motion.div layout transition={spring.snappy} className="w-[22px] h-[22px] rounded-full bg-white shadow-sm" />
    </motion.button>
  );
}

export function SettingsRow({ label, hint, children, last = false }: { label: string; hint?: string; children: ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-3.5 ${last ? "" : "border-b border-border-light"}`}>
      <div className="flex-1 min-w-0 mr-3">
        <span className="text-[13px] font-medium text-foreground">{label}</span>
        {hint && <p className="text-[10px] text-muted mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
