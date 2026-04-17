"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Play, ArrowLeft } from "lucide-react";
import { useApp } from "@/lib/store";

/**
 * Visible banner shown at the top of every demo session.
 * Always provides a one-click exit back to onboarding so
 * demo users are never stuck in the app.
 */
export default memo(function DemoBanner() {
  const { isDemo, logout } = useApp();
  const router = useRouter();

  if (!isDemo) return null;

  function exitDemo() {
    try { sessionStorage.setItem("skip-onboarding-slides", "1"); } catch {}
    logout();
    router.replace("/onboarding");
  }

  return (
    <div className="flex-shrink-0 px-4 pt-2">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={exitDemo}
        className="w-full rounded-xl px-3 py-2 flex items-center gap-2.5 shadow-sm"
        style={{ background: "linear-gradient(135deg, #EEF0FF, #F4F4F5)", border: "1px solid #E4E4E7" }}
      >
        <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
          <Play size={11} className="text-accent" strokeWidth={2.5} />
        </div>
        <span className="text-[11px] font-semibold text-foreground flex-1 text-left">
          Mode demo — <span className="text-muted font-medium">session temporaire</span>
        </span>
        <span className="text-[11px] font-bold text-accent flex items-center gap-1">
          <ArrowLeft size={11} /> Accueil
        </span>
      </motion.button>
    </div>
  );
});
