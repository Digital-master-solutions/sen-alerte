-- Create INSERT policies for categorie_organization table to allow signup
CREATE POLICY "Anonymous category organization signup" 
ON public.categorie_organization 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Also allow authenticated users to insert
CREATE POLICY "Authenticated category organization signup" 
ON public.categorie_organization 
FOR INSERT 
TO authenticated 
WITH CHECK (true);