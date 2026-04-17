-- =========================================================
-- Migration v9 - pg_cron hourly reminder trigger
--
-- The Next.js endpoint `/api/cron/reminders` handles the actual
-- logic (scan appointments, fire Resend emails, write idempotency
-- markers). On Vercel Hobby, the platform cron is limited to once
-- per day — too coarse for 1h / 4h reminder timings.
--
-- This migration uses Supabase's pg_cron + pg_net extensions to
-- hit the endpoint every hour, which gives the granularity the
-- reminder timings need. The Vercel daily cron stays as a safety
-- net — the idempotency marker prevents double-sends.
--
-- ─────────────────────────────────────────────────────────
-- ONE-TIME SETUP (do this BEFORE running this file):
-- ─────────────────────────────────────────────────────────
-- 1. In Supabase Dashboard → Database → Extensions, enable:
--       pg_cron
--       pg_net
--
-- 2. Edit the two lines below marked `<<< EDIT THIS`:
--       - APP_URL: your production URL (e.g. https://clientbase.fr)
--       - CRON_SECRET: the same value you set in Vercel env vars
--
-- 3. Run this file in the SQL Editor.
--
-- Safe to re-run (drops any existing schedule first).
-- =========================================================

-- ---------------------------------------------------------
-- Ensure extensions exist (no-op if already enabled via UI)
-- ---------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ---------------------------------------------------------
-- Store the cron secret + app URL in a tiny config table
-- so we don't have to hard-code secrets inside the schedule
-- definition (those would show up in pg_cron.job_run_details).
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_cron_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Lock it down — only service role should read secrets
ALTER TABLE app_cron_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny all" ON app_cron_config;
CREATE POLICY "deny all" ON app_cron_config FOR ALL TO authenticated, anon USING (false);

-- Insert / update the two config rows.
-- <<< EDIT THESE TWO VALUES >>>
INSERT INTO app_cron_config (key, value) VALUES
  ('app_url',      'https://clientbase.fr'),
  ('cron_secret',  'REPLACE_ME_SAME_AS_VERCEL_CRON_SECRET')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ---------------------------------------------------------
-- Wrapper function: reads config, calls the Next.js endpoint
-- via pg_net. Runs as SECURITY DEFINER so it can read the
-- locked-down app_cron_config table.
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_reminder_cron()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url TEXT;
  v_secret TEXT;
  v_request_id BIGINT;
BEGIN
  SELECT value INTO v_url     FROM app_cron_config WHERE key = 'app_url';
  SELECT value INTO v_secret  FROM app_cron_config WHERE key = 'cron_secret';

  IF v_url IS NULL OR v_secret IS NULL THEN
    RAISE WARNING '[reminder-cron] missing app_url or cron_secret in app_cron_config';
    RETURN NULL;
  END IF;

  SELECT net.http_post(
    url     := v_url || '/api/cron/reminders',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    body    := '{}'::jsonb
  )
  INTO v_request_id;

  RETURN v_request_id;
END;
$$;

-- ---------------------------------------------------------
-- Schedule the job. Running every hour on the hour.
-- ---------------------------------------------------------
-- Unschedule any previous version (ignore errors if it doesn't exist)
DO $$
BEGIN
  PERFORM cron.unschedule('reminder-hourly');
EXCEPTION WHEN OTHERS THEN
  NULL;
END
$$;

SELECT cron.schedule(
  'reminder-hourly',          -- unique job name
  '0 * * * *',                -- top of every hour, UTC
  $$SELECT trigger_reminder_cron();$$
);

-- ---------------------------------------------------------
-- Inspect: list scheduled jobs
--   SELECT jobid, jobname, schedule, active FROM cron.job;
-- Inspect: last runs of our job
--   SELECT * FROM cron.job_run_details
--   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'reminder-hourly')
--   ORDER BY start_time DESC LIMIT 10;
-- Inspect: recent HTTP calls (pg_net)
--   SELECT id, created, status_code, content FROM net._http_response
--   ORDER BY id DESC LIMIT 10;
-- ---------------------------------------------------------
