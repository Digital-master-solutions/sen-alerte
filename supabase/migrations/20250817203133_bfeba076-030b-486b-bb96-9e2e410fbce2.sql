-- Correction des tables sans politiques RLS et configuration de sécurité

-- 1. Ajouter des politiques pour les tables manquantes
-- Table dashboard_stats
ALTER TABLE public.dashboard_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dashboard_stats_admin_only" 
ON public.dashboard_stats 
FOR ALL 
USING (EXISTS (SELECT 1 FROM superadmin WHERE supabase_user_id = auth.uid() AND status = 'active'))
WITH CHECK (EXISTS (SELECT 1 FROM superadmin WHERE supabase_user_id = auth.uid() AND status = 'active'));

-- Table organization_logs  
ALTER TABLE public.organization_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organization_logs_admin_only" 
ON public.organization_logs 
FOR ALL 
USING (EXISTS (SELECT 1 FROM superadmin WHERE supabase_user_id = auth.uid() AND status = 'active'))
WITH CHECK (EXISTS (SELECT 1 FROM superadmin WHERE supabase_user_id = auth.uid() AND status = 'active'));

-- 2. Améliorer la sécurité des fonctions restantes avec search_path
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM superadmin 
    WHERE supabase_user_id = _user_id AND status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM superadmin WHERE supabase_user_id = _user_id AND status = 'active') THEN 'superadmin'
      WHEN EXISTS (SELECT 1 FROM population WHERE supabase_user_id = _user_id AND status = 'active') THEN 'user'
      ELSE 'anonymous'
    END;
$function$;

CREATE OR REPLACE FUNCTION public.link_org_to_user(_org_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  updated_count int;
BEGIN
  -- Link only if organization exists and is not linked yet
  UPDATE public.organizations o
  SET supabase_user_id = auth.uid()
  WHERE o.name = _org_name
    AND o.supabase_user_id IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count > 0;
END;
$function$;

-- 3. Ajouter une fonction de logging de sécurité
CREATE OR REPLACE FUNCTION public.log_security_event(
  _event_type TEXT,
  _details JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.security_logs (event_type, user_id, details)
  VALUES (_event_type, auth.uid(), _details);
END;
$function$;

-- 4. Trigger pour logger les tentatives de connexion
CREATE OR REPLACE FUNCTION public.log_auth_attempts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log successful login
  PERFORM public.log_security_event(
    'login_success',
    jsonb_build_object(
      'user_type', CASE 
        WHEN NEW.supabase_user_id IS NOT NULL THEN 'authenticated'
        ELSE 'anonymous'
      END,
      'login_time', NEW.last_login
    )
  );
  RETURN NEW;
END;
$function$;

-- Appliquer le trigger sur les tables appropriées
CREATE TRIGGER superadmin_login_log
  AFTER UPDATE OF last_login ON public.superadmin
  FOR EACH ROW
  WHEN (OLD.last_login IS DISTINCT FROM NEW.last_login)
  EXECUTE FUNCTION public.log_auth_attempts();

CREATE TRIGGER organization_login_log
  AFTER UPDATE OF last_login ON public.organizations
  FOR EACH ROW
  WHEN (OLD.last_login IS DISTINCT FROM NEW.last_login)
  EXECUTE FUNCTION public.log_auth_attempts();