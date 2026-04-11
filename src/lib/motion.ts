// ── Centralized animation constants ──────────────────────
// Single source of truth for all Framer Motion transitions.
// Ensures consistency across the entire app.

// ── Spring presets ──────────────────────────────────────
export const spring = {
  /** Snappy, responsive — buttons, nav items */
  snappy: { type: "spring" as const, stiffness: 500, damping: 30 },
  /** Smooth, natural — modals, panels, cards */
  smooth: { type: "spring" as const, stiffness: 340, damping: 30 },
  /** Bouncy — success animations, attention-grabbing */
  bouncy: { type: "spring" as const, stiffness: 260, damping: 20 },
  /** Gentle — layout shifts, indicator movement */
  gentle: { type: "spring" as const, stiffness: 200, damping: 25 },
};

// ── Duration presets ────────────────────────────────────
export const duration = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
};

// ── Easing presets ──────────────────────────────────────
export const ease = {
  smooth: [0.25, 0.46, 0.45, 0.94] as const,
  out: [0, 0, 0.2, 1] as const,
  in: [0.4, 0, 1, 0.6] as const,
};

// ── Page transition variants ────────────────────────────
export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export const pageTransition = {
  duration: duration.normal,
  ease: ease.smooth,
};

// ── Stagger children ────────────────────────────────────
export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.04 },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: ease.smooth } },
};

// ── Card hover/tap ──────────────────────────────────────
export const cardTap = { scale: 0.98 };
export const buttonTap = { scale: 0.97 };
export const iconTap = { scale: 0.85 };

// ── Fade in ─────────────────────────────────────────────
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: duration.normal },
};

export const fadeSlideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: ease.smooth },
};
