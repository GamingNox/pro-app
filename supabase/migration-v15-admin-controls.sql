-- =========================================================
-- Migration v15 - Admin controls (maintenance, closed, announcement)
--                + activity log
-- =========================================================
-- Adds the infrastructure for site-wide admin toggles and a
-- lightweight activity feed. All tables are read-locked to the
-- authenticated role and written via service-role API routes only.

-- 1. Global app config — singleton row (id = 1)
CREATE TABLE IF NOT EXISTS app_config (
  id INT PRIMARY KEY DEFAULT 1,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  maintenance_message TEXT DEFAULT 'Maintenance en cours, merci de patienter.',
  site_closed BOOLEAN NOT NULL DEFAULT false,
  site_closed_message TEXT DEFAULT 'Le site est temporairement fermé. Nous revenons très vite.',
  announcement TEXT,
  announcement_type TEXT DEFAULT 'info', -- info | warning | critical
  app_version TEXT DEFAULT '1.0.0',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT app_config_singleton CHECK (id = 1)
);

INSERT INTO app_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Everyone signed in can READ the config (so banners/maintenance show up)
DROP POLICY IF EXISTS "app_config: read to authenticated" ON app_config;
CREATE POLICY "app_config: read to authenticated"
  ON app_config FOR SELECT
  USING (auth.role() = 'authenticated');

-- Anon can also read so the public booking page reflects maintenance too
DROP POLICY IF EXISTS "app_config: read to anon" ON app_config;
CREATE POLICY "app_config: read to anon"
  ON app_config FOR SELECT
  USING (auth.role() = 'anon');

-- Writes go through a service-role API route (no direct client write)


-- 2. Activity log — recent app-level events
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  -- signup | login | booking | invoice | cancellation | error | admin_action | …
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log (type);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read
DROP POLICY IF EXISTS "activity_log: admin read" ON activity_log;
CREATE POLICY "activity_log: admin read"
  ON activity_log FOR SELECT
  USING (is_admin());

-- All writes go via service role (no client insert)
