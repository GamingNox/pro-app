"use client";

import { type ReactNode } from "react";
import { useApp } from "@/lib/store";
import { hasAccess, requiredPlan, PLAN_NAMES, type Feature } from "@/lib/types";
import { Sparkles } from "lucide-react";
import { PremiumLockContent } from "./PremiumLockScreen";

interface FeatureGateProps {
  feature: Feature;
  children: ReactNode;
  /** If true (default), renders the rich premium lock screen instead of children. */
  showLocked?: boolean;
}

/**
 * Wraps a feature. If the user's plan doesn't include it:
 *  - showLocked=true (default) → renders the full PremiumLockContent (hero + showcase + benefits)
 *  - showLocked=false → renders nothing
 * If the user has access, renders children.
 *
 * This is used for sub-sections (e.g., tabs inside Gestion page). For full standalone
 * locked pages, use PremiumLockScreen directly.
 */
export default function FeatureGate({ feature, children, showLocked = true }: FeatureGateProps) {
  const { user } = useApp();
  const plan = user.plan || "essentiel";

  if (hasAccess(feature, plan)) {
    return <>{children}</>;
  }

  if (!showLocked) return null;

  // Full-replacement rich premium content (no overlay, no dimmed children)
  return <PremiumLockContent feature={feature} />;
}

/** Inline premium badge for menu items. Uses brand indigo. */
export function LockBadge({ feature }: { feature: Feature }) {
  const { user } = useApp();
  const plan = user.plan || "essentiel";

  if (hasAccess(feature, plan)) return null;

  const needed = requiredPlan(feature);

  return (
    <span
      className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5"
      style={{ background: "#EEF0FF", color: "#3B30B5" }}
    >
      <Sparkles size={7} /> {PLAN_NAMES[needed]}
    </span>
  );
}
