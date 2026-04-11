"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X as XIcon, CalendarDays } from "lucide-react";
import SettingsPage, { SettingsSection, SettingsToggle, SaveButton } from "@/components/SettingsPage";

const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

interface DaySchedule { active: boolean; slots: { start: string; end: string }[]; }

export default function SettingsAvailabilityPage() {
  const [saved, setSaved] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { active: true, slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "18:00" }] },
    { active: true, slots: [{ start: "09:00", end: "17:30" }] },
    { active: false, slots: [] },
    { active: true, slots: [{ start: "09:00", end: "18:00" }] },
    { active: true, slots: [{ start: "09:00", end: "16:00" }] },
    { active: false, slots: [] },
    { active: false, slots: [] },
  ]);
  const [holidays, setHolidays] = useState<{ start: string; end: string }[]>([]);
  const [hStart, setHStart] = useState("");
  const [hEnd, setHEnd] = useState("");
  const [cancelDelay, setCancelDelay] = useState("24");
  const [autoConfirm, setAutoConfirm] = useState(true);

  function toggleDay(idx: number) {
    const s = [...schedule];
    s[idx] = { ...s[idx], active: !s[idx].active };
    if (!s[idx].active) s[idx].slots = [];
    else if (s[idx].slots.length === 0) s[idx].slots = [{ start: "09:00", end: "18:00" }];
    setSchedule(s);
  }

  function updateSlot(dayIdx: number, slotIdx: number, field: "start" | "end", value: string) {
    const s = [...schedule];
    s[dayIdx].slots[slotIdx] = { ...s[dayIdx].slots[slotIdx], [field]: value };
    setSchedule(s);
  }

  function addSlot(dayIdx: number) {
    const s = [...schedule];
    s[dayIdx].slots.push({ start: "14:00", end: "18:00" });
    setSchedule(s);
  }

  function removeSlot(dayIdx: number, slotIdx: number) {
    const s = [...schedule];
    s[dayIdx].slots.splice(slotIdx, 1);
    setSchedule(s);
  }

  function addHoliday() {
    if (hStart && hEnd) { setHolidays([...holidays, { start: hStart, end: hEnd }]); setHStart(""); setHEnd(""); }
  }

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 1500); }

  return (
    <SettingsPage category="Configuration" title="Disponibilités & Horaires"
      description="Définissez vos créneaux de travail et vos règles de réservation.">

      {/* Weekly schedule */}
      <SettingsSection title="Semaine type">
        <div className="space-y-4">
          {schedule.map((day, i) => (
            <div key={i} className="pb-4 border-b border-border-light last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-bold text-foreground">{DAY_NAMES[i]}</span>
                <SettingsToggle on={day.active} onToggle={() => toggleDay(i)} />
              </div>
              {day.active ? (
                <div className="space-y-2">
                  {day.slots.map((slot, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <input type="time" value={slot.start} onChange={(e) => updateSlot(i, j, "start", e.target.value)}
                        className="flex-1 bg-border-light rounded-xl px-3 py-2 text-[13px] text-foreground outline-none" />
                      <span className="text-[12px] text-muted">–</span>
                      <input type="time" value={slot.end} onChange={(e) => updateSlot(i, j, "end", e.target.value)}
                        className="flex-1 bg-border-light rounded-xl px-3 py-2 text-[13px] text-foreground outline-none" />
                      {day.slots.length > 1 && (
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeSlot(i, j)}
                          className="w-8 h-8 rounded-lg bg-danger-soft flex items-center justify-center"><XIcon size={12} className="text-danger" /></motion.button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addSlot(i)} className="text-[11px] text-accent font-bold flex items-center gap-1">
                    <Plus size={12} /> Ajouter un créneau
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-muted italic">Indisponible</p>
              )}
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Holidays */}
      <SettingsSection title="Congés & Exceptions" description="Dates où vous ne serez pas disponible.">
        <div className="flex gap-2 mb-3">
          <input type="date" value={hStart} onChange={(e) => setHStart(e.target.value)} className="flex-1 bg-border-light rounded-xl px-3 py-2 text-[12px] outline-none" />
          <input type="date" value={hEnd} onChange={(e) => setHEnd(e.target.value)} className="flex-1 bg-border-light rounded-xl px-3 py-2 text-[12px] outline-none" />
          <motion.button whileTap={{ scale: 0.9 }} onClick={addHoliday} disabled={!hStart || !hEnd}
            className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center"><Plus size={16} /></motion.button>
        </div>
        {holidays.length === 0 ? (
          <p className="text-[12px] text-muted text-center py-3">Aucun congé planifié.</p>
        ) : (
          <div className="space-y-2">
            {holidays.map((h, i) => (
              <div key={i} className="flex items-center justify-between bg-warning-soft rounded-xl px-4 py-2.5">
                <span className="text-[12px] font-semibold text-foreground">
                  {new Date(h.start).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} → {new Date(h.end).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
                <motion.button whileTap={{ scale: 0.8 }} onClick={() => setHolidays(holidays.filter((_, j) => j !== i))}>
                  <XIcon size={14} className="text-warning" />
                </motion.button>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>

      {/* Rules */}
      <SettingsSection title="Règles de réservation">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Délai d&apos;annulation</label>
            <div className="flex gap-2">
              {["12", "24", "48", "72"].map((h) => (
                <motion.button key={h} whileTap={{ scale: 0.95 }} onClick={() => setCancelDelay(h)}
                  className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold ${cancelDelay === h ? "bg-accent text-white" : "bg-border-light text-muted"}`}>
                  {h}h
                </motion.button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-foreground">Confirmation automatique</p>
              <p className="text-[10px] text-muted mt-0.5">Les RDV sont confirmés sans action de votre part.</p>
            </div>
            <SettingsToggle on={autoConfirm} onToggle={() => setAutoConfirm(!autoConfirm)} />
          </div>
        </div>
      </SettingsSection>

      <SaveButton onClick={flash} saving={saved} />
    </SettingsPage>
  );
}
