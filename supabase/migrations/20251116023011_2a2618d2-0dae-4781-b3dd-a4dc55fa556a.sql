-- First, we need to create a Supabase Auth user for the admin
-- This requires manual steps in Supabase Dashboard, so we'll update the existing admin to use email-based login

-- Delete the old admin account that doesn't have Supabase Auth
DELETE FROM public.superadmin WHERE username = 'secureadmin' AND supabase_user_id IS NULL;

-- Note: To create a proper admin account with Supabase Auth:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Create a new user with email: secureadmin@senalert.sn and password: Admin@2025Secure!
-- 3. Then run this migration to link it:
-- UPDATE public.superadmin SET supabase_user_id = 'auth-user-id-here' WHERE email = 'secureadmin@senalert.sn';

-- For now, let's use the existing admin account
SELECT id, username, email, name, status, supabase_user_id FROM public.superadmin;