"use client";

import { type ReactNode } from "react";
import { useApp } from "@/lib/store";
import { hasAccess, requiredPlan, PLAN_NAMES, type Feature } from "@/lib/types";
import { Lock } from "lucide-react";
import Link from "next/link";

interface FeatureGateProps {
  feature: Feature;
  children: ReactNode;
  /** If true, renders children but with an overlay lock. If false (default), replaces entirely. */
  showLocked?: boolean;
}

/** Wraps a feature. If the user's plan doesn't include it, shows a lock UI instead. */
export default function FeatureGate({ feature, children, showLocked = true }: FeatureGateProps) {
  const { user } = useApp();
  const plan = user.plan || "essentiel";

  if (hasAccess(feature, plan)) {
    return <>{children}</>;
  }

  const needed = requiredPlan(feature);
  const planName = PLAN_NAMES[needed];

  if (!showLocked) return null;

  return (
    <div className="relative">
      <div className="opacity-40 pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Link href="/subscription">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2.5 border border-border-light">
            <div className="w-7 h-7 rounded-lg bg-accent-soft flex items-center justify-center">
              <Lock size={13} className="text-accent" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-foreground">Plan {planName}</p>
              <p className="text-[9px] text-accent font-bold">Passer au plan &rarr;</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

/** Inline lock badge for menu items */
export function LockBadge({ feature }: { feature: Feature }) {
  const { user } = useApp();
  const plan = user.plan || "essentiel";

  if (hasAccess(feature, plan)) return null;

  const needed = requiredPlan(feature);

  return (
    <span className="text-[8px] font-bold text-accent bg-accent-soft px-1.5 py-0.5 rounded uppercase tracking-wider">
      {PLAN_NAMES[needed]}
    </span>
  );
}
