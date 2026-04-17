-- =========================================================
-- Migration v5 - Loyalty persistence + RLS tightening (step 1)
-- =========================================================
-- Creates the loyalty tables and tightens RLS on tables that are NOT
-- used by the public /book/<slug> flow. The remaining public-flow
-- tables are hardened later in migration v6 via SECURITY DEFINER RPCs.
-- Safe to re-run.

-- ---------------------------------------------------------
-- 1. LOYALTY TABLES
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS loyalty_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT '',
  color       TEXT NOT NULL DEFAULT '#5B4FE9',
  emoji       TEXT NOT NULL DEFAULT 'GIFT',
  mode        TEXT NOT NULL CHECK (mode IN ('visits', 'points')) DEFAULT 'visits',
  goal        INTEGER NOT NULL DEFAULT 10,
  reward      TEXT NOT NULL DEFAULT '',
  message     TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loyalty_cards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  template_id  UUID NOT NULL REFERENCES loyalty_templates(id) ON DELETE CASCADE,
  client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
  code         TEXT NOT NULL UNIQUE,
  progress     INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_templates_user ON loyalty_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_user ON loyalty_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_template ON loyalty_cards(template_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_code ON loyalty_cards(code);

ALTER TABLE loyalty_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "loyalty_templates: owner full access" ON loyalty_templates;
CREATE POLICY "loyalty_templates: owner full access"
  ON loyalty_templates FOR ALL
  USING (auth.uid() = user_id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "loyalty_cards: owner full access" ON loyalty_cards;
CREATE POLICY "loyalty_cards: owner full access"
  ON loyalty_cards FOR ALL
  USING (auth.uid() = user_id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='loyalty_templates') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE loyalty_templates;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='loyalty_cards') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE loyalty_cards;
  END IF;
END $$;

-- ---------------------------------------------------------
-- 2. RLS TIGHTENING - invoices, products
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Allow all on invoices" ON invoices;
DROP POLICY IF EXISTS "invoices: owner full access" ON invoices;
CREATE POLICY "invoices: owner full access"
  ON invoices FOR ALL
  USING (auth.uid() = user_id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Allow all on products" ON products;
DROP POLICY IF EXISTS "products: owner full access" ON products;
CREATE POLICY "products: owner full access"
  ON products FOR ALL
  USING (auth.uid() = user_id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);
