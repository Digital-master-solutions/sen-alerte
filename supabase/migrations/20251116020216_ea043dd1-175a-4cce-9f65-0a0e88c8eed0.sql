-- Remove legacy authorization columns that are no longer used after RBAC migration
-- These columns are completely unused in the application code
-- The application now uses the user_roles table for authorization

ALTER TABLE public.auth_profiles 
  DROP COLUMN IF EXISTS permissions,
  DROP COLUMN IF EXISTS categories;

ALTER TABLE public.organizations 
  DROP COLUMN IF EXISTS permissions;