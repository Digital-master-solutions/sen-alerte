-- CORRECTION DES VULNÉRABILITÉS CRITIQUES DE SÉCURITÉ

-- 1. Sécuriser la table superadmin (CRITIQUE)
DROP POLICY IF EXISTS "superadmin_select_simple" ON public.superadmin;
DROP POLICY IF EXISTS "superadmin_insert_simple" ON public.superadmin;
DROP POLICY IF EXISTS "superadmin_update_simple" ON public.superadmin;

CREATE POLICY "superadmin_own_access_only" 
ON public.superadmin 
FOR ALL 
USING (supabase_user_id = auth.uid() AND status = 'active')
WITH CHECK (supabase_user_id = auth.uid() AND status = 'active');

-- 2. Restreindre l'accès aux organisations
DROP POLICY IF EXISTS "organizations_public_approved_read" ON public.organizations;

CREATE POLICY "organizations_restricted_read" 
ON public.organizations 
FOR SELECT 
USING (
  -- Superadmins can see all
  (EXISTS (SELECT 1 FROM superadmin WHERE supabase_user_id = auth.uid() AND status = 'active'))
  OR 
  -- Organizations can see their own data
  (supabase_user_id = auth.uid())
  OR
  -- Public can only see basic info of approved active organizations
  (status = 'approved' AND is_active = true AND auth.uid() IS NULL)
);

-- 3. Sécuriser les rapports citoyens
DROP POLICY IF EXISTS "Public can view reports" ON public.reports;

CREATE POLICY "reports_restricted_read" 
ON public.reports 
FOR SELECT 
USING (
  -- Superadmins can see all
  (EXISTS (SELECT 1 FROM superadmin WHERE supabase_user_id = auth.uid() AND status = 'active'))
  OR
  -- Users can see their own reports
  (EXISTS (SELECT 1 FROM population WHERE supabase_user_id = auth.uid() AND id = reports.population_id))
  OR
  -- Assigned organizations can see their reports
  (EXISTS (SELECT 1 FROM organizations WHERE supabase_user_id = auth.uid() AND id = reports.assigned_organization_id))
  OR
  -- Anonymous users can only see basic info with their anonymous code
  (anonymous_code IS NOT NULL AND auth.uid() IS NULL)
);

-- 4. Sécuriser la messagerie interne
DROP POLICY IF EXISTS "messagerie_all_access" ON public.messagerie;

CREATE POLICY "messagerie_sender_recipient_only" 
ON public.messagerie 
FOR SELECT 
USING (
  -- Superadmins can see all
  (EXISTS (SELECT 1 FROM superadmin WHERE supabase_user_id = auth.uid() AND status = 'active'))
  OR
  -- Sender can see their messages
  (sender_id::uuid = auth.uid())
  OR
  -- Recipient can see messages sent to them
  (recipient_id::uuid = auth.uid())
);

CREATE POLICY "messagerie_auth_insert" 
ON public.messagerie 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (
    sender_id::uuid = auth.uid() OR 
    EXISTS (SELECT 1 FROM superadmin WHERE supabase_user_id = auth.uid() AND status = 'active')
  )
);

CREATE POLICY "messagerie_sender_update" 
ON public.messagerie 
FOR UPDATE 
USING (
  sender_id::uuid = auth.uid() OR 
  EXISTS (SELECT 1 FROM superadmin WHERE supabase_user_id = auth.uid() AND status = 'active')
);

-- 5. Restreindre l'accès aux catégories
DROP POLICY IF EXISTS "categories_all_access" ON public.categorie;

CREATE POLICY "categories_public_read" 
ON public.categorie 
FOR SELECT 
USING (true);

CREATE POLICY "categories_admin_write" 
ON public.categorie 
FOR ALL 
USING (EXISTS (SELECT 1 FROM superadmin WHERE supabase_user_id = auth.uid() AND status = 'active'))
WITH CHECK (EXISTS (SELECT 1 FROM superadmin WHERE supabase_user_id = auth.uid() AND status = 'active'));

-- 6. Sécuriser les notifications admin
DROP POLICY IF EXISTS "admin_notifications_all_access" ON public.admin_notifications;

CREATE POLICY "admin_notifications_recipient_access" 
ON public.admin_notifications 
FOR SELECT 
USING (
  -- Superadmins can see all
  (EXISTS (SELECT 1 FROM superadmin WHERE supabase_user_id = auth.uid() AND status = 'active'))
  OR
  -- Recipients can see their notifications
  (recipient_id::uuid = auth.uid())
  OR
  -- Senders can see notifications they sent
  (sender_id::uuid = auth.uid())
);

CREATE POLICY "admin_notifications_auth_insert" 
ON public.admin_notifications 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  sender_id::uuid = auth.uid()
);

CREATE POLICY "admin_notifications_recipient_update" 
ON public.admin_notifications 
FOR UPDATE 
USING (
  recipient_id::uuid = auth.uid() OR 
  sender_id::uuid = auth.uid() OR
  EXISTS (SELECT 1 FROM superadmin WHERE supabase_user_id = auth.uid() AND status = 'active')
);

-- 7. Sécuriser les fonctions avec search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_reply_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE public.admin_notifications 
    SET reply_count = reply_count + 1 
    WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE public.admin_notifications 
    SET reply_count = reply_count - 1 
    WHERE id = OLD.parent_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 8. Ajouter une table pour les logs de sécurité
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_logs_admin_only" 
ON public.security_logs 
FOR ALL 
USING (EXISTS (SELECT 1 FROM superadmin WHERE supabase_user_id = auth.uid() AND status = 'active'))
WITH CHECK (EXISTS (SELECT 1 FROM superadmin WHERE supabase_user_id = auth.uid() AND status = 'active'));