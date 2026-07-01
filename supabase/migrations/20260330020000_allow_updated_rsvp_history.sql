ALTER TABLE public.rsvp_history
  DROP CONSTRAINT IF EXISTS rsvp_history_event_type_check;

ALTER TABLE public.rsvp_history
  ADD CONSTRAINT rsvp_history_event_type_check
  CHECK (event_type IN ('submitted', 'viewed', 'updated'));

COMMENT ON COLUMN public.rsvp_history.event_type IS 'Kind of RSVP activity captured in this row: submitted, updated, or viewed.';
