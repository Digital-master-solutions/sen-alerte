-- Remove duplicate organization records, keeping only the latest one for each email
DELETE FROM public.organizations a USING (
    SELECT MIN(id) as id, email
    FROM public.organizations 
    WHERE email IN ('metzondoye2@gmail.com', 'mouhamad.moustapha.ndoye.1@gmail.com')
    GROUP BY email
) b
WHERE a.email = b.email AND a.id != b.id;

-- Now add the unique constraint
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_email_unique UNIQUE (email);