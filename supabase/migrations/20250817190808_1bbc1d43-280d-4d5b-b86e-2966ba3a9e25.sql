-- Ajouter la catégorie Voirie
INSERT INTO public.categorie (nom) VALUES ('Voirie')
ON CONFLICT DO NOTHING;

-- Assigner la catégorie Voirie à l'organisation démo
INSERT INTO public.categorie_organization (organization_id, categorie_id)
SELECT '00000000-0000-0000-0000-000000000001', c.id
FROM public.categorie c
WHERE c.nom = 'Voirie'
ON CONFLICT DO NOTHING;

-- Ajouter également la catégorie Eau si elle n'existe pas
INSERT INTO public.categorie (nom) VALUES ('Eau')
ON CONFLICT DO NOTHING;

INSERT INTO public.categorie_organization (organization_id, categorie_id)
SELECT '00000000-0000-0000-0000-000000000001', c.id
FROM public.categorie c
WHERE c.nom = 'Eau'
ON CONFLICT DO NOTHING;