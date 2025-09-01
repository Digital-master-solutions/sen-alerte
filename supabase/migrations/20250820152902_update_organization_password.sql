-- Create function to update organization password
CREATE OR REPLACE FUNCTION public.update_organization_password(org_id uuid, new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the password hash for the organization
  UPDATE public.organizations 
  SET password_hash = public.hash_password(new_password)
  WHERE id = org_id;
  
  -- Return true if update was successful
  RETURN FOUND;
END;
$$;

