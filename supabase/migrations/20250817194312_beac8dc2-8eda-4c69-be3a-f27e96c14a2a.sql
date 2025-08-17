-- Permettre l'accès public aux notifications avec un code anonyme
CREATE POLICY "Public can view notifications with anonymous code"
ON public.notifications
FOR SELECT
USING (anonymous_code IS NOT NULL);

-- Permettre la mise à jour publique pour marquer comme lu
CREATE POLICY "Public can update notifications with anonymous code"
ON public.notifications
FOR UPDATE
USING (anonymous_code IS NOT NULL)
WITH CHECK (anonymous_code IS NOT NULL);