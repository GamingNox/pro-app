"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import type { ReactNode, CSSProperties } from "react";
import { settingsVariants, settingsTransition, notificationVariants, notificationTransition, staggerItem, tap, spring } from "@/lib/motion";
import { getCategoryForRoute } from "@/lib/categories";

interface SettingsPageProps {
  category: string;
  title: string;
  description: string;
  children: ReactNode;
  /** Entry animation variant. "notification" uses a slide-from-top + scale
   *  treatment distinct from regular settings pages. */
  variant?: "default" | "notification";
}

export default function SettingsPage({ category, title, description, children, variant = "default" }: SettingsPageProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Resolve the category color for the current settings route.
  // This overrides --color-accent for the whole subtree, so every child
  // using bg-accent / text-accent / var(--color-accent) automatically
  // picks up the category color. Full visual immersion inside a page.
  const cat = getCategoryForRoute(pathname);
  const scopeStyle: CSSProperties = {
    ["--color-accent" as string]: cat.color,
    ["--color-accent-soft" as string]: cat.soft,
    ["--color-accent-deep" as string]: cat.deep,
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background" style={scopeStyle}>
      {/* Back bar — strong visibility */}
      <div className="flex-shrink-0 px-6 pt-5 pb-2 flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          transition={spring.snappy}
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white flex items-center justify-center btn-hover"
          style={{
            border: "1px solid #E4E4E7",
            boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <ArrowLeft size={18} className="text-foreground" strokeWidth={2.4} />
        </motion.button>
        <span className="text-[15px] font-semibold text-foreground">Parametres</span>
      </div>

      {/* All content scrolls together with entrance animation */}
      <motion.div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}
        initial={variant === "notification" ? notificationVariants.initial : settingsVariants.initial}
        animate={variant === "notification" ? notificationVariants.animate : settingsVariants.animate}
        transition={variant === "notification" ? notificationTransition : settingsTransition}>
        <div className="px-6 pb-32">
          {/* Header with category color */}
          <motion.div className="pt-3 pb-5" {...staggerItem}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
              <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: cat.color }}>{category}</p>
            </div>
            <h1 className="text-[28px] font-bold text-foreground tracking-tight leading-tight">{title}</h1>
            <p className="text-[13px] text-muted mt-2 leading-relaxed">{description}</p>
          </motion.div>

          {/* Page content — inherits category --color-accent */}
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
    <motion.button whileTap={tap.button} onClick={onClick}
      className="w-full text-white py-4 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 btn-hover mb-5"
      style={{
        background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
        boxShadow: "0 10px 24px color-mix(in srgb, var(--color-primary) 30%, transparent)",
      }}>
      {saving ? "Enregistre !" : label}
    </motion.button>
  );
}

export function SettingsToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
      onToggle();
      // Haptic feedback on toggle (mobile)
      try { navigator?.vibrate?.(10); } catch {}
    }}
      className={`w-11 h-[26px] rounded-full flex items-center px-0.5 transition-all duration-100 ${on ? "justify-end" : "justify-start"}`}
      style={{ backgroundColor: on ? "var(--color-primary)" : "var(--color-border)" }}>
      <motion.div layout transition={spring.snappy} className="w-[22px] h-[22px] rounded-full bg-white shadow-sm" />
    </motion.button>
  );
}

/** Violet-branded primary button used for CTAs across settings pages. */
export function PrimaryButton({ children, onClick, disabled = false, className = "" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return (
    <motion.button whileTap={disabled ? undefined : { scale: 0.98 }} onClick={() => {
      if (!disabled && onClick) {
        try { navigator?.vibrate?.(15); } catch {}
        onClick();
      }
    }} disabled={disabled}
      className={`w-full text-white py-3.5 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2 btn-hover disabled:opacity-60 ${className}`}
      style={{
        background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
        boxShadow: disabled ? "none" : "0 8px 20px color-mix(in srgb, var(--color-primary) 25%, transparent)",
      }}>
      {children}
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
