-- Fix search path for security functions
CREATE OR REPLACE FUNCTION public.hash_password(plain_password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Simple base64 encoding for now - in production use proper bcrypt
  RETURN encode(convert_to(plain_password, 'UTF8'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.verify_password(plain_password TEXT, stored_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN encode(convert_to(plain_password, 'UTF8'), 'base64') = stored_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.authenticate_organization(org_email TEXT, plain_password TEXT)
RETURNS TABLE(id uuid, name text, email text, type text, status text, created_at timestamp with time zone) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.email,
    o.type,
    o.status,
    o.created_at
  FROM public.organizations o
  WHERE o.email = org_email 
    AND o.password_hash IS NOT NULL
    AND public.verify_password(plain_password, o.password_hash)
    AND o.status = 'approved'
    AND o.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;