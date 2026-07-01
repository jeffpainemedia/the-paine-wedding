ALTER TABLE public.rsvp_history
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS actor_guest_id uuid REFERENCES public.guests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS event_group_id uuid;

UPDATE public.rsvp_history
SET event_type = 'submitted'
WHERE event_type IS NULL;

WITH grouped AS (
  SELECT
    household_id,
    recorded_at,
    attending,
    COALESCE(food_allergies, '') AS food_allergies,
    COALESCE(song_request, '') AS song_request,
    COALESCE(advice, '') AS advice,
    MIN(id::text)::uuid AS group_id,
    MIN(guest_id::text)::uuid AS actor_id
  FROM public.rsvp_history
  GROUP BY
    household_id,
    recorded_at,
    attending,
    COALESCE(food_allergies, ''),
    COALESCE(song_request, ''),
    COALESCE(advice, '')
)
UPDATE public.rsvp_history AS history
SET
  event_group_id = grouped.group_id,
  actor_guest_id = COALESCE(history.actor_guest_id, grouped.actor_id)
FROM grouped
WHERE history.event_group_id IS NULL
  AND history.household_id IS NOT DISTINCT FROM grouped.household_id
  AND history.recorded_at = grouped.recorded_at
  AND history.attending IS NOT DISTINCT FROM grouped.attending
  AND COALESCE(history.food_allergies, '') = grouped.food_allergies
  AND COALESCE(history.song_request, '') = grouped.song_request
  AND COALESCE(history.advice, '') = grouped.advice;

UPDATE public.rsvp_history
SET event_group_id = id
WHERE event_group_id IS NULL;

ALTER TABLE public.rsvp_history
  ALTER COLUMN event_type SET DEFAULT 'submitted',
  ALTER COLUMN event_type SET NOT NULL,
  ALTER COLUMN event_group_id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN event_group_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS rsvp_history_event_group_id_idx
  ON public.rsvp_history(event_group_id);

CREATE INDEX IF NOT EXISTS rsvp_history_actor_guest_id_idx
  ON public.rsvp_history(actor_guest_id);

CREATE INDEX IF NOT EXISTS rsvp_history_event_type_idx
  ON public.rsvp_history(event_type);

ALTER TABLE public.rsvp_history
  DROP CONSTRAINT IF EXISTS rsvp_history_event_type_check;

ALTER TABLE public.rsvp_history
  ADD CONSTRAINT rsvp_history_event_type_check
  CHECK (event_type IN ('submitted', 'viewed'));

COMMENT ON COLUMN public.rsvp_history.event_type IS 'Kind of RSVP activity captured in this row: submitted or viewed.';
COMMENT ON COLUMN public.rsvp_history.actor_guest_id IS 'The matched guest who initiated the RSVP session for this event, when known.';
COMMENT ON COLUMN public.rsvp_history.event_group_id IS 'Shared identifier used to group all per-guest rows created by the same RSVP interaction.';
