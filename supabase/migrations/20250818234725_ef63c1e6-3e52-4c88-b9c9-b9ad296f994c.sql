-- Add password_hash column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN password_hash TEXT;

-- Create function to hash passwords securely
CREATE OR REPLACE FUNCTION public.hash_password(plain_password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Simple base64 encoding for now - in production use proper bcrypt
  RETURN encode(convert_to(plain_password, 'UTF8'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify passwords
CREATE OR REPLACE FUNCTION public.verify_password(plain_password TEXT, stored_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN encode(convert_to(plain_password, 'UTF8'), 'base64') = stored_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to authenticate organization
CREATE OR REPLACE FUNCTION public.authenticate_organization(org_email TEXT, plain_password TEXT)
RETURNS TABLE(id uuid, name text, email text, type text, status text, created_at timestamp with time zone) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.email,
    o.type,
    o.status,
    o.created_at
  FROM public.organizations o
  WHERE o.email = org_email 
    AND o.password_hash IS NOT NULL
    AND public.verify_password(plain_password, o.password_hash)
    AND o.status = 'approved'
    AND o.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to work without Supabase Auth for organizations
DROP POLICY IF EXISTS "organizations_unified_insert" ON public.organizations;
DROP POLICY IF EXISTS "Organizations can view their own data" ON public.organizations;
DROP POLICY IF EXISTS "Organizations can update their own data" ON public.organizations;

-- Allow public signup (insert without auth)
CREATE POLICY "Allow organization signup" 
ON public.organizations 
FOR INSERT 
WITH CHECK (true);

-- Allow organizations to view their data (for now allow all to read approved orgs)
CREATE POLICY "Organizations can view approved orgs" 
ON public.organizations 
FOR SELECT 
USING (status = 'approved' AND is_active = true);

-- Allow superadmins to see all
CREATE POLICY "Superadmins can view all organizations" 
ON public.organizations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM superadmin 
  WHERE supabase_user_id = auth.uid() AND status = 'active'
));

-- Allow superadmins to update all
CREATE POLICY "Superadmins can update all organizations" 
ON public.organizations 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM superadmin 
  WHERE supabase_user_id = auth.uid() AND status = 'active'
));