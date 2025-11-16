-- Make storage buckets private for better security
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('report-photos', 'report-audio');

-- Create RLS policies for storage.objects to control access to report files

-- Policy: Authenticated users can view their own report files
CREATE POLICY "Users can view own report files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('report-photos', 'report-audio')
  AND (
    -- Allow admins/superadmins to view all
    EXISTS (
      SELECT 1 FROM public.superadmin
      WHERE supabase_user_id = auth.uid() AND status = 'active'
    )
    OR
    -- Allow organizations to view files from their assigned reports
    EXISTS (
      SELECT 1 FROM public.reports r
      INNER JOIN public.organizations o ON r.assigned_organization_id = o.id
      WHERE o.supabase_user_id = auth.uid()
        AND (r.photo_url = storage.objects.name OR r.audio_url = storage.objects.name)
    )
    OR
    -- Allow report creators to view their own files
    EXISTS (
      SELECT 1 FROM public.reports r
      INNER JOIN public.population p ON r.population_id = p.id
      WHERE p.supabase_user_id = auth.uid()
        AND (r.photo_url = storage.objects.name OR r.audio_url = storage.objects.name)
    )
  )
);

-- Policy: Authenticated users can upload files
CREATE POLICY "Authenticated users can upload report files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('report-photos', 'report-audio')
);

-- Policy: Users can update their own files (for overwrites)
CREATE POLICY "Users can update own report files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('report-photos', 'report-audio')
  AND (
    EXISTS (
      SELECT 1 FROM public.superadmin
      WHERE supabase_user_id = auth.uid() AND status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.reports r
      INNER JOIN public.organizations o ON r.assigned_organization_id = o.id
      WHERE o.supabase_user_id = auth.uid()
        AND (r.photo_url = storage.objects.name OR r.audio_url = storage.objects.name)
    )
    OR
    EXISTS (
      SELECT 1 FROM public.reports r
      INNER JOIN public.population p ON r.population_id = p.id
      WHERE p.supabase_user_id = auth.uid()
        AND (r.photo_url = storage.objects.name OR r.audio_url = storage.objects.name)
    )
  )
);

-- Policy: Admins can delete files
CREATE POLICY "Admins can delete report files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('report-photos', 'report-audio')
  AND EXISTS (
    SELECT 1 FROM public.superadmin
    WHERE supabase_user_id = auth.uid() AND status = 'active'
  )
);