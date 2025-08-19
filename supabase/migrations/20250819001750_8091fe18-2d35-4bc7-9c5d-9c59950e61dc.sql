-- Remove existing policy and create a more explicit one
DROP POLICY IF EXISTS "Public organization signup" ON public.organizations;

-- Create explicit policy for anonymous organization signup
CREATE POLICY "Anonymous organization signup" 
ON public.organizations 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Also allow authenticated users to insert (for flexibility)
CREATE POLICY "Authenticated organization signup" 
ON public.organizations 
FOR INSERT 
TO authenticated 
WITH CHECK (true);