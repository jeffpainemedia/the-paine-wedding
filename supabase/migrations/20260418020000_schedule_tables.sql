-- ─────────────────────────────────────────────────────────────
-- Day-of Schedule: tables + baseline tier seed
-- Run in Supabase SQL Editor (requires pgcrypto, enabled by default)
-- ─────────────────────────────────────────────────────────────

-- Tiers (public | bridal-party | vip | any future tiers)
CREATE TABLE IF NOT EXISTS public.schedule_tiers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  label       text NOT NULL,
  sort_order  int  NOT NULL DEFAULT 0,
  is_public   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Events
CREATE TABLE IF NOT EXISTS public.schedule_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date  date NOT NULL DEFAULT '2026-09-26',
  start_time  time NOT NULL,
  end_time    time,
  title       text NOT NULL,
  location    text,
  notes       text,
  sort_order  int  NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Junction: which tiers can see each event
CREATE TABLE IF NOT EXISTS public.schedule_event_visibility (
  event_id  uuid NOT NULL REFERENCES public.schedule_events(id) ON DELETE CASCADE,
  tier_id   uuid NOT NULL REFERENCES public.schedule_tiers(id)  ON DELETE CASCADE,
  PRIMARY KEY (event_id, tier_id)
);

-- Accounts (individual logins; links back to game_players if email matches)
CREATE TABLE IF NOT EXISTS public.schedule_users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username          text NOT NULL UNIQUE,
  display_name      text NOT NULL,
  email             text,
  password_hash     text NOT NULL,
  tier_id           uuid NOT NULL REFERENCES public.schedule_tiers(id),
  role_label        text NOT NULL DEFAULT '',
  game_player_id    uuid REFERENCES public.game_players(id) ON DELETE SET NULL,
  last_login_at     timestamptz,
  login_count       int NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Full session audit log
CREATE TABLE IF NOT EXISTS public.schedule_sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES public.schedule_users(id) ON DELETE SET NULL,
  username_snapshot text NOT NULL,
  tier_snapshot     text NOT NULL,
  logged_in_at      timestamptz NOT NULL DEFAULT now(),
  ip                text,
  user_agent        text,
  country           text
);

-- Indexes
CREATE INDEX IF NOT EXISTS schedule_sessions_user_idx    ON public.schedule_sessions(user_id);
CREATE INDEX IF NOT EXISTS schedule_sessions_time_idx    ON public.schedule_sessions(logged_in_at DESC);
CREATE INDEX IF NOT EXISTS schedule_events_date_time_idx ON public.schedule_events(event_date, start_time, sort_order);
CREATE INDEX IF NOT EXISTS schedule_users_email_idx      ON public.schedule_users(email) WHERE email IS NOT NULL;

-- Seed baseline tiers
INSERT INTO public.schedule_tiers (slug, label, sort_order, is_public) VALUES
  ('public',        'Public',        0,  true),
  ('bridal-party',  'Bridal Party',  10, false),
  ('vip',           'Full Schedule', 20, false)
ON CONFLICT (slug) DO NOTHING;
