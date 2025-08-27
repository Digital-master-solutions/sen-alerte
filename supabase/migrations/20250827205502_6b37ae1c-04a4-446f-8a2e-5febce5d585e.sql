-- Remove duplicate organization records, keeping only the oldest one for each email
DELETE FROM public.organizations a 
WHERE a.id NOT IN (
    SELECT DISTINCT ON (email) id 
    FROM public.organizations 
    WHERE email IN ('metzondoye2@gmail.com', 'mouhamad.moustapha.ndoye.1@gmail.com')
    ORDER BY email, created_at ASC
) AND a.email IN ('metzondoye2@gmail.com', 'mouhamad.moustapha.ndoye.1@gmail.com');

-- Now add the unique constraint
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_email_unique UNIQUE (email);