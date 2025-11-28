import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { useEffect } from 'react';

// Types for unified authentication
export interface AdminUser {
  id: string;
  username: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  last_login?: string;
}

export interface Organization {
  id: string;
  name: string;
  email: string;
  type: string;
  status: string;
  created_at: string;
  city?: string;
  address?: string;
  phone?: string;
}

export interface AuthState {
  // Supabase Auth state
  user: AdminUser | Organization | null;
  session: Session | null;
  
  // Custom profile data  
  profile: AdminUser | Organization | null;
  userType: 'admin' | 'organization' | null;
  
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (session: Session, profile: AdminUser | Organization, userType: 'admin' | 'organization') => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  
  // Supabase Auth methods
  loginWithSupabase: (email: string, password: string, userType: 'admin' | 'organization') => Promise<boolean>;
  signupWithSupabase: (email: string, password: string, metadata: Record<string, any>) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      user: null,
      session: null,
      profile: null,
      userType: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setAuth: (session, profile, userType) =>
        set((state) => {
          state.user = profile;
          state.session = session;
          state.profile = profile;
          state.userType = userType;
          state.isAuthenticated = true;
          state.isLoading = false;
        }),

      logout: async () => {
        await supabase.auth.signOut();
        set((state) => {
          state.user = null;
          state.session = null;
          state.profile = null;
          state.userType = null;
          state.isAuthenticated = false;
          state.isLoading = false;
        });
      },

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      // Initialize auth state from Supabase session
      initializeAuth: async () => {
        try {
          set((state) => { state.isLoading = true; });

          // First check if we have persisted state
          const currentState = get();
          
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            // No valid session - clear everything
            set((state) => {
              state.user = null;
              state.session = null;
              state.profile = null;
              state.userType = null;
              state.isAuthenticated = false;
              state.isLoading = false;
            });
            return;
          }

          // Session exists - if we have persisted profile, use it temporarily
          if (currentState.profile && currentState.isAuthenticated) {
            set((state) => {
              state.session = session;
              state.isLoading = false;
            });
          }

          // Get fresh user profile from database
          const { data: profileData } = await supabase
            .rpc('get_user_profile_by_auth_id', {
              _auth_user_id: session.user.id
            });

          if (profileData && profileData.length > 0) {
            const rawProfile = profileData[0];
            const userType = rawProfile.user_type as 'admin' | 'organization';
            
            // Convert to proper type
            const profile: AdminUser | Organization = userType === 'admin' ? {
              id: rawProfile.id,
              username: rawProfile.username || '',
              name: rawProfile.name,
              email: rawProfile.email,
              status: rawProfile.status,
              created_at: new Date().toISOString(),
            } : {
              id: rawProfile.id,
              name: rawProfile.name,
              email: rawProfile.email,
              type: rawProfile.organization_type || '',
              status: rawProfile.status,
              created_at: new Date().toISOString(),
              city: rawProfile.city || undefined,
            };
            
            set((state) => {
              state.user = profile;
              state.session = session;
              state.profile = profile;
              state.userType = userType;
              state.isAuthenticated = true;
              state.isLoading = false;
            });
          } else {
            // Session exists but no profile - sign out
            await supabase.auth.signOut();
            set((state) => {
              state.user = null;
              state.session = null;
              state.profile = null;
              state.userType = null;
              state.isAuthenticated = false;
              state.isLoading = false;
            });
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          set((state) => {
            state.isLoading = false;
            state.isAuthenticated = false;
          });
        }
      },

      // Refresh profile data
      refreshProfile: async () => {
        const { session } = get();
        if (!session) return;

        try {
          const { data: profileData } = await supabase
            .rpc('get_user_profile_by_auth_id', {
              _auth_user_id: session.user.id
            });

          if (profileData && profileData.length > 0) {
            const rawProfile = profileData[0];
            const userType = rawProfile.user_type as 'admin' | 'organization';
            
            const profile: AdminUser | Organization = userType === 'admin' ? {
              id: rawProfile.id,
              username: rawProfile.username || '',
              name: rawProfile.name,
              email: rawProfile.email,
              status: rawProfile.status,
              created_at: new Date().toISOString(),
            } : {
              id: rawProfile.id,
              name: rawProfile.name,
              email: rawProfile.email,
              type: rawProfile.organization_type || '',
              status: rawProfile.status,
              created_at: new Date().toISOString(),
              city: rawProfile.city || undefined,
            };
            
            set((state) => {
              state.profile = profile;
              state.user = profile;
            });
          }
        } catch (error) {
          console.error('Error refreshing profile:', error);
        }
      },

      // Login with Supabase Auth
      loginWithSupabase: async (email, password, userType) => {
        try {
          set((state) => { state.isLoading = true; });

          // Sign in with Supabase Auth
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;
          if (!data.session) throw new Error('No session returned');

          // Get user profile to verify user type
          const { data: profileData } = await supabase
            .rpc('get_user_profile_by_auth_id', {
              _auth_user_id: data.session.user.id
            });

          if (!profileData || profileData.length === 0) {
            await supabase.auth.signOut();
            throw new Error('User profile not found');
          }

          const rawProfile = profileData[0];
          
          // Verify user type matches
          if (rawProfile.user_type !== userType) {
            await supabase.auth.signOut();
            throw new Error(`Invalid user type. Please use the ${rawProfile.user_type} login page.`);
          }

          const profile: AdminUser | Organization = userType === 'admin' ? {
            id: rawProfile.id,
            username: rawProfile.username || '',
            name: rawProfile.name,
            email: rawProfile.email,
            status: rawProfile.status,
            created_at: new Date().toISOString(),
          } : {
            id: rawProfile.id,
            name: rawProfile.name,
            email: rawProfile.email,
            type: rawProfile.organization_type || '',
            status: rawProfile.status,
            created_at: new Date().toISOString(),
            city: rawProfile.city || undefined,
          };
          
          set((state) => {
            state.user = profile;
            state.session = data.session;
            state.profile = profile;
            state.userType = userType;
            state.isAuthenticated = true;
            state.isLoading = false;
          });

          return true;
        } catch (error) {
          console.error('Login error:', error);
          set((state) => {
            state.isLoading = false;
            state.isAuthenticated = false;
          });
          throw error;
        }
      },

      // Signup with Supabase Auth
      signupWithSupabase: async (email, password, metadata) => {
        try {
          set((state) => { state.isLoading = true; });

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: metadata,
              emailRedirectTo: `${window.location.origin}/`,
            },
          });

          if (error) throw error;

          set((state) => {
            state.isLoading = false;
          });

          return true;
        } catch (error) {
          console.error('Signup error:', error);
          set((state) => {
            state.isLoading = false;
          });
          throw error;
        }
      },
    })),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userType: state.userType,
        profile: state.profile,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Hook to initialize auth on app load
export const useAuthInit = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
          // Use setTimeout to avoid deadlock
          setTimeout(() => initializeAuth(), 0);
        } else if (event === 'SIGNED_OUT') {
          useAuthStore.setState({
            user: null,
            session: null,
            profile: null,
            userType: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          useAuthStore.setState({ session });
        }
      }
    );

    // THEN check for existing session
    initializeAuth();

    return () => subscription.unsubscribe();
  }, [initializeAuth]);
};
