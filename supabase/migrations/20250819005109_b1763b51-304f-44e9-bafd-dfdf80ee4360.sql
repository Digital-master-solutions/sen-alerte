-- Supprimer les anciennes politiques RLS pour notifications qui utilisent supabase_user_id
DROP POLICY IF EXISTS "Anonymous notifications read with code" ON notifications;
DROP POLICY IF EXISTS "Anonymous notifications update with code" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;

-- Nouvelles politiques RLS pour notifications compatibles avec localStorage
-- Permettre la lecture publique des notifications (le filtrage se fait dans l'application)
CREATE POLICY "Public notifications read access" 
ON notifications 
FOR SELECT 
USING (true);

-- Permettre la mise à jour publique des notifications (marquage comme lu)
CREATE POLICY "Public notifications update access" 
ON notifications 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Permettre l'insertion de notifications (pour le système)
CREATE POLICY "Public notifications insert access" 
ON notifications 
FOR INSERT 
WITH CHECK (true);