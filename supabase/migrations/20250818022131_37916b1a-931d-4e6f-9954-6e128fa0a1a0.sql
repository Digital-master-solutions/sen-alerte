-- Create a function to update last login for superadmin
CREATE OR REPLACE FUNCTION public.update_superadmin_last_login(_username text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.superadmin 
  SET last_login = now() 
  WHERE username = _username AND status = 'active';
END;
$function$