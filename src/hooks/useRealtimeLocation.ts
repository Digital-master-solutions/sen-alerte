import { useCallback } from 'react';
import { useLocationStore } from '@/stores/locationStore';

/**
 * Hook pour gérer la géolocalisation en temps réel
 * La mise à jour automatique se fait en arrière-plan via watchPosition
 */
export const useRealtimeLocation = () => {
  const currentLocation = useLocationStore((state) => state.currentLocation);
  const isLocationLoading = useLocationStore((state) => state.isLocationLoading);
  const locationError = useLocationStore((state) => state.locationError);
  const isWatchingLocation = useLocationStore((state) => state.isWatchingLocation);
  const lastUpdateTime = useLocationStore((state) => state.lastUpdateTime);
  
  const requestLocation = useLocationStore((state) => state.requestLocation);

  // Fonction pour obtenir la position la plus récente
  const getCurrentPosition = useCallback(() => {
    return currentLocation;
  }, [currentLocation]);

  // Fonction pour forcer une mise à jour immédiate (manuel)
  const refreshLocation = useCallback(async () => {
    return await requestLocation();
  }, [requestLocation]);

  return {
    currentLocation,
    isLocationLoading,
    locationError,
    isWatchingLocation,
    lastUpdateTime,
    getCurrentPosition,
    refreshLocation,
  };
};
