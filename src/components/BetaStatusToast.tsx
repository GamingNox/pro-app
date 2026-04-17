"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { useApp } from "@/lib/store";
import type { BetaStatus } from "@/lib/types";

// ── One-shot celebration toast ───────────────────────────
// Watches the current user's beta_status and shows a welcome message the
// first time it becomes "approved" (or a refusal message when "rejected").
// The last acknowledged status is stored per-user in localStorage so the
// toast doesn't reappear on every reload.
//
// CRITICAL BUG FIX:
// We intentionally do NOT show a "revoked" toast. The old implementation
// compared the in-memory `status` ("none" by default) against an acked
// value of "approved", which caused a race on app start where user data
// hadn't loaded yet — the "revoked" toast would fire and get immediately
// replaced by "approved" once the DB fetch completed, producing a
// conflicting two-message sequence.
//
// We also skip the effect entirely while `user.betaStatus` is undefined
// (data not yet loaded) and use a ref to guarantee one toast per session
// per transition.

function ackKey(userId: string | null) {
  return `beta-status-ack:${userId || "anon"}`;
}

type ToastKind = "approved" | "rejected";

export default function BetaStatusToast() {
  const { user, userId } = useApp();
  const [visible, setVisible] = useState<null | ToastKind>(null);
  // Track whether we've already fired a toast in this component lifetime,
  // so repeated re-renders (e.g., every focus refetch) don't re-pop it.
  const firedRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    // Hard guard: wait until the profile has actually loaded. `user.betaStatus`
    // is undefined before `completeAuth` writes the profile into state, and we
    // must NOT infer any status from that transient state.
    if (user.betaStatus === undefined) return;
    if (firedRef.current) return;

    const status: BetaStatus = user.betaStatus;

    let acked: BetaStatus = "none";
    try {
      acked = (localStorage.getItem(ackKey(userId)) as BetaStatus) || "none";
    } catch {}

    if (status === "approved" && acked !== "approved") {
      setVisible("approved");
      firedRef.current = true;
    } else if (status === "rejected" && acked !== "rejected") {
      setVisible("rejected");
      firedRef.current = true;
    }
    // NOTE: no "revoked" branch. When admin removes beta access, the profile
    // entry naturally switches back to "Devenir bêta testeur" — no toast.
  }, [user.betaStatus, userId]);

  function dismiss() {
    setVisible(null);
    try {
      if (userId && user.betaStatus) {
        localStorage.setItem(ackKey(userId), user.betaStatus);
      }
    } catch {}
  }

  // Auto-dismiss after 10s
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(dismiss, 10000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  const approved = visible === "approved";

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
      <div className="max-w-md mx-auto px-4 pt-4">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="pointer-events-auto rounded-2xl p-4 text-white relative overflow-hidden"
            style={approved
              ? { background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)", boxShadow: "0 14px 36px rgba(139, 92, 246, 0.42)" }
              : { background: "linear-gradient(135deg, #71717A 0%, #3F3F46 100%)", boxShadow: "0 14px 36px rgba(0,0,0,0.25)" }}
          >
            <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10" />
            <div className="relative z-10 flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                <Sparkles size={18} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/85">
                  {approved ? "Bienvenue" : "Mise à jour"}
                </p>
                <p className="text-[14px] font-bold leading-tight mt-0.5">
                  {approved
                    ? "Vous êtes maintenant bêta testeur 🎉"
                    : "Votre demande n'a pas été acceptée"}
                </p>
                <p className="text-[11px] text-white/85 mt-1 leading-relaxed">
                  {approved
                    ? "L'Espace bêta est débloqué depuis votre profil."
                    : "Vous pouvez soumettre une nouvelle candidature plus tard."}
                </p>
                {approved && (
                  <Link href="/beta-space" onClick={dismiss}>
                    <div className="mt-3 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 inline-flex items-center gap-1.5 text-[11px] font-bold">
                      Ouvrir l&apos;Espace bêta <ArrowRight size={12} strokeWidth={2.5} />
                    </div>
                  </Link>
                )}
              </div>
              <button
                onClick={dismiss}
                className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 hover:bg-white/25 transition-colors"
              >
                <X size={12} className="text-white" strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
