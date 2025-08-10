-- Créer un compte super administrateur par défaut
INSERT INTO public.superadmin (
  name,
  email,
  username,
  password_hash,
  status
) VALUES (
  'Super Administrateur',
  'admin@signalement.com',
  'admin',
  encode(digest('admin123', 'sha256'), 'base64'), -- Mot de passe: admin123 (hashé)
  'active'
) ON CONFLICT (username) DO NOTHING;

-- Créer également un admin standard pour test
INSERT INTO public.admin (
  name,
  email,
  username,
  password_hash,
  department,
  status
) VALUES (
  'Administrateur Test',
  'test@signalement.com',
  'test',
  encode(digest('test123', 'sha256'), 'base64'), -- Mot de passe: test123 (hashé)
  'Informatique',
  'active'
) ON CONFLICT (username) DO NOTHING;