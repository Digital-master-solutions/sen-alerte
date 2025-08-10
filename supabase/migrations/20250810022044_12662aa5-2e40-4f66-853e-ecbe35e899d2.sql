-- Fix RLS: allow public read of approved & active organizations
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'organizations' AND policyname = 'organizations_select_policy'
  ) THEN
    DROP POLICY "organizations_select_policy" ON public.organizations;
  END IF;
END$$;

-- Public can view approved, active organizations without auth
CREATE POLICY "organizations_public_approved_read"
ON public.organizations
FOR SELECT
USING (status = 'approved' AND is_active = true);

-- Authenticated admins/superadmins and owners can view all
CREATE POLICY "organizations_admin_read"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  public.is_admin_or_superadmin(auth.uid())
  OR (supabase_user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.admin a
    WHERE a.supabase_user_id = auth.uid() AND a.organization_id = organizations.id
  )
);