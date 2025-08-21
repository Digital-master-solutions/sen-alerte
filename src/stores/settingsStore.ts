import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useEffect } from 'react';

// Types pour les préférences
export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  reportUpdates: boolean;
  systemAlerts: boolean;
  marketingEmails: boolean;
}

export interface DisplaySettings {
  theme: 'light' | 'dark' | 'system';
  language: 'fr' | 'en' | 'wo'; // Français, Anglais, Wolof
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  animations: boolean;
}

export interface MapSettings {
  defaultZoom: number;
  showSatelliteView: boolean;
  showTrafficLayer: boolean;
  autoCenter: boolean;
  clusterMarkers: boolean;
}

export interface PrivacySettings {
  shareLocation: boolean;
  publicProfile: boolean;
  analyticsOptIn: boolean;
  crashReporting: boolean;
}

export interface SettingsState {
  // Préférences utilisateur
  notifications: NotificationSettings;
  display: DisplaySettings;
  map: MapSettings;
  privacy: PrivacySettings;

  // État de synchronisation
  isLoading: boolean;
  lastSyncAt: number | null;
  isDirty: boolean; // Changements non sauvegardés

  // Actions
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  updateDisplay: (settings: Partial<DisplaySettings>) => void;
  updateMap: (settings: Partial<MapSettings>) => void;
  updatePrivacy: (settings: Partial<PrivacySettings>) => void;
  resetToDefaults: () => void;
  markAsSynced: () => void;
  setLoading: (loading: boolean) => void;

  // Migration depuis localStorage existant
  migrateFromLegacySettings: () => void;
}

// Paramètres par défaut adaptés au Sénégal
const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  reportUpdates: true,
  systemAlerts: true,
  marketingEmails: false,
};

const DEFAULT_DISPLAY: DisplaySettings = {
  theme: 'system',
  language: 'fr', // Français par défaut
  fontSize: 'medium',
  compactMode: false,
  animations: true,
};

const DEFAULT_MAP: MapSettings = {
  defaultZoom: 12,
  showSatelliteView: false,
  showTrafficLayer: false,
  autoCenter: true,
  clusterMarkers: true,
};

const DEFAULT_PRIVACY: PrivacySettings = {
  shareLocation: true,
  publicProfile: false,
  analyticsOptIn: true,
  crashReporting: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    immer((set, get) => ({
      // État initial avec valeurs par défaut
      notifications: DEFAULT_NOTIFICATIONS,
      display: DEFAULT_DISPLAY,
      map: DEFAULT_MAP,
      privacy: DEFAULT_PRIVACY,
      isLoading: false,
      lastSyncAt: null,
      isDirty: false,

      // Actions
      updateNotifications: (settings) =>
        set((state) => {
          state.notifications = { ...state.notifications, ...settings };
          state.isDirty = true;
        }),

      updateDisplay: (settings) =>
        set((state) => {
          state.display = { ...state.display, ...settings };
          state.isDirty = true;
          
          // Appliquer le thème immédiatement
          if (settings.theme) {
            const html = document.documentElement;
            if (settings.theme === 'dark') {
              html.classList.add('dark');
            } else if (settings.theme === 'light') {
              html.classList.remove('dark');
            } else {
              // Mode système
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              html.classList.toggle('dark', prefersDark);
            }
          }
        }),

      updateMap: (settings) =>
        set((state) => {
          state.map = { ...state.map, ...settings };
          state.isDirty = true;
        }),

      updatePrivacy: (settings) =>
        set((state) => {
          state.privacy = { ...state.privacy, ...settings };
          state.isDirty = true;
        }),

      resetToDefaults: () =>
        set((state) => {
          state.notifications = DEFAULT_NOTIFICATIONS;
          state.display = DEFAULT_DISPLAY;
          state.map = DEFAULT_MAP;
          state.privacy = DEFAULT_PRIVACY;
          state.isDirty = true;
        }),

      markAsSynced: () =>
        set((state) => {
          state.isDirty = false;
          state.lastSyncAt = Date.now();
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      // Migration depuis l'ancien système
      migrateFromLegacySettings: () => {
        // Vérifier les anciens réglages dans localStorage
        const legacyTheme = localStorage.getItem('theme');
        const legacyLanguage = localStorage.getItem('language');
        
        if (legacyTheme && ['light', 'dark', 'system'].includes(legacyTheme)) {
          set((state) => {
            state.display.theme = legacyTheme as 'light' | 'dark' | 'system';
          });
        }

        if (legacyLanguage && ['fr', 'en', 'wo'].includes(legacyLanguage)) {
          set((state) => {
            state.display.language = legacyLanguage as 'fr' | 'en' | 'wo';
          });
        }

        // Nettoyer les anciens éléments
        localStorage.removeItem('theme');
        localStorage.removeItem('language');
      },
    })),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        display: state.display,
        map: state.map,
        privacy: state.privacy,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);

// Hook pour l'initialisation des paramètres
export const useSettingsInit = () => {
  const migrateFromLegacySettings = useSettingsStore((state) => state.migrateFromLegacySettings);
  const display = useSettingsStore((state) => state.display);

  useEffect(() => {
    // Migration automatique au premier chargement
    migrateFromLegacySettings();

    // Appliquer le thème au chargement
    const html = document.documentElement;
    if (display.theme === 'dark') {
      html.classList.add('dark');
    } else if (display.theme === 'light') {
      html.classList.remove('dark');
    } else {
      // Mode système
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.classList.toggle('dark', prefersDark);
    }
  }, [migrateFromLegacySettings, display.theme]);

  // Écouter les changements de préférence système pour le thème
  useEffect(() => {
    if (display.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [display.theme]);
};