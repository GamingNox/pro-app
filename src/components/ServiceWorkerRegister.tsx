"use client";

import { useEffect } from "react";

// Registers /sw.js on first load so the push manager is ready whenever
// the user later grants permission. Silent failure — the rest of the app
// keeps working even if the SW registration is rejected by the browser.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Defer to idle time so we do not compete with first paint.
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((e) => {
        console.warn("[sw] register failed:", e);
      });
    };
    if ("requestIdleCallback" in window) {
      (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback?.(register);
    } else {
      setTimeout(register, 1200);
    }
  }, []);

  return null;
}
