-- =========================================================
-- Migration v6 - RLS hardening + public booking RPCs
--
-- This migration closes the last part of debt #1 by:
--   1. Creating two SECURITY DEFINER RPCs that handle the anonymous
--      public booking flow without needing wide-open policies.
--   2. Replacing the permissive "Allow all" policies on the four tables
--      used by the booking flow (user_profiles, services, clients,
--      appointments) with strict auth.uid()-based policies.
--   3. Tightening messages RLS (chat) to the two conversation participants.
--
-- Safe to re-run (all CREATE statements use IF NOT EXISTS or OR REPLACE).
-- =========================================================

-- ---------------------------------------------------------
-- 1. PUBLIC RPC: get booking page data
-- ---------------------------------------------------------
-- Returns the pro profile + their active services, given a booking slug.
-- Runs as table owner so it bypasses RLS. Exposes only the minimum
-- amount of data needed to render the booking page.
CREATE OR REPLACE FUNCTION public_get_booking_page(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_services JSONB;
BEGIN
  SELECT id, name, business
  INTO v_profile
  FROM user_profiles
  WHERE booking_slug = p_slug
  LIMIT 1;

  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'duration', s.duration,
        'price', s.price,
        'description', s.description
      )
      ORDER BY s.created_at
    ),
    '[]'::jsonb
  )
  INTO v_services
  FROM services s
  WHERE s.user_id = v_profile.id AND s.active = true;

  RETURN jsonb_build_object(
    'profile', jsonb_build_object(
      'id', v_profile.id,
      'name', v_profile.name,
      'business', v_profile.business
    ),
    'services', v_services
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public_get_booking_page(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------
-- 2. PUBLIC RPC: create a guest booking
-- ---------------------------------------------------------
-- Atomically:
--   - Looks up or creates a client row for the pro CRM (dedupe by email)
--   - Inserts the appointment with is_guest = p_is_guest
-- Runs as owner (SECURITY DEFINER) so it bypasses RLS on clients and
-- appointments. Minimal attack surface: anon can only CREATE bookings
-- for a pro via this function, nothing else.
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
  v_service   RECORD;
  v_client_id UUID;
  v_appt_id   UUID;
  v_palette   TEXT[] := ARRAY['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EC4899'];
BEGIN
  -- Verify the service exists and belongs to the pro
  SELECT id, name, duration, price, active
  INTO v_service
  FROM services
  WHERE id = p_service_id AND user_id = p_pro_id;

  IF v_service IS NULL OR v_service.active = false THEN
    RETURN jsonb_build_object('error', 'invalid_service');
  END IF;

  -- Find or create the client in the pro CRM
  IF p_email IS NOT NULL AND length(trim(p_email)) > 0 THEN
    SELECT id INTO v_client_id
    FROM clients
    WHERE user_id = p_pro_id
      AND lower(email) = lower(trim(p_email))
    LIMIT 1;
  END IF;

  IF v_client_id IS NULL THEN
    INSERT INTO clients (user_id, first_name, last_name, email, phone, notes, avatar)
    VALUES (
      p_pro_id,
      trim(p_first_name),
      trim(p_last_name),
      COALESCE(trim(p_email), ''),
      COALESCE(trim(p_phone), ''),
      CASE WHEN p_is_guest THEN '[guest] Reservation en ligne' ELSE 'Reservation en ligne' END,
      v_palette[1 + floor(random() * array_length(v_palette, 1))::int]
    )
    RETURNING id INTO v_client_id;
  END IF;

  -- Create the appointment
  INSERT INTO appointments (
    user_id, client_id, title, date, time, duration, status, price, notes,
    is_guest, guest_name, guest_email, guest_phone
  )
  VALUES (
    p_pro_id,
    v_client_id,
    v_service.name || ' - ' || trim(p_first_name) || ' ' || trim(p_last_name),
    p_date,
    p_time,
    v_service.duration,
    'confirmed',
    v_service.price,
    CASE WHEN p_note IS NOT NULL AND length(trim(p_note)) > 0
         THEN 'Reservation en ligne' || chr(10) || trim(p_note)
         ELSE 'Reservation en ligne' END,
    p_is_guest,
    CASE WHEN p_is_guest THEN trim(p_first_name) || ' ' || trim(p_last_name) ELSE NULL END,
    CASE WHEN p_is_guest THEN NULLIF(trim(p_email), '') ELSE NULL END,
    CASE WHEN p_is_guest THEN NULLIF(trim(p_phone), '') ELSE NULL END
  )
  RETURNING id INTO v_appt_id;

  RETURN jsonb_build_object(
    'appointment_id', v_appt_id,
    'client_id', v_client_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public_create_guest_booking(UUID, UUID, DATE, TIME, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO anon, authenticated;

-- ---------------------------------------------------------
-- 3. TIGHTEN RLS - user_profiles
-- ---------------------------------------------------------
-- Owner can manage their own row. Anon can NOT read other profiles
-- directly; they must go through public_get_booking_page() for public data.
DROP POLICY IF EXISTS "Allow all on user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles: own row select" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles: own row insert" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles: own row update" ON user_profiles;

CREATE POLICY "user_profiles: own row select"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "user_profiles: own row insert"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles: own row update"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------
-- 4. TIGHTEN RLS - services
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Allow all on services" ON services;
DROP POLICY IF EXISTS "services: owner full access" ON services;

CREATE POLICY "services: owner full access"
  ON services FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------
-- 5. TIGHTEN RLS - clients
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Allow all on clients" ON clients;
DROP POLICY IF EXISTS "clients: owner full access" ON clients;

CREATE POLICY "clients: owner full access"
  ON clients FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------
-- 6. TIGHTEN RLS - appointments
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Allow all on appointments" ON appointments;
DROP POLICY IF EXISTS "appointments: owner full access" ON appointments;

CREATE POLICY "appointments: owner full access"
  ON appointments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------
-- 7. TIGHTEN RLS - messages (optional)
-- ---------------------------------------------------------
-- Conversation participants only. Anon has no access.
-- Wrapped in a guard: if the messages table has not been created yet
-- (chat-system.sql not applied), skip this section silently.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'messages'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Allow all on messages" ON messages';
    EXECUTE 'DROP POLICY IF EXISTS "messages: participant select" ON messages';
    EXECUTE 'DROP POLICY IF EXISTS "messages: sender insert" ON messages';
    EXECUTE 'DROP POLICY IF EXISTS "messages: participant update" ON messages';

    EXECUTE 'CREATE POLICY "messages: participant select" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id)';
    EXECUTE 'CREATE POLICY "messages: sender insert" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id)';
    EXECUTE 'CREATE POLICY "messages: participant update" ON messages FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id)';
  END IF;
END $$;

-- ---------------------------------------------------------
-- 8. DROP v5 escape hatch
-- ---------------------------------------------------------
-- v5 used "OR auth.uid() IS NULL" as a stepping stone on invoices,
-- products, loyalty_*. Now that everything is auth-based, drop the
-- escape hatch so anon really cannot touch them.
-- Loyalty tables are wrapped in existence guards in case v5 has not been
-- applied yet - avoids crashing on a fresh database.
DROP POLICY IF EXISTS "Allow all on invoices" ON invoices;
DROP POLICY IF EXISTS "invoices: owner full access" ON invoices;
CREATE POLICY "invoices: owner full access"
  ON invoices FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow all on products" ON products;
DROP POLICY IF EXISTS "products: owner full access" ON products;
CREATE POLICY "products: owner full access"
  ON products FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='loyalty_templates') THEN
    EXECUTE 'DROP POLICY IF EXISTS "loyalty_templates: owner full access" ON loyalty_templates';
    EXECUTE 'CREATE POLICY "loyalty_templates: owner full access" ON loyalty_templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='loyalty_cards') THEN
    EXECUTE 'DROP POLICY IF EXISTS "loyalty_cards: owner full access" ON loyalty_cards';
    EXECUTE 'CREATE POLICY "loyalty_cards: owner full access" ON loyalty_cards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;
