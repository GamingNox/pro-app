"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { CalendarDays, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function ClientReservationsPage() {
  const { appointments } = useApp();
  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");
  const today = new Date().toISOString().split("T")[0];

  const upcoming = useMemo(() => appointments.filter((a) => a.date >= today && a.status !== "canceled").sort((a, b) => a.date.localeCompare(b.date)), [appointments, today]);
  const history = useMemo(() => appointments.filter((a) => a.date < today || a.status === "done" || a.status === "canceled").sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15), [appointments, today]);
  const list = tab === "upcoming" ? upcoming : history;

  const nextAppt = upcoming[0];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <h1 className="text-[24px] font-bold text-foreground tracking-tight">Réservations</h1>
        <p className="text-[13px] text-muted mt-0.5">Gérez vos rendez-vous et votre historique.</p>
        <div className="segment-control mt-4">
          <button onClick={() => setTab("upcoming")} className={`segment-btn flex-1 ${tab === "upcoming" ? "segment-btn-active" : ""}`}>À venir</button>
          <button onClick={() => setTab("history")} className={`segment-btn flex-1 ${tab === "history" ? "segment-btn-active" : ""}`}>Historique</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {/* Next appointment highlight */}
          {tab === "upcoming" && nextAppt && (
            <div className="mb-4">
              <p className="section-label mb-2.5">Prochain rendez-vous</p>
              <div className="bg-white rounded-[22px] p-5 shadow-card-premium border-l-[3px] border-l-accent">
                <div className="flex items-center gap-3.5 mb-3">
                  <div className="w-12 h-12 rounded-full bg-accent-soft flex items-center justify-center">
                    <CalendarDays size={20} className="text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[16px] font-bold text-foreground">{nextAppt.title}</p>
                    <p className="text-[12px] text-accent font-semibold mt-0.5">{nextAppt.title}</p>
                  </div>
                  <span className="text-[10px] font-bold text-accent bg-accent-soft px-2.5 py-1 rounded-md uppercase">Confirmé</span>
                </div>
                <div className="border-t border-border-light pt-3 flex items-center gap-4">
                  <div className="flex items-center gap-1.5"><CalendarDays size={13} className="text-muted" /><span className="text-[12px] text-foreground font-medium">{new Date(nextAppt.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span></div>
                  <div className="flex items-center gap-1.5"><Clock size={13} className="text-muted" /><span className="text-[12px] text-foreground font-medium">{nextAppt.time}</span></div>
                </div>
                <div className="flex gap-3 mt-4">
                  <motion.button whileTap={{ scale: 0.95 }} className="flex-1 bg-accent text-white py-3 rounded-xl text-[13px] font-bold text-center">Modifier</motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} className="flex-1 bg-border-light text-muted py-3 rounded-xl text-[13px] font-bold text-center">Annuler</motion.button>
                </div>
              </div>
            </div>
          )}

          {/* List */}
          {tab === "upcoming" && <p className="section-label mb-2.5">En attente</p>}
          {list.length === 0 ? (
            <div className="bg-white rounded-[22px] p-8 shadow-card-premium text-center">
              <CalendarDays size={28} className="text-muted mx-auto mb-3" />
              <p className="text-[15px] font-bold text-foreground">{tab === "upcoming" ? "Aucun rendez-vous à venir" : "Aucun historique"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(tab === "upcoming" ? list.slice(1) : list).map((appt) => (
                <div key={appt.id} className="bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${appt.status === "done" ? "bg-success-soft" : appt.status === "canceled" ? "bg-danger-soft" : "bg-accent-soft"}`}>
                    {appt.status === "done" ? <CheckCircle2 size={17} className="text-success" /> : appt.status === "canceled" ? <XCircle size={17} className="text-danger" /> : <CalendarDays size={17} className="text-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">{appt.title}</p>
                    <p className="text-[11px] text-muted mt-0.5">{new Date(appt.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {appt.time}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[12px] font-bold text-foreground">{new Date(appt.date).getDate()}</p>
                    <p className="text-[9px] text-muted">{new Date(appt.date).toLocaleDateString("fr-FR", { month: "short" })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
