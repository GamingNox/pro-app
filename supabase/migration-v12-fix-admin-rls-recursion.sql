-- =========================================================
-- Migration v12 - Fix recursive RLS policies from v10
-- =========================================================
-- v10 created "admin read all" policies with subqueries
-- against user_profiles inside policies applied to user_profiles.
-- That causes infinite recursion -> 500 Internal Server Error on
-- any SELECT against user_profiles (and other tables).
--
-- Fix: replace the inline EXISTS subquery with a SECURITY DEFINER
-- helper function. SECURITY DEFINER bypasses RLS, so the admin
-- check no longer triggers the policy on user_profiles.

-- 1. Helper: is_admin() — bypasses RLS via SECURITY DEFINER
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT up.is_admin FROM user_profiles up WHERE up.id = auth.uid() LIMIT 1),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- 2. Replace the 4 recursive policies with non-recursive versions

DROP POLICY IF EXISTS "user_profiles: admin read all" ON user_profiles;
CREATE POLICY "user_profiles: admin read all"
  ON user_profiles FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "appointments: admin read all" ON appointments;
CREATE POLICY "appointments: admin read all"
  ON appointments FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "clients: admin read all" ON clients;
CREATE POLICY "clients: admin read all"
  ON clients FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "invoices: admin read all" ON invoices;
CREATE POLICY "invoices: admin read all"
  ON invoices FOR SELECT
  USING (is_admin());
