-- Allow anonymous users to view reports (public incident reporting platform)
-- This is appropriate for a public civic platform where transparency is important

CREATE POLICY "Anyone can view public reports"
ON public.reports
FOR SELECT
TO anon, authenticated
USING (true);

-- Note: We keep the existing policies for authenticated users for INSERT/UPDATE/DELETE operations
-- This only adds public read access to make reports visible on the public website