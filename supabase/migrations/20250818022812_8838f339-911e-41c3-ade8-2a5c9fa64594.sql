-- Fonction pour récupérer les utilisateurs réels
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE(
  user_type TEXT,
  total_count BIGINT,
  active_count BIGINT,
  users JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Retourner les superadmins
  RETURN QUERY
  SELECT 
    'superadmin'::TEXT as user_type,
    COUNT(*)::BIGINT as total_count,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT as active_count,
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'name', name,
        'email', email,
        'username', username,
        'status', status,
        'created_at', created_at,
        'last_login', last_login
      )
    ) as users
  FROM superadmin;
  
  -- Retourner les admins depuis auth_profiles
  RETURN QUERY
  SELECT 
    'admin'::TEXT as user_type,
    COUNT(*)::BIGINT as total_count,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT as active_count,
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'name', name,
        'email', email,
        'username', email,
        'status', status,
        'created_at', created_at,
        'last_login', last_login,
        'organization_id', organization_id
      )
    ) as users
  FROM auth_profiles
  WHERE user_type = 'admin';
END;
$$;