-- ══════════════════════════════════════════════════════════
-- ProApp V2: Services + Booking System
-- ══════════════════════════════════════════════════════════

-- Add booking slug to user profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS booking_slug TEXT UNIQUE;

-- ── Services ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_user ON services(user_id);
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on services" ON services FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE services;
