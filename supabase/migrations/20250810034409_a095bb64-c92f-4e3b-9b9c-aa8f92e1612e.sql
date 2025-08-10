-- Function to link the currently authenticated user to a demo organization (or any by name)
CREATE OR REPLACE FUNCTION public.link_org_to_user(_org_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  updated_count int;
BEGIN
  -- Link only if organization exists and is not linked yet
  UPDATE public.organizations o
  SET supabase_user_id = auth.uid()
  WHERE o.name = _org_name
    AND o.supabase_user_id IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count > 0;
END;
$$;