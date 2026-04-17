"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  X,
  RefreshCw,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  UserMinus,
  AlertTriangle,
  Copy,
  Database,
  Trash2,
} from "lucide-react";
import {
  fetchBetaRequests,
  decideBetaRequest,
  removeBetaAccess,
  deleteBetaRequest,
  checkBetaSchema,
  clearUnseenBeta,
  type BetaSchemaDiagnostics,
} from "@/lib/beta";
import type { BetaRequest } from "@/lib/types";

type FilterKey = "pending" | "approved" | "rejected" | "all";

const STATUS_META: Record<string, { label: string; className: string; Icon: typeof Clock }> = {
  pending: { label: "EN ATTENTE", className: "bg-warning-soft text-warning", Icon: Clock },
  approved: { label: "APPROUVÉ", className: "bg-success-soft text-success", Icon: CheckCircle2 },
  rejected: { label: "REFUSÉ", className: "bg-danger-soft text-danger", Icon: XCircle },
  none: { label: "AUCUN", className: "bg-border-light text-muted", Icon: Clock },
};

export default function AdminBetaPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<BetaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [schema, setSchema] = useState<BetaSchemaDiagnostics | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);

  async function load() {
    setLoading(true);
    const [data, diag] = await Promise.all([fetchBetaRequests(), checkBetaSchema()]);
    setRequests(data);
    setSchema(diag);
    setLoading(false);
  }

  useEffect(() => { load(); clearUnseenBeta(); }, []);

  function flashToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function decide(r: BetaRequest, decision: "approved" | "rejected") {
    if (busy) return;
    setBusy(r.id);
    const res = await decideBetaRequest(r.id, r.userId, decision);
    if (!res.ok) {
      flashToast("err", `Échec de la mise à jour : ${res.error || "erreur inconnue"}`);
      setBusy(null);
      return;
    }
    // Re-fetch from DB so the displayed state exactly matches what's persisted
    const fresh = await fetchBetaRequests();
    setRequests(fresh);
    setBusy(null);
    flashToast("ok", decision === "approved" ? "Demande approuvée ✓" : "Demande refusée");
  }

  async function revoke(r: BetaRequest) {
    if (busy) return;
    if (!confirm(`Retirer l'accès bêta de ${r.userName || "cet utilisateur"} ? Son plan premium sera également retiré.`)) return;
    setBusy(r.id);
    const res = await removeBetaAccess(r.userId);
    if (!res.ok) {
      flashToast("err", `Échec du retrait : ${res.error || "erreur inconnue"}`);
      setBusy(null);
      return;
    }
    const fresh = await fetchBetaRequests();
    setRequests(fresh);
    setBusy(null);
    flashToast("ok", "Accès bêta retiré");
  }

  async function remove(r: BetaRequest) {
    if (busy) return;
    if (!confirm(`Supprimer définitivement cette demande refusée ? L'utilisateur pourra en soumettre une nouvelle.`)) return;
    setBusy(r.id);
    const res = await deleteBetaRequest(r.id);
    if (!res.ok) {
      flashToast("err", `Échec de la suppression : ${res.error || "erreur inconnue"}`);
      setBusy(null);
      return;
    }
    setRequests((prev) => prev.filter((x) => x.id !== r.id));
    setBusy(null);
    flashToast("ok", "Demande supprimée");
  }

  function copySql() {
    const sql = `-- Run this in the Supabase SQL editor
alter table public.user_profiles add column if not exists beta_status text default 'none';

create table if not exists public.beta_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  motivation text not null, feedback text, experience text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.beta_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null, title text, description text not null,
  step text, verdict text,
  status text not null default 'received',
  created_at timestamptz not null default now()
);

alter table public.beta_requests enable row level security;
alter table public.beta_reports enable row level security;

create policy "beta_requests_anon_all" on public.beta_requests for all using (true) with check (true);
create policy "beta_reports_anon_all" on public.beta_reports for all using (true) with check (true);
create policy "user_profiles_beta_status_update" on public.user_profiles for update using (true) with check (true);

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.beta_requests; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.beta_reports; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.user_profiles; exception when duplicate_object then null; end;
  end if;
end $$;`;
    try {
      navigator.clipboard.writeText(sql);
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 2000);
    } catch {}
  }

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  const counts = useMemo(() => ({
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    all: requests.length,
  }), [requests]);

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
            <h1 className="text-[22px] font-bold text-foreground tracking-tight leading-tight">Demandes bêta</h1>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={load}
          className="w-10 h-10 rounded-xl bg-white shadow-card-premium flex items-center justify-center">
          <RefreshCw size={16} className={`text-muted ${loading ? "animate-spin" : ""}`} />
        </motion.button>
      </div>

      {/* ── Toast (success / error feedback) ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex-shrink-0 mx-6 mb-3 rounded-xl px-4 py-3 text-[12px] font-bold flex items-center gap-2"
            style={toast.type === "ok"
              ? { backgroundColor: "#D1FAE5", color: "#047857" }
              : { backgroundColor: "#FEE2E2", color: "#991B1B" }}
          >
            {toast.type === "ok" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            <span className="flex-1">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Schema diagnostics banner (critical if tables missing) ── */}
      {schema && !schema.ok && (
        <div className="flex-shrink-0 mx-6 mb-3 rounded-2xl p-4"
          style={{ background: "linear-gradient(135deg, #FEE2E2 0%, #FEF3C7 100%)", border: "1px solid #FCA5A5" }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
              <Database size={16} className="text-danger" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-foreground">Migration SQL requise</p>
              <p className="text-[11px] text-muted mt-1 leading-relaxed">
                {schema.missing.user_profiles_beta_status && "Colonne user_profiles.beta_status manquante. "}
                {schema.missing.beta_requests && "Table beta_requests manquante. "}
                {schema.missing.beta_reports && "Table beta_reports manquante. "}
                Ouvrez votre SQL editor Supabase et collez la migration pour activer le système.
              </p>
              <div className="flex gap-2 mt-3">
                <motion.button whileTap={{ scale: 0.96 }} onClick={copySql}
                  className="text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}>
                  <Copy size={11} /> {sqlCopied ? "Copié !" : "Copier le SQL"}
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={load}
                  className="bg-white text-foreground text-[11px] font-bold px-3 py-1.5 rounded-lg"
                  style={{ border: "1px solid #E4E4E7" }}>
                  Re-tester
                </motion.button>
              </div>
              {schema.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="text-[10px] text-muted cursor-pointer">Voir les détails techniques</summary>
                  <ul className="mt-1 text-[10px] text-muted space-y-0.5 pl-3">
                    {schema.errors.map((e, i) => <li key={i}>• {e}</li>)}
                  </ul>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KPI */}
      <div className="flex-shrink-0 px-6 pb-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl p-3 shadow-card-premium text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-warning">En attente</p>
            <p className="text-[22px] font-bold text-foreground leading-none mt-1">{counts.pending}</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-card-premium text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-success">Approuvés</p>
            <p className="text-[22px] font-bold text-foreground leading-none mt-1">{counts.approved}</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-card-premium text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-danger">Refusés</p>
            <p className="text-[22px] font-bold text-foreground leading-none mt-1">{counts.rejected}</p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex-shrink-0 px-6 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
        {([
          { key: "pending", label: "En attente" },
          { key: "approved", label: "Approuvés" },
          { key: "rejected", label: "Refusés" },
          { key: "all", label: "Tous" },
        ] as const).map((t) => {
          const active = filter === t.key;
          return (
            <motion.button
              key={t.key}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter(t.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${active ? "text-white" : "bg-white text-muted"}`}
              style={active
                ? { background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }
                : { border: "1px solid #E4E4E7" }}
            >
              {t.label}
            </motion.button>
          );
        })}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">
          {loading ? (
            <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center">
              <p className="text-[12px] text-muted">Chargement des demandes...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-card-premium text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-3">
                <Sparkles size={24} className="text-accent" />
              </div>
              <p className="text-[14px] font-bold text-foreground">Aucune demande</p>
              <p className="text-[11px] text-muted mt-1.5 max-w-[260px] mx-auto leading-relaxed">
                {filter === "pending"
                  ? "Pas de demandes en attente pour le moment."
                  : "Aucune demande dans cette catégorie."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((r) => {
                const st = STATUS_META[r.status] || STATUS_META.pending;
                const StatusIcon = st.Icon;
                const isExpanded = expanded === r.id;
                return (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-card-premium overflow-hidden"
                  >
                    {/* Header row */}
                    <button
                      onClick={() => setExpanded((id) => (id === r.id ? null : r.id))}
                      className="w-full p-4 flex items-start gap-3 text-left"
                    >
                      <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[13px] font-bold"
                        style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}>
                        {(r.userName || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-bold text-foreground truncate">{r.userName || "Utilisateur"}</p>
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md flex items-center gap-1 ${st.className}`}>
                            <StatusIcon size={9} /> {st.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted truncate mt-0.5 flex items-center gap-1">
                          <Mail size={9} /> {r.userEmail || "(email manquant)"}
                        </p>
                        <p className="text-[11px] text-foreground mt-2 line-clamp-2 leading-relaxed">
                          {r.motivation || "(pas de motivation)"}
                        </p>
                        <p className="text-[9px] text-subtle mt-1">
                          Envoyée le {new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </button>

                    {/* Expanded content */}
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
                            {r.feedback && (
                              <div className="mt-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Retour initial</p>
                                <p className="text-[12px] text-foreground leading-relaxed">{r.feedback}</p>
                              </div>
                            )}
                            {r.experience && (
                              <div className="mt-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Expérience</p>
                                <p className="text-[12px] text-foreground leading-relaxed">{r.experience}</p>
                              </div>
                            )}

                            {r.status === "pending" && (
                              <div className="flex gap-2 mt-4">
                                <motion.button
                                  whileTap={{ scale: 0.96 }}
                                  disabled={busy === r.id}
                                  onClick={() => decide(r, "approved")}
                                  className="flex-1 text-white py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                                  style={{ background: "linear-gradient(135deg, #10B981, #047857)" }}
                                >
                                  <Check size={14} strokeWidth={3} /> Accepter
                                </motion.button>
                                <motion.button
                                  whileTap={{ scale: 0.96 }}
                                  disabled={busy === r.id}
                                  onClick={() => decide(r, "rejected")}
                                  className="flex-1 bg-white text-danger py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                                  style={{ border: "1px solid #FEE2E2" }}
                                >
                                  <X size={14} strokeWidth={3} /> Refuser
                                </motion.button>
                              </div>
                            )}

                            {r.status === "approved" && (
                              <motion.button
                                whileTap={{ scale: 0.97 }}
                                disabled={busy === r.id}
                                onClick={() => revoke(r)}
                                className="w-full mt-4 bg-white text-danger py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                                style={{ border: "1px solid #FEE2E2" }}
                              >
                                <UserMinus size={14} strokeWidth={2.5} /> Retirer l&apos;accès bêta
                              </motion.button>
                            )}

                            {r.status === "rejected" && (
                              <motion.button
                                whileTap={{ scale: 0.97 }}
                                disabled={busy === r.id}
                                onClick={() => remove(r)}
                                className="w-full mt-4 bg-white text-danger py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                                style={{ border: "1px solid #FEE2E2" }}
                              >
                                <Trash2 size={14} strokeWidth={2.5} /> Supprimer la demande
                              </motion.button>
                            )}

                            {r.status !== "pending" && r.decidedAt && (
                              <p className="text-[10px] text-muted text-center mt-3 italic">
                                Décidé le {new Date(r.decidedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            )}
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
                <p className="text-[12px] font-bold text-foreground">Sécurité</p>
                <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                  Seul l&apos;admin peut valider une demande. Les utilisateurs ne peuvent jamais s&apos;approuver eux-mêmes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
