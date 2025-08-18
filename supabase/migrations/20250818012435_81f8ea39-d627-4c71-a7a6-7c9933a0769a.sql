-- Remove the problematic public_organizations view that's causing security definer issues
DROP VIEW IF EXISTS public.public_organizations;

-- Also remove dashboard_stats view if it has security definer issues  
DROP VIEW IF EXISTS public.dashboard_stats;

-- Create a proper dashboard stats function instead of a view
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE(
  total_reports bigint,
  today_reports bigint,
  week_reports bigint,
  pending_reports bigint,
  in_progress_reports bigint,
  resolved_reports bigint,
  rejected_reports bigint,
  avg_resolution_hours numeric
)
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT 
    COUNT(*)::bigint as total_reports,
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)::bigint as today_reports,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::bigint as week_reports,
    COUNT(*) FILTER (WHERE status = 'en-attente')::bigint as pending_reports,
    COUNT(*) FILTER (WHERE status = 'en-cours')::bigint as in_progress_reports,
    COUNT(*) FILTER (WHERE status = 'resolu')::bigint as resolved_reports,
    COUNT(*) FILTER (WHERE status = 'rejete')::bigint as rejected_reports,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) 
      FILTER (WHERE status = 'resolu')::numeric as avg_resolution_hours
  FROM reports;
$$;