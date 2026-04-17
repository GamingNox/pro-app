"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Mail, Phone, CalendarDays, Trash2, Check, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/lib/store";

interface WaitlistEntry {
  id: string;
  service_id: string | null;
  preferred_date: string | null;
  client_first: string;
  client_last: string | null;
  client_email: string | null;
  client_phone: string | null;
  note: string | null;
  status: "waiting" | "contacted" | "resolved" | "expired";
  created_at: string;
}

export default function WaitlistPage() {
  const router = useRouter();
  const { userId, services } = useApp();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "waiting" | "contacted">("waiting");

  // Initial load + realtime subscription
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("waitlist")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        if (error) console.error("[waitlist] load failed:", error.message);
        setEntries((data as WaitlistEntry[]) || []);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`waitlist-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "waitlist", filter: `user_id=eq.${userId}` },
        (p) => {
          if (p.eventType === "INSERT") {
            setEntries((prev) => [p.new as WaitlistEntry, ...prev]);
          } else if (p.eventType === "UPDATE") {
            setEntries((prev) => prev.map((e) => (e.id === p.new.id ? (p.new as WaitlistEntry) : e)));
          } else if (p.eventType === "DELETE") {
            setEntries((prev) => prev.filter((e) => e.id !== p.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function markContacted(id: string) {
    const snapshot = entries;
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status: "contacted" } : e)));
    const { error } = await supabase.from("waitlist").update({ status: "contacted" }).eq("id", id);
    if (error) {
      console.error("[waitlist] update failed:", error.message);
      setEntries(snapshot);
    }
  }

  async function deleteEntry(id: string) {
    const snapshot = entries;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    const { error } = await supabase.from("waitlist").delete().eq("id", id);
    if (error) {
      console.error("[waitlist] delete failed:", error.message);
      setEntries(snapshot);
    }
  }

  const filtered = entries.filter((e) => {
    if (filter === "all") return true;
    return e.status === filter;
  });

  const waitingCount = entries.filter((e) => e.status === "waiting").length;
  const contactedCount = entries.filter((e) => e.status === "contacted").length;

  function serviceName(id: string | null) {
    if (!id) return null;
    return services.find((s) => s.id === id)?.name || null;
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* ═══ HEADER ═══ */}
      <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
          style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}
        >
          <ArrowLeft size={18} className="text-foreground" strokeWidth={2.4} />
        </motion.button>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--color-primary-deep)" }}>
            Réservations
          </p>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight leading-tight">Liste d&apos;attente</h1>
        </div>
        {waitingCount > 0 && (
          <div
            className="min-w-[34px] h-7 px-2 rounded-full flex items-center justify-center text-[12px] font-bold text-white"
            style={{
              background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
              boxShadow: "0 3px 10px color-mix(in srgb, var(--color-primary) 30%, transparent)",
            }}
          >
            {waitingCount}
          </div>
        )}
      </div>

      {/* ═══ FILTER PILLS ═══ */}
      <div className="flex-shrink-0 px-6 pb-3 flex gap-2">
        {[
          { key: "waiting", label: "En attente", count: waitingCount },
          { key: "contacted", label: "Contactés", count: contactedCount },
          { key: "all", label: "Tous", count: entries.length },
        ].map((f) => {
          const active = filter === f.key;
          return (
            <motion.button
              key={f.key}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter(f.key as "all" | "waiting" | "contacted")}
              className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5"
              style={{
                backgroundColor: active ? "var(--color-primary)" : "white",
                color: active ? "white" : "var(--color-muted)",
                border: active ? "none" : "1px solid var(--color-border)",
              }}
            >
              {f.label}
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                style={{
                  backgroundColor: active ? "rgba(255,255,255,0.25)" : "var(--color-border-light)",
                }}
              >
                {f.count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* ═══ LIST ═══ */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {loading ? (
            <p className="text-[12px] text-muted text-center py-8">Chargement…</p>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center mt-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: "var(--color-primary-soft)" }}
              >
                <Users size={24} style={{ color: "var(--color-primary)" }} strokeWidth={2.2} />
              </div>
              <p className="text-[15px] font-bold text-foreground">
                {filter === "waiting"
                  ? "Aucun client en attente"
                  : filter === "contacted"
                  ? "Aucun client contacté"
                  : "Liste d'attente vide"}
              </p>
              <p className="text-[12px] text-muted mt-1.5 max-w-[280px] mx-auto leading-relaxed">
                Les clients qui ne trouvent pas de créneau sur votre page publique peuvent s&apos;inscrire pour être prévenus.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {filtered.map((e) => {
                  const svc = serviceName(e.service_id);
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white rounded-2xl p-4 shadow-card-premium"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-[14px] font-bold text-foreground truncate">
                              {e.client_first} {e.client_last || ""}
                            </p>
                            {e.status === "contacted" && (
                              <span
                                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: "var(--color-success-soft)",
                                  color: "var(--color-success)",
                                }}
                              >
                                Contacté
                              </span>
                            )}
                          </div>

                          {/* Contact info */}
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
                            {e.client_email && (
                              <a
                                href={`mailto:${e.client_email}`}
                                className="text-[11px] text-muted flex items-center gap-1 hover:text-foreground"
                              >
                                <Mail size={11} /> {e.client_email}
                              </a>
                            )}
                            {e.client_phone && (
                              <a
                                href={`tel:${e.client_phone}`}
                                className="text-[11px] text-muted flex items-center gap-1 hover:text-foreground"
                              >
                                <Phone size={11} /> {e.client_phone}
                              </a>
                            )}
                          </div>

                          {/* Metadata */}
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {svc && (
                              <span className="text-[10px] text-muted flex items-center gap-1">
                                <span
                                  className="w-1 h-1 rounded-full"
                                  style={{ backgroundColor: "var(--color-primary)" }}
                                />
                                {svc}
                              </span>
                            )}
                            {e.preferred_date && (
                              <span className="text-[10px] text-muted flex items-center gap-1">
                                <CalendarDays size={10} /> Souhaité : {formatDate(e.preferred_date)}
                              </span>
                            )}
                            <span className="text-[10px] text-subtle flex items-center gap-1">
                              <Clock size={10} /> Inscrit {formatDateTime(e.created_at)}
                            </span>
                          </div>

                          {/* Note */}
                          {e.note && (
                            <p className="text-[11px] text-foreground/80 italic mt-2 leading-relaxed bg-border-light rounded-lg px-3 py-2">
                              “{e.note}”
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border-light">
                        {e.status === "waiting" && (
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => markContacted(e.id)}
                            className="flex-1 py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5"
                            style={{
                              backgroundColor: "var(--color-primary-soft)",
                              color: "var(--color-primary-deep)",
                              border: "1px solid color-mix(in srgb, var(--color-primary) 20%, white)",
                            }}
                          >
                            <Check size={12} strokeWidth={2.8} /> Marquer comme contacté
                          </motion.button>
                        )}
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => deleteEntry(e.id)}
                          className="w-9 h-9 rounded-lg flex items-center justify-center bg-danger-soft"
                          aria-label="Supprimer"
                        >
                          <Trash2 size={13} className="text-danger" />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Help card */}
          <div
            className="mt-5 rounded-2xl p-4 flex items-start gap-3"
            style={{ backgroundColor: "var(--color-primary-soft)" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "white" }}
            >
              <Clock size={15} style={{ color: "var(--color-primary)" }} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-foreground">Comment ça marche ?</p>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                Quand un client ne trouve pas de créneau sur votre page publique, il peut laisser ses coordonnées ici.
                Quand un créneau se libère (annulation, nouvelle dispo), contactez-le en un tap — email ou téléphone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}