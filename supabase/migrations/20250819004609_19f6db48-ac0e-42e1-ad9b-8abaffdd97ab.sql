-- Corriger les politiques RLS pour qu'elles fonctionnent avec localStorage au lieu de supabase_user_id
-- Supprimer les anciennes politiques qui utilisent supabase_user_id

DROP POLICY IF EXISTS "Organizations can see available and own reports" ON reports;
DROP POLICY IF EXISTS "Organizations can claim available reports" ON reports;
DROP POLICY IF EXISTS "Organizations can update their assigned reports" ON reports;

-- Nouvelles politiques qui fonctionnent avec l'ID direct de l'organisation
-- Politique de lecture pour les signalements
CREATE POLICY "Organizations can see available and assigned reports" 
ON reports 
FOR SELECT 
USING (
  -- Les superadmins peuvent tout voir (ils utilisent encore supabase auth)
  (EXISTS (SELECT 1 FROM superadmin WHERE supabase_user_id = auth.uid() AND status = 'active'))
  OR
  -- Les utilisateurs peuvent voir leurs propres signalements (ils utilisent encore supabase auth)
  (EXISTS (SELECT 1 FROM population WHERE supabase_user_id = auth.uid() AND id = reports.population_id))
  OR
  -- Les signalements anonymes accessibles avec code
  (anonymous_code IS NOT NULL AND auth.uid() IS NULL)
  OR
  -- Pour les organisations : tous les signalements disponibles (non assignés) sont visibles
  -- Les signalements assignés ne sont visibles que dans la requête spécifique
  (assigned_organization_id IS NULL)
);

-- Politique pour permettre aux organisations de prendre en charge des signalements
CREATE POLICY "Organizations can claim reports" 
ON reports 
FOR UPDATE 
USING (
  -- Seulement si le signalement n'est pas encore assigné
  assigned_organization_id IS NULL
)
WITH CHECK (
  -- Permet la mise à jour si assigned_organization_id est défini
  assigned_organization_id IS NOT NULL
);

-- Politique pour permettre aux organisations de mettre à jour leurs signalements assignés
CREATE POLICY "Organizations can update assigned reports" 
ON reports 
FOR UPDATE 
USING (
  -- Permet la mise à jour des signalements déjà assignés
  assigned_organization_id IS NOT NULL
)
WITH CHECK (
  -- Permet la mise à jour tant que assigned_organization_id reste défini
  assigned_organization_id IS NOT NULL
);