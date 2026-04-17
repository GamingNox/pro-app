"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  RefreshCw,
  Bug,
  Lightbulb,
  MessageSquareHeart,
  Sparkles,
  CheckCircle2,
  Clock,
  Eye,
  Inbox,
  Mail,
} from "lucide-react";
import { fetchAllBetaReports, updateBetaReportStatus, labelFor } from "@/lib/beta";
import type { BetaReport, BetaReportKind, BetaReportStatus } from "@/lib/types";

type KindFilter = "all" | BetaReportKind;
type StatusFilter = "all" | BetaReportStatus;

const KIND_META: Record<BetaReportKind, { label: string; Icon: typeof Bug; tint: string }> = {
  bug: { label: "Bug", Icon: Bug, tint: "#8B5CF6" },
  feedback: { label: "Avis", Icon: MessageSquareHeart, tint: "#EC4899" },
  suggestion: { label: "Suggestion", Icon: Lightbulb, tint: "#F59E0B" },
};

const STATUS_META: Record<BetaReportStatus, { label: string; className: string; Icon: typeof Eye }> = {
  received: { label: "Reçu", className: "bg-accent-soft text-accent", Icon: Eye },
  in_progress: { label: "En cours", className: "bg-warning-soft text-warning", Icon: Clock },
  fixed: { label: "Traité", className: "bg-success-soft text-success", Icon: CheckCircle2 },
};

const STATUS_FLOW: BetaReportStatus[] = ["received", "in_progress", "fixed"];

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [reports, setReports] = useState<BetaReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const data = await fetchAllBetaReports();
    setReports(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function changeStatus(r: BetaReport, next: BetaReportStatus) {
    if (busy) return;
    setBusy(r.id);
    await updateBetaReportStatus(r.id, next);
    setReports((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: next } : x)));
    setBusy(null);
  }

  const counts = useMemo(() => ({
    total: reports.length,
    bug: reports.filter((r) => r.kind === "bug").length,
    feedback: reports.filter((r) => r.kind === "feedback").length,
    suggestion: reports.filter((r) => r.kind === "suggestion").length,
    received: reports.filter((r) => r.status === "received").length,
    in_progress: reports.filter((r) => r.status === "in_progress").length,
    fixed: reports.filter((r) => r.status === "fixed").length,
  }), [reports]);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (kindFilter !== "all" && r.kind !== kindFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [reports, kindFilter, statusFilter]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
            style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}>
            <ArrowLeft size={18} className="text-foreground" strokeWidth={2.4} />
          </motion.button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#6D28D9" }}>Admin</p>
            <h1 className="text-[22px] font-bold text-foreground tracking-tight leading-tight">Retours bêta</h1>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={load}
          className="w-10 h-10 rounded-xl bg-white shadow-card-premium flex items-center justify-center">
          <RefreshCw size={16} className={`text-muted ${loading ? "animate-spin" : ""}`} />
        </motion.button>
      </div>

      {/* KPI */}
      <div className="flex-shrink-0 px-6 pb-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl p-3 shadow-card-premium text-center">
            <Bug size={13} className="mx-auto mb-1" style={{ color: "#8B5CF6" }} />
            <p className="text-[20px] font-bold text-foreground leading-none">{counts.bug}</p>
            <p className="text-[9px] text-muted mt-1 uppercase tracking-wider">Bugs</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-card-premium text-center">
            <Lightbulb size={13} className="mx-auto mb-1" style={{ color: "#F59E0B" }} />
            <p className="text-[20px] font-bold text-foreground leading-none">{counts.suggestion}</p>
            <p className="text-[9px] text-muted mt-1 uppercase tracking-wider">Idées</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-card-premium text-center">
            <MessageSquareHeart size={13} className="mx-auto mb-1" style={{ color: "#EC4899" }} />
            <p className="text-[20px] font-bold text-foreground leading-none">{counts.feedback}</p>
            <p className="text-[9px] text-muted mt-1 uppercase tracking-wider">Avis</p>
          </div>
        </div>
      </div>

      {/* Filter: kind */}
      <div className="flex-shrink-0 px-6 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
        {([
          { key: "all", label: `Tous (${counts.total})` },
          { key: "bug", label: `Bugs (${counts.bug})` },
          { key: "suggestion", label: `Idées (${counts.suggestion})` },
          { key: "feedback", label: `Avis (${counts.feedback})` },
        ] as const).map((f) => {
          const active = kindFilter === f.key;
          return (
            <motion.button
              key={f.key}
              whileTap={{ scale: 0.96 }}
              onClick={() => setKindFilter(f.key as KindFilter)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap ${active ? "text-white" : "bg-white text-muted"}`}
              style={active
                ? { background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }
                : { border: "1px solid #E4E4E7" }}
            >
              {f.label}
            </motion.button>
          );
        })}
      </div>

      {/* Filter: status */}
      <div className="flex-shrink-0 px-6 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
        {([
          { key: "all", label: "Tout" },
          { key: "received", label: `Non lus (${counts.received})` },
          { key: "in_progress", label: `En cours (${counts.in_progress})` },
          { key: "fixed", label: `Traités (${counts.fixed})` },
        ] as const).map((f) => {
          const active = statusFilter === f.key;
          return (
            <motion.button
              key={f.key}
              whileTap={{ scale: 0.96 }}
              onClick={() => setStatusFilter(f.key as StatusFilter)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap ${active ? "bg-accent-soft text-accent" : "bg-white text-muted"}`}
              style={!active ? { border: "1px solid #E4E4E7" } : undefined}
            >
              {f.label}
            </motion.button>
          );
        })}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {loading ? (
            <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center">
              <p className="text-[12px] text-muted">Chargement des retours...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-3">
                <Inbox size={24} className="text-accent" />
              </div>
              <p className="text-[14px] font-bold text-foreground">Aucun retour</p>
              <p className="text-[11px] text-muted mt-1.5 max-w-[260px] mx-auto leading-relaxed">
                Dès qu&apos;un bêta testeur enverra un rapport, il apparaîtra ici.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((r) => {
                const km = KIND_META[r.kind];
                const sm = STATUS_META[r.status];
                const Icon = km.Icon;
                const StatusIcon = sm.Icon;
                const isExpanded = expanded === r.id;
                const currentIdx = STATUS_FLOW.indexOf(r.status);
                return (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-card-premium overflow-hidden"
                  >
                    <button
                      onClick={() => setExpanded((id) => (id === r.id ? null : r.id))}
                      className="w-full p-4 flex items-start gap-3 text-left"
                    >
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${km.tint}18` }}>
                        <Icon size={18} style={{ color: km.tint }} strokeWidth={2.2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-bold text-foreground truncate">{r.title || labelFor(r.kind)}</p>
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md flex items-center gap-1 ${sm.className}`}>
                            <StatusIcon size={9} /> {sm.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted truncate mt-0.5 flex items-center gap-1">
                          <Mail size={9} /> {r.userName || "Utilisateur"} {r.userEmail ? `· ${r.userEmail}` : ""}
                        </p>
                        <p className="text-[11px] text-foreground mt-2 line-clamp-2 leading-relaxed">
                          {r.description || "(pas de description)"}
                        </p>
                        <p className="text-[9px] text-subtle mt-1">
                          {labelFor(r.kind)} · {new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 border-t border-border-light">
                            {r.step && (
                              <div className="mt-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Étape concernée</p>
                                <p className="text-[12px] text-foreground leading-relaxed">{r.step}</p>
                              </div>
                            )}
                            <div className="mt-3">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Description complète</p>
                              <p className="text-[12px] text-foreground leading-relaxed whitespace-pre-line">{r.description}</p>
                            </div>
                            {r.verdict && (
                              <div className="mt-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Verdict</p>
                                <p className="text-[12px] text-foreground">{r.verdict}</p>
                              </div>
                            )}

                            {/* Status actions */}
                            <div className="flex gap-2 mt-4">
                              {STATUS_FLOW.map((s, idx) => {
                                const active = r.status === s;
                                const sMeta = STATUS_META[s];
                                const StatusActIcon = sMeta.Icon;
                                return (
                                  <motion.button
                                    key={s}
                                    whileTap={{ scale: 0.96 }}
                                    disabled={active || busy === r.id}
                                    onClick={() => changeStatus(r, s)}
                                    className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${active ? "opacity-100" : "opacity-70"}`}
                                    style={active
                                      ? {
                                          background:
                                            s === "received"
                                              ? "linear-gradient(135deg, #8B5CF6, #6D28D9)"
                                              : s === "in_progress"
                                              ? "linear-gradient(135deg, #F59E0B, #B45309)"
                                              : "linear-gradient(135deg, #10B981, #047857)",
                                          color: "white",
                                        }
                                      : { backgroundColor: "#F4F4F5", color: "#71717A" }}
                                  >
                                    <StatusActIcon size={12} strokeWidth={2.5} />
                                    {idx === 0 ? "Lu" : idx === 1 ? "En cours" : "Traité"}
                                  </motion.button>
                                );
                              })}
                            </div>

                            <p className="text-[10px] text-muted text-center mt-3 italic">
                              Statut actuel : <strong className="text-foreground">{sm.label}</strong>
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Info footer */}
          <div className="mt-6 bg-accent-soft rounded-2xl p-4">
            <div className="flex items-start gap-2.5">
              <Sparkles size={14} className="text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[12px] font-bold text-foreground">Centralisé</p>
                <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                  Tous les retours envoyés depuis l&apos;Espace bêta des testeurs convergent ici. Changer le statut informe le produit en temps réel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
