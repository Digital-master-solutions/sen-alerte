-- Create feedbacks table
CREATE TABLE public.feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'suggestion',
  status VARCHAR(50) DEFAULT 'nouveau',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Anyone can create feedback
CREATE POLICY "Anyone can create feedback" 
ON public.feedbacks
FOR INSERT 
WITH CHECK (true);

-- Admins can view all feedbacks
CREATE POLICY "Admins can view all feedbacks" 
ON public.feedbacks
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.superadmin 
    WHERE supabase_user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Admins can update feedbacks
CREATE POLICY "Admins can update feedbacks" 
ON public.feedbacks
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.superadmin 
    WHERE supabase_user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Admins can delete feedbacks
CREATE POLICY "Admins can delete feedbacks" 
ON public.feedbacks
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.superadmin 
    WHERE supabase_user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_feedbacks_updated_at
BEFORE UPDATE ON public.feedbacks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();