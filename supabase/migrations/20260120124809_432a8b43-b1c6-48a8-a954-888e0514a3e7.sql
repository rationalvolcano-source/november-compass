-- =============================================================================
-- NOVEMBER COMPASS V2 - Database Schema
-- =============================================================================

-- 1. CANDIDATES TABLE - Raw candidates from RSS/GDELT/Serper
CREATE TABLE IF NOT EXISTS public.candidates (
  id text PRIMARY KEY, -- hash of canonical_url OR hash(title+source+date)
  year integer NOT NULL,
  month integer NOT NULL,
  section text NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  url text,
  source text NOT NULL,
  snippet text,
  published_at timestamptz,
  provider text NOT NULL CHECK (provider IN ('rss', 'gdelt', 'serper')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for candidates
CREATE INDEX IF NOT EXISTS idx_candidates_lookup ON public.candidates(year, month, section, category);
CREATE INDEX IF NOT EXISTS idx_candidates_provider ON public.candidates(provider);

-- Enable RLS
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read candidates
CREATE POLICY "Authenticated users can read candidates"
  ON public.candidates
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. SELECTIONS TABLE - Cached Gemini rerank results
CREATE TABLE IF NOT EXISTS public.selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month integer NOT NULL,
  section text NOT NULL,
  category text NOT NULL,
  selected_ids jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of candidate IDs
  candidate_set_hash text NOT NULL, -- Hash of sorted candidate IDs used
  prompt_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, month, section, category, candidate_set_hash, prompt_version)
);

-- Indexes for selections
CREATE INDEX IF NOT EXISTS idx_selections_lookup ON public.selections(year, month, section, category);

-- Enable RLS
ALTER TABLE public.selections ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read selections
CREATE POLICY "Authenticated users can read selections"
  ON public.selections
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. PAYMENTS TABLE - Payment records for audit trail
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'razorpay',
  order_id text UNIQUE NOT NULL,
  payment_id text UNIQUE,
  signature text,
  amount integer NOT NULL, -- in paise
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'attempted', 'paid', 'failed', 'refunded')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own payments
CREATE POLICY "Users can read own payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Update entitlements table to add updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'entitlements' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.entitlements ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;