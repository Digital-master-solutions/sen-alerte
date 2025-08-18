-- Fix the RLS policy to allow signup with active session
DROP POLICY IF EXISTS "organizations_unified_insert" ON public.organizations;

-- Create a more permissive INSERT policy for signup
CREATE POLICY "organizations_unified_insert" 
ON public.organizations 
FOR INSERT 
WITH CHECK (
  -- Allow insertion when supabase_user_id is NULL (during signup)
  (supabase_user_id IS NULL)
  OR 
  -- Allow authenticated users to insert their own organization
  (auth.uid() IS NOT NULL AND supabase_user_id = auth.uid())
  OR
  -- Allow superadmins to insert any organization
  (EXISTS (
    SELECT 1 FROM superadmin 
    WHERE supabase_user_id = auth.uid() AND status = 'active'
  ))
);