DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname
  INTO constraint_name
  FROM pg_constraint con
  INNER JOIN pg_class rel ON rel.oid = con.conrelid
  INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'game_scores'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%game IN%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.game_scores DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.game_scores
  DROP CONSTRAINT IF EXISTS game_scores_game_check;

ALTER TABLE public.game_scores
  ADD CONSTRAINT game_scores_game_check
  CHECK (game IN ('trivia', 'painedle', 'crossword'));
