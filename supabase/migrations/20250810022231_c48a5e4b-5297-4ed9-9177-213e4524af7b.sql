-- Fix infinite recursion by removing cross-table references to reports inside RLS policies
-- 1) Helper functions with SECURITY DEFINER to bypass RLS safely
CREATE OR REPLACE FUNCTION public.admin_can_view_population(_user_id uuid, _population_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin a
    JOIN public.reports r ON r.assigned_admin_id = a.id
    WHERE a.supabase_user_id = _user_id
      AND r.population_id = _population_id
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_assigned_to_report(_user_id uuid, _report_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin a
    JOIN public.reports r ON r.assigned_admin_id = a.id
    WHERE a.supabase_user_id = _user_id
      AND r.id = _report_id
  );
$$;

-- 2) Recreate population SELECT policy without direct reference to reports
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'population' AND policyname = 'population_select_policy'
  ) THEN
    DROP POLICY "population_select_policy" ON public.population;
  END IF;
END$$;

CREATE POLICY "population_select_policy"
ON public.population
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND (
    (supabase_user_id = auth.uid())
    OR (EXISTS (SELECT 1 FROM public.superadmin WHERE superadmin.supabase_user_id = auth.uid()))
    OR public.admin_can_view_population(auth.uid(), id)
  )
);

-- 3) Recreate notifications SELECT policy avoiding direct join to reports
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'notifications_select_policy'
  ) THEN
    DROP POLICY "notifications_select_policy" ON public.notifications;
  END IF;
END$$;

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
    OR public.admin_assigned_to_report(auth.uid(), notifications.report_id)
  )
);