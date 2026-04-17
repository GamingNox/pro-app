"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Clock, CheckCircle2, XCircle, AlertTriangle, MessageSquare } from "lucide-react";
import Link from "next/link";
import { tabContentVariants, tabContentTransition } from "@/lib/motion";
import { CATEGORIES } from "@/lib/categories";
import { countUnread } from "@/lib/chat";
import { supabase } from "@/lib/supabase";

export default function ClientReservationsPage() {
  const { appointments, setAppointmentStatus, getClient, userId } = useApp();

  // Unread messages counter for the "Contacter le professionnel" badge
  const [unreadMessages, setUnreadMessages] = useState(0);
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const n = await countUnread(userId);
      if (!cancelled) setUnreadMessages(n);
    })();
    // Realtime: increment on each incoming message directed to this user
    const channel = supabase
      .channel(`client-resa-msg-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${userId}` },
        () => setUnreadMessages((c) => c + 1)
      )
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [userId]);
  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];

  const upcoming = useMemo(
    () => appointments.filter((a) => a.date >= today && a.status !== "canceled").sort((a, b) => a.date.localeCompare(b.date)),
    [appointments, today]
  );
  const history = useMemo(
    () =>
      appointments
        .filter((a) => a.date < today || a.status === "done" || a.status === "canceled")
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 15),
    [appointments, today]
  );
  const list = tab === "upcoming" ? upcoming : history;
  const nextAppt = upcoming[0];

  function cancelAppointment(id: string) {
    setAppointmentStatus(id, "canceled");
    setConfirmCancelId(null);
  }

  // Scope the whole page with bookings purple
  const scopeStyle = {
    ["--color-accent" as string]: CATEGORIES.clients.color,
    ["--color-accent-soft" as string]: CATEGORIES.clients.soft,
    ["--color-accent-deep" as string]: CATEGORIES.clients.deep,
  } as React.CSSProperties;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background" style={scopeStyle}>
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <h1 className="text-[24px] font-bold text-foreground tracking-tight">Reservations</h1>
        <p className="text-[13px] text-muted mt-0.5">Gerez vos rendez-vous et votre historique.</p>
        <div className="segment-control mt-4">
          <button onClick={() => setTab("upcoming")} className={`segment-btn flex-1 ${tab === "upcoming" ? "segment-btn-active" : ""}`}>A venir</button>
          <button onClick={() => setTab("history")} className={`segment-btn flex-1 ${tab === "history" ? "segment-btn-active" : ""}`}>Historique</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} initial={tabContentVariants.initial} animate={tabContentVariants.animate} exit={tabContentVariants.exit} transition={tabContentTransition}>
              {/* Next appointment highlight */}
              {tab === "upcoming" && nextAppt && (
                <div className="mb-4">
                  <p className="section-label mb-2.5">Prochain rendez-vous</p>
                  <div className="bg-white rounded-[22px] p-5 shadow-card-premium border-l-[3px] border-l-accent">
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className="w-12 h-12 rounded-full bg-accent-soft flex items-center justify-center">
                        <CalendarDays size={20} className="text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[16px] font-bold text-foreground truncate">{nextAppt.title}</p>
                        {(() => {
                          const c = getClient(nextAppt.clientId);
                          return c ? <p className="text-[12px] text-muted mt-0.5 truncate">{c.firstName} {c.lastName}</p> : null;
                        })()}
                      </div>
                      <span className="text-[10px] font-bold text-accent bg-accent-soft px-2.5 py-1 rounded-md uppercase">Confirme</span>
                    </div>
                    <div className="border-t border-border-light pt-3 flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays size={13} className="text-muted" />
                        <span className="text-[12px] text-foreground font-medium">
                          {new Date(nextAppt.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-muted" />
                        <span className="text-[12px] text-foreground font-medium">{nextAppt.time}</span>
                      </div>
                    </div>

                    {/* Chat with the pro — available because there is an active booking */}
                    <Link href={`/chat/${nextAppt.id}`}>
                      <motion.div
                        whileTap={{ scale: 0.97 }}
                        className="w-full text-white py-3 rounded-xl text-[13px] font-bold mt-4 flex items-center justify-center gap-2 relative"
                        style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))", boxShadow: "0 4px 12px color-mix(in srgb, var(--color-accent) 30%, transparent)" }}
                      >
                        <MessageSquare size={14} strokeWidth={2.5} /> Contacter le professionnel
                        {unreadMessages > 0 && (
                          <span className="min-w-[20px] h-[20px] px-1.5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #EF4444, #BE123C)", boxShadow: "0 2px 6px rgba(239, 68, 68, 0.35)" }}>
                            {unreadMessages > 9 ? "9+" : unreadMessages}
                          </span>
                        )}
                      </motion.div>
                    </Link>

                    {/* Cancel action — working */}
                    {confirmCancelId !== nextAppt.id ? (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setConfirmCancelId(nextAppt.id)}
                        className="w-full bg-danger-soft text-danger py-3 rounded-xl text-[13px] font-bold mt-2"
                      >
                        Annuler ce rendez-vous
                      </motion.button>
                    ) : (
                      <div className="mt-4 p-3 rounded-xl bg-danger-soft">
                        <div className="flex items-center gap-2 mb-2.5">
                          <AlertTriangle size={14} className="text-danger flex-shrink-0" />
                          <p className="text-[12px] font-bold text-danger">Confirmer l&apos;annulation ?</p>
                        </div>
                        <div className="flex gap-2">
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setConfirmCancelId(null)}
                            className="flex-1 bg-white text-foreground py-2.5 rounded-lg text-[12px] font-bold"
                          >
                            Garder
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => cancelAppointment(nextAppt.id)}
                            className="flex-1 bg-danger text-white py-2.5 rounded-lg text-[12px] font-bold"
                          >
                            Annuler le RDV
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* List */}
              {tab === "upcoming" && upcoming.length > 1 && <p className="section-label mb-2.5">A venir</p>}
              {list.length === 0 || (tab === "upcoming" && upcoming.length === 1) ? (
                tab === "upcoming" && list.length === 0 ? (
                  <div className="bg-white rounded-[22px] p-8 shadow-card-premium text-center">
                    <CalendarDays size={28} className="text-muted mx-auto mb-3" />
                    <p className="text-[15px] font-bold text-foreground">Aucun rendez-vous a venir</p>
                  </div>
                ) : tab === "history" && list.length === 0 ? (
                  <div className="bg-white rounded-[22px] p-8 shadow-card-premium text-center">
                    <CalendarDays size={28} className="text-muted mx-auto mb-3" />
                    <p className="text-[15px] font-bold text-foreground">Aucun historique</p>
                  </div>
                ) : null
              ) : (
                <div className="space-y-3">
                  {(tab === "upcoming" ? list.slice(1) : list).map((appt) => (
                    <Link key={appt.id} href={`/reservations/${appt.id}`}>
                      <motion.div whileTap={{ scale: 0.99 }} className="bg-white rounded-2xl p-4 shadow-card-interactive flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${appt.status === "done" ? "bg-success-soft" : appt.status === "canceled" ? "bg-danger-soft" : "bg-accent-soft"}`}>
                          {appt.status === "done" ? (
                            <CheckCircle2 size={17} className="text-success" />
                          ) : appt.status === "canceled" ? (
                            <XCircle size={17} className="text-danger" />
                          ) : (
                            <CalendarDays size={17} className="text-accent" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-foreground truncate">{appt.title}</p>
                          <p className="text-[11px] text-muted mt-0.5">
                            {new Date(appt.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} &middot; {appt.time}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[12px] font-bold text-foreground">{new Date(appt.date).getDate()}</p>
                          <p className="text-[9px] text-muted">{new Date(appt.date).toLocaleDateString("fr-FR", { month: "short" })}</p>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
