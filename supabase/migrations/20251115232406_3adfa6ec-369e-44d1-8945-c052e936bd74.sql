-- Migration to support Supabase Auth integration
-- This preserves existing superadmin and organizations tables while adding Supabase Auth support

-- Create a function to create Supabase Auth users from existing records
-- This will be used during migration and new signups

CREATE OR REPLACE FUNCTION public.create_supabase_auth_user_for_superadmin(
  _superadmin_id uuid,
  _email text,
  _password text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Note: This function is a placeholder for the migration process
  -- Actual Supabase Auth user creation must be done via Supabase Auth API
  -- This function just updates the supabase_user_id link
  RETURN _superadmin_id;
END;
$$;

-- Add index on supabase_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_superadmin_supabase_user_id ON public.superadmin(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_supabase_user_id ON public.organizations(supabase_user_id);

-- Create a function to get user profile by Supabase Auth ID
CREATE OR REPLACE FUNCTION public.get_user_profile_by_auth_id(_auth_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_type text,
  name text,
  email text,
  status text,
  username text,
  organization_type text,
  city text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check superadmin first
  RETURN QUERY
  SELECT 
    s.id,
    'admin'::text as user_type,
    s.name,
    s.email,
    s.status,
    s.username,
    null::text as organization_type,
    null::text as city
  FROM public.superadmin s
  WHERE s.supabase_user_id = _auth_user_id
    AND s.status = 'active'
  LIMIT 1;
  
  -- If not found, check organizations
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      o.id,
      'organization'::text as user_type,
      o.name,
      o.email,
      o.status,
      o.email as username,
      o.type as organization_type,
      o.city
    FROM public.organizations o
    WHERE o.supabase_user_id = _auth_user_id
      AND o.status = 'approved'
      AND o.is_active = true
    LIMIT 1;
  END IF;
END;
$$;