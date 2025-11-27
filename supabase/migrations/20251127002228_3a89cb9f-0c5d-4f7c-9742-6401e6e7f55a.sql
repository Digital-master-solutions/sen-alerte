-- Fix hash_password function to properly reference extensions schema
CREATE OR REPLACE FUNCTION public.hash_password(plain_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN extensions.crypt(plain_password, extensions.gen_salt('bf', 10));
END;
$$;

-- Fix verify_password function to properly reference extensions schema
CREATE OR REPLACE FUNCTION public.verify_password(plain_password text, stored_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN extensions.crypt(plain_password, stored_hash) = stored_hash;
END;
$$;