"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";
import { X, TrendingUp, Users, Star, CalendarDays, Target, ChevronRight } from "lucide-react";

const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

interface Slide {
  emoji: string;
  title: string;
  value: string;
  sub: string;
  color: string;
}

/**
 * Weekly recap modal — shown on Monday mornings (or manually triggered).
 * Disableable via localStorage toggle.
 */
export default function WeeklyRecap() {
  const { clients, appointments, invoices, isDemo } = useApp();
  const [show, setShow] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);

  // Should we show the recap?
  useEffect(() => {
    // Skip entirely on demo
    if (isDemo) return;
    try {
      // Disabled by user?
      if (localStorage.getItem("weekly_recap_disabled") === "1") return;

      const now = new Date();
      // Show on Mondays before noon
      if (now.getDay() !== 1 || now.getHours() >= 12) return;

      // Already shown this week?
      const lastShown = localStorage.getItem("weekly_recap_last");
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      const weekKey = weekStart.toISOString().split("T")[0];
      if (lastShown === weekKey) return;

      // Delay slightly so dashboard loads first
      const t = setTimeout(() => {
        setShow(true);
        localStorage.setItem("weekly_recap_last", weekKey);
      }, 1500);
      return () => clearTimeout(t);
    } catch { /* ignore */ }
  }, [isDemo]);

  // Compute last week stats
  const slides = useMemo((): Slide[] => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];
    const todayStr = now.toISOString().split("T")[0];

    // Revenue
    const weekRev = invoices
      .filter((i) => i.status === "paid" && i.clientId !== "__expense__" && i.date >= weekAgoStr && i.date <= todayStr)
      .reduce((s, i) => s + i.amount, 0);

    // Appointments done
    const weekDone = appointments.filter((a) => a.status === "done" && a.date >= weekAgoStr && a.date <= todayStr).length;

    // New clients
    const newClients = clients.filter((c) => c.createdAt >= weekAgoStr).length;

    // Best day
    const dayCounts: Record<string, number> = {};
    appointments
      .filter((a) => a.date >= weekAgoStr && a.date <= todayStr && a.status !== "canceled")
      .forEach((a) => { dayCounts[a.date] = (dayCounts[a.date] || 0) + 1; });
    let bestDayStr = "";
    let bestDayCount = 0;
    Object.entries(dayCounts).forEach(([d, c]) => { if (c > bestDayCount) { bestDayStr = d; bestDayCount = c; } });
    const bestDayLabel = bestDayStr
      ? `${DAY_NAMES[new Date(bestDayStr).getDay()]} ${new Date(bestDayStr).getDate()}`
      : "—";

    // Fill rate (done / (done + confirmed + canceled) for the week)
    const weekTotal = appointments.filter((a) => a.date >= weekAgoStr && a.date <= todayStr).length;
    const fillRate = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0;

    return [
      { emoji: "💰", title: "Chiffre d'affaires", value: `${weekRev.toFixed(0)} €`, sub: "encaissé cette semaine", color: "#16A34A" },
      { emoji: "📅", title: "Rendez-vous réalisés", value: String(weekDone), sub: "prestations terminées", color: "#8B5CF6" },
      { emoji: "👥", title: "Nouveaux clients", value: String(newClients), sub: newClients > 0 ? "votre base grandit" : "zéro cette semaine", color: "#3B82F6" },
      { emoji: "🏆", title: "Meilleur jour", value: bestDayLabel, sub: bestDayCount > 0 ? `${bestDayCount} rendez-vous` : "aucune donnée", color: "#F59E0B" },
      { emoji: "📊", title: "Taux de réalisation", value: `${fillRate}%`, sub: "de vos créneaux remplis", color: "#5B4FE9" },
    ];
  }, [clients, appointments, invoices]);

  const nextSlide = useCallback(() => {
    if (slideIdx < slides.length - 1) setSlideIdx((i) => i + 1);
    else setShow(false);
  }, [slideIdx, slides.length]);

  if (!show) return null;

  const slide = slides[slideIdx];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
      onClick={(e) => { if (e.target === e.currentTarget) setShow(false); }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-[340px] rounded-[28px] overflow-hidden relative"
        style={{ background: "linear-gradient(180deg, #FAFAF9, white)" }}
      >
        {/* Close */}
        <button onClick={() => setShow(false)} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-border-light flex items-center justify-center">
          <X size={16} className="text-muted" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "#5B4FE9" }}>
            Votre semaine en bref
          </p>
          <div className="flex justify-center gap-1.5 mt-3">
            {slides.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === slideIdx ? 20 : 8,
                  backgroundColor: i === slideIdx ? "#5B4FE9" : "#E4E4E7",
                }}
              />
            ))}
          </div>
        </div>

        {/* Slide content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slideIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="px-6 pb-6"
          >
            <div className="flex flex-col items-center text-center py-6">
              <p className="text-[48px] leading-none mb-3">{slide.emoji}</p>
              <p className="text-[12px] text-muted font-bold uppercase tracking-wider">{slide.title}</p>
              <p className="text-[40px] font-bold tracking-tight leading-none mt-2" style={{ color: slide.color }}>
                {slide.value}
              </p>
              <p className="text-[13px] text-muted mt-2">{slide.sub}</p>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={nextSlide}
              className="w-full py-3.5 rounded-2xl text-[14px] font-bold text-white flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)", boxShadow: "0 10px 24px rgba(91,79,233,0.35)" }}
            >
              {slideIdx < slides.length - 1 ? (
                <>Suivant <ChevronRight size={16} strokeWidth={2.6} /></>
              ) : (
                "C'est parti pour cette semaine !"
              )}
            </motion.button>
          </motion.div>
        </AnimatePresence>

        {/* Disable option on last slide */}
        {slideIdx === slides.length - 1 && (
          <div className="px-6 pb-5 text-center">
            <button
              onClick={() => {
                localStorage.setItem("weekly_recap_disabled", "1");
                setShow(false);
              }}
              className="text-[11px] text-muted underline"
            >
              Ne plus afficher ce récap
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
