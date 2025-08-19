-- Remove the current problematic policy
DROP POLICY IF EXISTS "Allow organization signup" ON public.organizations;

-- Create a new explicit policy that allows public organization signup
CREATE POLICY "Public organization signup" 
ON public.organizations 
FOR INSERT 
WITH CHECK (true);

-- Ensure the policy allows all necessary fields for signup
-- This policy will allow any insertion without authentication requirements