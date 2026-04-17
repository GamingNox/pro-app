-- =========================================================
-- Migration v11 - Settings JSONB column + booking config RPC
-- =========================================================

-- 1. Add the settings JSONB column that useUserSettings writes to.
-- Without this column, every saveSetting() call fails silently and
-- falls back to localStorage only.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- 2. RPC: public_get_booking_config
-- Called by /book/<slug> to fetch the pro's booking rules and
-- availability exceptions so they render on the client-side
-- booking page. SECURITY DEFINER so it works for anon visitors.
CREATE OR REPLACE FUNCTION public_get_booking_config(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_settings JSONB;
  v_rules JSONB;
  v_exceptions JSONB;
BEGIN
  -- Find the pro by slug
  SELECT id, COALESCE(settings, '{}'::jsonb)
  INTO v_user_id, v_settings
  FROM user_profiles
  WHERE booking_slug = p_slug
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  -- Extract booking_rules from settings JSONB
  v_rules := v_settings -> 'booking_rules';

  -- Extract availability_exceptions from settings JSONB
  v_exceptions := v_settings -> 'availability_exceptions';

  RETURN jsonb_build_object(
    'booking_rules', COALESCE(v_rules, '{}'::jsonb),
    'availability_exceptions', COALESCE(v_exceptions, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public_get_booking_config(TEXT) TO anon, authenticated;
