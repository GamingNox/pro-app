-- =========================================================
-- Migration v8 - Harden public_create_guest_booking
-- =========================================================
-- v6 shipped an RPC that could NULL-violate the clients.last_name
-- NOT NULL constraint if a client submitted without a last name:
--   trim(NULL) -> NULL -> INSERT fails
--
-- This migration replaces the function with a defensive version:
--   * All TEXT parameters are coalesced to '' before any trim/insert
--   * Empty first_name is rejected explicitly with a dedicated error
--   * Error messages are more granular for the client to display

CREATE OR REPLACE FUNCTION public_create_guest_booking(
  p_pro_id     UUID,
  p_service_id UUID,
  p_date       DATE,
  p_time       TIME,
  p_first_name TEXT,
  p_last_name  TEXT,
  p_email      TEXT,
  p_phone      TEXT,
  p_note       TEXT,
  p_is_guest   BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service    RECORD;
  v_client_id  UUID;
  v_appt_id    UUID;
  v_palette    TEXT[] := ARRAY['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EC4899'];
  v_first      TEXT;
  v_last       TEXT;
  v_email      TEXT;
  v_phone      TEXT;
  v_note       TEXT;
BEGIN
  -- Normalize every text input once at the top.
  v_first := trim(COALESCE(p_first_name, ''));
  v_last  := trim(COALESCE(p_last_name,  ''));
  v_email := trim(COALESCE(p_email,      ''));
  v_phone := trim(COALESCE(p_phone,      ''));
  v_note  := trim(COALESCE(p_note,       ''));

  IF length(v_first) = 0 THEN
    RETURN jsonb_build_object('error', 'missing_first_name');
  END IF;

  IF p_date IS NULL OR p_time IS NULL THEN
    RETURN jsonb_build_object('error', 'missing_date_or_time');
  END IF;

  -- Verify the service exists, belongs to the pro, and is active.
  SELECT id, name, duration, price, active
  INTO v_service
  FROM services
  WHERE id = p_service_id AND user_id = p_pro_id;

  IF NOT FOUND OR v_service.active IS NOT TRUE THEN
    RETURN jsonb_build_object('error', 'invalid_service');
  END IF;

  -- Dedupe client by email (case-insensitive), but only if email provided.
  IF length(v_email) > 0 THEN
    SELECT id INTO v_client_id
    FROM clients
    WHERE user_id = p_pro_id
      AND lower(email) = lower(v_email)
    LIMIT 1;
  END IF;

  -- Insert the client row if we did not find one.
  -- All columns are coalesced so we never hit NOT NULL violations.
  IF v_client_id IS NULL THEN
    INSERT INTO clients (
      user_id, first_name, last_name, email, phone, notes, avatar
    )
    VALUES (
      p_pro_id,
      v_first,
      v_last,
      v_email,
      v_phone,
      CASE WHEN p_is_guest THEN '[guest] Reservation en ligne' ELSE 'Reservation en ligne' END,
      v_palette[1 + floor(random() * array_length(v_palette, 1))::int]
    )
    RETURNING id INTO v_client_id;
  END IF;

  -- Insert the appointment.
  INSERT INTO appointments (
    user_id, client_id, title, date, time, duration, status, price, notes,
    is_guest, guest_name, guest_email, guest_phone
  )
  VALUES (
    p_pro_id,
    v_client_id,
    v_service.name || ' - ' || v_first ||
      CASE WHEN length(v_last) > 0 THEN ' ' || v_last ELSE '' END,
    p_date,
    p_time,
    v_service.duration,
    'confirmed',
    v_service.price,
    CASE WHEN length(v_note) > 0
         THEN 'Reservation en ligne' || chr(10) || v_note
         ELSE 'Reservation en ligne' END,
    COALESCE(p_is_guest, false),
    CASE WHEN p_is_guest THEN
           v_first || CASE WHEN length(v_last) > 0 THEN ' ' || v_last ELSE '' END
         ELSE NULL END,
    CASE WHEN p_is_guest AND length(v_email) > 0 THEN v_email ELSE NULL END,
    CASE WHEN p_is_guest AND length(v_phone) > 0 THEN v_phone ELSE NULL END
  )
  RETURNING id INTO v_appt_id;

  RETURN jsonb_build_object(
    'appointment_id', v_appt_id,
    'client_id', v_client_id
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Surface the raw SQLSTATE to help the client report bugs.
    RETURN jsonb_build_object(
      'error', 'db_error',
      'sqlstate', SQLSTATE,
      'detail', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public_create_guest_booking(UUID, UUID, DATE, TIME, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO anon, authenticated;
