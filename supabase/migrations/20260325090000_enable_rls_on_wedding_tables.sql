ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvp_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_households" ON public.households;
CREATE POLICY "service_role_all_households"
  ON public.households
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_guests" ON public.guests;
CREATE POLICY "service_role_all_guests"
  ON public.guests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_admin_logs" ON public.admin_logs;
CREATE POLICY "service_role_all_admin_logs"
  ON public.admin_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_game_scores" ON public.game_scores;
CREATE POLICY "service_role_all_game_scores"
  ON public.game_scores
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_game_players" ON public.game_players;
CREATE POLICY "service_role_all_game_players"
  ON public.game_players
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_rsvp_history" ON public.rsvp_history;
CREATE POLICY "service_role_all_rsvp_history"
  ON public.rsvp_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
