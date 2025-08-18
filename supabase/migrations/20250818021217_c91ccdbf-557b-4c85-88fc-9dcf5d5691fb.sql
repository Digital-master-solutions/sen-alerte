-- Remove all RLS policies from organizations table
DROP POLICY IF EXISTS "organizations_admin_read" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_secure_read" ON organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;
DROP POLICY IF EXISTS "public_organizations_basic_read" ON organizations;
DROP POLICY IF EXISTS "superadmin_full_organizations_access" ON organizations;

-- Disable RLS on organizations table
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;