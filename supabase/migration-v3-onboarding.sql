-- ────────────────────────────────────────────────────────────────
-- Onboarding v3 — multi-step signup + progressive profile completion
-- Run once in the Supabase SQL editor. Safe to re-run (IF NOT EXISTS).
-- ────────────────────────────────────────────────────────────────

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS business_type TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Existing Pro users (before v3) are considered "setup complete" so they
-- don't see the resume banner on next login.
UPDATE user_profiles
SET setup_completed = true
WHERE setup_completed IS NULL OR setup_completed = false;

COMMENT ON COLUMN user_profiles.business_type IS 'Pro account category (beaute, sante, conseil, etc.) — picked from a predefined list during onboarding';
COMMENT ON COLUMN user_profiles.onboarding_data IS 'Raw multi-step onboarding form snapshot — services, schedule, preferences. Used to resume incomplete setups.';
COMMENT ON COLUMN user_profiles.setup_completed IS 'True once the user has finished the complete 5-step onboarding (or dismissed the resume banner).';
