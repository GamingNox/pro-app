"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Undo2 } from "lucide-react";

interface UndoEvent {
  message: string;
  onUndo: () => void;
}

let pendingUndo: UndoEvent | null = null;
let listeners: (() => void)[] = [];

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

/**
 * Call this from anywhere to show an undo toast.
 * The action is delayed 5s — if user taps "Annuler", onUndo() fires
 * and the destructive action is reverted. If not, it stays done.
 *
 * Usage:
 *   import { showUndoToast } from "@/components/UndoToast";
 *   showUndoToast("Client supprimé", () => restoreClient(id));
 */
export function showUndoToast(message: string, onUndo: () => void) {
  pendingUndo = { message, onUndo };
  notifyListeners();
}

export default function UndoToast() {
  const [active, setActive] = useState<UndoEvent | null>(null);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const listener = () => {
      setActive(pendingUndo);
      setProgress(100);
      pendingUndo = null;
    };
    listeners.push(listener);
    return () => { listeners = listeners.filter((l) => l !== listener); };
  }, []);

  // Auto-dismiss after 5s with visual countdown
  useEffect(() => {
    if (!active) return;
    const start = Date.now();
    const duration = 5000;
    let raf: number;

    function tick() {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        raf = requestAnimationFrame(tick);
      } else {
        setActive(null);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const handleUndo = useCallback(() => {
    if (active?.onUndo) active.onUndo();
    setActive(null);
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="fixed bottom-24 left-4 right-4 z-[9500] max-w-md mx-auto"
        >
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-3 text-white relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #18181B, #27272A)",
              boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
            }}
          >
            {/* Progress bar at bottom */}
            <div
              className="absolute bottom-0 left-0 h-[3px] rounded-full"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #5B4FE9, #8B5CF6)",
                transition: "width 0.1s linear",
              }}
            />

            <p className="text-[13px] font-medium flex-1">{active.message}</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleUndo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold"
              style={{ backgroundColor: "rgba(91, 79, 233, 0.25)", color: "#A78BFA" }}
            >
              <Undo2 size={13} strokeWidth={2.6} />
              Annuler
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
