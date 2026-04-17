"use client";

import { motion } from "framer-motion";
import { fadeIn } from "@/lib/motion";

/** Skeleton placeholder — use while data is loading. */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

/** Full card skeleton with title + 3 text lines. */
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-card-premium space-y-3">
      <SkeletonBlock className="skeleton-title" />
      <SkeletonBlock className="skeleton-text w-full" />
      <SkeletonBlock className="skeleton-text w-4/5" />
      <SkeletonBlock className="skeleton-text w-3/5" />
    </div>
  );
}

/** List skeleton — shows N skeleton rows. */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-card-premium">
          <SkeletonBlock className="skeleton-avatar flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="skeleton-text w-2/3" />
            <SkeletonBlock className="skeleton-text w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Wraps content with a fade-in once it's ready. Pass `ready` to control. */
export function FadeInContent({ ready, children, className = "" }: { ready: boolean; children: React.ReactNode; className?: string }) {
  if (!ready) return null;
  return (
    <motion.div {...fadeIn} className={className}>
      {children}
    </motion.div>
  );
}
