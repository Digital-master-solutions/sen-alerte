import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useEffect } from 'react';

// Types pour l'authentification unifiée
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
  // État de l'authentification
  user: AdminUser | Organization | null;
  userType: 'admin' | 'organization' | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpiry: number | null;

  // Actions pour l'authentification
  setAuth: (
    user: AdminUser | Organization,
    userType: 'admin' | 'organization',
    token?: string,
    refreshToken?: string,
    expiresIn?: number
  ) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateToken: (token: string, refreshToken?: string, expiresIn?: number) => void;
  isSessionValid: () => boolean;

  // Migration depuis localStorage (backward compatibility)
  migrateFromLegacyAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      // État initial
      user: null,
      userType: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      sessionExpiry: null,

      // Actions
      setAuth: (user, userType, token, refreshToken, expiresIn) =>
        set((state) => {
          state.user = user;
          state.userType = userType;
          state.token = token || null;
          state.refreshToken = refreshToken || null;
          state.isAuthenticated = true;
          state.isLoading = false;
          state.sessionExpiry = expiresIn ? Date.now() + expiresIn * 1000 : null;
        }),

      logout: () =>
        set((state) => {
          state.user = null;
          state.userType = null;
          state.token = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
          state.isLoading = false;
          state.sessionExpiry = null;

          // Nettoyer l'ancien localStorage
          localStorage.removeItem('adminUser');
          localStorage.removeItem('organization_session');
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      updateToken: (token, refreshToken, expiresIn) =>
        set((state) => {
          state.token = token;
          if (refreshToken) state.refreshToken = refreshToken;
          state.sessionExpiry = expiresIn ? Date.now() + expiresIn * 1000 : null;
        }),

      isSessionValid: () => {
        const { sessionExpiry, isAuthenticated } = get();
        if (!isAuthenticated) return false;
        if (!sessionExpiry) return true; // Session sans expiration (legacy)
        return Date.now() < sessionExpiry;
      },

      // Migration depuis l'ancien système
      migrateFromLegacyAuth: () => {
        const adminUser = localStorage.getItem('adminUser');
        const orgSession = localStorage.getItem('organization_session');

        if (adminUser && !get().user) {
          try {
            const user = JSON.parse(adminUser);
            set((state) => {
              state.user = user;
              state.userType = 'admin';
              state.isAuthenticated = true;
              // Session legacy - expiration 24h
              state.sessionExpiry = Date.now() + 24 * 60 * 60 * 1000;
            });
          } catch (error) {
            console.error('Erreur migration admin:', error);
          }
        }

        if (orgSession && !get().user) {
          try {
            const session = JSON.parse(orgSession);
            if (session.organization && session.timestamp) {
              const isExpired = Date.now() - session.timestamp > 24 * 60 * 60 * 1000;
              if (!isExpired) {
                set((state) => {
                  state.user = session.organization;
                  state.userType = 'organization';
                  state.isAuthenticated = true;
                  state.sessionExpiry = session.timestamp + 24 * 60 * 60 * 1000;
                });
              }
            }
          } catch (error) {
            console.error('Erreur migration organisation:', error);
          }
        }
      },
    })),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        userType: state.userType,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        sessionExpiry: state.sessionExpiry,
      }),
    }
  )
);

// Hook pour l'initialisation
export const useAuthInit = () => {
  const migrateFromLegacyAuth = useAuthStore((state) => state.migrateFromLegacyAuth);
  const isSessionValid = useAuthStore((state) => state.isSessionValid);
  const logout = useAuthStore((state) => state.logout);

  // Migration automatique au premier chargement
  useEffect(() => {
    migrateFromLegacyAuth();
    
    // Vérifier la validité de la session
    if (!isSessionValid()) {
      logout();
    }
  }, [migrateFromLegacyAuth, isSessionValid, logout]);
};