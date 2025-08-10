-- Fix categorie CRUD RLS so the admin panel (no Supabase auth) can operate
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='categorie' AND policyname='categories_insert_policy'
  ) THEN
    DROP POLICY "categories_insert_policy" ON public.categorie;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='categorie' AND policyname='categories_select_policy'
  ) THEN
    DROP POLICY "categories_select_policy" ON public.categorie;
  END IF;
END$$;

CREATE POLICY categories_all_access
ON public.categorie
FOR ALL
USING (true)
WITH CHECK (true);
