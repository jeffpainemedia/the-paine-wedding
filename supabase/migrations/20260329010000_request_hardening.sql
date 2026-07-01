CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  key text PRIMARY KEY,
  bucket text NOT NULL,
  identifier text NOT NULL,
  window_started_at timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS api_rate_limits_bucket_identifier_idx
  ON public.api_rate_limits(bucket, identifier);

CREATE INDEX IF NOT EXISTS api_rate_limits_expires_at_idx
  ON public.api_rate_limits(expires_at);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS api_rate_limits_service_role_all ON public.api_rate_limits;
CREATE POLICY api_rate_limits_service_role_all
  ON public.api_rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_bucket text,
  p_identifier text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS TABLE (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer,
  count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_window_started_at timestamptz;
  v_key text;
  v_row public.api_rate_limits%ROWTYPE;
BEGIN
  IF p_limit <= 0 OR p_window_seconds <= 0 THEN
    RAISE EXCEPTION 'Invalid rate limit configuration';
  END IF;

  v_window_started_at := to_timestamp(
    floor(extract(epoch FROM v_now) / p_window_seconds) * p_window_seconds
  );
  v_key := concat(
    p_bucket,
    ':',
    p_identifier,
    ':',
    floor(extract(epoch FROM v_window_started_at))
  );

  DELETE FROM public.api_rate_limits
  WHERE expires_at < v_now;

  INSERT INTO public.api_rate_limits AS rl (
    key,
    bucket,
    identifier,
    window_started_at,
    count,
    expires_at
  )
  VALUES (
    v_key,
    p_bucket,
    p_identifier,
    v_window_started_at,
    1,
    v_window_started_at + make_interval(secs => p_window_seconds)
  )
  ON CONFLICT (key) DO UPDATE
    SET count = rl.count + 1,
        updated_at = now()
  RETURNING rl.* INTO v_row;

  allowed := v_row.count <= p_limit;
  remaining := GREATEST(p_limit - v_row.count, 0);
  retry_after_seconds := GREATEST(
    CEIL(EXTRACT(epoch FROM (v_row.expires_at - v_now)))::integer,
    0
  );
  count := v_row.count;

  RETURN NEXT;
END;
$$;

COMMENT ON TABLE public.api_rate_limits IS 'Server-side request rate limiting buckets keyed by endpoint and requester identity.';
COMMENT ON FUNCTION public.consume_rate_limit(text, text, integer, integer) IS 'Consumes one request from a fixed-window rate limiter and returns whether the request is allowed.';

ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.households
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS guests_updated_at ON public.guests;
CREATE TRIGGER guests_updated_at
  BEFORE UPDATE ON public.guests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS households_updated_at ON public.households;
CREATE TRIGGER households_updated_at
  BEFORE UPDATE ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
