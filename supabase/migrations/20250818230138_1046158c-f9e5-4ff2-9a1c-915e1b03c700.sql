-- Supprimer l'ancienne contrainte restrictive
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_type_check;

-- Créer une nouvelle contrainte qui accepte tous les types du frontend
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_type_check 
CHECK (type IN (
  'Mairie',
  'Conseil départemental', 
  'Préfecture',
  'Services publics',
  'Entreprise de service',
  'ONG',
  'Association',
  'Autre',
  -- Garder compatibilité avec les anciennes valeurs
  'mairie',
  'ong',
  'prive', 
  'benevolat'
));