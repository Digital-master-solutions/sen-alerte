-- Créer une fonction pour nettoyer les organisations (SECURITY DEFINER pour bypass RLS)
CREATE OR REPLACE FUNCTION public.cleanup_all_organizations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Retirer l'assignation des organisations sur les rapports
  UPDATE public.reports 
  SET assigned_organization_id = NULL 
  WHERE assigned_organization_id IS NOT NULL;

  -- Supprimer toutes les liaisons catégories-organisations
  DELETE FROM public.categorie_organization;

  -- Supprimer tous les logs d'organisations
  DELETE FROM public.organization_logs;

  -- Supprimer toutes les auth_profiles des organisations
  DELETE FROM public.auth_profiles
  WHERE user_type = 'organization';

  -- Supprimer toutes les organisations
  DELETE FROM public.organizations;
END;
$$;

-- Exécuter la fonction
SELECT public.cleanup_all_organizations();

-- Supprimer la fonction après utilisation
DROP FUNCTION IF EXISTS public.cleanup_all_organizations();