-- Activer RLS sur la table organizations (c'était désactivé)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour la table organizations
CREATE POLICY "Organizations can view their own data" 
ON public.organizations 
FOR SELECT 
USING (supabase_user_id = auth.uid());

CREATE POLICY "Organizations can update their own data" 
ON public.organizations 
FOR UPDATE 
USING (supabase_user_id = auth.uid());

CREATE POLICY "Anyone can insert organization (for signup)" 
ON public.organizations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Superadmins can view all organizations" 
ON public.organizations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM superadmin 
  WHERE supabase_user_id = auth.uid() 
  AND status = 'active'
));

CREATE POLICY "Superadmins can update all organizations" 
ON public.organizations 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM superadmin 
  WHERE supabase_user_id = auth.uid() 
  AND status = 'active'
));

CREATE POLICY "Superadmins can delete organizations" 
ON public.organizations 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM superadmin 
  WHERE supabase_user_id = auth.uid() 
  AND status = 'active'
));