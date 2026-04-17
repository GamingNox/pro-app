"use client";

import type { ReactNode } from "react";

/**
 * Minimal route wrapper. No animation-induced remount = no crash risk.
 * The subtle entrance animations are handled by individual pages
 * via their own motion.div wrappers (SettingsPage, etc.).
 */
export default function RouteTransition({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
