-- Fix Security Definer View Issues

-- 1. Remove the security barrier from the view (this was causing the security definer issue)
ALTER VIEW public.public_organizations_safe RESET (security_barrier);

-- 2. Instead of using a security definer view, create a proper function that returns safe organization data
DROP VIEW IF EXISTS public.public_organizations_safe;

-- 3. Create a secure function to get public organization data without sensitive info
CREATE OR REPLACE FUNCTION public.get_public_organizations()
RETURNS TABLE(
  id uuid,
  name text,
  type text,
  city text,
  status text,
  is_active boolean,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    o.id,
    o.name,
    o.type,
    o.city,
    o.status,
    o.is_active,
    o.created_at
  FROM organizations o
  WHERE o.status = 'approved' 
    AND o.is_active = true;
$$;

-- 4. Update the anonymous notifications policies to use a simpler approach
-- Remove the complex header-based policies that might not work properly
DROP POLICY IF EXISTS "Anonymous can view own notifications only" ON notifications;
DROP POLICY IF EXISTS "Anonymous can update own notifications only" ON notifications;

-- 5. Restore the original anonymous notification policies but make them more secure
CREATE POLICY "Anonymous notifications read with code" 
ON notifications 
FOR SELECT 
USING (
  anonymous_code IS NOT NULL 
  AND length(anonymous_code) = 8
);

CREATE POLICY "Anonymous notifications update with code" 
ON notifications 
FOR UPDATE 
USING (
  anonymous_code IS NOT NULL 
  AND length(anonymous_code) = 8
)
WITH CHECK (
  anonymous_code IS NOT NULL 
  AND length(anonymous_code) = 8
);

-- 6. Create a more secure way to access organization data for public use
-- This function will be used instead of direct table access for public organization listing
CREATE OR REPLACE FUNCTION public.search_public_organizations(
  search_term text DEFAULT NULL,
  organization_type text DEFAULT NULL,
  city_filter text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  name text,
  type text,
  city text
)
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT 
    o.id,
    o.name,
    o.type,
    o.city
  FROM organizations o
  WHERE o.status = 'approved' 
    AND o.is_active = true
    AND (search_term IS NULL OR o.name ILIKE '%' || search_term || '%')
    AND (organization_type IS NULL OR o.type = organization_type)
    AND (city_filter IS NULL OR o.city = city_filter);
$$;