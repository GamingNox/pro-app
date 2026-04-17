-- =========================================================
-- Migration v13 - Public taken-slots RPC
-- =========================================================
-- Lets the public booking page know which time slots are
-- already taken on a given date, so it can disable them in
-- the UI instead of letting clients double-book.

CREATE OR REPLACE FUNCTION public_get_taken_slots(p_slug TEXT, p_date DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_times JSONB;
BEGIN
  SELECT id INTO v_user_id
  FROM user_profiles
  WHERE booking_slug = p_slug
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(to_char(time, 'HH24:MI') ORDER BY time), '[]'::jsonb)
  INTO v_times
  FROM appointments
  WHERE user_id = v_user_id
    AND date = p_date
    AND (status IS NULL OR status NOT IN ('cancelled', 'canceled'));

  RETURN v_times;
END;
$$;

GRANT EXECUTE ON FUNCTION public_get_taken_slots(TEXT, DATE) TO anon, authenticated;
