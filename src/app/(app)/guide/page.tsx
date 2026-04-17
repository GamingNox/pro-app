"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Sparkles, CalendarDays, Users, Gift, Rocket,
  Check, X, Share2, Target, Heart, Zap, TrendingUp, Trophy, PartyPopper,
} from "lucide-react";

// ══════════════════════════════════════════════════════════
// STEP TYPES — the guide is a linear series of mixed steps
// ══════════════════════════════════════════════════════════

type Quiz = {
  kind: "quiz";
  question: string;
  options: { label: string; correct: boolean; explain: string }[];
};

type Info = {
  kind: "info";
  kicker: string;
  title: string;
  description: string;
  icon: typeof Rocket;
  accent: string;
  accentDeep: string;
  bullets: { icon: typeof Check; text: string }[];
};

type Choice = {
  kind: "choice";
  question: string;
  options: { emoji: string; label: string; tip: string }[];
};

type Celebration = {
  kind: "celebration";
  title: string;
  subtitle: string;
};

type Step = Info | Quiz | Choice | Celebration;

const STEPS: Step[] = [
  {
    kind: "info",
    kicker: "Chapitre 1",
    title: "Bienvenue dans Clientbase",
    description: "On va faire le tour de votre nouvel outil en 2 minutes. Tapez sur Suivant à chaque étape.",
    icon: Rocket,
    accent: "#5B4FE9",
    accentDeep: "#3B30B5",
    bullets: [
      { icon: Check, text: "Votre agenda, clients et factures centralisés" },
      { icon: Check, text: "Un lien public pour que vos clients réservent seuls" },
      { icon: Check, text: "Des outils marketing intégrés (fidélité, promos)" },
    ],
  },
  {
    kind: "quiz",
    question: "Par quoi commencer pour que votre page publique soit utilisable ?",
    options: [
      { label: "Ajouter mes services", correct: true, explain: "Exact ! Sans services, vos clients ne peuvent rien réserver. C'est LA première chose à faire." },
      { label: "Envoyer une promo", correct: false, explain: "Pas encore — on lance des promos une fois la base en place." },
      { label: "Créer un programme fidélité", correct: false, explain: "Excellent plus tard, mais d'abord il faut des services à vendre." },
    ],
  },
  {
    kind: "info",
    kicker: "Chapitre 2",
    title: "Vos clients au même endroit",
    description: "Chaque fiche client regroupe son historique, ses notes et ses préférences. Tout est à portée de tap.",
    icon: Users,
    accent: "#3B82F6",
    accentDeep: "#1D4ED8",
    bullets: [
      { icon: Check, text: "Fiche complète : RDV, factures, notes privées" },
      { icon: Check, text: "Badges VIP / Régulier / Nouveau" },
      { icon: Check, text: "Messagerie de groupe pour annonces ciblées" },
    ],
  },
  {
    kind: "choice",
    question: "Quel profil de pro êtes-vous ?",
    options: [
      { emoji: "💇", label: "Beauté & bien-être", tip: "Activez les rappels 24h avant — ils réduisent les no-shows de 40% dans votre secteur." },
      { emoji: "🩺", label: "Santé & thérapie", tip: "Utilisez les notes privées sur chaque fiche client pour suivre l'historique médical en toute confidentialité." },
      { emoji: "🎓", label: "Conseil & coaching", tip: "Créez des forfaits multi-séances dans Services pour vendre des packs de 5 ou 10 rendez-vous d'un coup." },
      { emoji: "🎨", label: "Créatif / autre", tip: "Personnalisez votre page publique avec vos meilleures réalisations — les photos convertissent +3× mieux." },
    ],
  },
  {
    kind: "info",
    kicker: "Chapitre 3",
    title: "L'agenda qui travaille pour vous",
    description: "Réservations 24/7 via votre lien public. Rappels automatiques. Zéro friction.",
    icon: CalendarDays,
    accent: "#8B5CF6",
    accentDeep: "#6D28D9",
    bullets: [
      { icon: Check, text: "Vos horaires définis une seule fois" },
      { icon: Check, text: "Les clients réservent depuis leur téléphone" },
      { icon: Check, text: "Vous êtes notifié en temps réel" },
    ],
  },
  {
    kind: "quiz",
    question: "Comment un client peut-il réserver sans vous déranger ?",
    options: [
      { label: "Il vous appelle", correct: false, explain: "Non ! Le but de Clientbase est justement d'éviter ça." },
      { label: "Il utilise votre lien public", correct: true, explain: "Oui ! Votre lien `clientbase.fr/p/votre-nom` est partageable partout. Les clients choisissent service + créneau seuls." },
      { label: "Il envoie un email", correct: false, explain: "Possible, mais moins efficace que le lien direct." },
    ],
  },
  {
    kind: "info",
    kicker: "Chapitre 4",
    title: "Faites grandir votre activité",
    description: "Fidélité, promos ciblées, parrainage : tous les outils pour transformer un client en habitué.",
    icon: Gift,
    accent: "#F59E0B",
    accentDeep: "#B45309",
    bullets: [
      { icon: Check, text: "17 modèles de promotions prêts à l'emploi" },
      { icon: Check, text: "Cartes de fidélité numériques" },
      { icon: Check, text: "1 ami parrainé = 1 mois Premium offert" },
    ],
  },
  {
    kind: "info",
    kicker: "Chapitre 5",
    title: "Gérer votre activité",
    description: "Facturation, paiements, stock : tout en un seul endroit pour piloter votre business.",
    icon: Target,
    accent: "#16A34A",
    accentDeep: "#15803D",
    bullets: [
      { icon: Check, text: "Factures au format PDF, aux normes françaises" },
      { icon: Check, text: "Lien de paiement Stripe/PayPal en un tap" },
      { icon: Check, text: "Suivi du stock avec alertes automatiques" },
    ],
  },
  {
    kind: "quiz",
    question: "Comment vos clients vont-ils régler leurs prestations ?",
    options: [
      { label: "En espèces uniquement", correct: false, explain: "Vous pouvez, mais c'est limitant. La plupart des clients préfèrent la carte bancaire." },
      { label: "Via un lien de paiement sécurisé", correct: true, explain: "Exact ! Client Base ouvre automatiquement votre lien Stripe/PayPal quand vous tapez « Encaisser ». L'argent arrive direct sur votre compte." },
      { label: "Seulement en fin de mois", correct: false, explain: "Risqué — autant encaisser tout de suite pour éviter les oublis." },
    ],
  },
  {
    kind: "info",
    kicker: "Chapitre 6",
    title: "Se faire connaître",
    description: "Votre page publique, vos avis clients et vos supports marketing pour attirer plus de monde.",
    icon: Share2,
    accent: "#EC4899",
    accentDeep: "#BE185D",
    bullets: [
      { icon: Check, text: "Page publique personnalisée (clientbase.fr/p/vous)" },
      { icon: Check, text: "QR code + cartes de visite imprimables en 1 clic" },
      { icon: Check, text: "Avis clients modérés et affichés automatiquement" },
    ],
  },
  {
    kind: "celebration",
    title: "Vous êtes prêt !",
    subtitle: "Vous connaissez l'essentiel. Maintenant, lancez-vous — vos premiers clients vous attendent.",
  },
];

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════

export default function GuidePage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [choiceAnswer, setChoiceAnswer] = useState<number | null>(null);

  const step = STEPS[index];
  const total = STEPS.length;
  const progress = ((index + 1) / total) * 100;

  const goNext = useCallback(() => {
    setQuizAnswer(null);
    setChoiceAnswer(null);
    if (index < total - 1) setIndex(index + 1);
    else router.back();
  }, [index, total, router]);

  const goPrev = useCallback(() => {
    setQuizAnswer(null);
    setChoiceAnswer(null);
    if (index > 0) setIndex(index - 1);
  }, [index]);

  // Block Next for quiz steps until an answer is chosen
  const canGoNext = step.kind === "quiz" ? quizAnswer !== null : step.kind === "choice" ? choiceAnswer !== null : true;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* ═══ HEADER ═══ */}
      <div className="flex-shrink-0 px-6 pt-5 pb-3 flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
          style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
        >
          <X size={18} className="text-foreground" strokeWidth={2.4} />
        </motion.button>
        <p className="text-[12px] font-bold tracking-wider uppercase text-muted">
          {index + 1} / {total}
        </p>
        <div className="w-10 h-10" />
      </div>

      {/* ═══ PROGRESS BAR ═══ */}
      <div className="flex-shrink-0 px-6 pb-4">
        <div className="h-1.5 bg-border-light rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #5B4FE9, #8B5CF6)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            >
              {step.kind === "info" && <InfoStep step={step} />}
              {step.kind === "quiz" && (
                <QuizStep step={step} answer={quizAnswer} onAnswer={setQuizAnswer} />
              )}
              {step.kind === "choice" && (
                <ChoiceStep step={step} answer={choiceAnswer} onAnswer={setChoiceAnswer} />
              )}
              {step.kind === "celebration" && <CelebrationStep step={step} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ═══ FOOTER — navigation ═══ */}
      <div className="flex-shrink-0 px-6 pb-6 pt-3 flex items-center gap-3 bg-background border-t border-border-light">
        {index > 0 ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={goPrev}
            className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center flex-shrink-0"
            style={{ border: "1px solid #E4E4E7", boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}
          >
            <ArrowLeft size={18} className="text-foreground" strokeWidth={2.4} />
          </motion.button>
        ) : (
          <div className="w-12 h-12 flex-shrink-0" />
        )}
        <motion.button
          whileTap={canGoNext ? { scale: 0.97 } : undefined}
          onClick={canGoNext ? goNext : undefined}
          disabled={!canGoNext}
          className="flex-1 h-12 rounded-2xl text-white text-[14px] font-bold flex items-center justify-center gap-2 disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg, #5B4FE9, #3B30B5)",
            boxShadow: canGoNext ? "0 10px 24px rgba(91, 79, 233, 0.35)" : "none",
          }}
        >
          {index === total - 1 ? "Commencer à l'utiliser" : "Suivant"}
          <ArrowRight size={16} strokeWidth={2.6} />
        </motion.button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// STEP RENDERERS
// ══════════════════════════════════════════════════════════

function InfoStep({ step }: { step: Info }) {
  const Icon = step.icon;
  return (
    <div>
      {/* Hero illustration — animated floating icon */}
      <div
        className="relative w-full h-[220px] rounded-[28px] overflow-hidden mb-5"
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${step.accent} 8%, white) 0%, color-mix(in srgb, ${step.accent} 3%, white) 60%, white 100%)`,
        }}
      >
        {/* Floating bubbles */}
        <motion.div
          className="absolute rounded-full"
          style={{ width: 80, height: 80, backgroundColor: `color-mix(in srgb, ${step.accent} 12%, white)`, top: 40, left: 30 }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{ width: 50, height: 50, backgroundColor: `color-mix(in srgb, ${step.accent} 18%, white)`, top: 20, right: 40 }}
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{ width: 60, height: 60, backgroundColor: `color-mix(in srgb, ${step.accent} 10%, white)`, bottom: 20, right: 70 }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* Central icon card */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[96px] h-[96px] rounded-[26px] flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${step.accent}, ${step.accentDeep})`,
            boxShadow: `0 16px 36px color-mix(in srgb, ${step.accent} 40%, transparent)`,
          }}
          initial={{ scale: 0.82, rotate: -6 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
        >
          <Icon size={44} className="text-white" strokeWidth={2} />
        </motion.div>
      </div>

      {/* Kicker + title + description */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: step.accent }} />
        <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: step.accentDeep }}>
          {step.kicker}
        </p>
      </div>
      <h1 className="text-[24px] font-bold text-foreground tracking-tight leading-tight">{step.title}</h1>
      <p className="text-[13px] text-muted mt-2 leading-relaxed">{step.description}</p>

      {/* Bullets */}
      <div className="mt-5 space-y-2.5">
        {step.bullets.map((b, i) => {
          const Icon = b.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.08, duration: 0.3 }}
              className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-card-premium"
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `color-mix(in srgb, ${step.accent} 12%, white)` }}
              >
                <Icon size={15} strokeWidth={2.8} style={{ color: step.accent }} />
              </div>
              <p className="text-[13px] text-foreground font-medium leading-snug flex-1">{b.text}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function QuizStep({ step, answer, onAnswer }: { step: Quiz; answer: number | null; onAnswer: (i: number) => void }) {
  return (
    <div>
      {/* Quiz badge */}
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4"
        style={{ background: "linear-gradient(135deg, #5B4FE9, #8B5CF6)" }}
      >
        <Sparkles size={12} className="text-white" strokeWidth={2.8} />
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white">Mini quiz</p>
      </motion.div>

      <h2 className="text-[22px] font-bold text-foreground tracking-tight leading-snug">
        {step.question}
      </h2>
      <p className="text-[12px] text-muted mt-2">Choisissez votre réponse ci-dessous.</p>

      {/* Options */}
      <div className="mt-5 space-y-2.5">
        {step.options.map((opt, i) => {
          const isSelected = answer === i;
          const isRevealed = answer !== null;
          const isCorrect = opt.correct;
          return (
            <motion.button
              key={i}
              whileTap={answer === null ? { scale: 0.98 } : undefined}
              onClick={answer === null ? () => onAnswer(i) : undefined}
              className="w-full rounded-2xl p-4 text-left flex items-center gap-3 transition-all"
              style={{
                backgroundColor: isRevealed
                  ? isCorrect
                    ? "#ECFDF5"
                    : isSelected
                      ? "#FEF2F2"
                      : "white"
                  : "white",
                border: isRevealed
                  ? isCorrect
                    ? "1.5px solid #10B981"
                    : isSelected
                      ? "1.5px solid #EF4444"
                      : "1.5px solid #E4E4E7"
                  : isSelected
                    ? "1.5px solid #5B4FE9"
                    : "1.5px solid #E4E4E7",
                boxShadow: isRevealed && isCorrect
                  ? "0 8px 22px rgba(16, 185, 129, 0.18)"
                  : "0 1px 4px rgba(0,0,0,0.03)",
              }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: isRevealed && isCorrect
                    ? "#10B981"
                    : isRevealed && isSelected && !isCorrect
                      ? "#EF4444"
                      : "#F4F4F5",
                  color: isRevealed && (isCorrect || isSelected) ? "white" : "#71717A",
                }}
              >
                {isRevealed && isCorrect ? (
                  <Check size={15} strokeWidth={3} />
                ) : isRevealed && isSelected && !isCorrect ? (
                  <X size={15} strokeWidth={3} />
                ) : (
                  <span className="text-[12px] font-bold">{String.fromCharCode(65 + i)}</span>
                )}
              </div>
              <p className="text-[14px] font-semibold text-foreground flex-1">{opt.label}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Explanation after answer */}
      <AnimatePresence>
        {answer !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 overflow-hidden"
          >
            <div
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{
                backgroundColor: step.options[answer].correct ? "#ECFDF5" : "#FEF2F2",
                border: `1px solid ${step.options[answer].correct ? "#10B981" : "#EF4444"}`,
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: step.options[answer].correct ? "#10B981" : "#EF4444" }}
              >
                {step.options[answer].correct ? (
                  <Check size={13} className="text-white" strokeWidth={3} />
                ) : (
                  <Sparkles size={13} className="text-white" strokeWidth={2.8} />
                )}
              </div>
              <div className="flex-1">
                <p
                  className="text-[11px] font-bold uppercase tracking-wider mb-0.5"
                  style={{ color: step.options[answer].correct ? "#047857" : "#B91C1C" }}
                >
                  {step.options[answer].correct ? "Bonne réponse !" : "Pas tout à fait"}
                </p>
                <p className="text-[12px] text-foreground leading-relaxed">{step.options[answer].explain}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChoiceStep({ step, answer, onAnswer }: { step: Choice; answer: number | null; onAnswer: (i: number) => void }) {
  return (
    <div>
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4"
        style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
      >
        <Target size={12} className="text-white" strokeWidth={2.8} />
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white">Conseil personnalisé</p>
      </motion.div>

      <h2 className="text-[22px] font-bold text-foreground tracking-tight leading-snug">
        {step.question}
      </h2>
      <p className="text-[12px] text-muted mt-2">On adapte le conseil à votre profil.</p>

      {/* Options grid */}
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {step.options.map((opt, i) => {
          const isSelected = answer === i;
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.97 }}
              onClick={() => onAnswer(i)}
              className="rounded-2xl p-4 text-left flex flex-col items-start gap-2 transition-all"
              style={{
                backgroundColor: isSelected ? "#EEF0FF" : "white",
                border: isSelected ? "1.5px solid #5B4FE9" : "1.5px solid #E4E4E7",
                boxShadow: isSelected ? "0 10px 24px rgba(91, 79, 233, 0.18)" : "0 1px 4px rgba(0,0,0,0.03)",
              }}
            >
              <div className="text-[28px] leading-none">{opt.emoji}</div>
              <p className="text-[12px] font-bold text-foreground leading-snug">{opt.label}</p>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {answer !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-5 overflow-hidden"
          >
            <div
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{
                background: "linear-gradient(135deg, #EEF0FF, white)",
                border: "1px solid #5B4FE9",
              }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #5B4FE9, #3B30B5)" }}
              >
                <Zap size={15} className="text-white" strokeWidth={2.6} />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#3B30B5" }}>
                  Conseil pour vous
                </p>
                <p className="text-[12px] text-foreground leading-relaxed">{step.options[answer].tip}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CelebrationStep({ step }: { step: Celebration }) {
  return (
    <div className="relative">
      {/* Confetti dots */}
      <div className="relative w-full h-[240px] rounded-[28px] overflow-hidden mb-5"
        style={{ background: "linear-gradient(180deg, #EEF0FF, #F5F3FF 60%, white)" }}
      >
        {[...Array(14)].map((_, i) => {
          const left = 10 + (i * 7) % 80;
          const top = 10 + (i * 13) % 70;
          const size = 6 + (i % 3) * 3;
          const colors = ["#5B4FE9", "#8B5CF6", "#F59E0B", "#10B981", "#EC4899"];
          const color = colors[i % colors.length];
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, backgroundColor: color }}
              initial={{ opacity: 0, y: -10, scale: 0 }}
              animate={{ opacity: [0, 1, 1, 0.7], y: [0, 6, 0], scale: [0, 1, 1] }}
              transition={{
                duration: 2.2,
                delay: 0.1 + i * 0.05,
                repeat: Infinity,
                repeatDelay: 1.5,
                ease: "easeInOut",
              }}
            />
          );
        })}

        {/* Trophy icon */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px] h-[110px] rounded-[30px] flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #5B4FE9, #3B30B5)",
            boxShadow: "0 20px 44px rgba(91, 79, 233, 0.4)",
          }}
          initial={{ scale: 0.5, rotate: -12, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
        >
          <Trophy size={52} className="text-white" strokeWidth={1.8} />
        </motion.div>

        <motion.div
          className="absolute left-1/2 bottom-5 -translate-x-1/2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <PartyPopper size={20} style={{ color: "#F59E0B" }} />
        </motion.div>
      </div>

      <h1 className="text-[26px] font-bold text-foreground tracking-tight leading-tight text-center">
        {step.title}
      </h1>
      <p className="text-[13px] text-muted mt-2 leading-relaxed text-center max-w-[320px] mx-auto">
        {step.subtitle}
      </p>

      {/* Quick win cards */}
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {[
          { icon: Heart, label: "Ajouter un client", accent: "#3B82F6", soft: "#EFF6FF" },
          { icon: Share2, label: "Partager mon lien", accent: "#8B5CF6", soft: "#F5F3FF" },
          { icon: TrendingUp, label: "Voir mes stats", accent: "#16A34A", soft: "#F0FDF4" },
          { icon: Gift, label: "Créer une promo", accent: "#F59E0B", soft: "#FFFBEB" },
        ].map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.3 }}
              className="bg-white rounded-2xl p-3 shadow-card-premium flex items-center gap-2.5"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: a.soft }}
              >
                <Icon size={16} style={{ color: a.accent }} strokeWidth={2.4} />
              </div>
              <p className="text-[11px] font-bold text-foreground leading-snug">{a.label}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
