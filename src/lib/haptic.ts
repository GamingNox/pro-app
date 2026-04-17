// ══ Haptic feedback utility ════════════════════════════
// Wraps navigator.vibrate for mobile devices. No-ops silently
// on desktop or unsupported browsers.

export function hapticLight() {
  try { navigator?.vibrate?.(8); } catch { /* ignore */ }
}

export function hapticMedium() {
  try { navigator?.vibrate?.(15); } catch { /* ignore */ }
}

export function hapticHeavy() {
  try { navigator?.vibrate?.([10, 30, 10]); } catch { /* ignore */ }
}

export function hapticSuccess() {
  try { navigator?.vibrate?.([8, 50, 8]); } catch { /* ignore */ }
}

export function hapticError() {
  try { navigator?.vibrate?.([20, 40, 20, 40, 20]); } catch { /* ignore */ }
}
