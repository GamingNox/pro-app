"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  Calendar,
  Target,
  Trophy,
  Receipt,
  Clock,
  Flame,
  XCircle,
} from "lucide-react";
import SettingsPage, { SettingsSection } from "@/components/SettingsPage";

const EUR = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const DAY_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function pctDelta(curr: number, prev: number) {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function DeltaChip({ delta, hasPrev }: { delta: number; hasPrev: boolean }) {
  if (!hasPrev) {
    return (
      <span
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold"
        style={{ backgroundColor: "var(--color-border-light)", color: "var(--color-muted)" }}
      >
        —
      </span>
    );
  }
  const up = delta >= 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold"
      style={{
        backgroundColor: "var(--color-primary-soft)",
        color: "var(--color-primary-deep)",
      }}
    >
      {up ? <TrendingUp size={9} strokeWidth={3} /> : <TrendingDown size={9} strokeWidth={3} />}
      {up ? "+" : ""}
      {delta}%
    </span>
  );
}

export default function SettingsAnalyticsPage() {
  const { clients, appointments, invoices } = useApp();

  // ── Time windows ─────────────────────────────────────────
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const toISO = (d: Date) => d.toISOString().split("T")[0];
  const monthStartISO = toISO(startOfMonth);
  const lastMonthStartISO = toISO(startOfLastMonth);
  const lastMonthEndISO = toISO(endOfLastMonth);

  const paidInvoices = useMemo(
    () => invoices.filter((i) => i.status === "paid" && i.clientId !== "__expense__"),
    [invoices]
  );

  // ── Revenue ──────────────────────────────────────────────
  const monthRev = useMemo(
    () => paidInvoices.filter((i) => i.date >= monthStartISO).reduce((s, i) => s + i.amount, 0),
    [paidInvoices, monthStartISO]
  );
  const lastMonthRev = useMemo(
    () => paidInvoices.filter((i) => i.date >= lastMonthStartISO && i.date <= lastMonthEndISO).reduce((s, i) => s + i.amount, 0),
    [paidInvoices, lastMonthStartISO, lastMonthEndISO]
  );
  const revDelta = pctDelta(monthRev, lastMonthRev);
  const isUp = revDelta >= 0;

  // ── Appointments this vs last month ─────────────────────
  const apptThisMonth = useMemo(
    () => appointments.filter((a) => a.date >= monthStartISO),
    [appointments, monthStartISO]
  );
  const apptLastMonth = useMemo(
    () => appointments.filter((a) => a.date >= lastMonthStartISO && a.date <= lastMonthEndISO),
    [appointments, lastMonthStartISO, lastMonthEndISO]
  );

  const doneThisMonth = apptThisMonth.filter((a) => a.status === "done");
  const doneLastMonth = apptLastMonth.filter((a) => a.status === "done");
  const doneAppointments = useMemo(() => appointments.filter((a) => a.status === "done"), [appointments]);
  const confirmedAppointments = useMemo(() => appointments.filter((a) => a.status === "confirmed"), [appointments]);

  // ── Average ticket + delta ──────────────────────────────
  const avgTicket = doneThisMonth.length > 0
    ? Math.round(doneThisMonth.reduce((s, a) => s + (a.price || 0), 0) / doneThisMonth.length)
    : 0;
  const avgTicketLast = doneLastMonth.length > 0
    ? Math.round(doneLastMonth.reduce((s, a) => s + (a.price || 0), 0) / doneLastMonth.length)
    : 0;
  const avgTicketDelta = pctDelta(avgTicket, avgTicketLast);

  // ── Completion rate + delta ─────────────────────────────
  const completionRate = apptThisMonth.length > 0
    ? Math.round((doneThisMonth.length / apptThisMonth.length) * 100)
    : 0;
  const completionRateLast = apptLastMonth.length > 0
    ? Math.round((doneLastMonth.length / apptLastMonth.length) * 100)
    : 0;
  const completionDelta = completionRate - completionRateLast;

  // ── New clients + delta ─────────────────────────────────
  const newThisMonth = useMemo(
    () => clients.filter((c) => new Date(c.createdAt) >= startOfMonth).length,
    [clients, startOfMonth]
  );
  const newLastMonth = useMemo(
    () => clients.filter((c) => {
      const d = new Date(c.createdAt);
      return d >= startOfLastMonth && d <= endOfLastMonth;
    }).length,
    [clients, startOfLastMonth, endOfLastMonth]
  );
  const newClientsDelta = pctDelta(newThisMonth, newLastMonth);

  // ── Avg session duration ────────────────────────────────
  const avgDuration = doneAppointments.length > 0
    ? Math.round(doneAppointments.reduce((s, a) => s + (a.duration || 0), 0) / doneAppointments.length)
    : 0;
  const avgDurationThis = doneThisMonth.length > 0
    ? Math.round(doneThisMonth.reduce((s, a) => s + (a.duration || 0), 0) / doneThisMonth.length)
    : 0;
  const avgDurationLast = doneLastMonth.length > 0
    ? Math.round(doneLastMonth.reduce((s, a) => s + (a.duration || 0), 0) / doneLastMonth.length)
    : 0;
  const durationDelta = pctDelta(avgDurationThis, avgDurationLast);

  // ── Cancellation rate + delta ───────────────────────────
  const canceledThisMonth = apptThisMonth.filter((a) => a.status === "canceled").length;
  const canceledLastMonth = apptLastMonth.filter((a) => a.status === "canceled").length;
  const cancelRate = apptThisMonth.length > 0
    ? Math.round((canceledThisMonth / apptThisMonth.length) * 100)
    : 0;
  const cancelRateLast = apptLastMonth.length > 0
    ? Math.round((canceledLastMonth / apptLastMonth.length) * 100)
    : 0;
  const cancelDelta = cancelRate - cancelRateLast;
  const canceledTotal = useMemo(() => appointments.filter((a) => a.status === "canceled").length, [appointments]);

  // ── Retention ───────────────────────────────────────────
  const returningClients = useMemo(() => {
    const counts = new Map<string, number>();
    doneAppointments.forEach((a) => counts.set(a.clientId, (counts.get(a.clientId) || 0) + 1));
    return Array.from(counts.values()).filter((c) => c >= 2).length;
  }, [doneAppointments]);
  const retentionRate = clients.length > 0 ? Math.round((returningClients / clients.length) * 100) : 0;

  // ── 6-month revenue chart ──────────────────────────────
  const chartData = useMemo(() => {
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      months.push({
        label: start.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase().slice(0, 3),
        value: paidInvoices
          .filter((inv) => inv.date >= toISO(start) && inv.date <= toISO(end))
          .reduce((s, inv) => s + inv.amount, 0),
      });
    }
    return months;
  }, [paidInvoices, now]);
  const maxChart = Math.max(...chartData.map((m) => m.value), 1);

  // Build a smooth SVG path over the 6 months (for gradient fill overlay)
  const chartPath = useMemo(() => {
    const w = 100;
    const h = 100;
    if (chartData.length === 0) return { line: "", area: "" };
    const step = w / (chartData.length - 1 || 1);
    const pts = chartData.map((m, i) => {
      const x = i * step;
      const y = h - Math.max((m.value / maxChart) * 85, 6);
      return { x, y };
    });
    const line = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
    const area = `${line} L ${w} ${h} L 0 ${h} Z`;
    return { line, area };
  }, [chartData, maxChart]);

  // ── Top services this month ────────────────────────────
  const topServices = useMemo(() => {
    const counts = new Map<string, { count: number; revenue: number }>();
    doneThisMonth.forEach((a) => {
      const key = a.title || "Sans titre";
      const prev = counts.get(key) || { count: 0, revenue: 0 };
      counts.set(key, { count: prev.count + 1, revenue: prev.revenue + (a.price || 0) });
    });
    return Array.from(counts.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);
  }, [doneThisMonth]);
  const topServiceMax = Math.max(...topServices.map((s) => s.revenue), 1);

  // ── Top 3 weekdays ─────────────────────────────────────
  const topDays = useMemo(() => {
    const counts = new Array(7).fill(0);
    doneAppointments.forEach((a) => {
      const d = new Date(a.date).getDay();
      counts[d]++;
    });
    return counts
      .map((count, idx) => ({ day: DAY_NAMES[idx], short: DAY_SHORT[idx], count }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [doneAppointments]);
  const topDayMax = Math.max(...topDays.map((d) => d.count), 1);

  // ── Peak activity: best (day, hour) combo ──────────────
  const peak = useMemo(() => {
    const bucket = new Map<string, { day: number; hour: number; count: number }>();
    doneAppointments.forEach((a) => {
      if (!a.time) return;
      const d = new Date(a.date).getDay();
      const h = parseInt(a.time.split(":")[0] || "0", 10);
      const key = `${d}-${h}`;
      const prev = bucket.get(key) || { day: d, hour: h, count: 0 };
      bucket.set(key, { ...prev, count: prev.count + 1 });
    });
    if (bucket.size === 0) return null;
    let best = Array.from(bucket.values())[0];
    bucket.forEach((v) => {
      if (v.count > best.count) best = v;
    });
    return best;
  }, [doneAppointments]);

  return (
    <SettingsPage
      category="Performance"
      title="Statistiques"
      description="Les vrais chiffres de votre activité, calculés en direct depuis vos rendez-vous et factures."
    >
      {/* ── Hero KPI: this month revenue (VIOLET, never accent) ── */}
      <div
        className="rounded-[22px] p-5 mb-5 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
          boxShadow: "0 14px 36px color-mix(in srgb, var(--color-primary) 35%, transparent)",
        }}
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -left-6 -bottom-10 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={14} className="text-white" strokeWidth={2.5} />
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/85">Ce mois-ci</p>
          </div>
          <p className="text-[34px] font-bold tracking-tight leading-none mt-2">
            {EUR(monthRev)}
            <span className="text-[18px] text-white/80 ml-1">&nbsp;€</span>
          </p>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1 bg-white/15 backdrop-blur-sm rounded-lg px-2.5 py-1">
              {isUp ? (
                <TrendingUp size={12} className="text-white" strokeWidth={2.8} />
              ) : (
                <TrendingDown size={12} className="text-white" strokeWidth={2.8} />
              )}
              <span className="text-[11px] font-bold text-white">
                {lastMonthRev > 0 ? `${isUp ? "+" : ""}${revDelta}%` : "—"}
              </span>
            </div>
            <p className="text-[11px] text-white/80">vs mois dernier ({EUR(lastMonthRev)}&nbsp;€)</p>
          </div>
        </div>
      </div>

      {/* ── KPI grid ── */}
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted mb-2.5 px-1">Indicateurs clefs</p>
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {/* Panier moyen */}
        <div className="bg-white rounded-2xl p-4 shadow-card-premium">
          <div className="flex items-start justify-between mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "var(--color-primary-soft)" }}
            >
              <Receipt size={15} strokeWidth={2.4} style={{ color: "var(--color-primary-deep)" }} />
            </div>
            <DeltaChip delta={avgTicketDelta} hasPrev={avgTicketLast > 0} />
          </div>
          <p className="text-[22px] font-bold text-foreground leading-none">{EUR(avgTicket)}&nbsp;€</p>
          <p className="text-[10px] text-muted mt-1 uppercase tracking-wider">Panier moyen</p>
        </div>

        {/* Taux realises */}
        <div className="bg-white rounded-2xl p-4 shadow-card-premium">
          <div className="flex items-start justify-between mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "var(--color-primary-soft)" }}
            >
              <Target size={15} strokeWidth={2.4} style={{ color: "var(--color-primary-deep)" }} />
            </div>
            <DeltaChip delta={completionDelta} hasPrev={apptLastMonth.length > 0} />
          </div>
          <p className="text-[22px] font-bold text-foreground leading-none">{completionRate}%</p>
          <p className="text-[10px] text-muted mt-1 uppercase tracking-wider">Taux realises</p>
        </div>

        {/* Nouveaux clients */}
        <div className="bg-white rounded-2xl p-4 shadow-card-premium">
          <div className="flex items-start justify-between mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "var(--color-primary-soft)" }}
            >
              <Users size={15} strokeWidth={2.4} style={{ color: "var(--color-primary-deep)" }} />
            </div>
            <DeltaChip delta={newClientsDelta} hasPrev={newLastMonth > 0} />
          </div>
          <p className="text-[22px] font-bold text-foreground leading-none">+{newThisMonth}</p>
          <p className="text-[10px] text-muted mt-1 uppercase tracking-wider">Nouveaux clients</p>
        </div>

        {/* RDV a venir */}
        <div className="bg-white rounded-2xl p-4 shadow-card-premium">
          <div className="flex items-start justify-between mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "var(--color-primary-soft)" }}
            >
              <Calendar size={15} strokeWidth={2.4} style={{ color: "var(--color-primary-deep)" }} />
            </div>
          </div>
          <p className="text-[22px] font-bold text-foreground leading-none">{confirmedAppointments.length}</p>
          <p className="text-[10px] text-muted mt-1 uppercase tracking-wider">RDV a venir</p>
        </div>

        {/* Duree moyenne */}
        <div className="bg-white rounded-2xl p-4 shadow-card-premium">
          <div className="flex items-start justify-between mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "var(--color-primary-soft)" }}
            >
              <Clock size={15} strokeWidth={2.4} style={{ color: "var(--color-primary-deep)" }} />
            </div>
            <DeltaChip delta={durationDelta} hasPrev={avgDurationLast > 0} />
          </div>
          <p className="text-[22px] font-bold text-foreground leading-none">
            {avgDuration}
            <span className="text-[13px] text-muted ml-1">min</span>
          </p>
          <p className="text-[10px] text-muted mt-1 uppercase tracking-wider">Duree moyenne</p>
        </div>

        {/* Taux d'annulation */}
        <div className="bg-white rounded-2xl p-4 shadow-card-premium">
          <div className="flex items-start justify-between mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: cancelRate > 15 ? "var(--color-warning-soft, #FEF3C7)" : "var(--color-primary-soft)",
              }}
            >
              <XCircle
                size={15}
                strokeWidth={2.4}
                style={{
                  color: cancelRate > 15 ? "var(--color-warning, #D97706)" : "var(--color-primary-deep)",
                }}
              />
            </div>
            {apptLastMonth.length > 0 && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold"
                style={{
                  backgroundColor: cancelDelta <= 0 ? "var(--color-primary-soft)" : "var(--color-warning-soft, #FEF3C7)",
                  color: cancelDelta <= 0 ? "var(--color-primary-deep)" : "var(--color-warning, #D97706)",
                }}
              >
                {cancelDelta <= 0 ? <TrendingDown size={9} strokeWidth={3} /> : <TrendingUp size={9} strokeWidth={3} />}
                {cancelDelta > 0 ? "+" : ""}
                {cancelDelta}pt
              </span>
            )}
          </div>
          <p className="text-[22px] font-bold text-foreground leading-none">{cancelRate}%</p>
          <p className="text-[10px] text-muted mt-1 uppercase tracking-wider">Annulations</p>
        </div>
      </div>

      {/* ── Revenue trend chart ── */}
      <SettingsSection title="Revenus sur 6 mois" description="Total encaisse par mois (factures payees uniquement).">
        <div className="relative h-[150px] mb-2">
          {/* SVG gradient fill underlay */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              d={chartPath.area}
              fill="url(#revGrad)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            />
            <motion.path
              d={chartPath.line}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </svg>

          {/* Bars (violet, hardcoded) */}
          <div className="absolute inset-0 flex items-end gap-[6px]">
            {chartData.map((m, i) => {
              const isCurrent = i === chartData.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <p
                    className="text-[9px] font-bold"
                    style={{ color: isCurrent ? "var(--color-primary-deep)" : "var(--color-muted)" }}
                  >
                    {m.value > 0 ? `${EUR(m.value)}` : "—"}
                  </p>
                  <motion.div
                    className="w-full rounded-t-[5px]"
                    style={{
                      background: isCurrent
                        ? "linear-gradient(180deg, var(--color-primary), var(--color-primary-deep))"
                        : "color-mix(in srgb, var(--color-primary) 20%, transparent)",
                    }}
                    initial={{ height: "6%" }}
                    animate={{ height: `${Math.max((m.value / maxChart) * 85, 6)}%` }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex gap-[6px] mt-1">
          {chartData.map((m) => (
            <span key={m.label} className="flex-1 text-center text-[9px] text-muted uppercase tracking-wider">
              {m.label}
            </span>
          ))}
        </div>
      </SettingsSection>

      {/* ── Peak activity ── */}
      {peak && (
        <SettingsSection title="Pic d'activité" description="Le créneau où vous réalisez le plus de prestations.">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
                boxShadow: "0 8px 20px color-mix(in srgb, var(--color-primary) 28%, transparent)",
              }}
            >
              <Flame size={22} className="text-white" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[20px] font-bold text-foreground leading-tight">
                {DAY_NAMES[peak.day]} &middot; {String(peak.hour).padStart(2, "0")}h
              </p>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                {peak.count} prestation{peak.count > 1 ? "s" : ""} sur ce créneau. Idéalement, proposez-y vos services premium.
              </p>
            </div>
          </div>
        </SettingsSection>
      )}

      {/* ── Best 3 weekdays ── */}
      {topDays.length > 0 && (
        <SettingsSection title="Meilleurs jours" description="Les 3 jours de la semaine ou vous travaillez le plus.">
          <div className="space-y-3">
            {topDays.map((d, i) => (
              <div key={d.day}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
                      }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-[13px] font-semibold text-foreground truncate">{d.day}</p>
                  </div>
                  <p className="text-[12px] font-bold flex-shrink-0 ml-2" style={{ color: "var(--color-primary-deep)" }}>
                    {d.count} RDV
                  </p>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-border-light)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg, var(--color-primary), var(--color-primary-deep))",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(d.count / topDayMax) * 100}%` }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SettingsSection>
      )}

      {/* ── Top services ── */}
      {topServices.length > 0 && (
        <SettingsSection title="Top services ce mois" description="Services les plus rentables, classes par revenus.">
          <div className="space-y-3">
            {topServices.map((s, i) => (
              <div key={s.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-muted w-4">#{i + 1}</span>
                    <p className="text-[13px] font-semibold text-foreground truncate">{s.name}</p>
                  </div>
                  <p className="text-[12px] font-bold flex-shrink-0 ml-2" style={{ color: "var(--color-primary-deep)" }}>
                    {EUR(s.revenue)}&nbsp;€
                  </p>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-border-light)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg, var(--color-primary), var(--color-primary-deep))",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(s.revenue / topServiceMax) * 100}%` }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}
                  />
                </div>
                <p className="text-[10px] text-muted mt-1">
                  {s.count} prestation{s.count > 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        </SettingsSection>
      )}

      {/* ── Insights ── */}
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted mb-2.5 px-1">A retenir</p>
      <div className="space-y-2.5 mb-5">
        <div className="bg-white rounded-2xl p-4 shadow-card-premium flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "var(--color-primary-soft)" }}
          >
            <Trophy size={16} strokeWidth={2.4} style={{ color: "var(--color-primary-deep)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-foreground">Fidelite : {retentionRate}%</p>
            <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
              {returningClients} client{returningClients > 1 ? "s" : ""} sur {clients.length} sont revenus au moins 2 fois. Un programme de
              fidelite peut augmenter ce chiffre.
            </p>
          </div>
        </div>

        {canceledTotal > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-card-premium flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--color-warning-soft, #FEF3C7)" }}
            >
              <TrendingDown size={16} strokeWidth={2.4} style={{ color: "var(--color-warning, #D97706)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-foreground">
                {canceledTotal} annulation{canceledTotal > 1 ? "s" : ""} au total
              </p>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                Activez les rappels automatiques pour reduire ce taux (Parametres → Notifications).
              </p>
            </div>
          </div>
        )}
      </div>
    </SettingsPage>
  );
}
