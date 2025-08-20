import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types pour les signalements
export interface Report {
  id: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
  updated_at?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  department?: string;
  photo_url?: string;
  audio_url?: string;
  priority?: string;
  assigned_organization_id?: string;
  assigned_admin_id?: string;
  resolution_notes?: string;
  estimated_resolution_time?: string;
  actual_resolution_time?: string;
  citizen_satisfaction_rating?: number;
  anonymous_code?: string;
  anonymous_name?: string;
  anonymous_phone?: string;
  population_id?: string;
}

export interface ReportsState {
  // Cache des signalements
  availableReports: Report[];
  managedReports: Report[];
  userReports: Report[];

  // États de chargement
  isLoadingAvailable: boolean;
  isLoadingManaged: boolean;
  isLoadingUser: boolean;

  // Erreurs
  availableReportsError: string | null;
  managedReportsError: string | null;
  userReportsError: string | null;

  // Filtres et recherche
  filters: {
    status?: string;
    type?: string;
    department?: string;
    priority?: string;
    dateRange?: { start: Date; end: Date };
  };
  searchQuery: string;

  // Actions - Gestion des signalements
  setAvailableReports: (reports: Report[]) => void;
  setManagedReports: (reports: Report[]) => void;
  setUserReports: (reports: Report[]) => void;
  addReport: (report: Report) => void;
  updateReport: (reportId: string, updates: Partial<Report>) => void;
  removeReport: (reportId: string) => void;

  // Actions - États de chargement
  setLoadingAvailable: (loading: boolean) => void;
  setLoadingManaged: (loading: boolean) => void;
  setLoadingUser: (loading: boolean) => void;

  // Actions - Erreurs
  setAvailableReportsError: (error: string | null) => void;
  setManagedReportsError: (error: string | null) => void;
  setUserReportsError: (error: string | null) => void;

  // Actions - Filtres et recherche
  setFilters: (filters: Partial<ReportsState['filters']>) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;

  // Actions - Cache management
  getReportById: (id: string) => Report | null;
  invalidateCache: () => void;
  getFilteredReports: (reportType: 'available' | 'managed' | 'user') => Report[];
}

export const useReportsStore = create<ReportsState>()(
  persist(
    immer((set, get) => ({
      // État initial
      availableReports: [],
      managedReports: [],
      userReports: [],
      isLoadingAvailable: false,
      isLoadingManaged: false,
      isLoadingUser: false,
      availableReportsError: null,
      managedReportsError: null,
      userReportsError: null,
      filters: {},
      searchQuery: '',

      // Actions - Gestion des signalements
      setAvailableReports: (reports) =>
        set((state) => {
          state.availableReports = reports;
          state.availableReportsError = null;
        }),

      setManagedReports: (reports) =>
        set((state) => {
          state.managedReports = reports;
          state.managedReportsError = null;
        }),

      setUserReports: (reports) =>
        set((state) => {
          state.userReports = reports;
          state.userReportsError = null;
        }),

      addReport: (report) =>
        set((state) => {
          // Ajouter à la liste appropriée selon le contexte
          if (report.assigned_organization_id) {
            state.managedReports.unshift(report);
          } else {
            state.availableReports.unshift(report);
          }
          
          if (report.population_id) {
            state.userReports.unshift(report);
          }
        }),

      updateReport: (reportId, updates) =>
        set((state) => {
          // Mettre à jour dans toutes les listes
          const updateInArray = (array: Report[]) => {
            const index = array.findIndex(r => r.id === reportId);
            if (index !== -1) {
              array[index] = { ...array[index], ...updates };
            }
          };

          updateInArray(state.availableReports);
          updateInArray(state.managedReports);
          updateInArray(state.userReports);
        }),

      removeReport: (reportId) =>
        set((state) => {
          state.availableReports = state.availableReports.filter(r => r.id !== reportId);
          state.managedReports = state.managedReports.filter(r => r.id !== reportId);
          state.userReports = state.userReports.filter(r => r.id !== reportId);
        }),

      // Actions - États de chargement
      setLoadingAvailable: (loading) =>
        set((state) => {
          state.isLoadingAvailable = loading;
        }),

      setLoadingManaged: (loading) =>
        set((state) => {
          state.isLoadingManaged = loading;
        }),

      setLoadingUser: (loading) =>
        set((state) => {
          state.isLoadingUser = loading;
        }),

      // Actions - Erreurs
      setAvailableReportsError: (error) =>
        set((state) => {
          state.availableReportsError = error;
          state.isLoadingAvailable = false;
        }),

      setManagedReportsError: (error) =>
        set((state) => {
          state.managedReportsError = error;
          state.isLoadingManaged = false;
        }),

      setUserReportsError: (error) =>
        set((state) => {
          state.userReportsError = error;
          state.isLoadingUser = false;
        }),

      // Actions - Filtres et recherche
      setFilters: (newFilters) =>
        set((state) => {
          state.filters = { ...state.filters, ...newFilters };
        }),

      setSearchQuery: (query) =>
        set((state) => {
          state.searchQuery = query;
        }),

      clearFilters: () =>
        set((state) => {
          state.filters = {};
          state.searchQuery = '';
        }),

      // Actions - Utilitaires
      getReportById: (id) => {
        const state = get();
        return (
          state.availableReports.find(r => r.id === id) ||
          state.managedReports.find(r => r.id === id) ||
          state.userReports.find(r => r.id === id) ||
          null
        );
      },

      invalidateCache: () =>
        set((state) => {
          state.availableReports = [];
          state.managedReports = [];
          state.userReports = [];
        }),

      getFilteredReports: (reportType) => {
        const { filters, searchQuery } = get();
        let reports: Report[] = [];

        switch (reportType) {
          case 'available':
            reports = get().availableReports;
            break;
          case 'managed':
            reports = get().managedReports;
            break;
          case 'user':
            reports = get().userReports;
            break;
        }

        return reports.filter((report) => {
          // Filtre par recherche textuelle
          if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = 
              report.description.toLowerCase().includes(searchLower) ||
              report.type.toLowerCase().includes(searchLower) ||
              report.address?.toLowerCase().includes(searchLower) ||
              report.department?.toLowerCase().includes(searchLower);
            
            if (!matchesSearch) return false;
          }

          // Filtres spécifiques
          if (filters.status && report.status !== filters.status) return false;
          if (filters.type && report.type !== filters.type) return false;
          if (filters.department && report.department !== filters.department) return false;
          if (filters.priority && report.priority !== filters.priority) return false;

          // Filtre par date
          if (filters.dateRange) {
            const reportDate = new Date(report.created_at);
            if (reportDate < filters.dateRange.start || reportDate > filters.dateRange.end) {
              return false;
            }
          }

          return true;
        });
      },
    })),
    {
      name: 'reports-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Garder seulement les données essentielles en cache
        filters: state.filters,
        searchQuery: state.searchQuery,
      }),
    }
  )
);