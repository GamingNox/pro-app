"use client";

import { motion } from "framer-motion";
import { Lock, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { requiredPlan, PLAN_NAMES, type Feature } from "@/lib/types";
import { getFeatureContent } from "@/lib/featureContent";

// ═══ BRAND INDIGO constants ════════════════════════════
// Hardcoded so the premium identity stays consistent even when
// the parent page has a category-scoped --color-accent override.
const BRAND_PRIMARY = "#5B4FE9";
const BRAND_SOFT = "#EEF0FF";
const BRAND_DEEP = "#3B30B5";
const BRAND_DEEPER = "#2B2489";

/**
 * PremiumLockContent — the inner locked-feature experience.
 * Category pill + title + description + CTA + showcase card + benefits.
 * Used standalone inside FeatureGate (embedded) or wrapped by
 * PremiumLockScreen when it needs a full-page header.
 */
export function PremiumLockContent({ feature }: { feature: Feature }) {
  const needed = requiredPlan(feature);
  const planName = PLAN_NAMES[needed];
  const content = getFeatureContent(feature);
  const ShowcaseIcon = content.showcaseIcon;

  // Reset accent vars inside this subtree so we always show brand indigo,
  // never the category color of the parent page.
  const scopeStyle = {
    ["--color-accent" as string]: BRAND_PRIMARY,
    ["--color-accent-soft" as string]: BRAND_SOFT,
    ["--color-accent-deep" as string]: BRAND_DEEP,
  } as React.CSSProperties;

  return (
    <div className="px-6 pb-8" style={scopeStyle}>
      {/* ── HERO ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="mt-3"
      >
        <span
          className="inline-block text-[10px] font-bold uppercase tracking-[0.14em] px-3 py-1 rounded-full mb-3"
          style={{ backgroundColor: BRAND_SOFT, color: BRAND_DEEP, border: `1px solid ${BRAND_PRIMARY}20` }}
        >
          {content.category}
        </span>
        <h1 className="text-[28px] font-bold text-foreground tracking-tight leading-[1.1] mb-3">
          {content.title}
        </h1>
        <p className="text-[13px] text-muted leading-relaxed mb-5 max-w-[360px]">
          {content.description}
        </p>

        {/* Primary CTA — indigo gradient */}
        <Link href="/subscription">
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full text-white py-4 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${BRAND_PRIMARY} 0%, ${BRAND_DEEP} 100%)`,
              boxShadow: `0 6px 18px ${BRAND_PRIMARY}55, 0 2px 4px ${BRAND_PRIMARY}25`,
            }}
          >
            <Lock size={16} strokeWidth={2.5} />
            Debloquer avec le plan {planName}
          </motion.button>
        </Link>

        <Link
          href="/subscription"
          className="block text-center text-[13px] font-semibold text-muted mt-3 hover:text-foreground transition-colors"
        >
          En savoir plus
        </Link>
      </motion.div>

      {/* ── INDIGO SHOWCASE CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08, ease: [0.4, 0, 0.2, 1] }}
        className="relative rounded-[22px] overflow-hidden mt-6 mb-6"
        style={{
          background: `linear-gradient(135deg, ${BRAND_PRIMARY} 0%, ${BRAND_DEEP} 50%, ${BRAND_DEEPER} 100%)`,
          boxShadow: `0 16px 40px ${BRAND_PRIMARY}55, 0 4px 12px ${BRAND_PRIMARY}30`,
          minHeight: "180px",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -left-10 -bottom-14 w-36 h-36 rounded-full bg-white/10" />
        <div className="absolute right-6 top-6 flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-white/40" />
          ))}
        </div>

        <div className="relative z-10 p-6 h-full flex flex-col justify-between min-h-[180px]">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1.5">
                <Sparkles size={11} className="text-white/80" />
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/80">
                  {content.showcaseLabel}
                </p>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/60">
                Premium
              </p>
            </div>
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
            >
              <ShowcaseIcon size={26} className="text-white" strokeWidth={2.2} />
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] text-white/70 font-semibold tracking-wider uppercase">Plan</p>
              <p className="text-[18px] font-bold text-white tracking-tight">{planName}</p>
            </div>
            <p className="text-[10px] text-white/60 font-mono tracking-widest">•••• PRO</p>
          </div>
        </div>
      </motion.div>

      {/* ── BENEFITS LIST ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.18, ease: [0.4, 0, 0.2, 1] }}
        className="space-y-3"
      >
        {content.benefits.map((b) => {
          const BIcon = b.icon;
          return (
            <div key={b.title} className="bg-white rounded-2xl p-4 shadow-card-premium flex items-start gap-3.5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${b.color}15` }}
              >
                <BIcon size={18} style={{ color: b.color }} strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-foreground leading-tight">{b.title}</p>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* ── Bottom reassurance ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.3 }}
        className="text-[10px] text-muted text-center mt-6 max-w-[280px] mx-auto leading-relaxed"
      >
        Sans engagement. Annulable a tout moment. Support prioritaire inclus.
      </motion.p>
    </div>
  );
}

/**
 * PremiumLockScreen — full-page wrapper with back button header.
 * Used as a complete page replacement for locked features
 * (e.g., settings/stock when user doesn't have access).
 */
export default function PremiumLockScreen({ feature }: { feature: Feature }) {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* ── Header: back + premium label ── */}
      <div className="flex-shrink-0 px-6 pt-5 pb-2 flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
          style={{
            border: "1px solid #E4E4E7",
            boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <ArrowLeft size={18} className="text-foreground" strokeWidth={2.4} />
        </motion.button>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            backgroundColor: BRAND_SOFT,
            border: `1px solid ${BRAND_PRIMARY}30`,
          }}
        >
          <Sparkles size={11} style={{ color: BRAND_DEEP }} strokeWidth={2.5} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: BRAND_DEEP }}>
            Premium Access
          </span>
        </div>
        <div className="w-10" />
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <PremiumLockContent feature={feature} />
      </div>
    </div>
  );
}
