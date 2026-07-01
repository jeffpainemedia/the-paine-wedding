ALTER TABLE public.rsvp_history
  ADD COLUMN IF NOT EXISTS change_summary text;

COMMENT ON COLUMN public.rsvp_history.change_summary IS 'Optional human-readable summary of what changed during an RSVP interaction, such as Added Plus One or Updated Song Request.';
