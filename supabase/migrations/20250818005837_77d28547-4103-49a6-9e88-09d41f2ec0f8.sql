-- Security Fix: Remove password hashes from organizations table and restrict public access

-- First, drop the problematic password_hash column since we're using Supabase Auth
ALTER TABLE public.organizations DROP COLUMN IF EXISTS password_hash;

-- Also drop the username column as it's no longer needed with Supabase Auth
ALTER TABLE public.organizations DROP COLUMN IF EXISTS username;

-- Update the RLS policy to prevent public access to organization details
-- Only allow authenticated users to see organization information
DROP POLICY IF EXISTS "organizations_restricted_read" ON public.organizations;

-- Create a new secure policy that only allows:
-- 1. Superadmins to see all organizations
-- 2. Organizations to see their own data
-- 3. No public access to organization details
CREATE POLICY "organizations_secure_read" 
ON public.organizations 
FOR SELECT 
USING (
  (EXISTS (
    SELECT 1 FROM superadmin 
    WHERE superadmin.supabase_user_id = auth.uid() 
    AND superadmin.status = 'active'
  )) 
  OR 
  (supabase_user_id = auth.uid())
);

-- For the public to see which organizations exist (without sensitive details),
-- create a view that only exposes safe information
CREATE OR REPLACE VIEW public.public_organizations AS
SELECT 
  id,
  name,
  type,
  city,
  status,
  is_active,
  created_at
FROM public.organizations
WHERE status = 'approved' AND is_active = true;

-- Allow public read access to this safe view
ALTER VIEW public.public_organizations OWNER TO postgres;
GRANT SELECT ON public.public_organizations TO anon;
GRANT SELECT ON public.public_organizations TO authenticated;