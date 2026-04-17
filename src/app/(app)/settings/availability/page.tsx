"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X as XIcon, CalendarX2, Trash2 } from "lucide-react";
import SettingsPage, {
  SettingsSection,
  SettingsToggle,
  SaveButton,
  PrimaryButton,
} from "@/components/SettingsPage";
import { useApp } from "@/lib/store";
import { useUserSettings } from "@/lib/user-settings";

const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

interface DaySchedule { active: boolean; slots: { start: string; end: string }[]; }

interface Exception {
  id: string;
  startDate: string;
  endDate?: string;
  label: string;
  message: string;
}


// Seed the weekly schedule from onboarding data when available — so a pro who
// filled in their hours during signup sees them on the settings page instead
// of generic defaults.
function buildInitialSchedule(
  workDays?: Record<string, boolean>,
  workStart?: string,
  workEnd?: string
): DaySchedule[] {
  const defaults: DaySchedule[] = [
    { active: true, slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "18:00" }] },
    { active: true, slots: [{ start: "09:00", end: "17:30" }] },
    { active: false, slots: [] },
    { active: true, slots: [{ start: "09:00", end: "18:00" }] },
    { active: true, slots: [{ start: "09:00", end: "16:00" }] },
    { active: false, slots: [] },
    { active: false, slots: [] },
  ];
  if (!workDays) return defaults;
  const start = workStart || "09:00";
  const end = workEnd || "18:00";
  return DAY_KEYS.map((key) => {
    const active = workDays[key] === true;
    return { active, slots: active ? [{ start, end }] : [] };
  });
}

function formatDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function SettingsAvailabilityPage() {
  const { user } = useApp();
  const [saved, setSaved] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule[]>(() =>
    buildInitialSchedule(
      user.onboardingData?.workDays,
      user.onboardingData?.workStart,
      user.onboardingData?.workEnd
    )
  );

  // Exceptions state — persisted to user_profiles.settings.availability_exceptions
  const [exceptions, setExceptions] = useUserSettings<Exception[]>("availability_exceptions", []);
  const [draft, setDraft] = useState<{ startDate: string; endDate: string; label: string; message: string }>({
    startDate: "",
    endDate: "",
    label: "",
    message: "",
  });
  const [showForm, setShowForm] = useState(false);

  const persistExceptions = setExceptions;

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

  function addException() {
    if (!draft.startDate || !draft.label.trim()) return;
    const next: Exception = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      startDate: draft.startDate,
      endDate: draft.endDate || undefined,
      label: draft.label.trim(),
      message: draft.message.trim(),
    };
    persistExceptions([...exceptions, next]);
    setDraft({ startDate: "", endDate: "", label: "", message: "" });
    setShowForm(false);
  }

  function deleteException(id: string) {
    persistExceptions(exceptions.filter((e) => e.id !== id));
  }

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 1500); }

  return (
    <SettingsPage
      category="Réservations"
      title="Disponibilités & Horaires"
      description="Définissez vos créneaux de travail et vos absences exceptionnelles."
    >
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
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateSlot(i, j, "start", e.target.value)}
                        className="flex-1 bg-border-light rounded-xl px-3 py-2 text-[13px] text-foreground outline-none"
                      />
                      <span className="text-[12px] text-muted">–</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateSlot(i, j, "end", e.target.value)}
                        className="flex-1 bg-border-light rounded-xl px-3 py-2 text-[13px] text-foreground outline-none"
                      />
                      {day.slots.length > 1 && (
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => removeSlot(i, j)}
                          className="w-8 h-8 rounded-lg bg-danger-soft flex items-center justify-center"
                        >
                          <XIcon size={12} className="text-danger" />
                        </motion.button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addSlot(i)}
                    className="text-[11px] font-bold flex items-center gap-1"
                    style={{ color: "var(--color-primary)" }}
                  >
                    <Plus size={12} /> Ajouter un creneau
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-muted italic">Indisponible</p>
              )}
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Exceptions / Absences */}
      <SettingsSection
        title="Exceptions & Absences"
        description="Jours ou periodes ou vous ne serez pas disponible. Un message sera affiche aux clients."
      >
        {/* Header row with icon + add button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "var(--color-accent-soft)" }}
            >
              <CalendarX2 size={16} style={{ color: "var(--color-accent)" }} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-foreground leading-tight">
                {exceptions.length} exception{exceptions.length > 1 ? "s" : ""}
              </p>
              <p className="text-[10px] text-muted mt-0.5">Visible par les clients a la reservation</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm((v) => !v)}
            className="w-9 h-9 rounded-xl text-white flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
              boxShadow: "0 8px 18px color-mix(in srgb, var(--color-primary) 25%, transparent)",
            }}
          >
            <motion.div animate={{ rotate: showForm ? 45 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <Plus size={16} />
            </motion.div>
          </motion.button>
        </div>

        {/* Draft form */}
        <AnimatePresence initial={false}>
          {showForm && (
            <motion.div
              key="draft"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-border-light/60 rounded-2xl p-4 mb-4 space-y-3">
                <div>
                  <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                    Periode
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={draft.startDate}
                      onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                      className="flex-1 bg-white rounded-xl px-3 py-2.5 text-[12px] text-foreground outline-none border border-border-light"
                    />
                    <span className="text-[11px] text-muted">→</span>
                    <input
                      type="date"
                      value={draft.endDate}
                      onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                      className="flex-1 bg-white rounded-xl px-3 py-2.5 text-[12px] text-foreground outline-none border border-border-light"
                      placeholder="Optionnel"
                    />
                  </div>
                  <p className="text-[10px] text-muted mt-1">Laissez la date de fin vide pour un seul jour.</p>
                </div>

                <div>
                  <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                    Motif
                  </label>
                  <input
                    type="text"
                    value={draft.label}
                    onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                    placeholder="Ex : Conges, Fermeture exceptionnelle..."
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5 block">
                    Message pour les clients
                  </label>
                  <textarea
                    value={draft.message}
                    onChange={(e) => setDraft({ ...draft, message: e.target.value })}
                    rows={3}
                    placeholder="Ce message s'affichera a vos clients quand ils essaieront de reserver sur cette date."
                    className="input-field w-full resize-none"
                  />
                </div>

                <PrimaryButton
                  onClick={addException}
                  disabled={!draft.startDate || !draft.label.trim()}
                >
                  Ajouter l&apos;exception
                </PrimaryButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exception list */}
        {exceptions.length === 0 ? (
          <p className="text-[12px] text-muted text-center py-4">Aucune exception planifiee.</p>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {exceptions.map((ex) => (
                <motion.div
                  key={ex.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className="bg-white border border-border-light rounded-2xl p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-foreground truncate">{ex.label}</p>
                      <p className="text-[11px] text-muted mt-0.5">
                        {formatDate(ex.startDate)}
                        {ex.endDate ? ` → ${formatDate(ex.endDate)}` : ""}
                      </p>
                      {ex.message && (
                        <p className="text-[11px] text-foreground/80 mt-2 leading-relaxed italic">
                          &ldquo;{ex.message}&rdquo;
                        </p>
                      )}
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteException(ex.id)}
                      className="w-8 h-8 rounded-lg bg-danger-soft flex items-center justify-center flex-shrink-0"
                    >
                      <Trash2 size={12} className="text-danger" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </SettingsSection>

      <SaveButton onClick={flash} saving={saved} />
    </SettingsPage>
  );
}
