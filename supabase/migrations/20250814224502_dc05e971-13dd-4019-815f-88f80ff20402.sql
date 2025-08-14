-- Fix remaining infinite recursion in auth_profiles policies
-- Drop all problematic policies that may cause recursion
DROP POLICY IF EXISTS "auth_profiles_select_policy" ON public.auth_profiles;
DROP POLICY IF EXISTS "auth_profiles_update_policy" ON public.auth_profiles;

-- Create clean, non-recursive policies
-- Policy for users to view their own profile
CREATE POLICY "Users can view own profile only"
ON public.auth_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile only"
ON public.auth_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Keep the superadmin policy (already safe)
-- Keep the insert policy as is (not causing issues)