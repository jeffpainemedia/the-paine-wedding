-- Resolves remaining Supabase Security Advisor warnings:
-- 1. SECURITY DEFINER function callable by anon / authenticated
-- 2. site-images bucket has a broad SELECT policy enabling listing
--
-- Neither change is functional for our app:
--   • consume_rate_limit is only invoked via the service-role client
--     (see src/lib/server/request-security.ts → getServiceClient()).
--   • site-images access happens via getPublicUrl() (public-bucket URL
--     fetch, bypasses RLS entirely) and via service-role uploads
--     (see src/app/api/admin/upload-image/route.ts).

-- ── 1. Rate-limit function: lock to service role ─────────────────────────
REVOKE EXECUTE ON FUNCTION public.consume_rate_limit(text, text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.consume_rate_limit(text, text, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.consume_rate_limit(text, text, integer, integer) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.consume_rate_limit(text, text, integer, integer) TO service_role;

-- ── 2. site-images bucket: drop broad listing policies ───────────────────
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND cmd        = 'SELECT'
      AND qual ILIKE '%site-images%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;
