import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocationStore } from '@/stores/locationStore';

// Fix for default markers - use local fallback for better reliability
delete (L.Icon.Default.prototype as any)._getIconUrl;
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
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { currentLocation, setCurrentLocation } = useLocationStore();

  // Fonction pour récupérer la position GPS exacte avec haute précision
  const getExactGPSPosition = async () => {
    setIsLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas supportée par votre navigateur");
      setIsLocationLoading(false);
      return;
    }

    try {
      let bestPosition: GeolocationPosition | null = null;
      let bestAccuracy = Infinity;
      const maxAttempts = 4;
      const targetAccuracy = 10; // Précision cible de 10m maximum

      // Essayer plusieurs fois pour obtenir la meilleure précision
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`🎯 Tentative GPS haute précision ${attempt}/${maxAttempts}...`);
          
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: true,
                timeout: attempt === 1 ? 20000 : 25000, // Plus de temps pour les tentatives suivantes
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
            console.log(`⏳ Attente avant tentative ${attempt + 1}...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
          }

        } catch (attemptError) {
          console.log(`❌ Tentative ${attempt} échouée:`, attemptError);
          if (attempt === maxAttempts) {
            throw attemptError;
          }
        }
      }

      if (!bestPosition) {
        throw new Error('Impossible d\'obtenir une position GPS précise');
      }

      const { latitude, longitude, accuracy } = bestPosition.coords;
      const newPosition = { lat: latitude, lng: longitude };
      
      // Stocker la précision pour l'affichage dans le popup
      (window as any).lastGpsAccuracy = accuracy;
      
      console.log(`Position finale: ${latitude}, ${longitude} (précision: ${accuracy}m)`);
      
      // Mettre à jour le store de géolocalisation avec la position exacte
      const locationData = {
        latitude,
        longitude,
        address: currentLocation?.address, // Conserver l'adresse existante si disponible
        city: currentLocation?.city,
        department: currentLocation?.department
      };
      setCurrentLocation(locationData);
      
      setGpsPosition(newPosition);
      setIsLocationLoading(false);
      setLocationError(null);
      
      // Mettre à jour la carte avec la nouvelle position (forcer le centrage)
      if (mapInstanceRef.current) {
        updateMapWithLocation(newPosition, true);
        
        // Afficher un message de précision à l'utilisateur
        let accuracyMessage;
        if (accuracy <= 5) {
          accuracyMessage = "🎯 Position ultra-précise obtenue!";
        } else if (accuracy <= 10) {
          accuracyMessage = "📍 Position très précise obtenue!";
        } else if (accuracy <= 20) {
          accuracyMessage = "📍 Position précise obtenue!";
        } else {
          accuracyMessage = "📍 Position obtenue (précision limitée)";
        }
          
        console.log(accuracyMessage + ` (±${accuracy.toFixed(1)}m)`);
      }
      
    } catch (error: any) {
      let errorMessage = "Erreur lors de la récupération de la position";
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Permission de localisation refusée. Veuillez l'autoriser dans les paramètres de votre navigateur.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Position non disponible. Vérifiez que votre GPS est activé et que vous êtes à l'extérieur.";
          break;
        case error.TIMEOUT:
          errorMessage = "Délai d'attente dépassé. Assurez-vous d'être dans un endroit avec une bonne réception GPS.";
          break;
      }
      
      setLocationError(errorMessage);
      setIsLocationLoading(false);
    }
  };

  // Mettre à jour la carte avec la position (immédiat, sans animation)
  const updateMapWithLocation = (position: { lat: number; lng: number }, forceCenter = false) => {
    if (!mapInstanceRef.current) return;

    // Valider les coordonnées avant de les utiliser
    if (typeof position.lat !== 'number' || typeof position.lng !== 'number' || 
        isNaN(position.lat) || isNaN(position.lng)) {
      console.error('Invalid coordinates provided to updateMapWithLocation:', position);
      return;
    }

    const map = mapInstanceRef.current;
    
    // Si forceCenter est true, toujours recentrer avec zoom 18
    if (forceCenter) {
      console.log('🎯 Recentrage forcé sur:', position.lat.toFixed(6), position.lng.toFixed(6), 'avec zoom 18');
      // Centrer la carte sur la position avec zoom proche (immédiat, sans animation)
      map.setView([position.lat, position.lng], 18, {
        animate: false
      });
      console.log('✅ Carte recentrée avec zoom:', map.getZoom());
    } else {
      // Vérifier si la carte est déjà centrée sur cette position (pour les mises à jour automatiques)
      const currentCenter = map.getCenter();
      const currentZoom = map.getZoom();
      const isAlreadyCentered = 
        Math.abs(currentCenter.lat - position.lat) < 0.0001 &&
        Math.abs(currentCenter.lng - position.lng) < 0.0001 &&
        currentZoom >= 17;

      // Centrer seulement si pas déjà centré
      if (!isAlreadyCentered) {
        // Centrer la carte sur la position avec zoom proche (immédiat, sans animation)
        map.setView([position.lat, position.lng], 18, {
          animate: false
        });
      }
    }
    
    // Ajouter ou mettre à jour le marqueur GPS
    if (gpsMarkerRef.current && map.hasLayer(gpsMarkerRef.current)) {
      map.removeLayer(gpsMarkerRef.current);
    }
    
    gpsMarkerRef.current = L.marker([position.lat, position.lng], {
      icon: L.divIcon({
        className: 'custom-gps-marker',
        html: '📍',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      })
    }).addTo(map);

    
    // Ajouter le popup au marqueur avec informations de précision
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
          <div class="space-y-2">
            <div class="text-xs text-gray-600 font-medium">Actions rapides :</div>
            <div class="grid grid-cols-1 gap-2">
              <button onclick="window.location.href='/signaler'" class="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 text-xs rounded-md transition-colors">
                📝 Signaler
              </button>
            </div>
          </div>
        </div>
      </div>
    `, {
      maxWidth: 350,
      className: 'custom-popup'
    });
  };

  // Référence pour le marqueur GPS
  const gpsMarkerRef = useRef<L.Marker | null>(null);

  // Ajouter les contrôles personnalisés
  const addCustomControls = () => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    
    // Supprimer les anciens contrôles s'ils existent
    const existingControls = map.getContainer().querySelectorAll('.leaflet-control-custom');
    existingControls.forEach(control => control.remove());

    // Créer les contrôles manuellement sans utiliser L.Control.extend
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

      // Effets de survol
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

    // Bouton de localisation avec belle icône
    const locationButton = createSimpleControl(
      '🎯',
      'Localiser ma position précisément',
      () => {
        console.log('🎯 Bouton de localisation cliqué');
        // Si on a déjà une position dans le store, centrer directement la carte
        if (currentLocation && mapInstanceRef.current) {
          console.log('📍 Recentrage sur position existante:', currentLocation);
          updateMapWithLocation({ lat: currentLocation.latitude, lng: currentLocation.longitude }, true);
        } else {
          console.log('🔍 Récupération nouvelle position GPS');
          // Sinon, récupérer la position GPS exacte
        getExactGPSPosition();
        }
      },
      '#22c55e',
      '10px'
    );

    // Bouton zoom + (agrandir)
    const zoomInButton = createSimpleControl(
      '+',
      'Zoomer (agrandir)',
      () => {
        map.zoomIn();
      },
      '#3b82f6',
      '60px'
    );

    // Bouton zoom - (diminuer)
    const zoomOutButton = createSimpleControl(
      '−',
      'Dézoomer (diminuer)',
      () => {
        map.zoomOut();
      },
      '#3b82f6',
      '110px'
    );

    // Ajouter les contrôles au conteneur de la carte
    const mapContainer = map.getContainer();
    mapContainer.appendChild(locationButton);
    mapContainer.appendChild(zoomInButton);
    mapContainer.appendChild(zoomOutButton);
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    
    // Exposer la fonction de géolocalisation globalement pour le popup
    (window as any).getExactGPSPosition = getExactGPSPosition;

    // Initialiser la carte
    const map = L.map(mapRef.current, {
      center: [14.7167, -17.4677], // Dakar
      zoom: 13,
      zoomControl: false, // Enlever complètement les contrôles de zoom à gauche
      attributionControl: true
    });

    mapInstanceRef.current = map;

    // Ajouter la couche OpenStreetMap avec attribution complète
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Attendre que la carte soit prête avant d'ajouter les contrôles
    map.whenReady(() => {
      // Ajouter les contrôles personnalisés
      addCustomControls();
      
      // Demander la localisation automatiquement
      getExactGPSPosition();
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Mettre à jour la position si elle change dans le store (mise à jour automatique)
  useEffect(() => {
    if (currentLocation) {
      // Convertir le format du store (latitude/longitude) vers le format attendu (lat/lng)
      const position = {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude
      };
      
      // Vérifier que les coordonnées sont valides
      if (typeof position.lat === 'number' && typeof position.lng === 'number' && 
          !isNaN(position.lat) && !isNaN(position.lng)) {
        
        // Vérifier si la position a vraiment changé
        if (!gpsPosition || 
            Math.abs(gpsPosition.lat - position.lat) > 0.00001 ||
            Math.abs(gpsPosition.lng - position.lng) > 0.00001) {
          
        setGpsPosition(position);
        if (mapInstanceRef.current) {
            // Mise à jour automatique
          updateMapWithLocation(position);
          }
        }
      }
    }
  }, [currentLocation, gpsPosition]);


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