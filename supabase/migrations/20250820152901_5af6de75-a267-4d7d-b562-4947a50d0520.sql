-- Tables nécessaires pour l'authentification JWT custom
-- refresh_tokens : Gestion des tokens de rafraîchissement
CREATE TABLE public.refresh_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'organization', 'population')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  user_agent TEXT,
  ip_address INET
);

-- user_sessions : Suivi des sessions actives pour la sécurité
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'organization', 'population')),
  session_token_hash TEXT NOT NULL UNIQUE,
  refresh_token_id UUID REFERENCES public.refresh_tokens(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  device_info JSONB
);

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour refresh_tokens
CREATE POLICY "Users can access their own refresh tokens" 
ON public.refresh_tokens 
FOR ALL 
USING (
  (user_type = 'admin' AND EXISTS (
    SELECT 1 FROM superadmin s WHERE s.supabase_user_id = auth.uid() AND s.id::text = user_id::text
  )) OR
  (user_type = 'organization' AND EXISTS (
    SELECT 1 FROM organizations o WHERE o.supabase_user_id = auth.uid() AND o.id::text = user_id::text
  )) OR
  (user_type = 'population' AND EXISTS (
    SELECT 1 FROM population p WHERE p.supabase_user_id = auth.uid() AND p.id::text = user_id::text
  ))
);

-- Politiques RLS pour user_sessions
CREATE POLICY "Users can access their own sessions" 
ON public.user_sessions 
FOR ALL 
USING (
  (user_type = 'admin' AND EXISTS (
    SELECT 1 FROM superadmin s WHERE s.supabase_user_id = auth.uid() AND s.id::text = user_id::text
  )) OR
  (user_type = 'organization' AND EXISTS (
    SELECT 1 FROM organizations o WHERE o.supabase_user_id = auth.uid() AND o.id::text = user_id::text
  )) OR
  (user_type = 'population' AND EXISTS (
    SELECT 1 FROM population p WHERE p.supabase_user_id = auth.uid() AND p.id::text = user_id::text
  ))
);

-- Superadmins peuvent voir toutes les sessions pour la sécurité
CREATE POLICY "Superadmins can view all tokens and sessions" 
ON public.refresh_tokens 
FOR SELECT 
USING (is_superadmin());

CREATE POLICY "Superadmins can view all sessions" 
ON public.user_sessions 
FOR SELECT 
USING (is_superadmin());

-- Index pour la performance
CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens(user_id, user_type);
CREATE INDEX idx_refresh_tokens_expires ON public.refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_hash ON public.refresh_tokens(token_hash);

CREATE INDEX idx_user_sessions_user ON public.user_sessions(user_id, user_type);
CREATE INDEX idx_user_sessions_expires ON public.user_sessions(expires_at);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token_hash);
CREATE INDEX idx_user_sessions_activity ON public.user_sessions(last_activity_at);

-- Trigger pour nettoyer automatiquement les tokens expirés
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Nettoyer les refresh tokens expirés
  DELETE FROM public.refresh_tokens 
  WHERE expires_at < now() OR is_revoked = true;
  
  -- Nettoyer les sessions expirées
  DELETE FROM public.user_sessions 
  WHERE expires_at < now() OR is_active = false;
END;
$$;

-- Fonction pour révoquer tous les tokens d'un utilisateur
CREATE OR REPLACE FUNCTION public.revoke_all_user_tokens(_user_id uuid, _user_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Révoquer tous les refresh tokens
  UPDATE public.refresh_tokens 
  SET is_revoked = true 
  WHERE user_id = _user_id AND user_type = _user_type;
  
  -- Désactiver toutes les sessions
  UPDATE public.user_sessions 
  SET is_active = false 
  WHERE user_id = _user_id AND user_type = _user_type;
END;
$$;