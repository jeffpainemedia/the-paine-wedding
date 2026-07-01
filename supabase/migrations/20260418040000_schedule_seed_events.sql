-- ─────────────────────────────────────────────────────────────
-- Day-of Schedule: seed events
-- Run AFTER 20260418030000_schedule_seed_users.sql
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_public_id  uuid;
  v_bp_id      uuid;
  v_vip_id     uuid;

  -- event id vars
  e uuid;
BEGIN
  SELECT id INTO v_public_id FROM public.schedule_tiers WHERE slug = 'public';
  SELECT id INTO v_bp_id     FROM public.schedule_tiers WHERE slug = 'bridal-party';
  SELECT id INTO v_vip_id    FROM public.schedule_tiers WHERE slug = 'vip';

  -- Helper: insert event + attach tiers in one step
  -- We'll use a temporary function pattern inline

  -- ── MORNING ──────────────────────────────────────────────

  -- 11:00–11:30 Ceremony rehearsal → bridal-party, vip
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, notes, sort_order)
  VALUES ('2026-09-26','11:00','11:30','Ceremony rehearsal','Run twice. Confirm processional order, pacing, microphone placement, and recessional exit.',10)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_bp_id),(e, v_vip_id);

  -- 11:30 Bride hair and makeup begins → vip
  INSERT INTO public.schedule_events (event_date, start_time, title, sort_order)
  VALUES ('2026-09-26','11:30','Bride hair and makeup begins',20)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_vip_id);

  -- 11:30–2:45 Hair, makeup, getting dressed → bridal-party (grouped entry)
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, sort_order)
  VALUES ('2026-09-26','11:30','14:45','Hair, makeup, getting dressed, and getting-ready photos',21)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_bp_id);

  -- 12:45 Dress and accessories prepared → vip
  INSERT INTO public.schedule_events (event_date, start_time, title, sort_order)
  VALUES ('2026-09-26','12:45','Dress and accessories prepared',30)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_vip_id);

  -- 1:15 Detail photos → vip
  INSERT INTO public.schedule_events (event_date, start_time, title, notes, sort_order)
  VALUES ('2026-09-26','13:15','Detail photos captured','Rings, shoes, invitations, bouquet, dress.',40)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_vip_id);

  -- 1:45 Bride fully ready → vip
  INSERT INTO public.schedule_events (event_date, start_time, title, sort_order)
  VALUES ('2026-09-26','13:45','Bride fully ready',50)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_vip_id);

  -- 2:00–2:30 Bride getting-ready photos with bridesmaids → vip
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, sort_order)
  VALUES ('2026-09-26','14:00','14:30','Bride getting-ready photos with bridesmaids',60)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_vip_id);

  -- 2:15 Bridesmaids dressed → vip
  INSERT INTO public.schedule_events (event_date, start_time, title, sort_order)
  VALUES ('2026-09-26','14:15','Bridesmaids dressed',70)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_vip_id);

  -- 2:30 Final touch-ups → vip
  INSERT INTO public.schedule_events (event_date, start_time, title, notes, sort_order)
  VALUES ('2026-09-26','14:30','Final touch-ups and remaining detail coverage','Second photographer can continue candid coverage during this window.',80)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_vip_id);

  -- 2:45 Everyone photo-ready → vip
  INSERT INTO public.schedule_events (event_date, start_time, title, sort_order)
  VALUES ('2026-09-26','14:45','Everyone photo-ready',90)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_vip_id);

  -- ── AFTERNOON ────────────────────────────────────────────

  -- 3:00–3:35 Bride with bridesmaids portraits → bridal-party, vip
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, notes, sort_order)
  VALUES ('2026-09-26','15:00','15:35','Bride with bridesmaids portraits','Includes group photos and individual pairings.',100)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_bp_id),(e, v_vip_id);

  -- 3:35–3:45 Bride first look with father → bridal-party, vip
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, sort_order)
  VALUES ('2026-09-26','15:35','15:45','Bride first look with father',110)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_bp_id),(e, v_vip_id);

  -- 3:45–4:15 Groom with groomsmen portraits → bridal-party, vip
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, notes, sort_order)
  VALUES ('2026-09-26','15:45','16:15','Groom with groomsmen portraits','Taken at a separate location on the property.',120)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_bp_id),(e, v_vip_id);

  -- 4:15–4:25 First touch in reception hall → bridal-party, vip
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, notes, sort_order)
  VALUES ('2026-09-26','16:15','16:25','First touch in reception hall','Bride goes back upstairs until ceremony starts.',130)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_bp_id),(e, v_vip_id);

  -- 4:25–4:45 Bride hidden before ceremony → vip only
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, notes, sort_order)
  VALUES ('2026-09-26','16:25','16:45','Bride hidden before ceremony','Guests begin arriving at 4:30.',140)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_vip_id);

  -- 4:30–4:55 Guest arrival → public
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, notes, sort_order)
  VALUES ('2026-09-26','16:30','16:55','Guest arrival','Arrive, park, and find your seats before the ceremony begins.',150)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_public_id);

  -- ── CEREMONY ─────────────────────────────────────────────

  -- 5:00–5:45 Ceremony → all tiers
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, notes, sort_order)
  VALUES ('2026-09-26','17:00','17:45','Ceremony','Officiated by groom''s father.',160)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_public_id),(e, v_bp_id),(e, v_vip_id);

  -- ── COCKTAIL HOUR ─────────────────────────────────────────

  -- 5:45–7:00 Cocktail hour → public
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, sort_order)
  VALUES ('2026-09-26','17:45','19:00','Cocktail hour',170)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_public_id);

  -- 5:45–6:15 Family portraits → bridal-party
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, notes, sort_order)
  VALUES ('2026-09-26','17:45','18:15','Family portraits','Other guests head to cocktail hour.',171)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_bp_id);

  -- 5:50–6:15 Family portraits → vip (detailed)
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, sort_order)
  VALUES ('2026-09-26','17:50','18:15','Family portraits',172)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_vip_id);

  -- 6:15–6:30 Full bridal party portraits → bridal-party, vip
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, notes, sort_order)
  VALUES ('2026-09-26','18:15','18:30','Full bridal party portraits','Family goes to cocktail hour.',180)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_bp_id),(e, v_vip_id);

  -- 6:30–7:00 Couple portraits → vip
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, sort_order)
  VALUES ('2026-09-26','18:30','19:00','Couple portraits',190)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_vip_id);

  -- 6:30–7:00 Bridal party joins cocktail hour → bridal-party
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, sort_order)
  VALUES ('2026-09-26','18:30','19:00','Bridal party joins cocktail hour',191)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_bp_id);

  -- ── RECEPTION ─────────────────────────────────────────────

  -- 7:00–7:15 Reception entrance and first dances → public
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, sort_order)
  VALUES ('2026-09-26','19:00','19:15','Reception entrance and first dances',200)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_public_id);

  -- 7:00–7:05 Grand entrance → bridal-party, vip
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, sort_order)
  VALUES ('2026-09-26','19:00','19:05','Reception grand entrance',201)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_bp_id),(e, v_vip_id);

  -- 7:05–7:15 First dances → bridal-party, vip
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, notes, sort_order)
  VALUES ('2026-09-26','19:05','19:15','First dances','Couple first dance · Father–daughter dance · Mother–son dance.',210)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_bp_id),(e, v_vip_id);

  -- 7:15 Dinner prayer → vip
  INSERT INTO public.schedule_events (event_date, start_time, title, notes, sort_order)
  VALUES ('2026-09-26','19:15','Dinner prayer','Led by groom''s father. Guests released to buffet immediately after. Bride, groom, parents, best man, and maid of honor begin eating right away so toasts start on schedule.',220)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_vip_id);

  -- 7:15–8:00 Dinner → public, bridal-party
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, sort_order)
  VALUES ('2026-09-26','19:15','20:00','Dinner',230)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_public_id),(e, v_bp_id);

  -- 7:15–8:00 Dinner service → vip
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, notes, sort_order)
  VALUES ('2026-09-26','19:15','20:00','Dinner service (Cane Rosso buffet)','Pizzas served continuously from buffet stations and refreshed throughout service.',231)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_vip_id);

  -- 7:30–8:00 Toasts → all tiers
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, notes, sort_order)
  VALUES ('2026-09-26','19:30','20:00','Toasts','Speaker order: Best man · Maid of honor · Bride''s parents · Groom''s parents.',240)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_public_id),(e, v_bp_id),(e, v_vip_id);

  -- 8:00–8:15 Cake cutting → all tiers
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, sort_order)
  VALUES ('2026-09-26','20:00','20:15','Cake cutting and cake service',250)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_public_id),(e, v_bp_id),(e, v_vip_id);

  -- 8:15–8:20 Group photo → bridal-party, vip
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, notes, sort_order)
  VALUES ('2026-09-26','20:15','20:20','Full-guest group photo on dance floor','Immediately followed by open dancing.',260)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_bp_id),(e, v_vip_id);

  -- ── DANCING & SEND-OFF ────────────────────────────────────

  -- 8:20–9:50 Dancing → public
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, sort_order)
  VALUES ('2026-09-26','20:20','21:50','Dancing',270)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_public_id);

  -- 8:20–9:50 Open dancing → bridal-party, vip
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, sort_order)
  VALUES ('2026-09-26','20:20','21:50','Open dancing',271)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_bp_id),(e, v_vip_id);

  -- 9:50–10:00 Line up for send-off → public
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, sort_order)
  VALUES ('2026-09-26','21:50','22:00','Line up for send-off',280)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_public_id);

  -- 9:50–10:00 Private last dance → bridal-party, vip
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, notes, sort_order)
  VALUES ('2026-09-26','21:50','22:00','Private last dance','Guests line up for send-off during this time.',281)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_bp_id),(e, v_vip_id);

  -- 10:00 Send-off → all tiers
  INSERT INTO public.schedule_events (event_date, start_time, title, sort_order)
  VALUES ('2026-09-26','22:00','Send-off',290)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_public_id),(e, v_bp_id),(e, v_vip_id);

  -- 10:00–11:00 Cleanup → public, bridal-party
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, notes, sort_order)
  VALUES ('2026-09-26','22:00','23:00','Cleanup and leave','Time to collect personal items before venue exit.',300)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_public_id),(e, v_bp_id);

  -- 10:00–11:00 Vendor breakdown → vip
  INSERT INTO public.schedule_events (event_date, start_time, end_time, title, notes, sort_order)
  VALUES ('2026-09-26','22:00','23:00','Cleanup and vendor breakdown window','Time reserved for collecting personal décor, gifts, signage, and remaining items before venue exit.',301)
  RETURNING id INTO e;
  INSERT INTO public.schedule_event_visibility VALUES (e, v_vip_id);

END $$;
