// ── Centralized Animation System ─────────────────────────
// Single source of truth for ALL motion in the app.
// Philosophy: felt, not seen. Fast, subtle, invisible.

// ── Spring presets (critically damped — no bounce) ──────
export const spring = {
  snappy: { type: "spring" as const, stiffness: 600, damping: 40 },
  smooth: { type: "spring" as const, stiffness: 400, damping: 35 },
  gentle: { type: "spring" as const, stiffness: 300, damping: 30 },
};

// ── Duration presets ────────────────────────────────────
export const dur = {
  /** Button taps, micro-interactions */
  instant: 0.08,
  /** Tab switches, small reveals */
  fast: 0.12,
  /** Page transitions, content fades */
  normal: 0.18,
  /** Modals, large reveals */
  slow: 0.22,
};

// ── Easing — single curve everywhere ───────────────────
export const ease = {
  /** Standard — used for everything */
  apple: [0.4, 0, 0.2, 1] as const,
};

// ── Page transitions (entrance only — no exit = no flash) ─
// No opacity fade — content is already visible on mount. Only a tiny slide
// gives a sense of motion without the "appears in two steps" perception.
export const pageVariants = {
  initial: { y: 4 },
  animate: { y: 0 },
};

export const pageTransition = {
  duration: dur.fast,
  ease: ease.apple,
};

// ── Settings page transition (subtle slide from right) ──
export const settingsVariants = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0 },
};

export const settingsTransition = {
  duration: dur.normal,
  ease: ease.apple,
};

// ── Notification panel transition (slide down from top + subtle scale) ─
// Distinct from page/settings transitions to signal a notification context.
export const notificationVariants = {
  initial: { opacity: 0, y: -14, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
};

export const notificationTransition = {
  duration: dur.fast,
  ease: ease.apple,
};

// ── Stagger container + items ───────────────────────────
export const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.03, delayChildren: 0 } },
};

export const staggerItem = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: dur.normal, ease: ease.apple } },
};

// ── Interaction presets ─────────────────────────────────
export const tap = {
  button: { scale: 0.98 },
  card: { scale: 0.99 },
  icon: { scale: 0.92 },
  subtle: { scale: 0.995 },
};

export const hover = {
  button: { scale: 1.01 },
  card: { scale: 1.005 },
  icon: { scale: 1.04 },
  subtle: { scale: 1.002 },
};

// ── Tab / view content switch ──────────────────────────
export const tabContentVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const tabContentTransition = {
  duration: dur.fast,
  ease: ease.apple,
};

// ── Fade presets ────────────────────────────────────────
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: dur.normal } },
};

export const fadeSlideUp = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: dur.normal, ease: ease.apple },
};

export const fadeSlideDown = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: dur.normal, ease: ease.apple },
};

// ── Scale in (modals, toasts) ───────────────────────────
export const scaleIn = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: dur.normal, ease: ease.apple },
};

// ── List item with viewport trigger ─────────────────────
export const viewportItem = {
  initial: { opacity: 0, y: 4 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: dur.normal, ease: ease.apple },
};
