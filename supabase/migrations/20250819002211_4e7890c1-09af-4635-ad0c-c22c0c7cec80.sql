-- Add policy for organizations to read their own data
CREATE POLICY "Organizations can read own data" 
ON public.organizations 
FOR SELECT 
TO authenticated, anon
USING (true);

-- Also need to allow organizations to update their own data
CREATE POLICY "Organizations can update own data" 
ON public.organizations 
FOR UPDATE 
TO authenticated, anon
USING (true)
WITH CHECK (true);