ALTER TABLE public.rsvp_history
  ADD COLUMN IF NOT EXISTS notification_sent_at timestamptz;

COMMENT ON COLUMN public.rsvp_history.notification_sent_at IS 'When this history row was already included in an outgoing email notification or digest.';
