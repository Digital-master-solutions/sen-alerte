
-- 1) Colonne d’assignation d’une organisation sur un signalement
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS assigned_organization_id uuid REFERENCES public.organizations(id);

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_reports_assigned_org ON public.reports(assigned_organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(type);

-- 2) Politiques RLS pour permettre aux organisations de (a) s’assigner un signalement de leurs catégories
-- et (b) mettre à jour un signalement qui leur est déjà assigné.
-- Remarque: les catégories sont liées via categorie_organization (org -> categorie_id) puis categorie.nom
-- qui doit correspondre à reports.type.

-- (a) Politique pour "claim" (prendre en charge) un report non assigné de ses catégories
CREATE POLICY reports_org_claim
ON public.reports
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.organizations o
    JOIN public.categorie_organization co ON co.organization_id = o.id
    JOIN public.categorie c ON c.id = co.categorie_id
    WHERE o.supabase_user_id = auth.uid()
      AND c.nom = public.reports.type
      AND public.reports.assigned_organization_id IS NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.organizations o
    WHERE o.supabase_user_id = auth.uid()
      AND public.reports.assigned_organization_id = o.id
  )
);

-- (b) Politique pour mettre à jour un report déjà assigné à l’organisation
CREATE POLICY reports_org_update_assigned
ON public.reports
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.organizations o
    WHERE o.supabase_user_id = auth.uid()
      AND public.reports.assigned_organization_id = o.id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.organizations o
    WHERE o.supabase_user_id = auth.uid()
      AND public.reports.assigned_organization_id = o.id
  )
);

-- 3) Déclencheur de validation: limite les colonnes modifiables par une organisation
-- Autorisé: status, resolution_notes, estimated_resolution_time, actual_resolution_time,
-- et assigned_organization_id uniquement de NULL -> org_id.
CREATE OR REPLACE FUNCTION public.enforce_org_report_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  org_id uuid;
BEGIN
  -- Identifier l’organisation courante via auth.uid()
  SELECT o.id INTO org_id
  FROM public.organizations o
  WHERE o.supabase_user_id = auth.uid();

  -- Si ce n’est pas une organisation, ne pas restreindre ici (les autres politiques s’appliquent)
  IF org_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Vérifier le changement d’assignation
  IF OLD.assigned_organization_id IS DISTINCT FROM NEW.assigned_organization_id THEN
    IF OLD.assigned_organization_id IS NULL AND NEW.assigned_organization_id = org_id THEN
      -- assignation initiale OK
      NULL;
    ELSE
      RAISE EXCEPTION 'Organizations cannot change report assignment except to claim to themselves';
    END IF;
  END IF;

  -- Vérifier que seules les colonnes autorisées changent
  IF
    -- Colonnes autorisées
    (COALESCE(OLD.status, '') IS DISTINCT FROM COALESCE(NEW.status, ''))
    OR (COALESCE(OLD.resolution_notes, '') IS DISTINCT FROM COALESCE(NEW.resolution_notes, ''))
    OR (OLD.estimated_resolution_time IS DISTINCT FROM NEW.estimated_resolution_time)
    OR (OLD.actual_resolution_time IS DISTINCT FROM NEW.actual_resolution_time)
    OR (OLD.assigned_organization_id IS DISTINCT FROM NEW.assigned_organization_id)
  THEN
    -- OK si aucune autre colonne ne change
    NULL;
  ELSE
    -- Si quelque chose a changé mais ce n’est pas dans la liste ci-dessus, refuser
    IF ROW(OLD.*) IS DISTINCT FROM ROW(NEW.*) THEN
      RAISE EXCEPTION 'Organizations can only update status, resolution notes or resolution times';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_org_report_updates ON public.reports;
CREATE TRIGGER trg_enforce_org_report_updates
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.enforce_org_report_updates();

-- 4) Activer le temps réel pour reports (affichage instantané)
ALTER TABLE public.reports REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
