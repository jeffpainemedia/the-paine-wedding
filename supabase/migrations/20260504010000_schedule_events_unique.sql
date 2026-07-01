-- Prevent duplicate schedule events from being seeded twice.
-- A given title at a given time on a given date should only appear once.
ALTER TABLE public.schedule_events
  ADD CONSTRAINT schedule_events_title_time_date_unique
  UNIQUE (event_date, start_time, title);
