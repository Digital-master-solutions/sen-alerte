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

  // État de la géolocalisation en temps réel
  isWatchingLocation: boolean;
  watchId: number | null;
  lastUpdateTime: number | null;

  // Actions
  setCurrentLocation: (location: Location | null) => void;
  setLocationLoading: (loading: boolean) => void;
  setLocationError: (error: string | null) => void;
  setLastReportLocation: (location: Location) => void;
  addToAddressCache: (query: string, location: Location) => void;
  getFromAddressCache: (query: string) => Location | null;
  requestLocation: () => Promise<Location | null>;
  reverseGeocode: (lat: number, lng: number) => Promise<Location | null>;
  startWatchingLocation: () => void;
  stopWatchingLocation: () => void;
  updateLocationFromWatch: (position: GeolocationPosition) => Promise<void>;
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
      isWatchingLocation: false,
      watchId: null,
      lastUpdateTime: null,

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

      // Demander la géolocalisation du navigateur avec haute précision
      requestLocation: async () => {
        const { setLocationLoading, setCurrentLocation, setLocationError } = get();
        
        setLocationLoading(true);
        setLocationError(null);

        try {
          if (!navigator.geolocation) {
            throw new Error('Géolocalisation non supportée par ce navigateur');
          }

          let bestPosition: GeolocationPosition | null = null;
          let bestAccuracy = Infinity;
          const maxAttempts = 3;
          const targetAccuracy = 20; // Précision cible de 20m maximum

          // Essayer plusieurs fois pour obtenir la meilleure précision
          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
              console.log(`Tentative de géolocalisation ${attempt}/${maxAttempts}...`);
              
              const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                  resolve,
                  reject,
                  {
                    enableHighAccuracy: true,
                    timeout: attempt === 1 ? 15000 : 20000, // Plus de temps pour les tentatives suivantes
                    maximumAge: 0, // Position fraîche uniquement
                  }
                );
              });

              const accuracy = position.coords.accuracy;
              console.log(`Tentative ${attempt}: précision de ${accuracy.toFixed(1)}m`);

              // Garder la meilleure position
              if (accuracy < bestAccuracy) {
                bestPosition = position;
                bestAccuracy = accuracy;
              }

              // Si on a atteint la précision cible, on s'arrête
              if (accuracy <= targetAccuracy) {
                console.log(`✅ Précision excellente atteinte: ${accuracy.toFixed(1)}m`);
                break;
              }

              // Attendre un peu avant la prochaine tentative
              if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 2000));
              }

            } catch (attemptError) {
              console.log(`Tentative ${attempt} échouée:`, attemptError);
              if (attempt === maxAttempts) {
                throw attemptError;
              }
            }
          }

          if (!bestPosition) {
            throw new Error('Impossible d\'obtenir une position GPS');
          }

          const finalAccuracy = bestPosition.coords.accuracy;
          console.log(`🎯 Meilleure précision obtenue: ${finalAccuracy.toFixed(1)}m`);

          const location: Location = {
            latitude: bestPosition.coords.latitude,
            longitude: bestPosition.coords.longitude,
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

      // Démarrer la surveillance de la géolocalisation en temps réel
      startWatchingLocation: () => {
        const { isWatchingLocation, watchId } = get();
        
        if (isWatchingLocation || watchId !== null) {
          return; // Déjà en cours
        }

        if (!navigator.geolocation) {
          console.error('Géolocalisation non supportée');
          return;
        }

        const id = navigator.geolocation.watchPosition(
          (position) => {
            get().updateLocationFromWatch(position);
          },
          (error) => {
            console.error('Erreur surveillance géolocalisation:', error);
            get().setLocationError(`Erreur surveillance: ${error.message}`);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000, // Plus de temps pour la haute précision
            maximumAge: 5000, // 5 secondes maximum
          }
        );

        set((state) => {
          state.isWatchingLocation = true;
          state.watchId = id;
        });

        console.log('Surveillance géolocalisation démarrée');
      },

      // Arrêter la surveillance de la géolocalisation
      stopWatchingLocation: () => {
        const { watchId } = get();
        
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
        }

        set((state) => {
          state.isWatchingLocation = false;
          state.watchId = null;
        });

        console.log('Surveillance géolocalisation arrêtée');
      },

      // Mettre à jour la localisation depuis la surveillance (en arrière-plan)
      updateLocationFromWatch: async (position) => {
        const { reverseGeocode, setCurrentLocation, currentLocation } = get();
        const now = Date.now();
        
        // Éviter les mises à jour trop fréquentes (minimum 5 secondes)
        const { lastUpdateTime } = get();
        if (lastUpdateTime && (now - lastUpdateTime) < 5000) {
          return;
        }

        const accuracy = position.coords.accuracy;
        
        // Filtrer les positions selon leur précision (accepter seulement si précision <= 20m)
        if (accuracy > 20) {
          console.log(`Position rejetée: précision de ${accuracy.toFixed(1)}m (trop imprécise)`);
          return;
        }

        const newLocation: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        // Vérifier si la position a vraiment changé (éviter les mises à jour inutiles)
        if (currentLocation && 
            Math.abs(currentLocation.latitude - newLocation.latitude) < 0.00001 &&
            Math.abs(currentLocation.longitude - newLocation.longitude) < 0.00001) {
          return; // Position identique, pas de mise à jour
        }

        try {
          // Récupérer l'adresse en arrière-plan (silencieux)
          const locationWithAddress = await reverseGeocode(
            newLocation.latitude,
            newLocation.longitude
          );

          const finalLocation = locationWithAddress || newLocation;
          
          // Mise à jour silencieuse en arrière-plan
          setCurrentLocation(finalLocation);

          set((state) => {
            state.lastUpdateTime = now;
          });

          // Log discret pour le debug
          console.log('Position mise à jour en arrière-plan:', {
            lat: finalLocation.latitude.toFixed(6),
            lng: finalLocation.longitude.toFixed(6),
            accuracy: `${accuracy.toFixed(1)}m`,
            address: finalLocation.address
          });
        } catch (error) {
          console.error('Erreur mise à jour position:', error);
          // Mettre à jour quand même avec les coordonnées
          setCurrentLocation(newLocation);
          set((state) => {
            state.lastUpdateTime = now;
          });
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
        lastUpdateTime: state.lastUpdateTime,
      }),
    }
  )
);

// Hook pour l'initialisation automatique de la géolocalisation
export const useLocationInit = () => {
  const requestLocation = useLocationStore((state) => state.requestLocation);
  const startWatchingLocation = useLocationStore((state) => state.startWatchingLocation);
  const stopWatchingLocation = useLocationStore((state) => state.stopWatchingLocation);

  useEffect(() => {
    // Initialisation unique au montage du composant
    const initializeLocation = async () => {
      try {
        // Démarrer la surveillance en temps réel
        startWatchingLocation();
        
        // Demander une position initiale
        await requestLocation();
      } catch (error) {
        console.error('Erreur initialisation géolocalisation:', error);
      }
    };

    initializeLocation();

    // Cleanup: arrêter la surveillance quand le composant se démonte
    return () => {
      stopWatchingLocation();
    };
  }, []); // Dépendances vides pour éviter la boucle infinie
};