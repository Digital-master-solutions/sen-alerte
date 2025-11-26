import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocationStore } from '@/stores/locationStore';

// Fix for default markers - use local fallback for better reliability
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEM1LjU5NiAwIDAgNS41OTYgMCAxMi41QzAgMTkuNDA0IDUuNTk2IDI1IDEyLjUgMjVDMTkuNDA0IDI1IDI1IDE5LjQwNCAyNSAxMi41QzI1IDUuNTk2IDE5LjQwNCAwIDEyLjUgMFoiIGZpbGw9IiMyMkM1NUUiLz4KPHBhdGggZD0iTTEyLjUgNkMxNC45ODUzIDYgMTcgOC4wMTQ3MiAxNyAxMC41QzE3IDEyLjk4NTMgMTQuOTg1MyAxNSAxMi41IDE1QzEwLjAxNDcgMTUgOCAxMi45ODUzIDggMTAuNUM4IDguMDE0NzIgMTAuMDE0NyA2IDEyLjUgNloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEM1LjU5NiAwIDAgNS41OTYgMCAxMi41QzAgMTkuNDA0IDUuNTk2IDI1IDEyLjUgMjVDMTkuNDA0IDI1IDI1IDE5LjQwNCAyNSAxMi41QzI1IDUuNTY2IDE5LjQwNCAwIDEyLjUgMFoiIGZpbGw9IiMyMkM1NUUiLz4KPHBhdGggZD0iTTEyLjUgNkMxNC45ODUzIDYgMTcgOC4wMTQ3MiAxNyAxMC41QzE3IDEyLjk4NTMgMTQuOTg1MyAxNSAxMi41IDE1QzEwLjAxNDcgMTUgOCAxMi45ODUzIDggMTAuNUM4IDguMDE0NzIgMTAuMDE0NyA2IDEyLjUgNloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
  shadowUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4K'
});

interface OpenStreetMapProps {
  className?: string;
}

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({ className }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [gpsPosition, setGpsPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingPosition, setPendingPosition] = useState<{ lat: number; lng: number } | null>(null);
  const { currentLocation, setCurrentLocation } = useLocationStore();
  
  // Flag pour éviter les appels multiples de géolocalisation
  const isGettingPositionRef = useRef(false);

  // Fonction pour obtenir une position GPS unique
  const getSingleGPSPosition = (attempt: number, maxAttempts: number): Promise<GeolocationPosition> => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: attempt === 1 ? 20000 : 25000,
          maximumAge: 0,
        }
      );
    });
  };

  // Fonction pour traiter une position obtenue
  const processGPSPosition = (position: GeolocationPosition, attempt: number, bestPosition: GeolocationPosition | null, bestAccuracy: number) => {
    const accuracy = position.coords.accuracy;
    console.log(`Tentative ${attempt}: précision de ${accuracy.toFixed(1)}m`);

    if (accuracy < bestAccuracy) {
      return { position, accuracy };
    }
    return { position: bestPosition, accuracy: bestAccuracy };
  };

  // Référence pour le marqueur GPS
  const gpsMarkerRef = useRef<L.Marker | null>(null);

  // Mettre à jour la carte avec la position (immédiat, sans animation)
  const updateMapWithLocation = useCallback((position: { lat: number; lng: number }, forceCenter = false) => {
    if (!mapInstanceRef.current) {
      console.log('⚠️ Carte non disponible pour affichage');
      return;
    }

    // Valider les coordonnées avant de les utiliser
    if (typeof position.lat !== 'number' || typeof position.lng !== 'number' || 
        isNaN(position.lat) || isNaN(position.lng)) {
      console.error('❌ Coordonnées invalides:', position);
      return;
    }

    console.log('🗺️ Mise à jour de la carte avec position:', position.lat.toFixed(6), position.lng.toFixed(6));

    const map = mapInstanceRef.current;
    
    // Toujours recentrer avec zoom 18 pour une vue précise
    map.setView([position.lat, position.lng], 18, {
      animate: false
    });
    console.log('✅ Carte centrée sur:', position.lat.toFixed(6), position.lng.toFixed(6), 'zoom:', map.getZoom());
    
    // Supprimer l'ancien marqueur s'il existe
    if (gpsMarkerRef.current && map.hasLayer(gpsMarkerRef.current)) {
      map.removeLayer(gpsMarkerRef.current);
    }
    
    // Ajouter le nouveau marqueur GPS
    gpsMarkerRef.current = L.marker([position.lat, position.lng], {
      icon: L.divIcon({
        className: 'custom-gps-marker',
        html: '📍',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      })
    }).addTo(map);

    console.log('✅ Marqueur GPS ajouté à la position:', position.lat.toFixed(6), position.lng.toFixed(6));
    
    // Ajouter le popup au marqueur
    gpsMarkerRef.current.bindPopup(`
      <div class="p-4 text-center min-w-[320px]">
        <div class="font-semibold text-green-600 mb-3 text-lg">Position GPS</div>
        <div class="space-y-3 text-sm">
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div class="font-medium text-gray-800 mb-2">Coordonnées GPS :</div>
            <div class="font-mono text-xs text-gray-700 space-y-1">
              <div class="flex justify-between">
                <span class="font-medium">Latitude:</span>
                <span class="text-green-600">${position.lat.toFixed(7)}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Longitude:</span>
                <span class="text-green-600">${position.lng.toFixed(7)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `, {
      maxWidth: 350,
      className: 'custom-popup'
    });
  }, []);

  // Fonction pour mettre à jour la localisation dans le store
  const updateLocationStore = useCallback((latitude: number, longitude: number, accuracy: number) => {
    console.log(`📍 Mise à jour du store: lat=${latitude.toFixed(6)}, lng=${longitude.toFixed(6)}, précision=${accuracy.toFixed(1)}m`);
    
    const locationData = {
      latitude,
      longitude,
      address: currentLocation?.address,
      city: currentLocation?.city,
      department: currentLocation?.department
    };
    setCurrentLocation(locationData);
    
    const newPosition = { lat: latitude, lng: longitude };
    setGpsPosition(newPosition);
    
    // Si la carte est prête, afficher immédiatement
    if (mapInstanceRef.current) {
      console.log('✅ Carte prête - Affichage immédiat du marqueur');
      updateMapWithLocation(newPosition, true);
      setPendingPosition(null);
    } else {
      // Sinon, stocker pour affichage dès que la carte sera prête
      console.log('⏳ Carte non prête - Position stockée pour affichage ultérieur');
      setPendingPosition(newPosition);
    }
  }, [currentLocation, setCurrentLocation, updateMapWithLocation]);

  // Fonction pour récupérer la position GPS exacte avec haute précision
  const getExactGPSPosition = useCallback(async () => {
    // Éviter les appels multiples simultanés
    if (isGettingPositionRef.current) {
      console.log('⚠️ Géolocalisation déjà en cours, appel ignoré');
      return;
    }
    
    if (!navigator.geolocation) {
      console.error('❌ Géolocalisation non disponible sur ce navigateur');
      return;
    }

    isGettingPositionRef.current = true;
    console.log('🎯 Démarrage de la géolocalisation GPS...');

    try {
      // Première tentative rapide pour affichage immédiat
      const firstPosition = await getSingleGPSPosition(1, 4);
      const firstAccuracy = firstPosition.coords.accuracy;
      
      console.log(`📍 Position GPS obtenue: lat=${firstPosition.coords.latitude.toFixed(6)}, lng=${firstPosition.coords.longitude.toFixed(6)}, précision=${firstAccuracy.toFixed(1)}m`);
      
      // Affichage immédiat du marqueur avec la première position
      updateLocationStore(
        firstPosition.coords.latitude,
        firstPosition.coords.longitude,
        firstAccuracy
      );
      
      // Si la précision est déjà bonne, on arrête
      if (firstAccuracy < 50) {
        console.log(`✅ Bonne précision dès le début (${firstAccuracy.toFixed(1)}m) - Arrêt de l'amélioration`);
        return;
      }

      // Amélioration de la précision en arrière-plan
      console.log(`🔄 Amélioration de la précision en arrière-plan...`);
      let bestPosition: GeolocationPosition = firstPosition;
      let bestAccuracy = firstAccuracy;
      const maxAttempts = 4;

      for (let attempt = 2; attempt <= maxAttempts; attempt++) {
        try {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const position = await getSingleGPSPosition(attempt, maxAttempts);
          const result = processGPSPosition(position, attempt, bestPosition, bestAccuracy);
          
          if (result.position && result.accuracy < bestAccuracy) {
            bestPosition = result.position;
            bestAccuracy = result.accuracy;
            
            console.log(`✅ Meilleure précision trouvée: ${bestAccuracy.toFixed(1)}m`);
            
            // Mise à jour progressive en arrière-plan
            updateLocationStore(
              bestPosition.coords.latitude,
              bestPosition.coords.longitude,
              bestAccuracy
            );
            
            if (bestAccuracy < 20) {
              console.log(`✅ Excellente précision atteinte (${bestAccuracy.toFixed(1)}m)`);
              break;
            }
          }
        } catch (err) {
          console.log(`⚠️ Tentative ${attempt} échouée`);
        }
      }
      
      console.log(`✓ Géolocalisation terminée avec précision de ${bestAccuracy.toFixed(1)}m`);
      
    } catch (error) {
      console.error('❌ Erreur lors de la géolocalisation:', error);
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.error('❌ Permission de géolocalisation refusée par l\'utilisateur');
            break;
          case error.POSITION_UNAVAILABLE:
            console.error('❌ Position GPS non disponible');
            break;
          case error.TIMEOUT:
            console.error('❌ Délai d\'attente GPS dépassé');
            break;
        }
      }
    } finally {
      // Toujours réinitialiser le flag à la fin
      isGettingPositionRef.current = false;
    }
  }, [updateLocationStore]);

  // Initialisation de la carte (une seule fois)
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    console.log('🗺️ Initialisation de la carte...');

    // Initialiser la carte
    const map = L.map(mapRef.current, {
      center: [14.7167, -17.4677], // Dakar
      zoom: 13,
      zoomControl: false,
      attributionControl: true
    });

    mapInstanceRef.current = map;

    // Ajouter la couche OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Ajouter les contrôles personnalisés
    const addControls = () => {
      if (!mapInstanceRef.current) return;
      const mapInstance = mapInstanceRef.current;
      
      const existingControls = mapInstance.getContainer().querySelectorAll('.leaflet-control-custom');
      existingControls.forEach(control => control.remove());

      const createSimpleControl = (html: string, title: string, onClick: () => void, color: string, top: string) => {
        const container = document.createElement('div');
        container.className = 'leaflet-control leaflet-control-custom';
        container.style.cssText = `
          position: absolute;
          top: ${top};
          right: 10px;
          z-index: 1000;
          background: white;
          border-radius: 8px;
          box-shadow: 0 3px 12px rgba(0,0,0,0.15);
          transition: all 0.2s ease;
        `;
        
        const button = document.createElement('a');
        button.className = 'leaflet-control-button';
        button.innerHTML = html;
        button.title = title;
        button.href = '#';
        button.style.cssText = `
          display: block;
          width: 44px;
          height: 44px;
          line-height: 44px;
          text-align: center;
          font-size: ${html === '+' || html === '−' ? '22px' : '20px'};
          font-weight: ${html === '+' || html === '−' ? 'bold' : 'normal'};
          background: white;
          border: 2px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          cursor: pointer;
          color: ${color};
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;

        button.addEventListener('click', (e) => {
          e.preventDefault();
          onClick();
        });

        button.addEventListener('mouseenter', () => {
          button.style.transform = 'scale(1.05)';
          button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
          button.style.borderColor = color;
        });

        button.addEventListener('mouseleave', () => {
          button.style.transform = 'scale(1)';
          button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          button.style.borderColor = 'rgba(0,0,0,0.1)';
        });

        container.appendChild(button);
        return container;
      };

      const locationButton = createSimpleControl(
        '🎯',
        'Localiser ma position précisément',
        () => {
          console.log('🎯 Bouton de localisation cliqué');
          getExactGPSPosition();
        },
        '#22c55e',
        '10px'
      );

      const zoomInButton = createSimpleControl(
        '+',
        'Zoomer (agrandir)',
        () => mapInstance.zoomIn(),
        '#3b82f6',
        '60px'
      );

      const zoomOutButton = createSimpleControl(
        '−',
        'Dézoomer (diminuer)',
        () => mapInstance.zoomOut(),
        '#3b82f6',
        '110px'
      );

      const mapContainer = mapInstance.getContainer();
      mapContainer.appendChild(locationButton);
      mapContainer.appendChild(zoomInButton);
      mapContainer.appendChild(zoomOutButton);
    };

    // Attendre que la carte soit prête
    map.whenReady(() => {
      console.log('🗺️ Carte initialisée et prête');
      addControls();
      
      // Lancer la géolocalisation UNE SEULE FOIS
      if (!isGettingPositionRef.current) {
        getExactGPSPosition();
      }
      
      // Afficher position en attente si elle existe
      if (pendingPosition) {
        console.log('📍 Affichage de la position GPS en attente');
        updateMapWithLocation(pendingPosition, true);
        setPendingPosition(null);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // ✅ Aucune dépendance = exécution unique

  // Mettre à jour le marqueur quand currentLocation change
  useEffect(() => {
    if (!currentLocation || !mapInstanceRef.current) return;
    
    const position = {
      lat: currentLocation.latitude,
      lng: currentLocation.longitude
    };
    
    // Vérifier validité des coordonnées
    if (typeof position.lat !== 'number' || typeof position.lng !== 'number' || 
        isNaN(position.lat) || isNaN(position.lng)) {
      return;
    }
    
    // Vérifier si vraiment changé
    if (!gpsPosition || 
        Math.abs(gpsPosition.lat - position.lat) > 0.00001 ||
        Math.abs(gpsPosition.lng - position.lng) > 0.00001) {
      
      console.log('🔄 Mise à jour du marqueur depuis currentLocation');
      setGpsPosition(position);
      updateMapWithLocation(position);
    }
  }, [currentLocation]);


  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg" />
      
      {/* Styles pour les marqueurs et contrôles */}
      <style>{`
        .custom-gps-marker {
          background: none;
          border: none;
          font-size: 40px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
        }
        
        .leaflet-control-location,
        .leaflet-control-recenter {
          background: white;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .leaflet-control-location:hover,
        .leaflet-control-recenter:hover {
          background: #f8f9fa;
        }
        
        /* Styles pour le popup personnalisé */
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          border: 1px solid rgba(0,0,0,0.1);
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 0;
          padding: 0;
        }
        
        .custom-popup .leaflet-popup-tip {
          background: white;
          border: 1px solid rgba(0,0,0,0.1);
        }
        
        /* S'assurer qu'aucun contrôle par défaut n'apparaît à gauche */
        .leaflet-control-zoom {
          display: none !important;
        }
        
        .leaflet-top.leaflet-left {
          display: none !important;
        }
        
        .leaflet-bottom.leaflet-left {
          display: none !important;
        }
        
        /* Cacher tous les contrôles à gauche */
        .leaflet-left {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default OpenStreetMap;