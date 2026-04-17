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

/**
 * French phone number: accepts 0X XX XX XX XX or +33 X XX XX XX XX
 * where X starts with 1-9 (landline/mobile). Ignores spaces, dots, hyphens.
 */
export function validatePhoneFR(v: string): string | null {
  if (!v.trim()) return null; // optional unless caller enforces required
  const digits = v.replace(/[\s\-().]/g, "");
  // Normalize +33 → 0 then check 10 digits starting 0 + non-zero
  const normalized = digits.startsWith("+33") ? "0" + digits.slice(3) : digits;
  if (!/^0[1-9]\d{8}$/.test(normalized)) {
    return "Numéro de téléphone français invalide (ex : 06 12 34 56 78).";
  }
  return null;
}

export function validatePhoneFRRequired(v: string): string | null {
  if (!v.trim()) return "Téléphone requis.";
  return validatePhoneFR(v);
}

/**
 * Password strength: at least 8 characters, at least one letter and one digit.
 * Deliberately loose so users can pick something they'll remember, while
 * blocking "123456" / "abc" style entries.
 */
export function validatePasswordStrength(v: string): string | null {
  if (!v) return "Mot de passe requis.";
  if (v.length < 8) return "Au moins 8 caractères.";
  if (!/[A-Za-z]/.test(v)) return "Au moins une lettre.";
  if (!/\d/.test(v)) return "Au moins un chiffre.";
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
