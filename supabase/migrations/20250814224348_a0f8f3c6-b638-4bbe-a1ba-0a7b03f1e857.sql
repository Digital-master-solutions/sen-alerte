-- Fix infinite recursion in RLS policy for auth_profiles
-- 1) Drop the recursive policy that referenced the same table inside its USING clause
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.auth_profiles;

-- 2) Replace it with a safe, non-recursive policy based on superadmin table only
CREATE POLICY "Superadmins can view all profiles"
ON public.auth_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.superadmin s
    WHERE s.supabase_user_id = auth.uid()
      AND s.status = 'active'
  )
);

-- Note: Other existing policies (own-profile access and insert/update policies) remain unchanged and already avoid recursion.