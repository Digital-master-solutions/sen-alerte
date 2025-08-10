-- Fix functions referencing dropped admin table

-- 1) Only check superadmin in is_admin_or_superadmin
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM superadmin 
    WHERE supabase_user_id = _user_id AND status = 'active'
  );
$$;

-- 2) Update get_user_role to remove dependency on admin table
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM superadmin WHERE supabase_user_id = _user_id AND status = 'active') THEN 'superadmin'
      WHEN EXISTS (SELECT 1 FROM population WHERE supabase_user_id = _user_id AND status = 'active') THEN 'user'
      ELSE 'anonymous'
    END;
$$;

-- 3) Guard legacy helper functions to avoid referencing admin table
-- These functions are referenced by some RLS policies for notifications;
-- we make them safe no-ops so they don't error while the admin system is simplified.
CREATE OR REPLACE FUNCTION public.admin_can_view_population(_user_id uuid, _population_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT false;
$$;

CREATE OR REPLACE FUNCTION public.admin_assigned_to_report(_user_id uuid, _report_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT false;
$$;