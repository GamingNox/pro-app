"use client";

import { motion } from "framer-motion";
import { Sparkles, Clock, CheckCircle2, Rocket } from "lucide-react";
import { CHANGELOG, type ChangelogEntry, type ChangelogStatus } from "@/lib/changelog";

const STATUS_META: Record<ChangelogStatus, { label: string; Icon: typeof Sparkles; tint: string; soft: string }> = {
  new: { label: "NOUVEAU", Icon: Sparkles, tint: "#8B5CF6", soft: "#F3F0FF" },
  shipped: { label: "LIVRÉ", Icon: CheckCircle2, tint: "#10B981", soft: "#D1FAE5" },
  upcoming: { label: "À VENIR", Icon: Rocket, tint: "#F59E0B", soft: "#FEF3C7" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function EntryCard({ entry, index }: { entry: ChangelogEntry; index: number }) {
  const meta = STATUS_META[entry.status];
  const Icon = meta.Icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="bg-white rounded-2xl p-5 shadow-card-premium relative overflow-hidden"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: meta.soft }}>
          <Icon size={17} style={{ color: meta.tint }} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] font-bold text-foreground leading-tight">{entry.title}</h3>
            {entry.status === "new" && (
              <span className="text-[8px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-md"
                style={{ backgroundColor: meta.soft, color: meta.tint }}>
                {meta.label}
              </span>
            )}
          </div>
          <p className="text-[12px] text-muted mt-1.5 leading-relaxed">{entry.description}</p>
          <div className="flex items-center gap-2 mt-2.5">
            <p className="text-[10px] text-subtle font-medium">{formatDate(entry.date)}</p>
            {entry.tag && (
              <>
                <span className="text-[9px] text-subtle">•</span>
                <p className="text-[10px] text-muted font-semibold">{entry.tag}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ChangelogView() {
  const upcoming = CHANGELOG.filter((c) => c.status === "upcoming");
  const shipped = CHANGELOG.filter((c) => c.status !== "upcoming");

  return (
    <>
      {/* ── Upcoming ── */}
      {upcoming.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#F59E0B" }} />
            <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: "#B45309" }}>Prochainement</p>
          </div>
          <div className="space-y-3">
            {upcoming.map((e, i) => <EntryCard key={e.id} entry={e} index={i} />)}
          </div>
        </div>
      )}

      {/* ── Shipped timeline ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-accent">Mises à jour récentes</p>
        </div>
        <div className="space-y-3">
          {shipped.map((e, i) => <EntryCard key={e.id} entry={e} index={i} />)}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="bg-white rounded-2xl p-5 shadow-card-premium text-center">
        <div className="w-12 h-12 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-3">
          <Clock size={20} className="text-accent" />
        </div>
        <p className="text-[14px] font-bold text-foreground">Une idée ou un besoin ?</p>
        <p className="text-[11px] text-muted mt-1.5 max-w-[260px] mx-auto leading-relaxed">
          Partagez vos retours depuis le menu Aide — chaque suggestion est lue.
        </p>
      </div>
    </>
  );
}
