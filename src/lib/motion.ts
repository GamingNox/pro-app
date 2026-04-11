// ── Centralized Animation System ─────────────────────────
// Single source of truth for ALL motion in the app.
// Apple-inspired: fast, subtle, natural.

// ── Spring presets ──────────────────────────────────────
export const spring = {
  snappy: { type: "spring" as const, stiffness: 500, damping: 30 },
  smooth: { type: "spring" as const, stiffness: 340, damping: 30 },
  bouncy: { type: "spring" as const, stiffness: 260, damping: 20 },
  gentle: { type: "spring" as const, stiffness: 200, damping: 25 },
};

// ── Duration presets ────────────────────────────────────
export const dur = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
};

// ── Easing — Apple Material Motion ──────────────────────
export const ease = {
  /** Apple standard — most animations */
  apple: [0.4, 0, 0.2, 1] as const,
  /** Enter — element appearing */
  enter: [0, 0, 0.2, 1] as const,
  /** Exit — element disappearing */
  exit: [0.4, 0, 1, 1] as const,
  /** Smooth — general purpose */
  smooth: [0.25, 0.46, 0.45, 0.94] as const,
};

// ── Page transitions ────────────────────────────────────
export const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export const pageTransition = {
  duration: dur.normal,
  ease: ease.apple,
};

// ── Settings page transition (slide from right) ─────────
export const settingsVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
};

export const settingsTransition = {
  duration: dur.normal,
  ease: ease.apple,
};

// ── Stagger container + items ───────────────────────────
export const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

export const staggerItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: dur.normal, ease: ease.apple } },
};

// ── Interaction presets ─────────────────────────────────
export const tap = {
  button: { scale: 0.97 },
  card: { scale: 0.985 },
  icon: { scale: 0.85 },
  subtle: { scale: 0.99 },
};

// ── Fade presets ────────────────────────────────────────
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: dur.normal } },
};

export const fadeSlideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: ease.apple },
};

export const fadeSlideDown = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: dur.normal, ease: ease.apple },
};

// ── Scale in (modals, toasts) ───────────────────────────
export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
  transition: { duration: dur.normal, ease: ease.apple },
};

// ── List item with viewport trigger ─────────────────────
export const viewportItem = {
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.3, ease: ease.apple },
};
