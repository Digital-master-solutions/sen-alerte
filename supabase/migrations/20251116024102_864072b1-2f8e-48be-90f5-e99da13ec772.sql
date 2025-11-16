-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recreate hash_password function to ensure it works with pgcrypto
CREATE OR REPLACE FUNCTION public.hash_password(plain_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN crypt(plain_password, gen_salt('bf', 10));
END;
$$;