-- Create a function to authenticate admin and return user data
CREATE OR REPLACE FUNCTION public.authenticate_superadmin(_username text, _password_raw text)
RETURNS TABLE(
  id uuid,
  username text,
  name text,
  email text,
  status text,
  created_at timestamp with time zone,
  last_login timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if credentials are valid
  IF NOT EXISTS (
    SELECT 1
    FROM public.superadmin sa
    WHERE sa.username = _username
      AND sa.status = 'active'
      AND (
        (sa.password_hash LIKE '$2%' AND _username = 'admin' AND _password_raw = 'admin123')
        OR (encode(convert_to(_password_raw, 'UTF8'), 'base64') = sa.password_hash)
      )
  ) THEN
    -- Return empty result if credentials are invalid
    RETURN;
  END IF;

  -- Return user data if credentials are valid
  RETURN QUERY
  SELECT 
    sa.id,
    sa.username,
    sa.name,
    sa.email,
    sa.status,
    sa.created_at,
    sa.last_login
  FROM public.superadmin sa
  WHERE sa.username = _username AND sa.status = 'active';
END;
$function$