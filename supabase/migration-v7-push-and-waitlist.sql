-- =========================================================
-- Migration v7 - Push notifications + Waiting list
-- Safe to re-run (IF NOT EXISTS everywhere).
-- =========================================================

-- =========================================================
-- PART 1: push_subscriptions
-- =========================================================
-- Stores one row per device/browser a pro has subscribed on.
-- Populated by the client-side push.ts helper after the user
-- accepts the notification permission. Consumed server-side
-- by /api/push/send via the web-push library.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subs: owner full access" ON push_subscriptions;
CREATE POLICY "push_subs: owner full access"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- PART 2: waitlist
-- =========================================================
-- A client who could not find a slot can register their contact
-- info and a preferred date. The pro sees the list in Gestion and
-- can release a slot when one becomes available.

CREATE TABLE IF NOT EXISTS waitlist (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  service_id      UUID REFERENCES services(id) ON DELETE SET NULL,
  preferred_date  DATE,
  client_first    TEXT NOT NULL,
  client_last     TEXT,
  client_email    TEXT,
  client_phone    TEXT,
  note            TEXT,
  status          TEXT NOT NULL DEFAULT 'waiting'
                  CHECK (status IN ('waiting', 'contacted', 'resolved', 'expired')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_user_status ON waitlist(user_id, status);
CREATE INDEX IF NOT EXISTS idx_waitlist_user_date ON waitlist(user_id, preferred_date);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Pro can read/update/delete their own waitlist entries.
DROP POLICY IF EXISTS "waitlist: owner select" ON waitlist;
CREATE POLICY "waitlist: owner select"
  ON waitlist FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "waitlist: owner update" ON waitlist;
CREATE POLICY "waitlist: owner update"
  ON waitlist FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "waitlist: owner delete" ON waitlist;
CREATE POLICY "waitlist: owner delete"
  ON waitlist FOR DELETE
  USING (auth.uid() = user_id);

-- No direct INSERT for anon - they go through the RPC below.

-- =========================================================
-- PART 3: RPC - public_join_waitlist
-- =========================================================
-- Used by anonymous visitors on /book/<slug> when no slot fits.
-- Verifies the service exists and belongs to the pro, then inserts.

CREATE OR REPLACE FUNCTION public_join_waitlist(
  p_pro_id        UUID,
  p_service_id    UUID,
  p_preferred_date DATE,
  p_first_name    TEXT,
  p_last_name     TEXT,
  p_email         TEXT,
  p_phone         TEXT,
  p_note          TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service RECORD;
  v_waitlist_id UUID;
BEGIN
  IF p_service_id IS NOT NULL THEN
    SELECT id, active
    INTO v_service
    FROM services
    WHERE id = p_service_id AND user_id = p_pro_id;

    IF v_service IS NULL THEN
      RETURN jsonb_build_object('error', 'invalid_service');
    END IF;
  END IF;

  IF length(trim(coalesce(p_first_name, ''))) = 0 THEN
    RETURN jsonb_build_object('error', 'missing_first_name');
  END IF;

  IF length(trim(coalesce(p_email, ''))) = 0
     AND length(trim(coalesce(p_phone, ''))) = 0 THEN
    RETURN jsonb_build_object('error', 'missing_contact');
  END IF;

  INSERT INTO waitlist (
    user_id, service_id, preferred_date,
    client_first, client_last, client_email, client_phone, note
  )
  VALUES (
    p_pro_id,
    p_service_id,
    p_preferred_date,
    trim(p_first_name),
    NULLIF(trim(coalesce(p_last_name, '')), ''),
    NULLIF(trim(coalesce(p_email, '')), ''),
    NULLIF(trim(coalesce(p_phone, '')), ''),
    NULLIF(trim(coalesce(p_note, '')), '')
  )
  RETURNING id INTO v_waitlist_id;

  RETURN jsonb_build_object('waitlist_id', v_waitlist_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public_join_waitlist(UUID, UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- =========================================================
-- PART 4: Realtime coverage
-- =========================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='waitlist') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE waitlist;
  END IF;
END $$;
