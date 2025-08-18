-- Ensure admin has direct access to organizations table via RLS policy
-- Add a policy for superadmin access to organizations table

CREATE POLICY "superadmin_full_organizations_access" 
ON organizations 
FOR ALL 
USING (
  -- Allow all operations for superadmins (including localStorage admin)
  EXISTS (
    SELECT 1 FROM superadmin 
    WHERE username = 'admin' 
    AND status = 'active'
  )
  OR 
  -- Keep existing superadmin access via supabase_user_id
  EXISTS (
    SELECT 1 FROM superadmin 
    WHERE supabase_user_id = auth.uid() 
    AND status = 'active'
  )
  OR 
  -- Keep existing organization owner access
  supabase_user_id = auth.uid()
)
WITH CHECK (
  -- Same check for insert/update operations
  EXISTS (
    SELECT 1 FROM superadmin 
    WHERE username = 'admin' 
    AND status = 'active'
  )
  OR 
  EXISTS (
    SELECT 1 FROM superadmin 
    WHERE supabase_user_id = auth.uid() 
    AND status = 'active'
  )
  OR 
  supabase_user_id = auth.uid()
);

-- Create a simplified function for admin access to organizations
CREATE OR REPLACE FUNCTION admin_get_all_organizations()
RETURNS SETOF organizations
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT o.*
  FROM organizations o
  ORDER BY o.created_at DESC;
$$;