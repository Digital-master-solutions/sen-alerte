-- Add unique constraint on organizations email to prevent duplicates
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_email_unique UNIQUE (email);