-- Assigner des catégories à la Mairie de Dakar (services municipaux)
INSERT INTO public.categorie_organization (organization_id, categorie_id)
SELECT '55177289-e588-46ac-afa5-70725a73c0a3', c.id
FROM public.categorie c
WHERE c.nom IN ('Voirie', 'Éclairage public', 'Déchets', 'Transport')
ON CONFLICT DO NOTHING;

-- Assigner des catégories à ONG EauPourTous (eau et santé)
INSERT INTO public.categorie_organization (organization_id, categorie_id)
SELECT 'ae1ebd7c-1436-4db8-8e39-d2fd81023b50', c.id
FROM public.categorie c
WHERE c.nom IN ('Eau', 'Santé', 'Pollution')
ON CONFLICT DO NOTHING;

-- Assigner des catégories à Org Hash 1 (sécurité et urgences)
INSERT INTO public.categorie_organization (organization_id, categorie_id)
SELECT '33333333-3333-3333-3333-333333333333', c.id
FROM public.categorie c
WHERE c.nom IN ('Incendie', 'Inondation', 'Santé')
ON CONFLICT DO NOTHING;

-- Assigner des catégories à Org Hash 2 (environnement)
INSERT INTO public.categorie_organization (organization_id, categorie_id)
SELECT '44444444-4444-4444-4444-444444444444', c.id
FROM public.categorie c
WHERE c.nom IN ('Pollution', 'Déchets', 'Eau')
ON CONFLICT DO NOTHING;