-- Storage policies for citizen uploads without authentication
-- Allow public read for report media buckets
CREATE POLICY "Public can read report media"
ON storage.objects
FOR SELECT
USING (bucket_id IN ('report-photos','report-audio'));

-- Allow anyone (including anon) to upload media to report buckets
CREATE POLICY "Anyone can upload report media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id IN ('report-photos','report-audio'));
