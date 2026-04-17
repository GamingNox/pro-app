-- =========================================================
-- Migration v9 - Persistent invoice numbering
-- =========================================================
-- Adds an invoice_number column to invoices. Numbers are assigned
-- at creation time by the app and must be sequential with no gaps
-- per user (French legal requirement, CGI Art. 289).
--
-- Also adds an invoice_counter column to user_profiles so each pro
-- has their own independent counter.
-- Safe to re-run.

-- 1. Add invoice_number to invoices
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS invoice_number TEXT;

CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(user_id, invoice_number);

-- 2. Add invoice_counter to user_profiles (starts at 0, incremented on each invoice)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS invoice_counter INTEGER NOT NULL DEFAULT 0;

-- 3. Backfill existing invoices that have no number yet.
-- Assigns numbers in chronological order per user.
-- Format: FA-YYYY-NNNN
DO $$
DECLARE
  r RECORD;
  counter INTEGER;
  prev_user UUID := NULL;
BEGIN
  FOR r IN (
    SELECT id, user_id, date
    FROM invoices
    WHERE invoice_number IS NULL
      AND client_id IS NOT NULL
    ORDER BY user_id, date, created_at
  ) LOOP
    IF r.user_id IS DISTINCT FROM prev_user THEN
      counter := 0;
      prev_user := r.user_id;
    END IF;
    counter := counter + 1;
    UPDATE invoices
    SET invoice_number = 'FA-' || EXTRACT(YEAR FROM r.date)::TEXT || '-' || LPAD(counter::TEXT, 4, '0')
    WHERE id = r.id;
  END LOOP;

  -- Update each user's counter to their max assigned number
  UPDATE user_profiles up
  SET invoice_counter = sub.cnt
  FROM (
    SELECT user_id, COUNT(*)::INTEGER AS cnt
    FROM invoices
    WHERE invoice_number IS NOT NULL
      AND client_id IS NOT NULL
    GROUP BY user_id
  ) sub
  WHERE up.id = sub.user_id;
END $$;
