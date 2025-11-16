-- Create new secure admin account
INSERT INTO public.superadmin (username, name, email, password_hash, status)
VALUES (
  'secureadmin',
  'Administrateur Sécurisé',
  'secureadmin@senalert.sn',
  crypt('Admin@2025Secure!', gen_salt('bf', 10)),
  'active'
)
ON CONFLICT (username) DO NOTHING;