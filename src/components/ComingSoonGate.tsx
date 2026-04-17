"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, AlertTriangle, Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";

/**
 * Wraps a page/section that is "coming soon" for regular users but
 * accessible with a disclaimer to approved beta testers.
 *
 * Behavior:
 * - Non-beta users see a blurred preview with a "Arrive prochainement" lock.
 * - Beta-approved users see a small lock icon; clicking it shows a
 *   disclaimer about no-warranty/beta access. After acceptance, the
 *   blur lifts and they can use the feature.
 */
export default function ComingSoonGate({
  children,
  title = "Arrive prochainement",
  subtitle = "Cette fonctionnalité n'est pas encore disponible.",
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const { user } = useApp();
  const isBeta = user.betaStatus === "approved";
  const [betaAccepted, setBetaAccepted] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const unlocked = isBeta && betaAccepted;

  return (
    <div className="relative">
      {/* The actual content — blurred & non-interactive when gated */}
      <div
        className={unlocked ? "" : "pointer-events-none select-none"}
        style={{
          filter: unlocked ? "none" : "blur(3px)",
          opacity: unlocked ? 1 : 0.55,
          transition: "filter 0.25s, opacity 0.25s",
        }}
        aria-hidden={!unlocked}
      >
        {children}
      </div>

      {/* Overlay — centered lock card */}
      {!unlocked && (
        <div className="absolute inset-0 flex items-start justify-center pt-20 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="pointer-events-auto max-w-[320px] w-[calc(100%-48px)] bg-white rounded-[22px] p-6 text-center shadow-xl"
            style={{
              boxShadow: "0 24px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(91,79,233,0.15)",
              border: "1px solid color-mix(in srgb, var(--color-primary) 12%, white)",
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #EEF0FF, #F5F3FF)",
              }}
            >
              <Lock size={22} style={{ color: "var(--color-primary)" }} strokeWidth={2.2} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--color-primary)" }}>
              Arrive prochainement
            </p>
            <h2 className="text-[20px] font-bold text-foreground tracking-tight mt-1.5">{title}</h2>
            <p className="text-[13px] text-muted mt-2 leading-relaxed">{subtitle}</p>

            {isBeta && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowDisclaimer(true)}
                className="mt-4 w-full py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5"
                style={{
                  background: "var(--color-primary-soft)",
                  color: "var(--color-primary-deep)",
                  border: "1px solid color-mix(in srgb, var(--color-primary) 30%, white)",
                }}
              >
                <Sparkles size={13} strokeWidth={2.4} /> Accès bêta testeur
              </motion.button>
            )}
          </motion.div>
        </div>
      )}

      {/* Beta disclaimer modal */}
      <AnimatePresence>
        {showDisclaimer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9500] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              className="w-full max-w-sm bg-background rounded-[28px] p-6 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center mb-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}
                >
                  <AlertTriangle size={24} style={{ color: "#B45309" }} strokeWidth={2.2} />
                </div>
                <h2 className="text-[20px] font-bold text-foreground tracking-tight">Accès bêta</h2>
                <p className="text-[13px] text-muted mt-2 leading-relaxed">
                  Cette fonctionnalité est en cours de développement.
                </p>
              </div>

              <div className="rounded-2xl p-4 mb-4" style={{ background: "#FFFBEB", border: "1px solid #FEF3C7" }}>
                <p className="text-[12px] text-foreground leading-relaxed">
                  En accédant à cette page en tant que bêta testeur, vous reconnaissez que&nbsp;:
                </p>
                <ul className="text-[12px] text-muted mt-2 space-y-1.5 leading-relaxed list-disc pl-4">
                  <li>la fonctionnalité peut être incomplète ou instable ;</li>
                  <li>les données saisies peuvent être perdues ou incohérentes ;</li>
                  <li>Clientbase ne peut pas garantir un fonctionnement correct ;</li>
                  <li>toute utilisation se fait à vos propres risques.</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDisclaimer(false)}
                  className="flex-1 py-3 rounded-xl text-[13px] font-bold text-foreground"
                  style={{ background: "var(--color-border-light)" }}
                >
                  Annuler
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setBetaAccepted(true); setShowDisclaimer(false); }}
                  className="flex-1 py-3 rounded-xl text-[13px] font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
                    boxShadow: "0 8px 20px color-mix(in srgb, var(--color-primary) 25%, transparent)",
                  }}
                >
                  J&apos;ai compris
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
