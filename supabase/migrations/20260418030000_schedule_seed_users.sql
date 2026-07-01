-- ─────────────────────────────────────────────────────────────
-- Day-of Schedule: seed users
-- Passwords use pgcrypto bcrypt (cost 10) — compatible with bcryptjs
-- Run AFTER 20260418020000_schedule_tables.sql
-- ─────────────────────────────────────────────────────────────

-- Helper: get tier ids
DO $$
DECLARE
  v_public_id       uuid;
  v_bridal_party_id uuid;
  v_vip_id          uuid;
BEGIN
  SELECT id INTO v_public_id       FROM public.schedule_tiers WHERE slug = 'public';
  SELECT id INTO v_bridal_party_id FROM public.schedule_tiers WHERE slug = 'bridal-party';
  SELECT id INTO v_vip_id          FROM public.schedule_tiers WHERE slug = 'vip';

  -- ── VIP (Full Schedule) ───────────────────────────────────
  INSERT INTO public.schedule_users (username, display_name, role_label, tier_id, password_hash)
  VALUES
    ('ashlyn',   'Ashlyn Bimmerle',   'Bride',              v_vip_id, crypt('coral-ridge-28',   gen_salt('bf', 10))),
    ('jeff',     'Jeff Paine',        'Groom',              v_vip_id, crypt('cedar-stone-74',   gen_salt('bf', 10))),
    ('jennifer', 'Jennifer Paine',    'Mother of the Groom',v_vip_id, crypt('amber-grove-15',   gen_salt('bf', 10))),
    ('katie',    'Katie Bimmerle',    'Mother of the Bride',v_vip_id, crypt('linen-creek-63',   gen_salt('bf', 10))),
    ('carly',    'Carly Stevenson',   'Wedding Coordinator',v_vip_id, crypt('willow-bay-42',    gen_salt('bf', 10)))
  ON CONFLICT (username) DO NOTHING;

  -- ── Bridal Party ─────────────────────────────────────────
  INSERT INTO public.schedule_users (username, display_name, role_label, tier_id, password_hash)
  VALUES
    ('paige',   'Paige Bimmerle',    'Maid of Honor', v_bridal_party_id, crypt('rustic-dawn-89',  gen_salt('bf', 10))),
    ('shelby',  'Shelby Gerner',     'Bridesmaid',    v_bridal_party_id, crypt('golden-lane-37',  gen_salt('bf', 10))),
    ('izzy',    'Izzy May',          'Bridesmaid',    v_bridal_party_id, crypt('pearl-moss-56',   gen_salt('bf', 10))),
    ('alondra', 'Alondra Santillan', 'Bridesmaid',    v_bridal_party_id, crypt('sunset-fern-21',  gen_salt('bf', 10))),
    ('megan',   'Megan Groezinger',  'Bridesmaid',    v_bridal_party_id, crypt('birch-tide-94',   gen_salt('bf', 10))),
    ('brynn',   'Brynn Wilson',      'Bridesmaid',    v_bridal_party_id, crypt('ivory-bloom-48',  gen_salt('bf', 10))),
    ('emma',    'Emma Wilson',       'Bridesmaid',    v_bridal_party_id, crypt('sage-cove-73',    gen_salt('bf', 10))),
    ('john',    'John Paine',        'Best Man',      v_bridal_party_id, crypt('copper-hill-16',  gen_salt('bf', 10))),
    ('hudson',  'Hudson Boyd',       'Groomsman',     v_bridal_party_id, crypt('navy-pine-85',    gen_salt('bf', 10))),
    ('roman',   'Roman Richichi',    'Groomsman',     v_bridal_party_id, crypt('olive-bend-32',   gen_salt('bf', 10))),
    ('justin',  'Justin Luurtsema',  'Groomsman',     v_bridal_party_id, crypt('misty-oak-67',    gen_salt('bf', 10))),
    ('duncan',  'Duncan Marshall',   'Groomsman',     v_bridal_party_id, crypt('ember-crest-41',  gen_salt('bf', 10))),
    ('collin',  'Collin Groezinger', 'Groomsman',     v_bridal_party_id, crypt('sienna-run-78',   gen_salt('bf', 10))),
    ('blake',   'Blake Bimmerle',    'Groomsman',     v_bridal_party_id, crypt('cedar-arch-59',   gen_salt('bf', 10)))
  ON CONFLICT (username) DO NOTHING;

  -- ── Link to existing game_players by username match ───────
  -- (case-insensitive display_name ↔ username match)
  UPDATE public.schedule_users su
  SET
    game_player_id = gp.id,
    email          = gp.email,
    updated_at     = now()
  FROM public.game_players gp
  WHERE su.game_player_id IS NULL
    AND lower(trim(gp.username)) = lower(trim(su.display_name));

END $$;
