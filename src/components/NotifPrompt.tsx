"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Loader2 } from "lucide-react";
import { useApp } from "@/lib/store";
import {
  isPushSupported,
  getSubscriptionStatus,
  subscribeToPush,
} from "@/lib/push";

const LS_KEY = "notif_prompt_seen";

/**
 * One-shot welcome prompt asking the user to enable push notifications.
 * Shown the first time a freshly-signed-in pro lands on the app shell.
 * Respects the user's past choice — if they dismissed or already enabled,
 * never shown again.
 */
export default function NotifPrompt() {
  const { userId, isDemo, hasOnboarded, user } = useApp();
  const [show, setShow] = useState(false);
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    // Gate: only for real pro users, onboarded, once.
    if (!userId || isDemo || !hasOnboarded || user.accountType !== "pro") return;
    if (!isPushSupported()) return;
    try {
      if (localStorage.getItem(LS_KEY)) return;
    } catch { return; }

    let cancelled = false;
    (async () => {
      const status = await getSubscriptionStatus();
      if (cancelled) return;
      // Already subscribed, or user has actively blocked notifications — skip.
      if (status === "subscribed" || status === "denied") {
        try { localStorage.setItem(LS_KEY, "skipped"); } catch { /* ignore */ }
        return;
      }
      // Small delay so the prompt doesn't appear on top of the splash/initial
      // route transition. Feels like the app is settling, then asking.
      setTimeout(() => { if (!cancelled) setShow(true); }, 1500);
    })();

    return () => { cancelled = true; };
  }, [userId, isDemo, hasOnboarded, user.accountType]);

  async function handleEnable() {
    if (!userId) return;
    setEnabling(true);
    try {
      await subscribeToPush(userId);
    } catch { /* ignore */ }
    try { localStorage.setItem(LS_KEY, "enabled"); } catch { /* ignore */ }
    setEnabling(false);
    setShow(false);
  }

  function handleDismiss() {
    try { localStorage.setItem(LS_KEY, "dismissed"); } catch { /* ignore */ }
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9400] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="w-full max-w-sm rounded-[28px] overflow-hidden relative"
            style={{
              background: "linear-gradient(180deg, #FAFAF9, #FFFFFF)",
              boxShadow: "0 24px 60px rgba(91,79,233,0.30), 0 8px 24px rgba(0,0,0,0.12)",
            }}
          >
            <button
              onClick={handleDismiss}
              className="absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center z-10"
              style={{ background: "rgba(0,0,0,0.04)" }}
            >
              <X size={16} className="text-muted" strokeWidth={2.4} />
            </button>

            {/* Hero */}
            <div
              className="px-6 pt-8 pb-6 text-center relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #EEF0FF, #F5F3FF)" }}
            >
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full" style={{ background: "rgba(91,79,233,0.08)" }} />
              <div className="absolute -left-6 bottom-0 w-24 h-24 rounded-full" style={{ background: "rgba(91,79,233,0.06)" }} />

              <motion.div
                initial={{ scale: 0.85, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 340, damping: 20 }}
                className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center relative"
                style={{
                  background: "linear-gradient(135deg, #5B4FE9, #3B30B5)",
                  boxShadow: "0 12px 28px rgba(91,79,233,0.35)",
                }}
              >
                <Bell size={28} className="text-white" strokeWidth={2.2} />
                {/* Pulse */}
                <motion.div
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: "#5B4FE9" }}
                />
              </motion.div>

              <h2 className="text-[22px] font-bold text-foreground tracking-tight relative z-10">
                Restez au courant en temps réel
              </h2>
              <p className="text-[13px] text-muted mt-2 leading-relaxed max-w-[280px] mx-auto relative z-10">
                Activez les notifications pour ne rien manquer de vos rendez-vous, messages et alertes importantes.
              </p>
            </div>

            {/* Benefits */}
            <div className="px-6 py-5">
              <div className="space-y-2.5 mb-5">
                {[
                  { emoji: "📅", text: "Nouvelles réservations" },
                  { emoji: "❌", text: "Annulations de RDV" },
                  { emoji: "💬", text: "Messages de vos clients" },
                  { emoji: "📦", text: "Alertes stock bas" },
                ].map((b, i) => (
                  <motion.div
                    key={b.emoji}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                    className="flex items-center gap-3 rounded-xl p-2.5"
                    style={{ background: "var(--color-border-light)" }}
                  >
                    <span className="text-[18px]">{b.emoji}</span>
                    <span className="text-[13px] font-semibold text-foreground">{b.text}</span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleEnable}
                disabled={enabling}
                className="w-full text-white py-3.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #5B4FE9, #3B30B5)",
                  boxShadow: "0 10px 24px rgba(91,79,233,0.30)",
                }}
              >
                {enabling ? <><Loader2 size={16} className="animate-spin" /> Activation…</> : "Activer les notifications"}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleDismiss}
                className="w-full py-3 text-[12px] font-semibold text-muted mt-1"
              >
                Plus tard
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
