-- ============================================
-- SECURITY FIX: Implement Proper RBAC System
-- ============================================

-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'organization', 'user', 'superadmin');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can manage all roles"
ON public.user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'
  )
);

-- 3. Drop old function and create security definer function to check roles
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Create helper function to get user role (with text return)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'superadmin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'organization' THEN 3
      WHEN 'user' THEN 4
    END
  LIMIT 1
$$;

-- 5. Migrate existing roles to user_roles table
-- Migrate superadmins
INSERT INTO public.user_roles (user_id, role)
SELECT supabase_user_id, 'superadmin'::app_role
FROM public.superadmin
WHERE supabase_user_id IS NOT NULL AND status = 'active'
ON CONFLICT (user_id, role) DO NOTHING;

-- Migrate organizations
INSERT INTO public.user_roles (user_id, role)
SELECT supabase_user_id, 'organization'::app_role
FROM public.organizations
WHERE supabase_user_id IS NOT NULL AND status = 'approved' AND is_active = true
ON CONFLICT (user_id, role) DO NOTHING;

-- Migrate regular users from auth_profiles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'user'::app_role
FROM public.auth_profiles
WHERE user_type = 'user' AND status = 'active'
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- SECURITY FIX: Anonymous Reports RLS
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Organizations can see available and assigned reports" ON public.reports;
DROP POLICY IF EXISTS "Anyone can insert anonymous reports" ON public.reports;

-- Create new restrictive policies for reports
CREATE POLICY "Superadmins can view all reports"
ON public.reports FOR SELECT
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Organizations can view available reports"
ON public.reports FOR SELECT
USING (
  public.has_role(auth.uid(), 'organization') 
  AND (assigned_organization_id IS NULL OR assigned_organization_id = (
    SELECT id FROM organizations WHERE supabase_user_id = auth.uid()
  ))
);

CREATE POLICY "Users can view their own reports"
ON public.reports FOR SELECT
USING (
  population_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM population 
    WHERE population.id = reports.population_id 
    AND population.supabase_user_id = auth.uid()
  )
);

-- Allow anonymous report creation
CREATE POLICY "Anyone can create anonymous reports"
ON public.reports FOR INSERT
WITH CHECK (
  (population_id IS NULL AND anonymous_code IS NOT NULL)
  OR (population_id IS NOT NULL)
);

-- ============================================
-- SECURITY FIX: Input Validation Constraints
-- ============================================

-- Add length constraints for description
ALTER TABLE public.reports 
ADD CONSTRAINT reports_description_length 
CHECK (length(description) >= 10 AND length(description) <= 5000);

-- Add coordinate validation
ALTER TABLE public.reports
ADD CONSTRAINT reports_valid_latitude
CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));

ALTER TABLE public.reports
ADD CONSTRAINT reports_valid_longitude
CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

-- Add constraint for type
ALTER TABLE public.reports
ADD CONSTRAINT reports_type_not_empty
CHECK (length(trim(type)) > 0);

-- Create secure report insertion function with validation
CREATE OR REPLACE FUNCTION public.insert_validated_report(
  _description text,
  _type text,
  _anonymous_name text DEFAULT NULL,
  _anonymous_phone text DEFAULT NULL,
  _anonymous_code text DEFAULT NULL,
  _latitude double precision DEFAULT NULL,
  _longitude double precision DEFAULT NULL,
  _address text DEFAULT NULL,
  _photo_url text DEFAULT NULL,
  _audio_url text DEFAULT NULL,
  _population_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _report_id uuid;
  _sanitized_description text;
BEGIN
  -- Server-side validation
  IF length(_description) < 10 OR length(_description) > 5000 THEN
    RAISE EXCEPTION 'Description must be between 10 and 5000 characters';
  END IF;
  
  IF length(trim(_type)) = 0 THEN
    RAISE EXCEPTION 'Type is required';
  END IF;
  
  IF _latitude IS NOT NULL AND (_latitude < -90 OR _latitude > 90) THEN
    RAISE EXCEPTION 'Invalid latitude: must be between -90 and 90';
  END IF;
  
  IF _longitude IS NOT NULL AND (_longitude < -180 OR _longitude > 180) THEN
    RAISE EXCEPTION 'Invalid longitude: must be between -180 and 180';
  END IF;
  
  -- Sanitize description (remove HTML tags)
  _sanitized_description := regexp_replace(_description, '<[^>]*>', '', 'g');
  
  -- Validate anonymous reports
  IF _population_id IS NULL AND (_anonymous_code IS NULL OR length(_anonymous_code) = 0) THEN
    RAISE EXCEPTION 'Anonymous reports require an anonymous code';
  END IF;
  
  -- Insert the report
  INSERT INTO public.reports (
    description,
    type,
    anonymous_name,
    anonymous_phone,
    anonymous_code,
    latitude,
    longitude,
    address,
    photo_url,
    audio_url,
    population_id,
    status
  ) VALUES (
    _sanitized_description,
    _type,
    _anonymous_name,
    _anonymous_phone,
    _anonymous_code,
    _latitude,
    _longitude,
    _address,
    _photo_url,
    _audio_url,
    _population_id,
    'en-attente'
  )
  RETURNING id INTO _report_id;
  
  RETURN _report_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.insert_validated_report TO authenticated, anon;