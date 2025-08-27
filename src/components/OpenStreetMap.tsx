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

  useEffect(() => {
    // Request location if not available
    if (!currentLocation) {
      requestLocation();
    }
  }, [currentLocation, requestLocation]);

  useEffect(() => {
    if (!mapRef.current || !currentLocation) return;

    const userPosition: [number, number] = [currentLocation.latitude, currentLocation.longitude];

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        scrollWheelZoom: false, // Désactiver le zoom avec la molette
        doubleClickZoom: false, // Désactiver le zoom au double clic
        touchZoom: true, // Garder le zoom tactile
        boxZoom: false, // Désactiver le zoom par sélection
        keyboard: false // Désactiver les contrôles clavier
      }).setView(userPosition, 15);

      // Add reliable tile layer with fallback servers for production
      const primaryTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
        crossOrigin: true
      });

      // Add fallback tile layer
      const fallbackTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        crossOrigin: true
      });

      // Try primary first, fallback if it fails
      primaryTileLayer.addTo(mapInstanceRef.current);
      
      primaryTileLayer.on('tileerror', () => {
        console.warn('Primary tile server failed, switching to fallback');
        mapInstanceRef.current?.removeLayer(primaryTileLayer);
        fallbackTileLayer.addTo(mapInstanceRef.current!);
      });

      // Add custom controls with recenter button
      const customControl = L.Control.extend({
        onAdd: function(map: L.Map) {
          const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
          
          // Zoom In button
          const zoomInBtn = L.DomUtil.create('a', 'leaflet-control-zoom-in', container);
          zoomInBtn.innerHTML = '+';
          zoomInBtn.href = '#';
          zoomInBtn.title = 'Zoom avant';
          
          // Zoom Out button
          const zoomOutBtn = L.DomUtil.create('a', 'leaflet-control-zoom-out', container);
          zoomOutBtn.innerHTML = '−';
          zoomOutBtn.href = '#';
          zoomOutBtn.title = 'Zoom arrière';
          
          // Recenter button
          const recenterBtn = L.DomUtil.create('a', 'leaflet-control-recenter', container);
          recenterBtn.innerHTML = '⌖';
          recenterBtn.href = '#';
          recenterBtn.title = 'Recentrer sur ma position';
          
          // Style the recenter button
          recenterBtn.style.fontSize = '18px';
          recenterBtn.style.lineHeight = '26px';
          recenterBtn.style.textAlign = 'center';
          
          L.DomEvent.on(zoomInBtn, 'click', function(e) {
            L.DomEvent.preventDefault(e);
            map.zoomIn();
          });
          
          L.DomEvent.on(zoomOutBtn, 'click', function(e) {
            L.DomEvent.preventDefault(e);
            map.zoomOut();
          });
          
          L.DomEvent.on(recenterBtn, 'click', function(e) {
            L.DomEvent.preventDefault(e);
            if (navigator.geolocation) {
              requestLocation().then(() => {
                if (currentLocation) {
                  map.setView([currentLocation.latitude, currentLocation.longitude], 15);
                }
              });
            }
          });
          
          return container;
        }
      });
      
      // Remove default zoom control and add custom control
      mapInstanceRef.current.zoomControl.remove();
      new customControl({ position: 'topright' }).addTo(mapInstanceRef.current);
    }

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Add user location marker with custom icon
    const userMarker = L.marker(userPosition, {
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
    }).addTo(mapInstanceRef.current!);
    
    userMarker.bindPopup('<strong>Votre position actuelle</strong>');
    markersRef.current.push(userMarker);


    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [currentLocation, requestLocation]);

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