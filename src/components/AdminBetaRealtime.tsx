"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { incrementUnseenBeta, syncUnseenBetaFromDb } from "@/lib/beta";

// ── Global admin listener ────────────────────────────────
// - Subscribes to Supabase realtime INSERTs on beta_requests
// - Pops a toast at the top of the admin UI when a new request arrives
// - Persists unseen count to localStorage so the badge survives navigation
//
// Mounted once in the admin layout — all admin pages get live updates.

interface Toast {
  id: string;
  name: string;
  motivation: string;
}

export default function AdminBetaRealtime() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Initial sync from DB (catches up between sessions)
  useEffect(() => {
    syncUnseenBetaFromDb();
  }, []);

  // Realtime channel on beta_requests
  useEffect(() => {
    const channel = supabase
      .channel("admin-beta-requests")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "beta_requests" },
        async (payload: { new: Record<string, unknown> }) => {
          const row = payload.new;
          const userId = row.user_id ? String(row.user_id) : "";
          const motivation = (row.motivation as string) || "Nouvelle demande reçue";
          let name = "Nouvel utilisateur";

          if (userId) {
            try {
              const { data } = await supabase
                .from("user_profiles")
                .select("name")
                .eq("id", userId)
                .single();
              if (data?.name) name = data.name;
            } catch {}
          }

          const toast: Toast = {
            id: `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
            name,
            motivation: motivation.slice(0, 90),
          };
          setToasts((prev) => [toast, ...prev].slice(0, 3));
          incrementUnseenBeta();

          // Auto-dismiss after 8s
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toast.id));
          }, 8000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
      <div className="max-w-md mx-auto px-4 pt-4 space-y-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="pointer-events-auto rounded-2xl p-4 text-white relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                boxShadow: "0 14px 36px rgba(139, 92, 246, 0.42), 0 4px 12px rgba(0, 0, 0, 0.15)",
              }}
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-white/10" />
              <div className="relative z-10 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                  <Sparkles size={16} className="text-white" strokeWidth={2.5} />
                </div>
                <Link href="/admin-beta" className="flex-1 min-w-0" onClick={() => dismiss(t.id)}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/85">Nouvelle demande bêta</p>
                  <p className="text-[14px] font-bold leading-tight mt-0.5 truncate">Nouvelle demande de bêta testeur</p>
                  <p className="text-[11px] text-white/80 mt-1 truncate">
                    {t.name} — {t.motivation}
                  </p>
                </Link>
                <button
                  onClick={() => dismiss(t.id)}
                  className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 hover:bg-white/25 transition-colors"
                >
                  <X size={12} className="text-white" strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
