import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocationStore } from '@/stores/locationStore';

// Fix for default markers - use local fallback for better reliability
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/placeholder.svg',
  iconUrl: '/placeholder.svg', 
  shadowUrl: '/placeholder.svg',
});

interface OpenStreetMapProps {
  className?: string;
}

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({ className }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const { currentLocation, requestLocation } = useLocationStore();

  const userMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    // Request location if not available
    if (!currentLocation) {
      requestLocation();
    }
  }, [currentLocation, requestLocation]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map only once
    if (!mapInstanceRef.current) {
      // Start with a default center (Senegal)
      const defaultCenter: [number, number] = [14.6937, -17.4441];
      
      mapInstanceRef.current = L.map(mapRef.current, {
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: true,
        boxZoom: false,
        keyboard: false
      }).setView(defaultCenter, 13);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        crossOrigin: true
      }).addTo(mapInstanceRef.current);

      // Add custom recenter button
      const customControl = L.Control.extend({
        options: { position: 'topright' },
        onAdd: function() {
          const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
          const button = L.DomUtil.create('a', 'leaflet-control-recenter', container);
          button.innerHTML = '⌖';
          button.title = 'Recentrer sur ma position';
          button.onclick = function() {
            if (mapInstanceRef.current && currentLocation) {
              mapInstanceRef.current.setView([currentLocation.latitude, currentLocation.longitude], 15, {
                animate: true
              });
            }
          }
          return container;
        }
      });
      
      mapInstanceRef.current.zoomControl.remove();
      new customControl({ position: 'topright' }).addTo(mapInstanceRef.current);
    }

    // Update marker when location changes
    if (currentLocation && mapInstanceRef.current) {
      const userPosition: [number, number] = [currentLocation.latitude, currentLocation.longitude];

      // Update or create user marker
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(userPosition);
      } else {
        userMarkerRef.current = L.marker(userPosition, {
          icon: L.divIcon({
            className: 'current-location-marker',
            html: `
              <div style="
                width: 20px;
                height: 20px;
                background: #22c55e;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                position: relative;
              ">
                <div style="
                  position: absolute;
                  top: -2px;
                  left: -2px;
                  width: 24px;
                  height: 24px;
                  background: rgba(34, 197, 94, 0.3);
                  border-radius: 50%;
                  animation: pulse 2s infinite;
                "></div>
              </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        }).addTo(mapInstanceRef.current);
        
        userMarkerRef.current.bindPopup('<strong>Votre position actuelle</strong>');
        markersRef.current.push(userMarkerRef.current);
      }

      // Auto-center on first location or when location changes significantly
      mapInstanceRef.current.setView(userPosition, 15, {
        animate: true
      });
    }

    // Cleanup only on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      userMarkerRef.current = null;
    };
  }, [currentLocation]);

  if (!currentLocation) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`} style={{ height: '100%', minHeight: '400px' }}>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-muted-foreground/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div 
        ref={mapRef} 
        style={{ height: '100%', width: '100%' }} 
        className="rounded-lg"
        role="img"
        aria-label="Carte interactive de Dakar pour les signalements"
      />
      
      {/* Custom styles for markers and controls */}
      <style>{`
        .current-location-marker {
          background: transparent !important;
          border: none !important;
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .leaflet-control-recenter {
          background: white;
          color: #333;
          border: none;
          width: 26px;
          height: 26px;
          display: block;
          text-decoration: none;
          border-bottom: 1px solid #ccc;
        }
        .leaflet-control-recenter:hover {
          background: #f4f4f4;
          color: #000;
        }
        .leaflet-control-recenter:last-child {
          border-bottom: none;
          border-bottom-left-radius: 4px;
          border-bottom-right-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default OpenStreetMap;
