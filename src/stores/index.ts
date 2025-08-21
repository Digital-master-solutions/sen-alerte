// Export central de tous les stores Zustand
export { useAuthStore, useAuthInit } from './authStore';
export { useLocationStore, useLocationInit } from './locationStore';
export { useReportsStore } from './reportsStore';
export { useSettingsStore, useSettingsInit } from './settingsStore';

export type {
  AuthState,
  AdminUser,
  Organization
} from './authStore';

export type {
  LocationState,
  Location
} from './locationStore';

export type {
  ReportsState,
  Report
} from './reportsStore';

export type {
  SettingsState,
  NotificationSettings,
  DisplaySettings,
  MapSettings,
  PrivacySettings
} from './settingsStore';