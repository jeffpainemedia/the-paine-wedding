-- Harden guest/plus-one integrity at the database level.
-- This cleans up legacy contradictions first, then adds guardrails so they
-- cannot silently reappear through partial writes or future regressions.

-- Remove duplicate plus-one rows per sponsoring guest, preferring claimed rows
-- and then the most recently updated row.
WITH ranked_plus_ones AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY plus_one_for_id
      ORDER BY plus_one_claimed DESC, updated_at DESC NULLS LAST, created_at DESC, id
    ) AS row_number
  FROM public.guests
  WHERE is_plus_one = true
    AND plus_one_for_id IS NOT NULL
)
DELETE FROM public.guests AS guests
USING ranked_plus_ones
WHERE guests.id = ranked_plus_ones.id
  AND ranked_plus_ones.row_number > 1;

-- Remove orphaned placeholder plus-one rows that are no longer linked to a
-- sponsoring guest.
DELETE FROM public.guests
WHERE is_plus_one = true
  AND plus_one_for_id IS NULL
  AND COALESCE(plus_one_claimed, false) = false
  AND lower(COALESCE(first_name, '')) = 'plus'
  AND lower(COALESCE(last_name, '')) = 'one';

-- If any named/claimed plus-one rows somehow lost their sponsor link, convert
-- them back into normal guests instead of dropping data.
UPDATE public.guests
SET
  is_plus_one = false,
  plus_one_claimed = false
WHERE is_plus_one = true
  AND plus_one_for_id IS NULL;

-- Normalize contradictory primary/plus-one field combinations.
UPDATE public.guests
SET
  plus_one_for_id = NULL,
  plus_one_claimed = false
WHERE is_plus_one = false
  AND (plus_one_for_id IS NOT NULL OR plus_one_claimed = true);

UPDATE public.guests
SET
  plus_one_allowed = false,
  plus_one_name = NULL
WHERE is_plus_one = true
  AND (
    COALESCE(plus_one_allowed, false) = true
    OR plus_one_name IS NOT NULL
  );

CREATE UNIQUE INDEX IF NOT EXISTS guests_one_plus_one_per_primary_idx
  ON public.guests (plus_one_for_id)
  WHERE is_plus_one = true
    AND plus_one_for_id IS NOT NULL;

ALTER TABLE public.guests
  DROP CONSTRAINT IF EXISTS guests_plus_one_role_consistency;

ALTER TABLE public.guests
  ADD CONSTRAINT guests_plus_one_role_consistency
  CHECK (
    (
      is_plus_one = true
      AND plus_one_for_id IS NOT NULL
      AND COALESCE(plus_one_allowed, false) = false
      AND plus_one_name IS NULL
    )
    OR (
      is_plus_one = false
      AND plus_one_for_id IS NULL
      AND COALESCE(plus_one_claimed, false) = false
    )
  );

ALTER TABLE public.guests
  DROP CONSTRAINT IF EXISTS guests_plus_one_not_self;

ALTER TABLE public.guests
  ADD CONSTRAINT guests_plus_one_not_self
  CHECK (plus_one_for_id IS NULL OR plus_one_for_id <> id);
