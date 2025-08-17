-- Correction pour les vues et finalisation de la sécurité

-- 1. Ajouter des politiques pour organization_logs seulement (dashboard_stats est une vue)
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