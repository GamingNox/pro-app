"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import {
  Copy, Check, Users, Share2, ArrowLeft, Sparkles, Crown, Mail, MessageSquare, Gift, CheckCircle2, Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ── Full violet theme (no mixing colors) ──
const VIOLET_GRADIENT = "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)";
const VIOLET_PRIMARY = "#8B5CF6";
const VIOLET_SOFT = "#F3F0FF";
const VIOLET_DEEP = "#6D28D9";

interface Milestone {
  count: number;
  reward: string;
  subtitle: string;
}

const MILESTONES: Milestone[] = [
  { count: 1, reward: "1 mois Premium", subtitle: "Votre premier parrainage" },
  { count: 3, reward: "3 mois Premium", subtitle: "Trio de champions" },
  { count: 5, reward: "6 mois Premium", subtitle: "Ambassadeur reconnu" },
  { count: 10, reward: "1 an Premium", subtitle: "Palier ultime" },
];

export default function SettingsReferralPage() {
  const { user } = useApp();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const code = useMemo(() => {
    const slug = user.bookingSlug || user.name?.replace(/\s/g, "").toLowerCase() || "user";
    return `${slug.toUpperCase().slice(0, 6)}-${new Date().getFullYear()}`;
  }, [user.bookingSlug, user.name]);

  const referralLink = useMemo(() => `https://clientbase.fr/r/${code}`, [code]);

  // TODO: wire to real DB count when referral tracking table exists
  const invitesCount = 0;

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  async function share() {
    const text = `Salut ! Je te recommande Client Base, l'app que j'utilise pour gérer mon activité. Avec mon code tu as 1 semaine Premium offerte : ${code}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Client Base", text, url: referralLink });
      } catch {
        copyLink();
      }
    } else {
      copyLink();
    }
  }

  function shareEmail() {
    const subject = encodeURIComponent("Découvre Client Base");
    const body = encodeURIComponent(
      `Salut !\n\nJe te recommande Client Base, l'app que j'utilise pour gérer mon activité (clients, rendez-vous, factures — tout au même endroit).\n\nAvec mon code, tu as 1 semaine Premium offerte à l'inscription :\n${code}\n\nLien direct : ${referralLink}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  function shareSms() {
    const text = encodeURIComponent(`Je te recommande Client Base ! Code parrain : ${code} (1 semaine Premium offerte) — ${referralLink}`);
    window.location.href = `sms:?&body=${text}`;
  }

  // Progression toward the next milestone
  const nextMilestone = MILESTONES.find((m) => m.count > invitesCount) || MILESTONES[MILESTONES.length - 1];
  const prevMilestone = [...MILESTONES].reverse().find((m) => m.count <= invitesCount);
  const progressBase = prevMilestone?.count ?? 0;
  const progressTarget = nextMilestone.count;
  const progressPct = progressTarget > 0
    ? Math.min(100, Math.round(((invitesCount - progressBase) / (progressTarget - progressBase)) * 100))
    : 100;

  const scopeStyle = {
    ["--color-accent" as string]: VIOLET_PRIMARY,
    ["--color-accent-soft" as string]: VIOLET_SOFT,
    ["--color-accent-deep" as string]: VIOLET_DEEP,
  } as React.CSSProperties;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background" style={scopeStyle}>
      {/* ── Back bar ── */}
      <div className="flex-shrink-0 px-6 pt-5 pb-2 flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
          style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}>
          <ArrowLeft size={18} className="text-foreground" strokeWidth={2.4} />
        </motion.button>
        <span className="text-[15px] font-semibold text-foreground">Paramètres</span>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-32">

          {/* ═══ TOP — code + link immediately visible ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="relative rounded-[22px] overflow-hidden mb-5 mt-3"
            style={{ background: VIOLET_GRADIENT, boxShadow: "0 14px 36px rgba(139, 92, 246, 0.35)" }}
          >
            <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10" />
            <div className="absolute -left-8 -bottom-20 w-40 h-40 rounded-full bg-white/10" />

            <div className="relative z-10 p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/90">Parrainage pro</p>
              </div>
              <h1 className="text-[24px] font-bold tracking-tight leading-[1.1]">
                Invitez, gagnez<br />du Premium
              </h1>

              {/* Code + link stacked for instant access */}
              <div className="mt-4 space-y-2.5">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-white/70 font-bold uppercase tracking-wider">Votre code</p>
                    <p className="text-[18px] font-bold tracking-[0.08em] mt-0.5 truncate">{code}</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.94 }} onClick={copyCode}
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: copied ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)" }}>
                    {copied ? <Check size={15} className="text-white" strokeWidth={2.8} /> : <Copy size={14} className="text-white" strokeWidth={2.4} />}
                  </motion.button>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-white/70 font-bold uppercase tracking-wider">Lien direct</p>
                    <p className="text-[12px] font-semibold mt-0.5 truncate">{referralLink}</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.94 }} onClick={copyLink}
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: linkCopied ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)" }}>
                    {linkCopied ? <Check size={15} className="text-white" strokeWidth={2.8} /> : <Copy size={14} className="text-white" strokeWidth={2.4} />}
                  </motion.button>
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={share}
                className="mt-4 w-full bg-white py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2"
                style={{ color: VIOLET_DEEP }}>
                <Share2 size={14} strokeWidth={2.5} /> Partager mon lien
              </motion.button>
            </div>
          </motion.div>

          {/* Secondary share buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <motion.button whileTap={{ scale: 0.97 }} onClick={shareEmail}
              className="bg-white rounded-2xl py-3 shadow-card-premium flex items-center justify-center gap-2">
              <Mail size={14} style={{ color: VIOLET_PRIMARY }} strokeWidth={2.2} />
              <span className="text-[12px] font-bold text-foreground">Email</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={shareSms}
              className="bg-white rounded-2xl py-3 shadow-card-premium flex items-center justify-center gap-2">
              <MessageSquare size={14} style={{ color: VIOLET_PRIMARY }} strokeWidth={2.2} />
              <span className="text-[12px] font-bold text-foreground">SMS</span>
            </motion.button>
          </div>

          {/* ═══ MIDDLE — progression system ═══ */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: VIOLET_PRIMARY }} />
            <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: VIOLET_PRIMARY }}>Votre progression</p>
          </div>

          <div className="bg-white rounded-[22px] p-5 shadow-card-premium mb-5">
            {/* Current status */}
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Amis invités</p>
                <p className="text-[32px] font-bold text-foreground leading-none mt-1">{invitesCount}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Prochain palier</p>
                <p className="text-[13px] font-bold mt-1" style={{ color: VIOLET_PRIMARY }}>
                  {nextMilestone.count - invitesCount} invitation{nextMilestone.count - invitesCount > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Progress bar toward next milestone */}
            <div className="mt-4">
              <div className="w-full h-[10px] bg-border-light rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: VIOLET_GRADIENT }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[10px] text-muted font-medium">{progressBase} invité{progressBase > 1 ? "s" : ""}</p>
                <p className="text-[10px] font-bold" style={{ color: VIOLET_PRIMARY }}>{progressPct}%</p>
                <p className="text-[10px] text-muted font-medium">{progressTarget} invité{progressTarget > 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>

          {/* Milestones list */}
          <div className="space-y-2.5 mb-6">
            {MILESTONES.map((m, i) => {
              const unlocked = invitesCount >= m.count;
              const isCurrent = !unlocked && m.count === nextMilestone.count;
              return (
                <motion.div
                  key={m.count}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  className="bg-white rounded-2xl p-4 shadow-card-premium flex items-center gap-3"
                  style={isCurrent ? { boxShadow: `0 0 0 2px ${VIOLET_PRIMARY}, 0 4px 12px rgba(139, 92, 246, 0.25)` } : undefined}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold"
                    style={unlocked
                      ? { background: VIOLET_GRADIENT, boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)" }
                      : isCurrent
                      ? { background: "color-mix(in srgb, var(--color-accent) 15%, white)", color: VIOLET_DEEP }
                      : { background: "#F4F4F5", color: "#A1A1AA" }}
                  >
                    {unlocked ? <CheckCircle2 size={18} strokeWidth={2.4} /> : isCurrent ? <span className="text-[14px]">{m.count}</span> : <Lock size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground">
                      {m.count} ami{m.count > 1 ? "s" : ""} invité{m.count > 1 ? "s" : ""}
                    </p>
                    <p className="text-[11px] text-muted mt-0.5">{m.subtitle}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-[12px] font-bold ${unlocked ? "" : "text-muted"}`}
                      style={unlocked ? { color: VIOLET_PRIMARY } : undefined}>
                      {m.reward}
                    </p>
                    {unlocked && <p className="text-[9px] text-accent mt-0.5 uppercase tracking-wider font-bold">Débloqué</p>}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ═══ BOTTOM — explanation ═══ */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: VIOLET_PRIMARY }} />
            <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: VIOLET_PRIMARY }}>Comment ça marche</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-5">
            <div className="space-y-4">
              {[
                { n: "1", t: "Partagez votre code", d: "Par SMS, email ou sur vos réseaux — le lien fait le reste." },
                { n: "2", t: "Votre ami s'inscrit", d: "Avec votre code, il débloque 1 semaine Premium gratuite." },
                { n: "3", t: "Vous gagnez", d: "1 mois Premium crédité automatiquement. Plus vous invitez, plus vous gagnez." },
              ].map((step, i) => (
                <motion.div
                  key={step.n}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-bold text-white"
                    style={{ background: VIOLET_GRADIENT, boxShadow: "0 3px 10px rgba(139, 92, 246, 0.3)" }}>
                    {step.n}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-[13px] font-bold text-foreground">{step.t}</p>
                    <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{step.d}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Reassurance footer */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Sparkles size={11} style={{ color: VIOLET_PRIMARY }} />
            <p className="text-[10px] text-muted text-center">
              Programme sans limite — parrainez autant de collègues que vous voulez
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
