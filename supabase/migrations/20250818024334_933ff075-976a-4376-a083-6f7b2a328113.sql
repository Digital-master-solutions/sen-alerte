-- Ajouter la colonne active à la table categorie si elle n'existe pas
ALTER TABLE public.categorie 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;