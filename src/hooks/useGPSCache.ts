import { useState, useCallback } from 'react';

interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

const GPS_CACHE_KEY = 'gps_position_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes

export const useGPSCache = () => {
  const [cachedPosition, setCachedPosition] = useState<GPSPosition | null>(() => {
    try {
      const cached = localStorage.getItem(GPS_CACHE_KEY);
      if (cached) {
        const position = JSON.parse(cached) as GPSPosition;
        const now = Date.now();
        
        // Vérifier si le cache est encore valide (< 5 minutes)
        if (now - position.timestamp < CACHE_DURATION) {
          console.log(`📦 Position en cache trouvée (${Math.floor((now - position.timestamp) / 1000)}s)`);
          return position;
        } else {
          console.log('📦 Cache expiré, suppression');
          localStorage.removeItem(GPS_CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('Erreur lecture cache GPS:', error);
      localStorage.removeItem(GPS_CACHE_KEY);
    }
    return null;
  });

  const savePosition = useCallback((latitude: number, longitude: number, accuracy: number) => {
    const position: GPSPosition = {
      latitude,
      longitude,
      accuracy,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(GPS_CACHE_KEY, JSON.stringify(position));
      setCachedPosition(position);
      console.log(`💾 Position sauvegardée en cache (précision: ${accuracy.toFixed(1)}m)`);
    } catch (error) {
      console.error('Erreur sauvegarde cache GPS:', error);
    }
  }, []);

  const clearCache = useCallback(() => {
    localStorage.removeItem(GPS_CACHE_KEY);
    setCachedPosition(null);
    console.log('🗑️ Cache GPS vidé');
  }, []);

  const isCacheValid = useCallback(() => {
    if (!cachedPosition) return false;
    const now = Date.now();
    return now - cachedPosition.timestamp < CACHE_DURATION;
  }, [cachedPosition]);

  const getCacheAge = useCallback(() => {
    if (!cachedPosition) return null;
    return Math.floor((Date.now() - cachedPosition.timestamp) / 1000); // en secondes
  }, [cachedPosition]);

  return {
    cachedPosition,
    savePosition,
    clearCache,
    isCacheValid,
    getCacheAge
  };
};
