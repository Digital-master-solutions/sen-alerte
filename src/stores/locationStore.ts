import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useEffect } from 'react';

// Types pour la géolocalisation
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  department?: string;
}

export interface LocationState {
  // Position actuelle de l'utilisateur
  currentLocation: Location | null;
  isLocationLoading: boolean;
  locationError: string | null;

  // Position par défaut du Sénégal
  defaultLocation: Location;

  // Cache des adresses recherchées
  addressCache: Record<string, Location>;

  // Dernière position utilisée pour un signalement
  lastReportLocation: Location | null;

  // Actions
  setCurrentLocation: (location: Location | null) => void;
  setLocationLoading: (loading: boolean) => void;
  setLocationError: (error: string | null) => void;
  setLastReportLocation: (location: Location) => void;
  addToAddressCache: (query: string, location: Location) => void;
  getFromAddressCache: (query: string) => Location | null;
  requestLocation: () => Promise<Location | null>;
  reverseGeocode: (lat: number, lng: number) => Promise<Location | null>;
}

// Position par défaut du Sénégal (Dakar)
const SENEGAL_DEFAULT_LOCATION: Location = {
  latitude: 14.4974,
  longitude: -14.4524,
  address: "Dakar, Sénégal",
  city: "Dakar",
  department: "Dakar"
};

export const useLocationStore = create<LocationState>()(
  persist(
    immer((set, get) => ({
      // État initial
      currentLocation: null,
      isLocationLoading: false,
      locationError: null,
      defaultLocation: SENEGAL_DEFAULT_LOCATION,
      addressCache: {},
      lastReportLocation: null,

      // Actions
      setCurrentLocation: (location) =>
        set((state) => {
          state.currentLocation = location;
          state.locationError = null;
        }),

      setLocationLoading: (loading) =>
        set((state) => {
          state.isLocationLoading = loading;
        }),

      setLocationError: (error) =>
        set((state) => {
          state.locationError = error;
          state.isLocationLoading = false;
        }),

      setLastReportLocation: (location) =>
        set((state) => {
          state.lastReportLocation = location;
        }),

      addToAddressCache: (query, location) =>
        set((state) => {
          state.addressCache[query.toLowerCase()] = location;
        }),

      getFromAddressCache: (query) => {
        const { addressCache } = get();
        return addressCache[query.toLowerCase()] || null;
      },

      // Demander la géolocalisation du navigateur
      requestLocation: async () => {
        const { setLocationLoading, setCurrentLocation, setLocationError } = get();
        
        setLocationLoading(true);
        setLocationError(null);

        try {
          if (!navigator.geolocation) {
            throw new Error('Géolocalisation non supportée par ce navigateur');
          }

          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000, // 5 minutes
              }
            );
          });

          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          // Essayer de récupérer l'adresse
          const locationWithAddress = await get().reverseGeocode(
            location.latitude,
            location.longitude
          );

          const finalLocation = locationWithAddress || location;
          setCurrentLocation(finalLocation);
          return finalLocation;

        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Erreur lors de la géolocalisation';
          
          setLocationError(errorMessage);
          console.error('Erreur géolocalisation:', error);
          
          // Retourner la position par défaut du Sénégal
          setCurrentLocation(SENEGAL_DEFAULT_LOCATION);
          return SENEGAL_DEFAULT_LOCATION;
        } finally {
          setLocationLoading(false);
        }
      },

      // Géocodage inverse (coordonnées -> adresse)
      reverseGeocode: async (lat, lng) => {
        try {
          // Utiliser Nominatim (OpenStreetMap) pour le géocodage inverse
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr`
          );

          if (!response.ok) {
            throw new Error('Erreur géocodage inverse');
          }

          const data = await response.json();

          const location: Location = {
            latitude: lat,
            longitude: lng,
            address: data.display_name || `${lat}, ${lng}`,
            city: data.address?.city || data.address?.town || data.address?.village || '',
            department: data.address?.state || data.address?.province || '',
          };

          return location;

        } catch (error) {
          console.error('Erreur géocodage inverse:', error);
          return null;
        }
      },
    })),
    {
      name: 'location-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentLocation: state.currentLocation,
        addressCache: state.addressCache,
        lastReportLocation: state.lastReportLocation,
      }),
    }
  )
);

// Hook pour l'initialisation automatique de la géolocalisation
export const useLocationInit = () => {
  const requestLocation = useLocationStore((state) => state.requestLocation);
  const currentLocation = useLocationStore((state) => state.currentLocation);

  useEffect(() => {
    // Demander automatiquement la géolocalisation si pas encore définie
    if (!currentLocation) {
      requestLocation();
    }
  }, [requestLocation, currentLocation]);
};