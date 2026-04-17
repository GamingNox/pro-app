"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { getInitials } from "@/lib/data";
import Modal from "@/components/Modal";
import {
  Plus,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Circle,
  CalendarDays,
  Trash2,
  SlidersHorizontal,
} from "lucide-react";
import type { AppointmentStatus } from "@/lib/types";
import { tabContentVariants, tabContentTransition } from "@/lib/motion";
import { CATEGORIES } from "@/lib/categories";

const DAYS_SHORT = ["L", "M", "M", "J", "V", "S", "D"];
const DAYS_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

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

function endTime(time: string, duration: number): string {
  const [h, m] = time.split(":").map(Number);
  const end = new Date(0, 0, 0, h, m + duration);
  return `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;
}

const statusMap: Record<AppointmentStatus, { label: string; color: string; bg: string; borderColor: string; icon: typeof Circle }> = {
  confirmed: { label: "Confirmé", color: "text-accent", bg: "bg-accent-soft", borderColor: "border-l-accent", icon: Circle },
  done: { label: "Terminé", color: "text-success", bg: "bg-success-soft", borderColor: "border-l-success", icon: CheckCircle2 },
  canceled: { label: "Annulé", color: "text-danger", bg: "bg-danger-soft", borderColor: "border-l-danger", icon: XCircle },
};

type View = "jour" | "semaine";
type Filter = "tout" | "confirmed" | "done" | "canceled";

export default function AppointmentsPage() {
  const { appointments, clients, services, getClient, addAppointment, setAppointmentStatus, deleteAppointment } = useApp();
  const searchParams = useSearchParams();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekBase, setWeekBase] = useState(new Date());
  const [showNew, setShowNew] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<string | null>(null);
  const [view, setView] = useState<View>("jour");
  const [filter, setFilter] = useState<Filter>("tout");
  const [showFilter, setShowFilter] = useState(false);

  const [form, setForm] = useState({
    title: "", clientId: "", date: fmt(new Date()), time: "09:00", duration: "60", price: "", notes: "",
  });

  useEffect(() => {
    if (searchParams.get("new") === "1") setShowNew(true);
  }, [searchParams]);

  const weekDays = useMemo(() => getWeekDays(weekBase), [weekBase]);

  // ── Infinite timeline ────────────────────────────────────
  // Continuous horizontal list of days (±60 days from today) that replaces
  // the 7-day week strip. The selected day auto-scrolls into view.
  const [timelineRange, setTimelineRange] = useState({ before: 60, after: 60 });
  const timelineDays = useMemo<Date[]>(() => {
    const list: Date[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = -timelineRange.before; i <= timelineRange.after; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      list.push(d);
    }
    return list;
  }, [timelineRange]);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  // Scroll the selected date into the center of the timeline whenever it changes
  useEffect(() => {
    const container = timelineRef.current;
    if (!container) return;
    const selector = `[data-date="${fmt(selectedDate)}"]`;
    const el = container.querySelector<HTMLElement>(selector);
    if (!el) return;
    const target = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [selectedDate, timelineDays.length]);

  // Lazy-extend the range when user scrolls near either edge
  function handleTimelineScroll() {
    const container = timelineRef.current;
    if (!container) return;
    const nearLeft = container.scrollLeft < 200;
    const nearRight = container.scrollLeft + container.clientWidth > container.scrollWidth - 200;
    if (nearLeft) setTimelineRange((r) => ({ ...r, before: r.before + 30 }));
    else if (nearRight) setTimelineRange((r) => ({ ...r, after: r.after + 30 }));
  }
  const today = fmt(new Date());
  const selectedStr = fmt(selectedDate);

  const dayAppts = useMemo(() => {
    let list = appointments.filter((a) => a.date === selectedStr);
    if (filter !== "tout") list = list.filter((a) => a.status === filter);
    return list.sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedStr, filter]);

  const upcoming = useMemo(() => {
    let list = appointments.filter((a) => a.date >= today && a.status !== "canceled");
    if (filter === "done") list = appointments.filter((a) => a.status === "done");
    else if (filter === "confirmed") list = list.filter((a) => a.status === "confirmed");
    return list.sort((a, b) => a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)).slice(0, 25);
  }, [appointments, today, filter]);

  const dayCounts = useMemo(() => {
    const m: Record<string, number> = {};
    appointments.forEach((a) => { if (a.status !== "canceled") m[a.date] = (m[a.date] || 0) + 1; });
    return m;
  }, [appointments]);

  const hourSlotMap = useMemo(() => {
    const m: Record<string, typeof appointments> = {};
    dayAppts.forEach((a) => {
      const hourKey = a.time.split(":")[0] + ":00";
      if (!m[hourKey]) m[hourKey] = [];
      m[hourKey].push(a);
    });
    return m;
  }, [dayAppts]);

  const dayOfWeek = (selectedDate.getDay() + 6) % 7;
  const dayLabel = `${DAYS_FULL[dayOfWeek]} ${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]}`;
  const dayCount = dayCounts[selectedStr] || 0;

  function handleSubmit() {
    if (!form.title.trim()) return;
    addAppointment({
      title: form.title.trim(), clientId: form.clientId, date: form.date, time: form.time,
      duration: parseInt(form.duration) || 60, price: parseFloat(form.price) || 0, status: "confirmed", notes: form.notes,
    });
    setShowNew(false);
    setForm({ title: "", clientId: "", date: fmt(new Date()), time: "09:00", duration: "60", price: "", notes: "" });
  }

  function openNewAtHour(hour: string) {
    setForm({ ...form, date: selectedStr, time: hour });
    setShowNew(true);
  }

  function prevDay() {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
    if (d < weekDays[0]) {
      const wb = new Date(weekBase);
      wb.setDate(wb.getDate() - 7);
      setWeekBase(wb);
    }
  }

  function nextDay() {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
    if (d > weekDays[6]) {
      const wb = new Date(weekBase);
      wb.setDate(wb.getDate() + 7);
      setWeekBase(wb);
    }
  }

  const viewedAppt = selectedAppt ? appointments.find((a) => a.id === selectedAppt) : null;

  return (
    /*
     * CRITICAL: This outer div must be flex-1 + flex-col + overflow-hidden
     * so the scrollable area below gets a bounded height.
     * The layout already provides flex-1 to children, so this creates
     * the constraint chain: layout -> page -> fixed header + scrollable body.
     */
    <div className="flex-1 flex flex-col overflow-hidden relative bg-background"
      style={{ ["--color-accent" as string]: CATEGORIES.bookings.color, ["--color-accent-soft" as string]: CATEGORIES.bookings.soft, ["--color-accent-deep" as string]: CATEGORIES.bookings.deep } as React.CSSProperties}>

      {/* ═══ FIXED HEADER (never scrolls) ═══ */}
      <div className="flex-shrink-0">

        {/* Title + filter */}
        <header className="px-6 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-[22px] font-bold text-foreground tracking-tight">Rendez-vous</h1>
            <div className="relative">
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowFilter(!showFilter)}
                className="w-9 h-9 rounded-xl bg-white shadow-sm-apple flex items-center justify-center">
                <SlidersHorizontal size={16} className="text-muted" />
              </motion.button>
              {showFilter && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute right-0 top-11 z-30 bg-white rounded-2xl shadow-apple-lg p-2 min-w-[140px]">
                  {([["tout", "Tout"], ["confirmed", "Confirmés"], ["done", "Terminés"], ["canceled", "Annulés"]] as [Filter, string][]).map(([key, label]) => (
                    <button key={key} onClick={() => { setFilter(key); setShowFilter(false); }}
                      className={`w-full text-left text-[13px] font-semibold px-3.5 py-2.5 rounded-xl transition-all ${filter === key ? "bg-accent-soft text-accent" : "text-foreground"}`}>
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* View toggle */}
          <div className="flex items-center justify-between">
            <div className="segment-control">
              <button onClick={() => setView("jour")} className={`segment-btn px-5 ${view === "jour" ? "segment-btn-active" : ""}`}>
                Jour
              </button>
              <button onClick={() => setView("semaine")} className={`segment-btn px-5 ${view === "semaine" ? "segment-btn-active" : ""}`}>
                Semaine
              </button>
            </div>
            {filter !== "tout" && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setFilter("tout")}
                className="text-[11px] font-bold text-accent bg-accent-soft px-3 py-1.5 rounded-lg flex items-center gap-1">
                {filter === "confirmed" ? "Confirmés" : filter === "done" ? "Terminés" : "Annulés"} ×
              </motion.button>
            )}
          </div>
        </header>

        {/* Date display + arrows — tappable to open native date picker */}
        <div className="px-6 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <label className="relative cursor-pointer flex items-center gap-1.5">
              <h2 className="text-[18px] font-bold text-foreground hover:text-accent transition-colors">{dayLabel}</h2>
              <ChevronDown size={14} className="text-muted" />
              {/* Hidden native date input — opens OS picker on click */}
              <input
                type="date"
                value={selectedStr}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) return;
                  const [y, m, d] = v.split("-").map(Number);
                  const next = new Date(y, m - 1, d);
                  setSelectedDate(next);
                  setWeekBase(next);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
            <div className="flex items-center gap-1 ml-auto">
              <motion.button whileTap={{ scale: 0.95 }} onClick={prevDay}
                className="w-7 h-7 rounded-lg bg-white shadow-sm-apple flex items-center justify-center">
                <ChevronLeft size={14} className="text-muted" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={nextDay}
                className="w-7 h-7 rounded-lg bg-white shadow-sm-apple flex items-center justify-center">
                <ChevronRight size={14} className="text-muted" />
              </motion.button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[12px] text-muted">{dayCount} rendez-vous {selectedStr === today ? "aujourd'hui" : ""}</p>
            {dayCount >= 3 && (
              <span className="text-[9px] font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-md uppercase tracking-wider">Journée chargée</span>
            )}
            {dayCount === 0 && selectedStr === today && (
              <span className="text-[9px] font-bold text-success bg-success-soft px-2 py-0.5 rounded-md uppercase tracking-wider">Libre</span>
            )}
          </div>
        </div>

        {/* Infinite timeline — continuous horizontal scroll of days */}
        <div
          ref={timelineRef}
          onScroll={handleTimelineScroll}
          className="mx-4 mb-1 bg-white/60 rounded-2xl overflow-x-auto overscroll-x-contain no-scrollbar"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
        >
          <div className="flex items-center py-3 px-2" style={{ minWidth: "100%" }}>
            {timelineDays.map((d) => {
              const ds = fmt(d);
              const isSelected = ds === selectedStr;
              const isToday = ds === today;
              const count = dayCounts[ds] || 0;
              const isMonthStart = d.getDate() === 1;
              return (
                <motion.button
                  key={ds}
                  data-date={ds}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setSelectedDate(d)}
                  className="flex-shrink-0 flex flex-col items-center py-1 px-1"
                  style={{ width: "46px" }}
                >
                  <span className={`text-[10px] font-semibold mb-1 ${isSelected ? "text-accent" : "text-muted"}`}>
                    {DAYS_SHORT[(d.getDay() + 6) % 7]}
                  </span>
                  <div className={`w-[36px] h-[36px] rounded-full flex items-center justify-center text-[14px] font-bold transition-all duration-150 ${
                    isSelected
                      ? "bg-accent text-white shadow-sm"
                      : isToday
                        ? "bg-accent-soft text-accent"
                        : "text-foreground"
                  }`}>
                    {d.getDate()}
                  </div>
                  {/* Month marker on day 1 */}
                  {isMonthStart && (
                    <span className="text-[8px] font-bold uppercase tracking-wider text-accent mt-0.5">
                      {MONTHS[d.getMonth()].slice(0, 3)}
                    </span>
                  )}
                  {!isMonthStart && (
                    <span className={`mt-0.5 w-1 h-1 rounded-full ${count > 0 ? (isSelected ? "bg-accent" : "bg-accent/50") : ""}`} style={{ backgroundColor: count === 0 ? "transparent" : undefined }} />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

      </div>
      {/* ═══ END FIXED HEADER ═══ */}


      {/* ═══ SCROLLABLE CONTENT ═══ */}
      {/* This div takes all remaining height and scrolls independently */}
      <AnimatePresence mode="wait" initial={false}>

      {view === "jour" && (
        <motion.div key={`jour-${selectedStr}`} initial={tabContentVariants.initial} animate={tabContentVariants.animate} exit={tabContentVariants.exit} transition={tabContentTransition}
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
          onClick={() => showFilter && setShowFilter(false)}
          onPanEnd={(_, info) => {
            const { offset, velocity } = info;
            const horizontal = Math.abs(offset.x) > 60 && Math.abs(offset.x) > Math.abs(offset.y) * 1.4;
            const flung = Math.abs(velocity.x) > 350 && Math.abs(velocity.x) > Math.abs(velocity.y) * 1.2;
            if (!horizontal && !flung) return;
            const d = new Date(selectedDate);
            if (offset.x > 0) { d.setDate(d.getDate() - 1); setSelectedDate(d); }
            else { d.setDate(d.getDate() + 1); setSelectedDate(d); }
          }}
        >
          <div className="px-6 pb-32 pt-2">
            {HOURS.map((hour) => {
              const appts = hourSlotMap[hour] || [];
              return (
                <div key={hour} className="flex min-h-[72px]">
                  {/* Time label */}
                  <div className="w-[50px] flex-shrink-0 -mt-[8px]">
                    <p className="text-[13px] text-muted font-medium">{hour}</p>
                  </div>

                  {/* Content area */}
                  <div className="flex-1 border-t border-border-light relative">
                    {appts.length > 0 ? (
                      <div className="flex flex-col gap-2 py-2 pr-1">
                        {appts.map((appt) => {
                          const client = getClient(appt.clientId);
                          const st = statusMap[appt.status];
                          return (
                            <motion.button
                              key={appt.id}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedAppt(appt.id)}
                              className={`bg-white rounded-2xl p-4 shadow-card-interactive text-left w-full border-l-[3px] ${st.borderColor}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[15px] font-bold text-foreground truncate">
                                    {client ? `${client.firstName} ${client.lastName}` : appt.title}
                                  </p>
                                  <p className="text-[12px] text-muted mt-1">
                                    {client ? appt.title : `${appt.duration} min`}
                                  </p>
                                </div>
                                <div className="flex-shrink-0 ml-3">
                                  <div className="bg-border-light rounded-lg px-2.5 py-1.5">
                                    <p className="text-[11px] font-bold text-foreground leading-tight">
                                      {appt.time} -
                                    </p>
                                    <p className="text-[11px] font-bold text-foreground leading-tight">
                                      {endTime(appt.time, appt.duration)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openNewAtHour(hour)}
                        className="w-full h-full min-h-[72px] flex items-center justify-center group"
                      >
                        <div className="w-full h-10 rounded-xl border border-dashed border-transparent group-hover:border-accent/15 group-active:border-accent/25 flex items-center justify-center transition-all">
                          <Plus size={14} className="text-subtle opacity-0 group-hover:opacity-60 group-active:opacity-100 transition-opacity" />
                        </div>
                      </motion.button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {view === "semaine" && (
        <motion.div key="semaine" initial={tabContentVariants.initial} animate={tabContentVariants.animate} exit={tabContentVariants.exit} transition={tabContentTransition}
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
          onClick={() => showFilter && setShowFilter(false)}
          onPanEnd={(_, info) => {
            const { offset, velocity } = info;
            const horizontal = Math.abs(offset.x) > 60 && Math.abs(offset.x) > Math.abs(offset.y) * 1.4;
            const flung = Math.abs(velocity.x) > 350 && Math.abs(velocity.x) > Math.abs(velocity.y) * 1.2;
            if (!horizontal && !flung) return;
            const wb = new Date(weekBase);
            if (offset.x > 0) {
              // swipe right = previous week
              wb.setDate(wb.getDate() - 7);
            } else {
              // swipe left = next week
              wb.setDate(wb.getDate() + 7);
            }
            setWeekBase(wb);
            setSelectedDate(wb);
          }}
        >
          <div className="px-6 pb-32 pt-2">
            <p className="section-label mb-3">{upcoming.length} rendez-vous</p>
            {upcoming.length === 0 ? (
              <div className="bg-white rounded-[22px] p-8 shadow-card-premium text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-3">
                  <CalendarDays size={28} className="text-accent" />
                </div>
                <p className="text-[17px] font-bold text-foreground mb-1">Aucun rendez-vous à venir</p>
                <p className="text-[13px] text-muted mb-5 leading-relaxed">
                  Ajoutez-en manuellement, ou laissez vos clients réserver tout seuls via votre lien de réservation.
                </p>
                <div className="flex flex-col gap-2 max-w-[240px] mx-auto">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowNew(true)}
                    className="inline-flex items-center justify-center gap-2 bg-accent-gradient text-white text-[13px] font-bold px-5 py-3 rounded-xl fab-shadow"
                  >
                    + Ajouter un RDV
                  </motion.button>
                  <Link
                    href="/settings/booking-link"
                    className="inline-flex items-center justify-center gap-2 bg-white border border-border text-foreground text-[13px] font-bold px-5 py-3 rounded-xl"
                  >
                    Partager mon lien de résa
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {upcoming.map((appt, i) => {
                  const client = getClient(appt.clientId);
                  const st = statusMap[appt.status];
                  const apptDate = new Date(appt.date);
                  return (
                    <motion.button
                      key={appt.id}
                      initial={{ y: 5 }}
                      animate={{ y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.25 }}
                      onClick={() => setSelectedAppt(appt.id)}
                      className={`bg-white rounded-2xl p-4 shadow-card-interactive flex items-center gap-3.5 text-left w-full border-l-[3px] ${st.borderColor}`}
                    >
                      <div className={`w-[50px] flex-shrink-0 text-center py-2 rounded-xl ${st.bg}`}>
                        <p className={`text-[14px] font-bold leading-none ${st.color}`}>{appt.time}</p>
                        <p className="text-[9px] text-muted mt-0.5 font-medium">{appt.duration}m</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-accent font-bold mb-0.5">
                          {apptDate.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                        </p>
                        <p className="text-[14px] font-bold text-foreground truncate">
                          {client ? `${client.firstName} ${client.lastName}` : appt.title}
                        </p>
                        {client && <p className="text-[11px] text-muted mt-0.5">{appt.title}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {appt.price > 0 && <span className="text-[13px] font-bold text-foreground">{appt.price} €</span>}
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${st.color} ${st.bg} px-2 py-0.5 rounded-md`}>
                          {st.label}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ═══ FAB — absolute inside the page container (stable across resizes) ═══ */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 600, damping: 40 }}
        onClick={() => { setForm({ ...form, date: selectedStr }); setShowNew(true); }}
        className="absolute bottom-5 right-5 z-40 bg-accent-gradient text-white rounded-2xl px-5 py-3.5 flex items-center gap-2 fab-shadow"
      >
        <Plus size={18} strokeWidth={2.5} />
        <span className="text-[13px] font-bold">Nouveau</span>
      </motion.button>

      {/* ═══ MODALS ═══ */}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nouveau rendez-vous">
        <div className="space-y-4">
          {services.length > 0 && (
            <div>
              <label className="text-[12px] text-muted font-semibold mb-2 block">Service rapide</label>
              <div className="flex gap-1.5 flex-wrap">
                {services.filter((s) => s.active).map((svc) => (
                  <motion.button key={svc.id} whileTap={{ scale: 0.95 }}
                    onClick={() => setForm({ ...form, title: svc.name, duration: String(svc.duration), price: String(svc.price) })}
                    className={`text-[12px] font-semibold px-3.5 py-2 rounded-xl transition-all duration-150 ${form.title === svc.name ? "bg-accent text-white" : "bg-border-light text-muted"}`}>
                    {svc.name} · {svc.price}€
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="text-[12px] text-muted font-semibold mb-1.5 block">Titre</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex : Manucure gel" className="input-field" />
          </div>
          <div>
            <label className="text-[12px] text-muted font-semibold mb-1.5 block">Client</label>
            <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="input-field">
              <option value="">-- Sélectionner --</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] text-muted font-semibold mb-1.5 block">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="text-[12px] text-muted font-semibold mb-1.5 block">Heure</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] text-muted font-semibold mb-1.5 block">Durée (min)</label>
              <div className="flex gap-1.5">
                {["30", "45", "60", "90"].map((d) => (
                  <motion.button key={d} whileTap={{ scale: 0.96 }}
                    onClick={() => setForm({ ...form, duration: d })}
                    className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-150 ${
                      form.duration === d ? "bg-accent text-white" : "bg-border-light text-muted"
                    }`}>
                    {d}
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[12px] text-muted font-semibold mb-1.5 block">Prix (€)</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0" className="input-field" />
            </div>
          </div>
          <div>
            <label className="text-[12px] text-muted font-semibold mb-1.5 block">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optionnel..." rows={2} className="input-field resize-none" />
          </div>
          <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmit}
            className="w-full bg-accent-gradient text-white py-3.5 rounded-2xl text-[14px] font-bold fab-shadow">
            Créer le rendez-vous
          </motion.button>
        </div>
      </Modal>

      <Modal open={!!viewedAppt} onClose={() => setSelectedAppt(null)} title={viewedAppt?.title || ""}>
        {viewedAppt && (() => {
          const client = getClient(viewedAppt.clientId);
          const st = statusMap[viewedAppt.status];
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`badge ${st.bg} ${st.color} text-[12px] px-3 py-1`}>{st.label}</span>
                {viewedAppt.price > 0 && <span className="text-[24px] font-bold text-foreground">{viewedAppt.price} €</span>}
              </div>
              <div className="bg-border-light rounded-2xl p-4 space-y-3.5">
                {[
                  ["Date", new Date(viewedAppt.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })],
                  ["Heure", `${viewedAppt.time} - ${endTime(viewedAppt.time, viewedAppt.duration)}`],
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
                      <div className="w-6 h-6 rounded-full text-white text-[8px] font-bold flex items-center justify-center" style={{ backgroundColor: client.avatar }}>
                        {getInitials(client.firstName, client.lastName)}
                      </div>
                      <span className="font-semibold">{client.firstName} {client.lastName}</span>
                    </div>
                  </div>
                )}
              </div>
              {viewedAppt.notes && (
                <div className="bg-border-light rounded-2xl p-4">
                  <p className="text-[11px] text-muted font-semibold mb-2">Notes</p>
                  <p className="text-[13px] text-foreground leading-relaxed">{viewedAppt.notes}</p>
                </div>
              )}
              {viewedAppt.status === "confirmed" && (
                <div className="flex gap-2.5">
                  <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => { setAppointmentStatus(viewedAppt.id, "done"); setSelectedAppt(null); }}
                    className="flex-1 bg-success text-white py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} /> Terminé
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => { setAppointmentStatus(viewedAppt.id, "canceled"); setSelectedAppt(null); }}
                    className="flex-1 bg-border-light text-danger py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2">
                    <XCircle size={16} /> Annuler
                  </motion.button>
                </div>
              )}
              <button onClick={() => { deleteAppointment(viewedAppt.id); setSelectedAppt(null); }}
                className="w-full text-danger text-[12px] py-2.5 flex items-center justify-center gap-1.5 opacity-40 hover:opacity-60 transition-opacity">
                <Trash2 size={12} /> Supprimer
              </button>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
