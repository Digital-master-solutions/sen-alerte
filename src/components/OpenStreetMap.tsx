import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocationStore } from '@/stores/locationStore';
import { Button } from '@/components/ui/button';
import { Crosshair, Target, X, MapPin } from 'lucide-react';

// Fix for default markers - use local fallback for better reliability
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEM1LjU5NiAwIDAgNS41OTYgMCAxMi41QzAgMTkuNDA0IDUuNTk2IDI1IDEyLjUgMjVDMTkuNDA0IDI1IDI1IDE5LjQwNCAyNSAxMi41QzI1IDUuNTk2IDE5LjQwNCAwIDEyLjUgMFoiIGZpbGw9IiMyMkM1NUUiLz4KPHBhdGggZD0iTTEyLjUgNkMxNC45ODUzIDYgMTcgOC4wMTQ3MiAxNyAxMC41QzE3IDEyLjk4NTMgMTQuOTg1MyAxNSAxMi41IDE1QzEwLjAxNDcgMTUgOCAxMi45ODUzIDggMTAuNUM4IDguMDE0NzIgMTAuMDE0NyA2IDEyLjUgNloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEM1LjU5NiAwIDAgNS41OTYgMCAxMi41QzAgMTkuNDA0IDUuNTk2IDI1IDEyLjUgMjVDMTkuNDA0IDI1IDI1IDE5LjQwNCAyNSAxMi41QzI1IDUuNTk2IDE5LjQwNCAwIDEyLjUgMFoiIGZpbGw9IiMyMkM1NUUiLz4KPHBhdGggZD0iTTEyLjUgNkMxNC45ODUzIDYgMTcgOC4wMTQ3MiAxNyAxMC41QzE3IDEyLjk4NTMgMTQuOTg1MyAxNSAxMi41IDE1QzEwLjAxNDcgMTUgOCAxMi45ODUzIDggMTAuNUM4IDguMDE0NzIgMTAuMDE0NyA2IDEyLjUgNloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
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
  const { currentLocation, requestLocation } = useLocationStore();

  // Fonction pour récupérer la position GPS exacte
  const getExactGPSPosition = () => {
    setIsLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas supportée par votre navigateur");
      setIsLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPosition = { lat: latitude, lng: longitude };
        
        setGpsPosition(newPosition);
        setIsLocationLoading(false);
        setLocationError(null);
        
        // Mettre à jour la carte avec la nouvelle position
        if (mapInstanceRef.current) {
          updateMapWithLocation(newPosition);
        }
      },
      (error) => {
        let errorMessage = "Erreur lors de la récupération de la position";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permission de localisation refusée. Veuillez l'autoriser dans les paramètres de votre navigateur.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Position non disponible. Vérifiez que votre GPS est activé.";
            break;
          case error.TIMEOUT:
            errorMessage = "Délai d'attente dépassé. Vérifiez votre connexion GPS.";
            break;
        }
        
        setLocationError(errorMessage);
        setIsLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  };

  // Mettre à jour la carte avec la position
  const updateMapWithLocation = (position: { lat: number; lng: number }) => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    
    // Centrer la carte sur la position
    map.setView([position.lat, position.lng], 16);
    
    // Ajouter ou mettre à jour le marqueur GPS
    const existingMarker = map.hasLayer(gpsMarkerRef.current);
    if (existingMarker) {
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

    // Ajouter le popup au marqueur
    gpsMarkerRef.current.bindPopup(`
      <div class="p-4 text-center min-w-[280px]">
        <div class="font-semibold text-green-600 mb-3 text-lg">📍 Votre position actuelle</div>
        <div class="space-y-3 text-sm">
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div class="font-medium text-gray-800 mb-2">Coordonnées GPS :</div>
            <div class="font-mono text-xs text-gray-700 space-y-1">
              <div class="flex justify-between">
                <span class="font-medium">Latitude:</span>
                <span class="text-green-600">${position.lat.toFixed(6)}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Longitude:</span>
                <span class="text-green-600">${position.lng.toFixed(6)}</span>
              </div>
            </div>
          </div>
          <div class="space-y-2">
            <div class="text-xs text-gray-600 font-medium">Actions rapides :</div>
            <div class="grid grid-cols-2 gap-2">
              <button onclick="document.querySelector('.leaflet-control-recenter').click()" class="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded-md transition-colors">
                🔄 Recentrer
              </button>
              <button onclick="window.location.href='/signaler'" class="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 text-xs rounded-md transition-colors">
                📝 Signaler
              </button>
            </div>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-lg p-3">
            <div class="text-xs text-green-800 space-y-1">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Position GPS exacte récupérée</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Prêt à signaler des problèmes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
  };

  // Référence pour le marqueur GPS
  const gpsMarkerRef = useRef<L.Marker | null>(null);

  // Ajouter les contrôles personnalisés
  const addCustomControls = () => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Bouton de localisation et recentrage
    const locationBtn = L.Control.extend({
      options: {
        position: 'topleft'
      },
      onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-control leaflet-control-location');
        const button = L.DomUtil.create('a', 'leaflet-control-button', container);
        button.innerHTML = '📍';
        button.title = 'Localiser et recentrer';
        button.style.cssText = `
          width: 30px;
          height: 30px;
          line-height: 30px;
          text-align: center;
          font-size: 18px;
          background: white;
          border: 2px solid rgba(0,0,0,0.2);
          border-radius: 4px;
          cursor: pointer;
          color: #22c55e;
        `;

        button.onclick = () => {
          if (gpsPosition) {
            // Si on a déjà une position, recentrer
            map.setView([gpsPosition.lat, gpsPosition.lng], 16);
          } else {
            // Sinon, demander la localisation
            getExactGPSPosition();
          }
        };

        return container;
      }
    });

    // Bouton de recentrage sur la position GPS
    const recenterBtn = L.Control.extend({
      options: {
        position: 'topleft'
      },
      onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-control leaflet-control-recenter');
        const button = L.DomUtil.create('a', 'leaflet-control-button', container);
        button.innerHTML = '🎯';
        button.title = 'Recentrer sur ma position';
        button.style.cssText = `
          width: 30px;
          height: 30px;
          line-height: 30px;
          text-align: center;
          font-size: 18px;
          background: white;
          border: 2px solid rgba(0,0,0,0.2);
          border-radius: 4px;
          cursor: pointer;
          color: #3b82f6;
          margin-top: 5px;
        `;

        button.onclick = () => {
          if (gpsPosition) {
            map.setView([gpsPosition.lat, gpsPosition.lng], 16);
          }
        };

        return container;
      }
    });

    // Ajouter les contrôles à la carte
    locationBtn().addTo(map);
    recenterBtn().addTo(map);
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialiser la carte
    const map = L.map(mapRef.current, {
      center: [14.7167, -17.4677], // Dakar
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });

    mapInstanceRef.current = map;

    // Ajouter la couche OpenStreetMap avec attribution complète
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Ajouter les contrôles personnalisés
    addCustomControls();

    // Demander la localisation automatiquement
    getExactGPSPosition();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Mettre à jour la position si elle change dans le store
  useEffect(() => {
    if (currentLocation && !gpsPosition) {
      setGpsPosition(currentLocation);
      if (mapInstanceRef.current) {
        updateMapWithLocation(currentLocation);
      }
    }
  }, [currentLocation, gpsPosition]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg" />
      
      {/* Styles pour les marqueurs et contrôles */}
      <style jsx>{`
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
      `}</style>
    </div>
  );
};

export default OpenStreetMap;