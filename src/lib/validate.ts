// ── Input validation helpers ────────────────────────────
// Returns an error message string or null if valid.
// French messages for direct display in the UI.

export function validateEmail(v: string): string | null {
  if (!v.trim()) return null; // optional field = no error
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return "Email invalide.";
  return null;
}

export function validateEmailRequired(v: string): string | null {
  if (!v.trim()) return "Email requis.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return "Format email invalide.";
  return null;
}

export function validatePhone(v: string): string | null {
  if (!v.trim()) return null; // optional
  const digits = v.replace(/[\s\-().+]/g, "");
  if (digits.length < 8 || digits.length > 15) return "Numéro trop court ou trop long.";
  if (!/^\d+$/.test(digits)) return "Caractères invalides.";
  return null;
}

export function validateRequired(v: string, label = "Ce champ"): string | null {
  if (!v.trim()) return `${label} est requis.`;
  return null;
}

export function validateMinLength(v: string, min: number, label = "Ce champ"): string | null {
  if (v.trim().length < min) return `${label} doit contenir au moins ${min} caractères.`;
  return null;
}

export function validatePrice(v: string | number): string | null {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n)) return "Prix invalide.";
  if (n < 0) return "Le prix ne peut pas être négatif.";
  return null;
}

export function validateDuration(v: string | number): string | null {
  const n = typeof v === "string" ? parseInt(v) : v;
  if (isNaN(n) || n <= 0) return "Durée invalide.";
  if (n > 480) return "Durée trop longue (max 8h).";
  return null;
}

/**
 * Validate multiple fields at once. Returns a Record of field → error.
 * Only includes fields with errors.
 *
 * Usage:
 *   const errors = validateAll({
 *     name: validateRequired(name, "Le nom"),
 *     email: validateEmail(email),
 *     price: validatePrice(price),
 *   });
 *   if (Object.keys(errors).length > 0) { setErrors(errors); return; }
 */
export function validateAll(checks: Record<string, string | null>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [key, err] of Object.entries(checks)) {
    if (err) errors[key] = err;
  }
  return errors;
}
