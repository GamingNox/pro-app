-- =========================================================
-- Migration v14 - Email verification via OTP
-- =========================================================
-- Adds a 6-digit OTP system for email verification, independent
-- of Supabase's default confirmation link. Allows a custom
-- branded email + in-app code entry flow.

-- 1. OTP table
CREATE TABLE IF NOT EXISTS email_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps (lower(email));
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON email_otps (expires_at);

-- 2. email_verified flag on user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

-- 3. RLS: the table is only touched via service-role API routes,
-- block all client access.
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "email_otps: no client access" ON email_otps;
CREATE POLICY "email_otps: no client access" ON email_otps
  FOR ALL USING (false) WITH CHECK (false);
