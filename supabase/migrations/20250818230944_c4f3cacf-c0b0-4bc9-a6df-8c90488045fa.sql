-- Fix the INSERT policy to allow unauthenticated organization signup
DROP POLICY IF EXISTS "Anyone can insert organization (for signup)" ON public.organizations;

CREATE POLICY "Anyone can insert organization (for signup)" 
ON public.organizations 
FOR INSERT 
WITH CHECK (
  -- Allow insert when no auth user (during signup) or when it's the authenticated user
  auth.uid() IS NULL OR supabase_user_id = auth.uid() OR supabase_user_id IS NULL
);