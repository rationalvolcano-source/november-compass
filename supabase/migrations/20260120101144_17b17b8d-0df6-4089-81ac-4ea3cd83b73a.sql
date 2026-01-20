-- Create enum for user plans
CREATE TYPE public.user_plan AS ENUM ('free', 'pro');

-- Create draft_items table (RSS-fetched raw news items)
CREATE TABLE public.draft_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  section TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  source TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  snippet TEXT,
  hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for draft_items
CREATE INDEX idx_draft_items_lookup ON public.draft_items (year, month, section, category);
CREATE INDEX idx_draft_items_created ON public.draft_items (created_at DESC);

-- Enable RLS on draft_items
ALTER TABLE public.draft_items ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read draft items
CREATE POLICY "Authenticated users can read draft items"
ON public.draft_items FOR SELECT
TO authenticated
USING (true);

-- Create enriched_items table (LLM outputs)
CREATE TABLE public.enriched_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL UNIQUE REFERENCES public.draft_items(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  exam_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  mcqs JSONB,
  model TEXT NOT NULL,
  prompt_version INTEGER NOT NULL DEFAULT 1,
  token_cost_est NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for enriched_items
CREATE INDEX idx_enriched_items_draft ON public.enriched_items (draft_id);

-- Enable RLS on enriched_items
ALTER TABLE public.enriched_items ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read enriched items
CREATE POLICY "Authenticated users can read enriched items"
ON public.enriched_items FOR SELECT
TO authenticated
USING (true);

-- Create entitlements table (paywall eligibility)
CREATE TABLE public.entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan user_plan NOT NULL DEFAULT 'free',
  export_enabled BOOLEAN NOT NULL DEFAULT false,
  enrich_quota_daily INTEGER NOT NULL DEFAULT 10,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_to TIMESTAMPTZ,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for entitlements
CREATE INDEX idx_entitlements_user ON public.entitlements (user_id);
CREATE INDEX idx_entitlements_validity ON public.entitlements (valid_from, valid_to);

-- Enable RLS on entitlements
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

-- Users can only read their own entitlements
CREATE POLICY "Users can read own entitlements"
ON public.entitlements FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create usage_daily table (rate limiting)
CREATE TABLE public.usage_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  draft_fetch_count INTEGER NOT NULL DEFAULT 0,
  enrich_count INTEGER NOT NULL DEFAULT 0,
  export_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, date)
);

-- Create indexes for usage_daily
CREATE INDEX idx_usage_daily_user_date ON public.usage_daily (user_id, date);

-- Enable RLS on usage_daily
ALTER TABLE public.usage_daily ENABLE ROW LEVEL SECURITY;

-- Users can only read their own usage
CREATE POLICY "Users can read own usage"
ON public.usage_daily FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create function to get or create today's usage record
CREATE OR REPLACE FUNCTION public.get_or_create_daily_usage(p_user_id UUID)
RETURNS public.usage_daily
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage public.usage_daily;
BEGIN
  SELECT * INTO v_usage
  FROM public.usage_daily
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  IF NOT FOUND THEN
    INSERT INTO public.usage_daily (user_id, date)
    VALUES (p_user_id, CURRENT_DATE)
    RETURNING * INTO v_usage;
  END IF;
  
  RETURN v_usage;
END;
$$;

-- Create function to increment usage counter
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id UUID,
  p_field TEXT,
  p_amount INTEGER DEFAULT 1
)
RETURNS public.usage_daily
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage public.usage_daily;
BEGIN
  -- Ensure record exists
  PERFORM public.get_or_create_daily_usage(p_user_id);
  
  -- Update the appropriate field
  EXECUTE format(
    'UPDATE public.usage_daily SET %I = %I + $1 WHERE user_id = $2 AND date = CURRENT_DATE RETURNING *',
    p_field, p_field
  ) INTO v_usage USING p_amount, p_user_id;
  
  RETURN v_usage;
END;
$$;

-- Create function to get user entitlement (with fallback to free)
CREATE OR REPLACE FUNCTION public.get_user_entitlement(p_user_id UUID)
RETURNS TABLE (
  plan user_plan,
  export_enabled BOOLEAN,
  enrich_quota_daily INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT e.plan, e.export_enabled, e.enrich_quota_daily
  FROM public.entitlements e
  WHERE e.user_id = p_user_id
    AND e.valid_from <= now()
    AND (e.valid_to IS NULL OR e.valid_to > now())
  ORDER BY e.created_at DESC
  LIMIT 1;
  
  -- If no entitlement found, return free defaults
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'free'::user_plan, false, 10;
  END IF;
END;
$$;