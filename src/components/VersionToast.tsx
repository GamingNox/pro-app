"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Sparkles } from "lucide-react";
import { useAppConfig } from "@/lib/app-config";

const SEEN_VERSION_KEY = "seen_app_version";

/**
 * Detects when a new version is deployed (admin-bumped app_config.app_version)
 * and shows a gentle toast asking the user to reload. Non-blocking: they can
 * keep working until they want to refresh.
 */
export default function VersionToast() {
  const { app_version } = useAppConfig();
  const [seenVersion, setSeenVersion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEEN_VERSION_KEY);
      if (stored) setSeenVersion(stored);
      else {
        // First visit — record current version silently so we don't toast right away.
        localStorage.setItem(SEEN_VERSION_KEY, app_version);
        setSeenVersion(app_version);
      }
    } catch { /* ignore */ }
  }, [app_version]);

  const isNewVersion = seenVersion !== null && seenVersion !== app_version && !dismissed;

  function handleReload() {
    try { localStorage.setItem(SEEN_VERSION_KEY, app_version); } catch { /* ignore */ }
    window.location.reload();
  }

  function handleDismiss() {
    try { localStorage.setItem(SEEN_VERSION_KEY, app_version); } catch { /* ignore */ }
    setDismissed(true);
  }

  return (
    <AnimatePresence>
      {isNewVersion && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9100] max-w-[360px] w-[calc(100%-32px)] rounded-2xl p-4 flex items-start gap-3 text-white"
          style={{
            background: "linear-gradient(135deg, #5B4FE9, #3B30B5)",
            boxShadow: "0 16px 40px rgba(91,79,233,0.40), 0 4px 12px rgba(0,0,0,0.10)",
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-white" strokeWidth={2.4} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold">Nouvelle version disponible</p>
            <p className="text-[11px] text-white/80 mt-0.5 leading-relaxed">
              Rechargez la page pour profiter des dernières améliorations.
            </p>
            <div className="flex gap-2 mt-2.5">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleReload}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-[11px] font-bold"
                style={{ color: "#3B30B5" }}
              >
                <RefreshCw size={11} strokeWidth={2.6} /> Recharger
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleDismiss}
                className="px-3 py-1.5 rounded-lg bg-white/15 text-[11px] font-bold text-white"
              >
                Plus tard
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
