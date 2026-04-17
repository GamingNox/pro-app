"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bug,
  Lightbulb,
  Send,
  Sparkles,
  CheckCircle2,
  Lock,
  Info,
  MessageSquareHeart,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { loadBetaReports, saveBetaReport } from "@/lib/beta";
import type { BetaReport } from "@/lib/types";

export default function BetaSpacePage() {
  const { user, userId } = useApp();
  const router = useRouter();
  const status = user.betaStatus || "none";

  const [reports, setReports] = useState<BetaReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Bug form
  const [bugDescription, setBugDescription] = useState("");
  const [bugSending, setBugSending] = useState(false);
  const [bugSent, setBugSent] = useState(false);

  // Feedback form
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Load recent reports for the inline counter
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const data = await loadBetaReports(userId);
      if (!cancelled) {
        setReports(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const stats = useMemo(() => ({
    bugs: reports.filter((r) => r.kind === "bug").length,
    feedback: reports.filter((r) => r.kind === "feedback" || r.kind === "suggestion").length,
    total: reports.length,
  }), [reports]);

  // ── Gamification — XP + level + monthly challenge ─────
  const gamification = useMemo(() => {
    // XP: 20 per bug, 10 per suggestion/feedback
    const xp = reports.reduce((sum, r) => sum + (r.kind === "bug" ? 20 : 10), 0);

    // Levels: 5 tiers (Bronze, Silver, Gold, Platinum, Diamond)
    const levels = [
      { name: "Bronze", min: 0, max: 50, emoji: "🥉" },
      { name: "Silver", min: 50, max: 150, emoji: "🥈" },
      { name: "Gold", min: 150, max: 300, emoji: "🥇" },
      { name: "Platinum", min: 300, max: 600, emoji: "💎" },
      { name: "Diamond", min: 600, max: 1000, emoji: "👑" },
    ];
    const currentLevel = levels.findIndex((l) => xp >= l.min && xp < l.max);
    const level = currentLevel === -1 ? levels.length - 1 : currentLevel;
    const current = levels[level];
    const next = levels[level + 1];
    const levelProgress = next
      ? Math.round(((xp - current.min) / (next.min - current.min)) * 100)
      : 100;

    // Monthly challenge: 3 feedbacks this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthReports = reports.filter((r) => new Date(r.createdAt) >= monthStart);
    const monthlyGoal = 3;
    const monthlyCount = monthReports.length;
    const monthlyPct = Math.min(100, Math.round((monthlyCount / monthlyGoal) * 100));
    const challengeDone = monthlyCount >= monthlyGoal;

    return {
      xp,
      level: current,
      nextLevel: next,
      levelProgress,
      monthlyCount,
      monthlyGoal,
      monthlyPct,
      challengeDone,
    };
  }, [reports]);

  // ── Access control ────────────────────────────────────
  if (status !== "approved") {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
            style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}>
            <ArrowLeft size={18} className="text-foreground" strokeWidth={2.4} />
          </motion.button>
          <span className="text-[15px] font-semibold text-foreground">Espace bêta</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#F3F0FF" }}>
            <Lock size={28} style={{ color: "#8B5CF6" }} strokeWidth={2.2} />
          </div>
          <h2 className="text-[20px] font-bold text-foreground">Accès réservé</h2>
          <p className="text-[13px] text-muted mt-2 max-w-[280px] leading-relaxed">
            L&apos;Espace bêta est accessible uniquement aux bêta testeurs validés par notre équipe.
          </p>
          <Link href="/settings/beta-tester">
            <motion.div whileTap={{ scale: 0.97 }}
              className="mt-5 text-white text-[13px] font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)", boxShadow: "0 4px 12px rgba(139, 92, 246, 0.35)" }}>
              Devenir bêta testeur
            </motion.div>
          </Link>
        </div>
      </div>
    );
  }

  // ── Submit handlers ───────────────────────────────────
  async function handleBugSubmit() {
    if (!bugDescription.trim() || !userId || bugSending) return;
    setBugSending(true);
    const saved = await saveBetaReport(userId, {
      kind: "bug",
      title: bugDescription.trim().slice(0, 60),
      description: bugDescription.trim(),
    });
    setReports((prev) => [saved, ...prev]);
    setBugDescription("");
    setBugSending(false);
    setBugSent(true);
    setTimeout(() => setBugSent(false), 3000);
  }

  async function handleFeedbackSubmit() {
    if (!feedbackText.trim() || !userId || feedbackSending) return;
    setFeedbackSending(true);
    const saved = await saveBetaReport(userId, {
      kind: "suggestion",
      title: feedbackText.trim().slice(0, 60),
      description: feedbackText.trim(),
    });
    setReports((prev) => [saved, ...prev]);
    setFeedbackText("");
    setFeedbackSending(false);
    setFeedbackSent(true);
    setTimeout(() => setFeedbackSent(false), 3000);
  }

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden bg-background"
      style={{
        ["--color-accent" as string]: "#8B5CF6",
        ["--color-accent-soft" as string]: "#F3F0FF",
        ["--color-accent-deep" as string]: "#6D28D9",
      } as React.CSSProperties}
    >
      {/* ═══ HEADER ═══ */}
      <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
          style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}>
          <ArrowLeft size={18} className="text-foreground" strokeWidth={2.4} />
        </motion.button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#6D28D9" }}>Bêta testeur</p>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight leading-tight">Espace bêta</h1>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))", boxShadow: "0 4px 12px rgba(139, 92, 246, 0.35)" }}>
          <Sparkles size={16} className="text-white" strokeWidth={2.5} />
        </div>
      </div>

      {/* ═══ SCROLLABLE CONTENT ═══ */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">

          {/* ══ PRIORITY STATUS CARD — pinned at very top ══ */}
          <div className="rounded-2xl p-5 mb-5 text-white relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
              boxShadow: "0 14px 36px rgba(139, 92, 246, 0.35)",
            }}>
            <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-white/10" />
            <div className="absolute -left-6 -bottom-10 w-24 h-24 rounded-full bg-white/10" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle2 size={14} className="text-white" strokeWidth={2.5} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/85">Statut actif</p>
              </div>
              <h3 className="text-[20px] font-bold tracking-tight leading-tight">Vous êtes bêta testeur 🎉</h3>
              <p className="text-[12px] text-white/85 mt-2 leading-relaxed max-w-[280px]">
                Accès anticipé aux nouveautés, canal privé avec l&apos;équipe, plan Premium offert.
              </p>

              {/* Contribution counters */}
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
                <div>
                  <p className="text-[22px] font-bold leading-none">{loading ? "—" : stats.bugs}</p>
                  <p className="text-[9px] text-white/70 mt-1 uppercase tracking-wider">Bugs signalés</p>
                </div>
                <div>
                  <p className="text-[22px] font-bold leading-none">{loading ? "—" : stats.feedback}</p>
                  <p className="text-[9px] text-white/70 mt-1 uppercase tracking-wider">Idées partagées</p>
                </div>
                <div>
                  <p className="text-[22px] font-bold leading-none">{loading ? "—" : stats.total}</p>
                  <p className="text-[9px] text-white/70 mt-1 uppercase tracking-wider">Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* ══ GAMIFICATION — XP + level + monthly challenge ══ */}
          <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-5">
            {/* Level header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[24px]"
                  style={{
                    background: "linear-gradient(135deg, var(--color-accent-soft), color-mix(in srgb, var(--color-accent) 15%, white))",
                    border: "1.5px solid color-mix(in srgb, var(--color-accent) 25%, white)",
                  }}>
                  {gamification.level.emoji}
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted">Niveau actuel</p>
                  <p className="text-[16px] font-bold text-foreground leading-tight mt-0.5">{gamification.level.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted">Total XP</p>
                <p className="text-[18px] font-bold text-accent leading-tight mt-0.5">{gamification.xp}</p>
              </div>
            </div>

            {/* XP progress bar toward next level */}
            {gamification.nextLevel && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] text-muted font-medium">{gamification.xp} / {gamification.nextLevel.min} XP</p>
                  <p className="text-[10px] font-bold text-accent">→ {gamification.nextLevel.name} {gamification.nextLevel.emoji}</p>
                </div>
                <div className="w-full h-[8px] bg-border-light rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-deep))" }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${gamification.levelProgress}%` }}
                    transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
              </div>
            )}

            {/* Monthly challenge */}
            <div className="pt-3 border-t border-border-light">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {gamification.challengeDone
                    ? <CheckCircle2 size={13} className="text-accent" strokeWidth={2.5} />
                    : <Sparkles size={13} className="text-accent" strokeWidth={2.4} />}
                  <p className="text-[11px] font-bold text-foreground">Défi du mois</p>
                </div>
                <p className="text-[10px] font-bold text-accent">{gamification.monthlyCount}/{gamification.monthlyGoal}</p>
              </div>
              <p className="text-[10px] text-muted leading-relaxed mb-2">
                {gamification.challengeDone
                  ? "Défi terminé ! Merci pour vos contributions ce mois."
                  : `Envoyez ${gamification.monthlyGoal - gamification.monthlyCount} retour${gamification.monthlyGoal - gamification.monthlyCount > 1 ? "s" : ""} ce mois-ci pour débloquer la récompense.`}
              </p>
              <div className="w-full h-[6px] bg-border-light rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-deep))" }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${gamification.monthlyPct}%` }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            </div>
          </div>

          {/* ══ A — REPORT A BUG ══ */}
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-accent">Signaler un bug</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))", boxShadow: "0 4px 12px color-mix(in srgb, var(--color-accent) 30%, transparent)" }}>
                <Bug size={17} className="text-white" strokeWidth={2.4} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-foreground">Quelque chose ne fonctionne pas ?</p>
                <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                  Décrivez le problème en quelques mots. Plus c&apos;est précis, plus on peut corriger vite.
                </p>
              </div>
            </div>

            <textarea
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              rows={3}
              placeholder="Ex : le bouton de facture ne s'ouvre pas sur iPhone..."
              className="input-field resize-none"
            />

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleBugSubmit}
              disabled={!bugDescription.trim() || bugSending}
              className="w-full text-white py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 mt-3"
              style={bugDescription.trim() && !bugSending
                ? { background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))", boxShadow: "0 4px 12px color-mix(in srgb, var(--color-accent) 35%, transparent)" }
                : { background: "#E4E4E7", color: "#A1A1AA" }}
            >
              <Send size={14} strokeWidth={2.5} />
              {bugSending ? "Envoi…" : "Signaler le bug"}
            </motion.button>

            <AnimatePresence>
              {bugSent && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] font-bold text-accent mt-2 flex items-center justify-center gap-1"
                >
                  <CheckCircle2 size={12} /> Merci, on regarde ça tout de suite.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* ══ B — GIVE FEEDBACK ══ */}
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-accent">Partager une idée</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #F3F0FF, #EEF0FF)", border: "1px solid color-mix(in srgb, var(--color-accent) 25%, white)" }}>
                <Lightbulb size={17} className="text-accent" strokeWidth={2.4} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-foreground">Une suggestion ou une idée ?</p>
                <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                  Ce qu&apos;il manque, ce qui pourrait être mieux, une fonction que vous rêvez d&apos;avoir.
                </p>
              </div>
            </div>

            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={3}
              placeholder="Ex : j'aimerais pouvoir dupliquer une facture en un clic..."
              className="input-field resize-none"
            />

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleFeedbackSubmit}
              disabled={!feedbackText.trim() || feedbackSending}
              className="w-full py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 mt-3"
              style={feedbackText.trim() && !feedbackSending
                ? { background: "white", color: "var(--color-accent-deep)", border: "1.5px solid color-mix(in srgb, var(--color-accent) 40%, white)" }
                : { background: "#E4E4E7", color: "#A1A1AA", border: "1.5px solid transparent" }}
            >
              <Send size={14} strokeWidth={2.5} />
              {feedbackSending ? "Envoi…" : "Envoyer mon idée"}
            </motion.button>

            <AnimatePresence>
              {feedbackSent && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] font-bold text-accent mt-2 flex items-center justify-center gap-1"
                >
                  <CheckCircle2 size={12} /> Merci, vos idées font avancer l&apos;app.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* ══ C — CONSEILS (unified tips section) ══ */}
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-accent">Bonnes pratiques</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Info size={14} className="text-accent" />
              <p className="text-[13px] font-bold text-foreground">Comment contribuer efficacement</p>
            </div>
            <ul className="space-y-3">
              {[
                { Icon: Bug, t: "Soyez précis dans les bugs", d: "Indiquez l'écran, l'action effectuée, et ce qui était attendu. On reçoit l'alerte immédiatement." },
                { Icon: Lightbulb, t: "Expliquez le besoin derrière vos idées", d: "Les meilleures suggestions sont implémentées en priorité — le contexte aide à juger." },
                { Icon: MessageSquareHeart, t: "Envoyez au fil de l'eau", d: "Plusieurs retours courts > un long message. Vos retours façonnent les prochaines versions." },
              ].map(({ Icon, t, d }) => (
                <li key={t} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #F3F0FF, #EEF0FF)", border: "1px solid color-mix(in srgb, var(--color-accent) 20%, white)" }}>
                    <Icon size={14} className="text-accent" strokeWidth={2.4} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-foreground leading-tight">{t}</p>
                    <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* ══ D — RECENT FEEDBACK SENT ══ */}
          {reports.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-accent">Vos derniers envois</p>
              </div>
              <div className="space-y-2 mb-5">
                {reports.slice(0, 5).map((r) => {
                  const isBug = r.kind === "bug";
                  const Icon = isBug ? Bug : Lightbulb;
                  const statusLabel = r.status === "fixed" ? "Corrigé" : r.status === "in_progress" ? "En cours" : "Reçu";
                  const statusStyle = r.status === "fixed"
                    ? { backgroundColor: "#D1FAE5", color: "#047857" }
                    : r.status === "in_progress"
                    ? { backgroundColor: "#FEF3C7", color: "#B45309" }
                    : { backgroundColor: "var(--color-accent-soft)", color: "var(--color-accent-deep)" };
                  return (
                    <div key={r.id} className="bg-white rounded-2xl p-4 shadow-card-premium flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #F3F0FF, #EEF0FF)" }}>
                        <Icon size={14} className="text-accent" strokeWidth={2.4} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-foreground line-clamp-2 leading-tight">{r.description || r.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md" style={statusStyle}>
                            {statusLabel}
                          </span>
                          <span className="text-[9px] text-subtle">
                            {new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Tips footer */}
          <div className="bg-accent-soft rounded-2xl p-4">
            <div className="flex items-start gap-2.5">
              <Sparkles size={14} className="text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[12px] font-bold text-foreground">Merci pour votre engagement</p>
                <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                  Chaque bug signalé et chaque idée partagée améliore l&apos;app pour tous les professionnels.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
