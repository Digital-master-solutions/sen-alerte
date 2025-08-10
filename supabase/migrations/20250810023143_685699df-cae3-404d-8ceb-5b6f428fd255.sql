-- Fix order: drop dependent policies first, then drop functions, then recreate policies and drop tables

-- A) Update role function to only consider superadmin
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.superadmin 
    WHERE supabase_user_id = _user_id AND status = 'active'
  );
$$;

-- B) Drop policies that reference admin_* helper functions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'population' AND policyname = 'population_select_policy'
  ) THEN
    DROP POLICY "population_select_policy" ON public.population;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'notifications_select_policy'
  ) THEN
    DROP POLICY "notifications_select_policy" ON public.notifications;
  END IF;
END$$;

-- C) Now drop helper functions that relied on admin table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'admin_can_view_population'
  ) THEN
    DROP FUNCTION public.admin_can_view_population(uuid, uuid);
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'admin_assigned_to_report'
  ) THEN
    DROP FUNCTION public.admin_assigned_to_report(uuid, uuid);
  END IF;
END$$;

-- D) Recreate policies without those functions
CREATE POLICY "population_select_policy"
ON public.population
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND (
    (supabase_user_id = auth.uid())
    OR (EXISTS ( SELECT 1 FROM public.superadmin WHERE superadmin.supabase_user_id = auth.uid() ))
  )
);

CREATE POLICY "notifications_select_policy"
ON public.notifications
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND (
    EXISTS (
      SELECT 1 FROM public.population p
      WHERE p.supabase_user_id = auth.uid()
        AND p.id = notifications.population_id
    )
    OR EXISTS (
      SELECT 1 FROM public.superadmin s WHERE s.supabase_user_id = auth.uid()
    )
  )
);

-- E) Update organizations policies to remove admin-based access paths
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

-- F) Drop admin_sessions (depends on admin), then drop admin table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'admin_sessions'
  ) THEN
    DROP TABLE public.admin_sessions;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'admin'
  ) THEN
    DROP TABLE public.admin;
  END IF;
END$$;