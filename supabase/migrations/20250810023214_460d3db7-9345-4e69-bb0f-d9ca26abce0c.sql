-- Resolve dependencies before dropping admin table

-- 1) Drop policies that reference admin table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'messagerie' AND policyname = 'messagerie_select_policy'
  ) THEN
    DROP POLICY "messagerie_select_policy" ON public.messagerie;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'organization_logs' AND policyname = 'organization_logs_select_policy'
  ) THEN
    DROP POLICY "organization_logs_select_policy" ON public.organization_logs;
  END IF;
END$$;

-- 2) Recreate policies without any reference to admin
CREATE POLICY messagerie_select_policy
ON public.messagerie
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND (
    ((sender_id)::text = (auth.uid())::text)
    OR ((recipient_id)::text = (auth.uid())::text)
    OR (EXISTS ( SELECT 1 FROM public.superadmin WHERE superadmin.supabase_user_id = auth.uid()))
  )
);

CREATE POLICY organization_logs_select_policy
ON public.organization_logs
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND (
    (EXISTS ( SELECT 1 FROM public.superadmin WHERE superadmin.supabase_user_id = auth.uid()))
  )
);

-- 3) Drop foreign key constraints that depend on admin table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema='public' AND table_name='reports' AND constraint_name='reports_assigned_admin_id_fkey'
  ) THEN
    ALTER TABLE public.reports DROP CONSTRAINT reports_assigned_admin_id_fkey;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema='public' AND table_name='admin_logs' AND constraint_name='admin_logs_admin_id_fkey'
  ) THEN
    ALTER TABLE public.admin_logs DROP CONSTRAINT admin_logs_admin_id_fkey;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema='public' AND table_name='report_assignments' AND constraint_name='report_assignments_admin_id_fkey'
  ) THEN
    ALTER TABLE public.report_assignments DROP CONSTRAINT report_assignments_admin_id_fkey;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema='public' AND table_name='report_assignments' AND constraint_name='report_assignments_assigned_by_fkey'
  ) THEN
    ALTER TABLE public.report_assignments DROP CONSTRAINT report_assignments_assigned_by_fkey;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema='public' AND table_name='system_settings' AND constraint_name='system_settings_updated_by_fkey'
  ) THEN
    ALTER TABLE public.system_settings DROP CONSTRAINT system_settings_updated_by_fkey;
  END IF;
END$$;

-- 4) Now drop admin table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'admin'
  ) THEN
    DROP TABLE public.admin;
  END IF;
END$$;