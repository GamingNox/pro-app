// ── Haptic feedback for mobile ────────────────────────────
// Uses the Vibration API (supported on Android Chrome, some iOS).
// Falls back silently if not available. Import and call where needed.

/** Micro tap — 10ms for button presses. */
export function hapticTap() {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch { /* ignore */ }
}

/** Medium feedback — 30ms for confirmations, toggles. */
export function hapticMedium() {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
  } catch { /* ignore */ }
}

/** Success pattern — double tap for completed actions. */
export function hapticSuccess() {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([15, 50, 15]);
    }
  } catch { /* ignore */ }
}

/** Error pattern — longer single vibration. */
export function hapticError() {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(80);
    }
  } catch { /* ignore */ }
}
