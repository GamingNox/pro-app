"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { pageVariants, pageTransition } from "@/lib/motion";

/**
 * Wraps page content with a smooth fade+slide entrance animation.
 * Use at the top of every page component's return.
 * Only animates on mount — no exit animation (prevents flash between routes).
 */
export default function PageTransition({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={pageVariants.initial}
      animate={pageVariants.animate}
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
