-- Fix ownership and security definer issues with views

-- Change ownership of views to authenticator instead of postgres
-- This prevents security definer issues
ALTER VIEW public.public_organizations OWNER TO authenticator;
ALTER VIEW public.dashboard_stats OWNER TO authenticator;

-- Ensure RLS is properly enforced on the underlying tables
-- by removing any potential security definer properties