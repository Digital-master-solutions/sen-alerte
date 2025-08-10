-- Clean up remaining dependencies and drop admin/admin_sessions

-- 0) Ensure organizations policies no longer reference admin
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'organizations' AND policyname = 'organizations_admin_read'
  ) THEN
    DROP POLICY "organizations_admin_read" ON public.organizations;
  END IF;
END$$;

CREATE POLICY organizations_admin_read
ON public.organizations
FOR SELECT
USING (
  is_admin_or_superadmin(auth.uid()) OR (supabase_user_id = auth.uid())
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'organizations' AND policyname = 'organizations_update_policy'
  ) THEN
    DROP POLICY "organizations_update_policy" ON public.organizations;
  END IF;
END$$;

CREATE POLICY organizations_update_policy
ON public.organizations
FOR UPDATE
USING (
  (auth.uid() IS NOT NULL) AND (
    (EXISTS ( SELECT 1 FROM public.superadmin WHERE superadmin.supabase_user_id = auth.uid() )) OR 
    (supabase_user_id = auth.uid())
  )
);

-- 1) Drop admin_sessions table CASCADE to remove attached policies/constraints
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'admin_sessions'
  ) THEN
    DROP TABLE public.admin_sessions CASCADE;
  END IF;
END$$;

-- 2) Finally drop admin table CASCADE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'admin'
  ) THEN
    DROP TABLE public.admin CASCADE;
  END IF;
END$$;