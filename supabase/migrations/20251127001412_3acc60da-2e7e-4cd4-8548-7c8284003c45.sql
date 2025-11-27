-- Function to allow superadmins to create new superadmin accounts
CREATE OR REPLACE FUNCTION public.admin_create_superadmin(
  _name TEXT,
  _email TEXT,
  _username TEXT,
  _password_hash TEXT,
  _supabase_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_admin_id UUID;
BEGIN
  -- Verify that the caller is an active superadmin
  IF NOT EXISTS (
    SELECT 1 FROM superadmin
    WHERE supabase_user_id = auth.uid()
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Only active superadmins can create new admin accounts';
  END IF;

  -- Check if email or username already exists
  IF EXISTS (SELECT 1 FROM superadmin WHERE email = _email) THEN
    RAISE EXCEPTION 'Email already exists';
  END IF;

  IF EXISTS (SELECT 1 FROM superadmin WHERE username = _username) THEN
    RAISE EXCEPTION 'Username already exists';
  END IF;

  -- Insert the new superadmin
  INSERT INTO superadmin (
    name,
    email,
    username,
    password_hash,
    supabase_user_id,
    status
  ) VALUES (
    _name,
    _email,
    _username,
    _password_hash,
    _supabase_user_id,
    'active'
  )
  RETURNING id INTO new_admin_id;

  -- Create user role entry
  INSERT INTO user_roles (user_id, role)
  VALUES (_supabase_user_id, 'superadmin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Log the action
  INSERT INTO admin_security_audit (
    admin_id,
    action,
    resource_type,
    resource_id
  ) VALUES (
    (SELECT id FROM superadmin WHERE supabase_user_id = auth.uid()),
    'CREATE_SUPERADMIN',
    'superadmin',
    new_admin_id
  );

  RETURN new_admin_id;
END;
$$;