"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";
import { getInitials } from "@/lib/data";
import Modal from "@/components/Modal";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Circle,
  CalendarDays,
  List,
  Trash2,
} from "lucide-react";
import type { AppointmentStatus } from "@/lib/types";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function getWeekDays(baseDate: Date): Date[] {
  const d = new Date(baseDate);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return dd;
  });
}

function fmt(d: Date) { return d.toISOString().split("T")[0]; }

const statusMap: Record<AppointmentStatus, { label: string; color: string; bg: string; icon: typeof Circle }> = {
  confirmed: { label: "Confirmé", color: "text-accent", bg: "bg-accent-soft", icon: Circle },
  done: { label: "Terminé", color: "text-success", bg: "bg-success-soft", icon: CheckCircle2 },
  canceled: { label: "Annulé", color: "text-danger", bg: "bg-danger-soft", icon: XCircle },
};

type View = "calendar" | "list";

export default function AppointmentsPage() {
  const { appointments, clients, services, getClient, addAppointment, setAppointmentStatus, deleteAppointment } = useApp();
  const searchParams = useSearchParams();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekBase, setWeekBase] = useState(new Date());
  const [showNew, setShowNew] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<string | null>(null);
  const [view, setView] = useState<View>("calendar");

  const [form, setForm] = useState({
    title: "", clientId: "", date: fmt(new Date()), time: "09:00", duration: "60", price: "", notes: "",
  });

  useEffect(() => {
    if (searchParams.get("new") === "1") setShowNew(true);
  }, [searchParams]);

  const weekDays = useMemo(() => getWeekDays(weekBase), [weekBase]);
  const today = fmt(new Date());
  const selectedStr = fmt(selectedDate);

  const dayAppts = useMemo(
    () => appointments.filter((a) => a.date === selectedStr).sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, selectedStr]
  );

  const upcoming = useMemo(
    () => appointments.filter((a) => a.date >= today && a.status !== "canceled")
      .sort((a, b) => a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)).slice(0, 20),
    [appointments, today]
  );

  const dayCounts = useMemo(() => {
    const m: Record<string, number> = {};
    appointments.forEach((a) => { if (a.status !== "canceled") m[a.date] = (m[a.date] || 0) + 1; });
    return m;
  }, [appointments]);

  function handleSubmit() {
    if (!form.title.trim()) return;
    addAppointment({
      title: form.title.trim(), clientId: form.clientId, date: form.date, time: form.time,
      duration: parseInt(form.duration) || 60, price: parseFloat(form.price) || 0, status: "confirmed", notes: form.notes,
    });
    setShowNew(false);
    setForm({ title: "", clientId: "", date: fmt(new Date()), time: "09:00", duration: "60", price: "", notes: "" });
  }

  const viewedAppt = selectedAppt ? appointments.find((a) => a.id === selectedAppt) : null;

  function ApptCard({ appt, i, showDate = false }: { appt: typeof appointments[0]; i: number; showDate?: boolean }) {
    const client = getClient(appt.clientId);
    const st = statusMap[appt.status];
    const StIcon = st.icon;
    return (
      <motion.button
        initial={{ y: 4 }}
        animate={{ y: 0 }}
        transition={{ delay: i * 0.03 }}
        onClick={() => setSelectedAppt(appt.id)}
        className="bg-white rounded-2xl p-4 shadow-apple flex items-center gap-3.5 text-left w-full tap-scale"
      >
        {/* Time pill */}
        <div className={`w-[50px] flex-shrink-0 text-center py-2 rounded-xl ${st.bg}`}>
          <p className={`text-[13px] font-bold leading-none ${st.color}`}>{appt.time}</p>
          <p className="text-[9px] text-muted mt-0.5">{appt.duration}m</p>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {showDate && (
            <p className="text-[10px] text-muted font-medium mb-0.5">
              {new Date(appt.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
            </p>
          )}
          <p className="text-[13px] font-semibold text-foreground truncate">{appt.title}</p>
          {client && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-[16px] h-[16px] rounded-full flex items-center justify-center text-white text-[6px] font-bold" style={{ backgroundColor: client.avatar }}>
                {getInitials(client.firstName, client.lastName)}
              </div>
              <span className="text-[11px] text-muted">{client.firstName} {client.lastName}</span>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {appt.price > 0 && <span className="text-[13px] font-bold text-foreground">{appt.price} €</span>}
          <span className={`badge ${st.bg} ${st.color}`} style={{ padding: "2px 8px", fontSize: "9px" }}>
            <StIcon size={8} />
            {st.label}
          </span>
        </div>
      </motion.button>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative bg-background">
      {/* Header */}
      <header className="px-6 pt-5 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight">Rendez-vous</h1>
          <p className="text-[12px] text-muted mt-0.5">{MONTHS[weekBase.getMonth()]} {weekBase.getFullYear()}</p>
        </div>
        <div className="segment-control">
          <button onClick={() => setView("calendar")} className={`segment-btn ${view === "calendar" ? "segment-btn-active" : ""}`}>
            <CalendarDays size={14} />
          </button>
          <button onClick={() => setView("list")} className={`segment-btn ${view === "list" ? "segment-btn-active" : ""}`}>
            <List size={14} />
          </button>
        </div>
      </header>

      {view === "calendar" && (
        <>
          {/* Week navigator */}
          <div className="px-6 pb-3">
            <div className="flex items-center justify-between mb-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); }}
                className="w-8 h-8 rounded-lg bg-border-light flex items-center justify-center text-muted"
              >
                <ChevronLeft size={16} />
              </motion.button>
              <button onClick={() => { setWeekBase(new Date()); setSelectedDate(new Date()); }}
                className="text-[12px] font-semibold text-accent bg-accent-soft px-3 py-1 rounded-lg">
                Aujourd&apos;hui
              </button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); }}
                className="w-8 h-8 rounded-lg bg-border-light flex items-center justify-center text-muted"
              >
                <ChevronRight size={16} />
              </motion.button>
            </div>

            {/* Day pills */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((d, i) => {
                const ds = fmt(d);
                const isSelected = ds === selectedStr;
                const isToday = ds === today;
                const count = dayCounts[ds] || 0;
                return (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setSelectedDate(d)}
                    className="flex flex-col items-center py-1.5 rounded-xl transition-colors"
                  >
                    <span className={`text-[10px] font-medium mb-1.5 ${isSelected ? "text-accent" : "text-muted"}`}>
                      {DAYS[i]}
                    </span>
                    <div className={`w-[40px] h-[40px] rounded-[14px] flex items-center justify-center text-[15px] font-semibold transition-all duration-200 ${
                      isSelected
                        ? "bg-accent text-white shadow-sm"
                        : isToday
                          ? "bg-accent-soft text-accent"
                          : "text-foreground hover:bg-border-light"
                    }`}>
                      {d.getDate()}
                    </div>
                    <div className="h-1.5 mt-1 flex gap-0.5 justify-center">
                      {count > 0 && Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                        <div key={j} className={`w-[4px] h-[4px] rounded-full transition-colors ${
                          isSelected ? "bg-accent/40" : "bg-accent"
                        }`} />
                      ))}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Day appointments */}
          <div className="flex-1 custom-scroll px-6 pb-24">
            <p className="section-label mb-2.5">
              {selectedStr === today ? "Aujourd'hui" :
                new Date(selectedStr).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
              }
              {dayAppts.length > 0 && <span className="text-accent ml-2">· {dayAppts.length}</span>}
            </p>

            {dayAppts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 shadow-apple text-center">
                <div className="w-12 h-12 rounded-2xl bg-border-light flex items-center justify-center mx-auto mb-3">
                  <Clock size={22} className="text-muted" />
                </div>
                <p className="text-[14px] font-semibold text-foreground mb-1">Aucun rendez-vous</p>
                <p className="text-[12px] text-muted">Appuyez sur + pour en créer un</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {dayAppts.map((a, i) => <ApptCard key={a.id} appt={a} i={i} />)}
              </div>
            )}
          </div>
        </>
      )}

      {view === "list" && (
        <div className="flex-1 custom-scroll px-6 pb-24 pt-2">
          <p className="section-label mb-3">{upcoming.length} à venir</p>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-apple text-center">
              <div className="w-12 h-12 rounded-2xl bg-border-light flex items-center justify-center mx-auto mb-3">
                <CalendarDays size={22} className="text-muted" />
              </div>
              <p className="text-[14px] font-semibold text-foreground">Aucun rendez-vous à venir</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {upcoming.map((a, i) => <ApptCard key={a.id} appt={a} i={i} showDate />)}
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => { setForm({ ...form, date: selectedStr }); setShowNew(true); }}
        className="fab fab-shadow"
      >
        <Plus size={22} strokeWidth={2} />
      </motion.button>

      {/* New Modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nouveau rendez-vous">
        <div className="space-y-4">
          {/* Quick service selection */}
          {services.length > 0 && (
            <div>
              <label className="text-[12px] text-muted font-medium mb-1.5 block">Service rapide</label>
              <div className="flex gap-1.5 flex-wrap">
                {services.filter((s) => s.active).map((svc) => (
                  <button key={svc.id}
                    onClick={() => setForm({ ...form, title: svc.name, duration: String(svc.duration), price: String(svc.price) })}
                    className={`text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all ${form.title === svc.name ? "bg-accent text-white" : "bg-border-light text-muted"}`}>
                    {svc.name} · {svc.price}€
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="text-[12px] text-muted font-medium mb-1.5 block">Titre</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex : Manucure gel" className="input-field" />
          </div>
          <div>
            <label className="text-[12px] text-muted font-medium mb-1.5 block">Client</label>
            <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              className="input-field">
              <option value="">-- Sélectionner --</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] text-muted font-medium mb-1.5 block">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="text-[12px] text-muted font-medium mb-1.5 block">Heure</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] text-muted font-medium mb-1.5 block">Durée (min)</label>
              <div className="flex gap-1.5">
                {["30", "45", "60", "90"].map((d) => (
                  <button key={d} onClick={() => setForm({ ...form, duration: d })}
                    className={`flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition-all ${
                      form.duration === d ? "bg-accent text-white" : "bg-border-light text-muted"
                    }`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[12px] text-muted font-medium mb-1.5 block">Prix (€)</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0" className="input-field" />
            </div>
          </div>
          <div>
            <label className="text-[12px] text-muted font-medium mb-1.5 block">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optionnel..." rows={2} className="input-field resize-none" />
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit}
            className="w-full bg-accent text-white py-3.5 rounded-2xl text-[14px] font-semibold shadow-sm">
            Créer le rendez-vous
          </motion.button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!viewedAppt} onClose={() => setSelectedAppt(null)} title={viewedAppt?.title || ""}>
        {viewedAppt && (() => {
          const client = getClient(viewedAppt.clientId);
          const st = statusMap[viewedAppt.status];
          return (
            <div className="space-y-4">
              {/* Status + Price header */}
              <div className="flex items-center justify-between">
                <span className={`badge ${st.bg} ${st.color}`}>{st.label}</span>
                {viewedAppt.price > 0 && <span className="text-[22px] font-bold text-foreground">{viewedAppt.price} €</span>}
              </div>

              {/* Details card */}
              <div className="bg-border-light rounded-2xl p-4 space-y-3">
                {[
                  ["Date", new Date(viewedAppt.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })],
                  ["Heure", viewedAppt.time],
                  ["Durée", `${viewedAppt.duration} min`],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-[13px]">
                    <span className="text-muted">{l}</span>
                    <span className="font-semibold">{v}</span>
                  </div>
                ))}
                {client && (
                  <div className="flex justify-between text-[13px] items-center">
                    <span className="text-muted">Client</span>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full text-white text-[8px] font-bold flex items-center justify-center" style={{ backgroundColor: client.avatar }}>
                        {getInitials(client.firstName, client.lastName)}
                      </div>
                      <span className="font-semibold">{client.firstName} {client.lastName}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {viewedAppt.notes && (
                <div className="bg-border-light rounded-2xl p-4">
                  <p className="text-[11px] text-muted font-medium mb-1.5">Notes</p>
                  <p className="text-[13px] text-foreground leading-relaxed">{viewedAppt.notes}</p>
                </div>
              )}

              {/* Actions */}
              {viewedAppt.status === "confirmed" && (
                <div className="flex gap-2.5">
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => { setAppointmentStatus(viewedAppt.id, "done"); setSelectedAppt(null); }}
                    className="flex-1 bg-success text-white py-3.5 rounded-2xl text-[13px] font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={15} />
                    Terminé
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => { setAppointmentStatus(viewedAppt.id, "canceled"); setSelectedAppt(null); }}
                    className="flex-1 bg-border-light text-danger py-3.5 rounded-2xl text-[13px] font-semibold flex items-center justify-center gap-1.5">
                    <XCircle size={15} />
                    Annuler
                  </motion.button>
                </div>
              )}

              <button onClick={() => { deleteAppointment(viewedAppt.id); setSelectedAppt(null); }}
                className="w-full text-danger text-[12px] py-2 flex items-center justify-center gap-1.5 opacity-40 hover:opacity-60 transition-opacity">
                <Trash2 size={12} />
                Supprimer ce rendez-vous
              </button>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
