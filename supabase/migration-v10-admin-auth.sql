-- =========================================================
-- Migration v10 - Proper admin authentication
-- =========================================================
-- Replaces the localStorage-based admin flag with a database
-- column + Supabase Auth check. Adds additive RLS policies so
-- admins can read cross-user data.

-- 1. Add is_admin column
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- 2. Grant admin to the owner email (update this to your email)
UPDATE user_profiles
SET is_admin = true
WHERE email = 'jodie@nospetitesaventures.fr';

-- 3. Additive SELECT policies for admins on key tables.
-- These do NOT replace the owner policies — they ADD a second
-- path for authenticated users who are admins.

-- user_profiles: admin can read all profiles
DROP POLICY IF EXISTS "user_profiles: admin read all" ON user_profiles;
CREATE POLICY "user_profiles: admin read all"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_admin = true
    )
  );

-- appointments: admin can read all
DROP POLICY IF EXISTS "appointments: admin read all" ON appointments;
CREATE POLICY "appointments: admin read all"
  ON appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_admin = true
    )
  );

-- clients: admin can read all
DROP POLICY IF EXISTS "clients: admin read all" ON clients;
CREATE POLICY "clients: admin read all"
  ON clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_admin = true
    )
  );

-- invoices: admin can read all
DROP POLICY IF EXISTS "invoices: admin read all" ON invoices;
CREATE POLICY "invoices: admin read all"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_admin = true
    )
  );
