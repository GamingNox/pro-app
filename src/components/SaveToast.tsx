"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertCircle } from "lucide-react";

/**
 * Global save indicator. Listens to a custom DOM event "settings-saved"
 * dispatched by useUserSettings on successful persistence.
 *
 * Usage: drop <SaveToast /> once in the layout. The hook fires the event
 * automatically — no wiring needed per page.
 */
export default function SaveToast() {
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [customText, setCustomText] = useState<string | null>(null);

  useEffect(() => {
    function onSaved() {
      setCustomText(null);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1800);
    }
    function onError() {
      setCustomText(null);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    }
    function onCustom(e: Event) {
      const detail = (e as CustomEvent<{ text?: string }>).detail;
      setCustomText(detail?.text || "Enregistré");
      setStatus("saved");
      setTimeout(() => { setStatus("idle"); setCustomText(null); }, 1800);
    }
    window.addEventListener("settings-saved", onSaved);
    window.addEventListener("settings-error", onError);
    window.addEventListener("save-toast", onCustom as EventListener);
    return () => {
      window.removeEventListener("settings-saved", onSaved);
      window.removeEventListener("settings-error", onError);
      window.removeEventListener("save-toast", onCustom as EventListener);
    };
  }, []);

  return (
    <AnimatePresence>
      {status !== "idle" && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9000] px-4 py-2.5 rounded-xl flex items-center gap-2 text-white text-[12px] font-bold"
          style={{
            background: status === "saved"
              ? "linear-gradient(135deg, #5B4FE9, #3B30B5)"
              : "linear-gradient(135deg, #EF4444, #B91C1C)",
            boxShadow: status === "saved"
              ? "0 12px 28px rgba(91,79,233,0.4)"
              : "0 12px 28px rgba(239,68,68,0.4)",
          }}
        >
          {status === "saved" ? (
            <><Check size={14} strokeWidth={3} /> {customText || "Enregistré"}</>
          ) : (
            <><AlertCircle size={14} strokeWidth={2.6} /> Erreur de sauvegarde</>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
