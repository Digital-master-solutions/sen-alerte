import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AdminData {
  id: string;
  name: string;
  email: string;
  username: string;
}

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check if user is an admin and get admin data
          try {
            const { data: adminInfo } = await supabase.rpc('get_current_admin');
            if (adminInfo && adminInfo.length > 0) {
              setAdminData(adminInfo[0]);
              setIsAdmin(true);
            } else {
              setAdminData(null);
              setIsAdmin(false);
            }
          } catch (error) {
            console.error('Error checking admin status:', error);
            setAdminData(null);
            setIsAdmin(false);
          }
        } else {
          setAdminData(null);
          setIsAdmin(false);
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          const { data: adminInfo } = await supabase.rpc('get_current_admin');
          if (adminInfo && adminInfo.length > 0) {
            setAdminData(adminInfo[0]);
            setIsAdmin(true);
          } else {
            setAdminData(null);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setAdminData(null);
          setIsAdmin(false);
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInAsAdmin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    // Check if the signed-in user is an admin
    try {
      const { data: adminInfo } = await supabase.rpc('get_current_admin');
      if (!adminInfo || adminInfo.length === 0) {
        // User is not an admin, sign them out
        await supabase.auth.signOut();
        return { error: { message: 'Accès non autorisé. Seuls les administrateurs peuvent se connecter.' } };
      }
    } catch (error) {
      await supabase.auth.signOut();
      return { error: { message: 'Erreur lors de la vérification des permissions.' } };
    }

    return { data };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      // Clear local storage of any legacy admin data
      localStorage.removeItem('adminUser');
    }
    return { error };
  };

  const logAdminAction = async (action: string, resourceType?: string, resourceId?: string) => {
    if (isAdmin) {
      try {
        await supabase.rpc('log_admin_action', {
          _action: action,
          _resource_type: resourceType || null,
          _resource_id: resourceId || null
        });
      } catch (error) {
        console.error('Failed to log admin action:', error);
      }
    }
  };

  return {
    user,
    session,
    adminData,
    isLoading,
    isAdmin,
    signInAsAdmin,
    signOut,
    logAdminAction
  };
}