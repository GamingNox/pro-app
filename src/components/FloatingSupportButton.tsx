"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { useApp } from "@/lib/store";
import SupportChat from "./SupportChat";

const DISMISS_KEY = "floating_support_dismissed_at";

/**
 * Small "?" pill anchored just above the bottom nav. Tap → opens
 * SupportChat. Hidden on /chat routes (conflict with the chat UI) and
 * for clients (pro feature). Can be temporarily dismissed — comes back
 * after 24h so it's always available when the user needs help.
 */
export default function FloatingSupportButton() {
  const { user, userId, isDemo } = useApp();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const ts = parseInt(raw, 10);
        if (!Number.isNaN(ts) && Date.now() - ts < 24 * 60 * 60 * 1000) {
          setVisible(false);
        }
      }
    } catch { /* ignore */ }
  }, []);

  if (!userId || isDemo) return null;
  if (user.accountType === "client") return null;
  if (!visible) return null;

  // Note: the host page decides whether to show this via the app layout,
  // which already knows the current route. Keep the component agnostic.

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="support-pill"
            initial={{ opacity: 0, y: 20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setOpen(true)}
            className="fixed z-[8500] flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-white"
            style={{
              right: "18px",
              bottom: "calc(82px + env(safe-area-inset-bottom, 0px) + 12px)",
              background: "linear-gradient(135deg, #5B4FE9, #3B30B5)",
              boxShadow: "0 10px 24px rgba(91,79,233,0.40), 0 2px 6px rgba(0,0,0,0.12)",
            }}
            aria-label="Contacter le support"
          >
            <HelpCircle size={15} strokeWidth={2.4} />
            <span className="text-[11px] font-bold">Aide</span>
          </motion.button>
        )}
      </AnimatePresence>

      <SupportChat
        open={open}
        onClose={() => setOpen(false)}
        userId={userId}
        userName={user.name || user.email || "Utilisateur"}
      />
    </>
  );
}
