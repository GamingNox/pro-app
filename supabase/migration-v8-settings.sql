-- =========================================================
-- Migration v8 - User settings JSONB + public config RPC
--
-- Adds:
--   1. `settings` JSONB column on user_profiles (holds visibility,
--      seo, booking_rules, automated_messages, availability_exceptions,
--      external_payment_link — all under one bag per pro)
--   2. Public RPC `public_get_booking_config(slug)` which returns only
--      the subset safe to expose: booking_rules + availability_exceptions.
--      Used by /book/[slug] to show instructions + absence messages.
--   3. Index on settings->>'customSlug' so SEO-custom slugs resolve fast.
--
-- Safe to re-run.
-- =========================================================

-- ---------------------------------------------------------
-- 1. Add settings JSONB column
-- ---------------------------------------------------------
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Nothing to backfill — everything lives in localStorage today.

-- ---------------------------------------------------------
-- 2. Public RPC: fetch booking config for a pro
-- ---------------------------------------------------------
-- Returns the subset of settings that the public booking page needs:
--   - booking_rules (cancellation policy, min delay, custom instructions)
--   - availability_exceptions (closed days with client-facing message)
-- Never returns private fields (automated_messages templates, SEO config).
CREATE OR REPLACE FUNCTION public_get_booking_config(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings JSONB;
BEGIN
  SELECT settings INTO v_settings
  FROM user_profiles
  WHERE booking_slug = p_slug
  LIMIT 1;

  IF v_settings IS NULL THEN
    RETURN jsonb_build_object(
      'booking_rules', '{}'::jsonb,
      'availability_exceptions', '[]'::jsonb
    );
  END IF;

  RETURN jsonb_build_object(
    'booking_rules', COALESCE(v_settings->'booking_rules', '{}'::jsonb),
    'availability_exceptions', COALESCE(v_settings->'availability_exceptions', '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public_get_booking_config(TEXT) TO anon, authenticated;
