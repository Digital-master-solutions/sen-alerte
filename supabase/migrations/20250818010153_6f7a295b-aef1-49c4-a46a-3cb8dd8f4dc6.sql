-- Fix security issues identified by the linter

-- 1. Fix the SECURITY DEFINER view by creating it without SECURITY DEFINER
-- and using RLS policies instead
DROP VIEW IF EXISTS public.public_organizations;

-- Create the view without SECURITY DEFINER
CREATE VIEW public.public_organizations AS
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

-- Enable RLS on the view (this inherits from the underlying table)
-- and grant appropriate permissions
GRANT SELECT ON public.public_organizations TO anon;
GRANT SELECT ON public.public_organizations TO authenticated;

-- Create a public read policy for the view
-- This allows anyone to read approved organizations from the view
CREATE POLICY "public_organizations_view_read" 
ON public.organizations 
FOR SELECT 
TO anon
USING (status = 'approved' AND is_active = true);

-- Ensure the existing secure policy still works for authenticated users
-- The policies will be combined with OR logic