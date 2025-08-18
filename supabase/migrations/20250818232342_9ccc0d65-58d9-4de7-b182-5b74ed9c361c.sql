-- Fix conflicting INSERT policies on organizations table
-- Drop the conflicting policies
DROP POLICY IF EXISTS "Anyone can insert organization (for signup)" ON public.organizations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.organizations;

-- Create a single unified INSERT policy
CREATE POLICY "organizations_unified_insert" 
ON public.organizations 
FOR INSERT 
WITH CHECK (
  -- Allow during signup (no auth yet, supabase_user_id is NULL)
  (auth.uid() IS NULL AND supabase_user_id IS NULL)
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