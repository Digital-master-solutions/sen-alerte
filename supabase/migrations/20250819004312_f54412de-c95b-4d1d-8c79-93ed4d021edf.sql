-- Corriger les politiques RLS pour les reports
-- D'abord, supprimer les politiques existantes problématiques

DROP POLICY IF EXISTS "reports_restricted_read" ON reports;
DROP POLICY IF EXISTS "reports_org_claim" ON reports;
DROP POLICY IF EXISTS "reports_org_update_assigned" ON reports;

-- Nouvelle politique pour que les organisations ne voient QUE les signalements disponibles (non assignés) ou leurs propres signalements
CREATE POLICY "Organizations can see available and own reports" 
ON reports 
FOR SELECT 
USING (
  -- Les superadmins peuvent tout voir
  (EXISTS (SELECT 1 FROM superadmin WHERE supabase_user_id = auth.uid() AND status = 'active'))
  OR
  -- Les utilisateurs peuvent voir leurs propres signalements
  (EXISTS (SELECT 1 FROM population WHERE supabase_user_id = auth.uid() AND id = reports.population_id))
  OR
  -- Les organisations peuvent voir seulement:
  -- 1. Les signalements non assignés (disponibles)
  -- 2. Les signalements qui leur sont assignés
  (EXISTS (
    SELECT 1 FROM organizations o 
    WHERE o.supabase_user_id = auth.uid() 
    AND (
      reports.assigned_organization_id IS NULL  -- signalements disponibles
      OR 
      reports.assigned_organization_id = o.id   -- leurs signalements
    )
  ))
  OR
  -- Les signalements anonymes accessibles avec code
  (anonymous_code IS NOT NULL AND auth.uid() IS NULL)
);

-- Politique pour que les organisations puissent prendre en charge (claim) des signalements
CREATE POLICY "Organizations can claim available reports" 
ON reports 
FOR UPDATE 
USING (
  -- Seulement si le signalement n'est pas encore assigné
  assigned_organization_id IS NULL 
  AND 
  -- Et que l'organisation existe et est liée à l'utilisateur connecté
  EXISTS (SELECT 1 FROM organizations o WHERE o.supabase_user_id = auth.uid())
)
WITH CHECK (
  -- Vérifier que l'organisation assigne le signalement à elle-même
  EXISTS (SELECT 1 FROM organizations o WHERE o.supabase_user_id = auth.uid() AND o.id = assigned_organization_id)
);

-- Politique pour que les organisations puissent mettre à jour leurs signalements assignés
CREATE POLICY "Organizations can update their assigned reports" 
ON reports 
FOR UPDATE 
USING (
  -- Seulement leurs signalements assignés
  EXISTS (SELECT 1 FROM organizations o WHERE o.supabase_user_id = auth.uid() AND o.id = assigned_organization_id)
)
WITH CHECK (
  -- Vérifier que le signalement reste assigné à la même organisation
  EXISTS (SELECT 1 FROM organizations o WHERE o.supabase_user_id = auth.uid() AND o.id = assigned_organization_id)
);