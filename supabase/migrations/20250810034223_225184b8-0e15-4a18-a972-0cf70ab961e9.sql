-- Seed: create a demo organization and link categories

-- 1) Ensure base categories exist
INSERT INTO public.categorie (nom)
SELECT c.nom
FROM (VALUES ('Voirie'), ('Eau'), ('Sécurité')) AS c(nom)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorie x WHERE x.nom = c.nom
);

-- 2) Create demo organization if not exists
INSERT INTO public.organizations (name, type, email, city, phone, status, is_active)
SELECT 'Organisation Démo', 'municipale', 'demo.org@example.com', 'Dakar', '+221700000000', 'approved', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.organizations o WHERE o.name = 'Organisation Démo'
);

-- 3) Link categories to the demo organization (idempotent)
WITH org AS (
  SELECT id FROM public.organizations WHERE name = 'Organisation Démo' LIMIT 1
),
 cats AS (
  SELECT id FROM public.categorie WHERE nom IN ('Voirie','Eau','Sécurité')
)
INSERT INTO public.categorie_organization (organization_id, categorie_id)
SELECT org.id, cats.id
FROM org, cats
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorie_organization co
  WHERE co.organization_id = org.id AND co.categorie_id = cats.id
);
