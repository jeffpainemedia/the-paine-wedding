-- Lock down the schedule_* tables.
--
-- All schedule access happens through server-side API routes that use the
-- service role key (which bypasses RLS by design). Enabling RLS with no
-- policies means: anon-key callers get DENY on every operation, while our
-- server keeps full access. Closes the Supabase Security Advisor warning
-- about "RLS Disabled in Public" on these tables.

ALTER TABLE public.schedule_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_event_visibility  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_tiers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_sessions          ENABLE ROW LEVEL SECURITY;

-- Belt and suspenders: explicitly revoke anon access. RLS-on with no
-- policies already blocks reads/writes, but stripping table-level grants
-- prevents the anon role from even seeing the schema metadata.
REVOKE ALL ON public.schedule_events           FROM anon;
REVOKE ALL ON public.schedule_event_visibility FROM anon;
REVOKE ALL ON public.schedule_tiers            FROM anon;
REVOKE ALL ON public.schedule_users            FROM anon;
REVOKE ALL ON public.schedule_sessions         FROM anon;
