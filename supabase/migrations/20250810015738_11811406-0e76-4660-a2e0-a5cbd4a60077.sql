-- Clean up database: remove all accounts except the ones we created
-- Keep only the admin and superadmin accounts we just created
DELETE FROM admin WHERE username NOT IN ('admin', 'test');
DELETE FROM superadmin WHERE username NOT IN ('admin');

-- Clean up all reports and related data
DELETE FROM notifications;
DELETE FROM report_assignments;
DELETE FROM reports;

-- Clean up unnecessary user data
DELETE FROM population;
DELETE FROM organizations WHERE username IS NULL OR username = '';

-- Clean up messaging and logs
DELETE FROM messagerie;
DELETE FROM admin_notifications;
DELETE FROM admin_logs;
DELETE FROM superadmin_logs;
DELETE FROM organization_logs;
DELETE FROM login_logs;
DELETE FROM system_logs;

-- Clean up sessions
DELETE FROM admin_sessions;

-- Remove auth_profiles except for our admin accounts
DELETE FROM auth_profiles WHERE user_type NOT IN ('admin', 'superadmin');