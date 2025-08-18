-- Corriger la fonction pour récupérer les utilisateurs réels
DROP FUNCTION IF EXISTS public.get_admin_users();

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
    COUNT(s.*)::BIGINT as total_count,
    COUNT(s.*) FILTER (WHERE s.status = 'active')::BIGINT as active_count,
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'email', s.email,
        'username', s.username,
        'status', s.status,
        'created_at', s.created_at,
        'last_login', s.last_login
      )
    ) as users
  FROM superadmin s;
  
  -- Retourner les admins depuis auth_profiles
  RETURN QUERY
  SELECT 
    'admin'::TEXT as user_type,
    COUNT(ap.*)::BIGINT as total_count,
    COUNT(ap.*) FILTER (WHERE ap.status = 'active')::BIGINT as active_count,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', ap.id,
          'name', ap.name,
          'email', ap.email,
          'username', ap.email,
          'status', ap.status,
          'created_at', ap.created_at,
          'last_login', ap.last_login,
          'organization_id', ap.organization_id
        )
      ) FILTER (WHERE ap.user_type = 'admin'),
      '[]'::jsonb
    ) as users
  FROM auth_profiles ap
  WHERE ap.user_type = 'admin';
END;
$$;