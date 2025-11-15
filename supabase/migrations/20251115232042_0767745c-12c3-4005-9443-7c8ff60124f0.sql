-- Enable pgcrypto extension for proper password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update hash_password function to use bcrypt instead of base64
CREATE OR REPLACE FUNCTION public.hash_password(plain_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN crypt(plain_password, gen_salt('bf', 10));
END;
$$;

-- Update verify_password function to use bcrypt
CREATE OR REPLACE FUNCTION public.verify_password(plain_password text, stored_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN crypt(plain_password, stored_hash) = stored_hash;
END;
$$;

-- Add search_path to all SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.authenticate_superadmin(_username text, _password_raw text)
RETURNS TABLE(id uuid, username text, name text, email text, status text, created_at timestamp with time zone, last_login timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.superadmin sa
    WHERE sa.username = _username
      AND sa.status = 'active'
      AND public.verify_password(_password_raw, sa.password_hash)
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    sa.id,
    sa.username,
    sa.name,
    sa.email,
    sa.status,
    sa.created_at,
    sa.last_login
  FROM public.superadmin sa
  WHERE sa.username = _username AND sa.status = 'active';
END;
$$;

CREATE OR REPLACE FUNCTION public.authenticate_organization(org_email text, plain_password text)
RETURNS TABLE(id uuid, name text, email text, type text, status text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_superadmin_last_login(_username text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.superadmin 
  SET last_login = now() 
  WHERE username = _username AND status = 'active';
END;
$$;

-- Enable RLS on all public tables that don't have it
ALTER TABLE public.categorie ENABLE ROW LEVEL SECURITY;

-- Fix organizations table RLS - make it more restrictive
DROP POLICY IF EXISTS "Enable read access for all users" ON public.organizations;
CREATE POLICY "Organizations visible to authenticated users only"
ON public.organizations FOR SELECT
USING (auth.role() = 'authenticated');

-- Fix reports table to protect anonymous contact info
DROP POLICY IF EXISTS "Enable read access for all users" ON public.reports;
CREATE POLICY "Reports visible to authenticated users"
ON public.reports FOR SELECT
USING (auth.role() = 'authenticated');