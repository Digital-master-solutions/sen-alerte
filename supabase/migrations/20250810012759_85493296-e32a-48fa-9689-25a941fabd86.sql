-- Phase 1: Fix critical RLS recursion issues
-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "reports_select_policy" ON public.reports;
DROP POLICY IF EXISTS "reports_insert_policy" ON public.reports;
DROP POLICY IF EXISTS "reports_update_policy" ON public.reports;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM superadmin WHERE supabase_user_id = _user_id AND status = 'active') THEN 'superadmin'
      WHEN EXISTS (SELECT 1 FROM admin WHERE supabase_user_id = _user_id AND status = 'active') THEN 'admin'
      WHEN EXISTS (SELECT 1 FROM population WHERE supabase_user_id = _user_id AND status = 'active') THEN 'user'
      ELSE 'anonymous'
    END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM superadmin WHERE supabase_user_id = _user_id AND status = 'active'
    UNION
    SELECT 1 FROM admin WHERE supabase_user_id = _user_id AND status = 'active'
  );
$$;

-- Recreate reports policies without recursion
CREATE POLICY "reports_admin_full_access" ON public.reports
FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "reports_user_own_access" ON public.reports
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM population 
    WHERE supabase_user_id = auth.uid() 
    AND id = reports.population_id
  )
);

-- Enable RLS on system_logs and add policies
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_logs_admin_access" ON public.system_logs
FOR SELECT USING (public.is_admin_or_superadmin(auth.uid()));

-- Phase 2: Add missing tables for admin system
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.admin(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.report_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES public.admin(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES public.admin(id),
  assigned_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'completed')),
  notes text
);

CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES public.admin(id)
);

-- Enable RLS on new tables
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Add policies for new tables
CREATE POLICY "admin_sessions_own_access" ON public.admin_sessions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin 
    WHERE id = admin_sessions.admin_id 
    AND supabase_user_id = auth.uid()
  )
);

CREATE POLICY "report_assignments_admin_access" ON public.report_assignments
FOR ALL USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "system_settings_admin_read" ON public.system_settings
FOR SELECT USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "system_settings_superadmin_write" ON public.system_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM superadmin 
    WHERE supabase_user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Phase 3: Add helpful columns and improve existing tables
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS resolution_notes text,
ADD COLUMN IF NOT EXISTS estimated_resolution_time interval,
ADD COLUMN IF NOT EXISTS actual_resolution_time interval,
ADD COLUMN IF NOT EXISTS citizen_satisfaction_rating integer CHECK (citizen_satisfaction_rating BETWEEN 1 AND 5);

ALTER TABLE public.admin 
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS last_activity timestamptz;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_reports_status_created_at ON public.reports(status, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_assigned_admin ON public.reports(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_reports_location ON public.reports(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_admin_organization ON public.admin(organization_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at);

-- Create useful views for dashboard statistics
CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'en-attente') as pending_reports,
  COUNT(*) FILTER (WHERE status = 'en-cours') as in_progress_reports,
  COUNT(*) FILTER (WHERE status = 'resolu') as resolved_reports,
  COUNT(*) FILTER (WHERE status = 'rejete') as rejected_reports,
  COUNT(*) as total_reports,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) FILTER (WHERE status = 'resolu') as avg_resolution_hours,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_reports,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_reports
FROM public.reports;

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description, category) VALUES
('max_reports_per_user_per_day', '10', 'Maximum number of reports a user can submit per day', 'limits'),
('auto_assign_reports', 'true', 'Automatically assign reports to available admins', 'workflow'),
('notification_email_enabled', 'true', 'Send email notifications for new reports', 'notifications'),
('report_retention_days', '365', 'Number of days to keep resolved reports', 'cleanup')
ON CONFLICT (key) DO NOTHING;

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON public.system_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing data: set default priorities for existing reports
UPDATE public.reports SET priority = 'normal' WHERE priority IS NULL;

-- Clean up orphaned data
DELETE FROM public.organizations WHERE id NOT IN (
  SELECT DISTINCT organization_id FROM public.admin WHERE organization_id IS NOT NULL
) AND status = 'pending' AND created_at < NOW() - INTERVAL '30 days';