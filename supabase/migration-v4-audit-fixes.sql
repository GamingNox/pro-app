-- =========================================================
-- Migration v4 - Audit fixes
-- Fills the gap between code and schema discovered by the audit.
-- Safe to run multiple times (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- =========================================================

-- ---------------------------------------------------------
-- 1. appointments: guest booking columns
-- ---------------------------------------------------------
-- Code writes to these in src/lib/store.tsx and src/app/book/[slug]/page.tsx
-- when a guest (non-registered) books via the public link.
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS is_guest    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guest_name  TEXT,
  ADD COLUMN IF NOT EXISTS guest_email TEXT,
  ADD COLUMN IF NOT EXISTS guest_phone TEXT;

-- ---------------------------------------------------------
-- 2. user_profiles: subscription_plan
-- ---------------------------------------------------------
-- Updated from src/lib/beta.ts (beta approval grants plan) and admin tools.
-- Previously silently failing because the column did not exist.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT
    CHECK (subscription_plan IN ('essentiel', 'croissance', 'entreprise'))
    DEFAULT 'essentiel';

-- ---------------------------------------------------------
-- 3. gift_codes table
-- ---------------------------------------------------------
-- Used by src/lib/giftCodes.ts. Currently falls back to localStorage
-- when the table is missing. This creates the persistent version.
CREATE TABLE IF NOT EXISTS gift_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,
  reward_type   TEXT NOT NULL CHECK (reward_type IN ('free_month', 'discount_percent')),
  reward_value  NUMERIC(10,2) NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ,
  redeemed      BOOLEAN NOT NULL DEFAULT false,
  redeemed_by   UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  redeemed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gift_codes_code ON gift_codes(code);
CREATE INDEX IF NOT EXISTS idx_gift_codes_redeemed ON gift_codes(redeemed);

ALTER TABLE gift_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on gift_codes" ON gift_codes;
CREATE POLICY "Allow all on gift_codes"
  ON gift_codes FOR ALL
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------
-- 4. Realtime coverage for gift_codes
-- ---------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'gift_codes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE gift_codes;
  END IF;
END $$;
