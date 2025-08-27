-- First, update any reports that reference duplicate organizations to point to the oldest one
UPDATE public.reports 
SET assigned_organization_id = (
  SELECT DISTINCT ON (email) id 
  FROM public.organizations 
  WHERE email = (
    SELECT email FROM public.organizations WHERE id = reports.assigned_organization_id
  )
  ORDER BY email, created_at ASC
  LIMIT 1
) 
WHERE assigned_organization_id IN (
  SELECT id FROM public.organizations 
  WHERE email IN ('metzondoye2@gmail.com', 'mouhamad.moustapha.ndoye.1@gmail.com')
  AND id NOT IN (
    SELECT DISTINCT ON (email) id 
    FROM public.organizations 
    WHERE email IN ('metzondoye2@gmail.com', 'mouhamad.moustapha.ndoye.1@gmail.com')
    ORDER BY email, created_at ASC
  )
);

-- Now safely delete the duplicate organizations
DELETE FROM public.organizations 
WHERE id NOT IN (
  SELECT DISTINCT ON (email) id 
  FROM public.organizations 
  WHERE email IN ('metzondoye2@gmail.com', 'mouhamad.moustapha.ndoye.1@gmail.com')
  ORDER BY email, created_at ASC
) 
AND email IN ('metzondoye2@gmail.com', 'mouhamad.moustapha.ndoye.1@gmail.com');

-- Finally, add the unique constraint
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_email_unique UNIQUE (email);