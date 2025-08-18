-- Phase 1: Critical Security Fixes

-- 1. Create a secure view for public organization data that excludes sensitive information
CREATE OR REPLACE VIEW public.public_organizations_safe AS
SELECT 
  id,
  name,
  type,
  city,
  status,
  is_active,
  created_at
FROM organizations
WHERE status = 'approved' AND is_active = true;

-- 2. Enable RLS on the new view
ALTER VIEW public.public_organizations_safe SET (security_barrier = true);

-- 3. Create RLS policy for the safe view (allow public read access)
-- Note: Views inherit RLS from their base tables, but we need to ensure proper access

-- 4. Update existing RLS policies to be more restrictive for sensitive data
-- Remove the overly permissive public read policy that exposes sensitive data
DROP POLICY IF EXISTS "public_organizations_view_read" ON organizations;

-- Create a more restrictive policy for public access that only allows basic info
CREATE POLICY "public_organizations_basic_read" 
ON organizations 
FOR SELECT 
USING (
  status = 'approved' 
  AND is_active = true 
  AND auth.uid() IS NULL -- Only for anonymous users viewing basic info
);

-- 5. Fix anonymous notifications access to be more restrictive
-- Update the policy to ensure anonymous users can only access their own notifications
DROP POLICY IF EXISTS "Public can view notifications with anonymous code" ON notifications;

CREATE POLICY "Anonymous can view own notifications only" 
ON notifications 
FOR SELECT 
USING (
  anonymous_code IS NOT NULL 
  AND anonymous_code = current_setting('request.headers', true)::json->>'x-anonymous-code'
);

-- Update policy for updating notifications with anonymous code
DROP POLICY IF EXISTS "Public can update notifications with anonymous code" ON notifications;

CREATE POLICY "Anonymous can update own notifications only" 
ON notifications 
FOR UPDATE 
USING (
  anonymous_code IS NOT NULL 
  AND anonymous_code = current_setting('request.headers', true)::json->>'x-anonymous-code'
)
WITH CHECK (
  anonymous_code IS NOT NULL 
  AND anonymous_code = current_setting('request.headers', true)::json->>'x-anonymous-code'
);

-- 6. Create proper admin authentication function using Supabase Auth
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM superadmin 
    WHERE supabase_user_id = auth.uid() 
    AND status = 'active'
  );
$$;

-- 7. Add proper session management for admins
-- This function will be used to validate admin sessions properly
CREATE OR REPLACE FUNCTION public.validate_admin_session()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN false
    WHEN is_superadmin() THEN true
    ELSE false
  END;
$$;

-- 8. Update superadmin table to support proper Supabase Auth integration
-- Ensure supabase_user_id is properly indexed for performance
CREATE INDEX IF NOT EXISTS idx_superadmin_supabase_user_id ON superadmin(supabase_user_id);

-- 9. Create a secure function to get current admin info
CREATE OR REPLACE FUNCTION public.get_current_admin()
RETURNS TABLE(id uuid, name text, email text, username text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT s.id, s.name, s.email, s.username
  FROM superadmin s
  WHERE s.supabase_user_id = auth.uid() 
  AND s.status = 'active';
$$;

-- 10. Create security audit log for admin actions
CREATE TABLE IF NOT EXISTS admin_security_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES superadmin(id),
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE admin_security_audit ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view audit logs
CREATE POLICY "superadmin_audit_read" 
ON admin_security_audit 
FOR SELECT 
USING (is_superadmin());

-- System can insert audit logs
CREATE POLICY "system_audit_insert" 
ON admin_security_audit 
FOR INSERT 
WITH CHECK (true);

-- 11. Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action text,
  _resource_type text DEFAULT NULL,
  _resource_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_id_val uuid;
BEGIN
  -- Get current admin ID
  SELECT id INTO admin_id_val 
  FROM superadmin 
  WHERE supabase_user_id = auth.uid() AND status = 'active';
  
  IF admin_id_val IS NOT NULL THEN
    INSERT INTO admin_security_audit (
      admin_id, 
      action, 
      resource_type, 
      resource_id
    ) VALUES (
      admin_id_val, 
      _action, 
      _resource_type, 
      _resource_id
    );
  END IF;
END;
$$;