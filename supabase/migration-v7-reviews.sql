-- =========================================================
-- Migration v7 - Public reviews system
--
-- Adds:
--   1. A `reviews` table with RLS
--   2. Public SECURITY DEFINER RPCs:
--      - public_submit_review   (anyone can submit, initial status = pending)
--      - public_get_reviews     (anyone can fetch published reviews for a pro)
--   3. Strict RLS so pros only see/manage their own reviews
--
-- Safe to re-run (CREATE OR REPLACE / IF NOT EXISTS).
-- =========================================================

-- ---------------------------------------------------------
-- 1. TABLE: reviews
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT NOT NULL CHECK (length(text) BETWEEN 10 AND 1000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews(user_id);
CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews(status);
CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON reviews(created_at DESC);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Pros can read all of their own reviews (any status)
DROP POLICY IF EXISTS "pro can read own reviews" ON reviews;
CREATE POLICY "pro can read own reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Pros can update status of their own reviews (moderation)
DROP POLICY IF EXISTS "pro can update own reviews" ON reviews;
CREATE POLICY "pro can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Pros can delete their own reviews
DROP POLICY IF EXISTS "pro can delete own reviews" ON reviews;
CREATE POLICY "pro can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- No direct INSERT policy — only via public_submit_review RPC

-- ---------------------------------------------------------
-- 2. PUBLIC RPC: submit review
-- ---------------------------------------------------------
-- Anyone can submit a review for a pro identified by booking_slug.
-- Reviews are saved with status='pending'. Pro moderates from their dashboard.
CREATE OR REPLACE FUNCTION public_submit_review(
  p_slug TEXT,
  p_author_name TEXT,
  p_author_email TEXT,
  p_rating INTEGER,
  p_text TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_clean_name TEXT;
  v_clean_text TEXT;
BEGIN
  -- Validate rating
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RETURN jsonb_build_object('error', 'invalid_rating');
  END IF;

  -- Validate and trim text
  v_clean_text := trim(coalesce(p_text, ''));
  IF length(v_clean_text) < 10 THEN
    RETURN jsonb_build_object('error', 'text_too_short');
  END IF;
  IF length(v_clean_text) > 1000 THEN
    v_clean_text := substring(v_clean_text FROM 1 FOR 1000);
  END IF;

  -- Validate author name
  v_clean_name := trim(coalesce(p_author_name, ''));
  IF length(v_clean_name) < 2 THEN
    RETURN jsonb_build_object('error', 'name_too_short');
  END IF;
  IF length(v_clean_name) > 80 THEN
    v_clean_name := substring(v_clean_name FROM 1 FOR 80);
  END IF;

  -- Resolve pro by slug
  SELECT id INTO v_user_id
  FROM user_profiles
  WHERE booking_slug = p_slug
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  INSERT INTO reviews (user_id, author_name, author_email, rating, text, status)
  VALUES (v_user_id, v_clean_name, nullif(trim(coalesce(p_author_email, '')), ''), p_rating, v_clean_text, 'pending');

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public_submit_review(TEXT, TEXT, TEXT, INTEGER, TEXT) TO anon, authenticated;

-- ---------------------------------------------------------
-- 3. PUBLIC RPC: fetch published reviews
-- ---------------------------------------------------------
-- Anyone can fetch the published reviews for a pro by slug.
-- Pending/hidden reviews are never returned from this function.
CREATE OR REPLACE FUNCTION public_get_reviews(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_reviews JSONB;
BEGIN
  SELECT id INTO v_user_id
  FROM user_profiles
  WHERE booking_slug = p_slug
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('reviews', '[]'::jsonb, 'count', 0, 'average', 0);
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'author', r.author_name,
        'rating', r.rating,
        'text', r.text,
        'created_at', r.created_at
      )
      ORDER BY r.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_reviews
  FROM reviews r
  WHERE r.user_id = v_user_id AND r.status = 'published'
  LIMIT 50;

  RETURN jsonb_build_object(
    'reviews', v_reviews,
    'count', (SELECT count(*) FROM reviews WHERE user_id = v_user_id AND status = 'published'),
    'average', (SELECT COALESCE(round(avg(rating)::numeric, 1), 0) FROM reviews WHERE user_id = v_user_id AND status = 'published')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public_get_reviews(TEXT) TO anon, authenticated;
