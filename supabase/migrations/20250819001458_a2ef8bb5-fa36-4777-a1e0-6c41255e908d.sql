-- Add a policy to allow reading organization data for authentication
CREATE POLICY "Organizations can authenticate" 
ON public.organizations 
FOR SELECT 
USING (true);

-- This allows the authenticate_organization function to read from the organizations table