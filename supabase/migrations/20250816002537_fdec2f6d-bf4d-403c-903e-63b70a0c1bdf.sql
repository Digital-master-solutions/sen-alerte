-- Enable real-time for messagerie table
ALTER TABLE public.messagerie REPLICA IDENTITY FULL;

-- Add messagerie table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messagerie;