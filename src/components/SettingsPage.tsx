"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface SettingsPageProps {
  category: string;
  title: string;
  description: string;
  children: ReactNode;
  icon?: ReactNode;
}

export default function SettingsPage({ category, title, description, children, icon }: SettingsPageProps) {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.push("/profile")}
              className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
              <ArrowLeft size={17} className="text-foreground" />
            </motion.button>
            <span className="text-[15px] font-semibold text-foreground">Settings</span>
          </div>
          {icon || (
            <div className="w-9 h-9 rounded-full bg-accent-soft flex items-center justify-center">
              <Settings size={16} className="text-accent" />
            </div>
          )}
        </div>
        <p className="text-[10px] text-accent font-bold uppercase tracking-wider mb-2">{category}</p>
        <h1 className="text-[28px] font-bold text-foreground tracking-tight leading-tight">{title}</h1>
        <p className="text-[13px] text-muted mt-2 leading-relaxed">{description}</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Section card wrapper */
export function SettingsSection({ title, description, children }: { title?: string; description?: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      {title && <h2 className="text-[18px] font-bold text-foreground mb-1">{title}</h2>}
      {description && <p className="text-[12px] text-muted mb-3 leading-relaxed">{description}</p>}
      <div className="bg-white rounded-2xl p-5 shadow-card-premium">
        {children}
      </div>
    </div>
  );
}

/** Save button */
export function SaveButton({ onClick, label = "Enregistrer les modifications" }: { onClick: () => void; label?: string }) {
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick}
      className="w-full bg-accent text-white py-4 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 fab-shadow">
      {label} <ArrowLeft size={15} className="rotate-180" />
    </motion.button>
  );
}

/** Toggle component */
export function SettingsToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.9 }} onClick={onToggle}
      className={`w-11 h-[26px] rounded-full flex items-center px-0.5 transition-all ${on ? "justify-end" : "justify-start"}`}
      style={{ backgroundColor: on ? "var(--color-accent)" : "var(--color-border)" }}>
      <div className="w-[22px] h-[22px] rounded-full bg-white shadow-sm" />
    </motion.button>
  );
}

/** Row with label + control */
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
