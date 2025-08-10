import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Report {
  id: string;
  latitude: number;
  longitude: number;
  type: string;
  description: string;
  status: string;
  created_at: string;
}

interface OpenStreetMapProps {
  className?: string;
}

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({ className }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserPosition([latitude, longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Dakar center if geolocation fails
          setUserPosition([14.693425, -17.447938]);
        }
      );
    } else {
      // Default to Dakar center if geolocation is not supported
      setUserPosition([14.693425, -17.447938]);
    }

    // Load reports from Supabase
    const loadReports = async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('id, latitude, longitude, type, description, status, created_at')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

        if (error) {
          console.error('Error loading reports:', error);
          return;
        }

        setReports(data || []);
      } catch (error) {
        console.error('Error loading reports:', error);
      }
    };

    loadReports();
  }, []);

  useEffect(() => {
    if (!mapRef.current || !userPosition) return;

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        scrollWheelZoom: false, // Désactiver le zoom avec la molette
        doubleClickZoom: false, // Désactiver le zoom au double clic
        touchZoom: true, // Garder le zoom tactile
        boxZoom: false, // Désactiver le zoom par sélection
        keyboard: false // Désactiver les contrôles clavier
      }).setView(userPosition, 15);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

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
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const { latitude, longitude } = position.coords;
                  map.setView([latitude, longitude], 15);
                  setUserPosition([latitude, longitude]);
                },
                (error) => {
                  console.error('Error getting location:', error);
                }
              );
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

    // Add report markers
    reports.forEach((report) => {
      const reportMarker = L.marker([report.latitude, report.longitude], {
        icon: L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [20, 32],
          iconAnchor: [10, 32],
          popupAnchor: [1, -28],
          shadowSize: [32, 32],
          className: 'report-marker'
        })
      }).addTo(mapInstanceRef.current!);

      const statusColor = report.status === 'resolu' ? 'green' : 
                         report.status === 'en-cours' ? 'orange' : 'red';
      
      reportMarker.bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="font-weight: 600; font-size: 14px; margin-bottom: 8px;">${report.type}</h3>
          <p style="font-size: 12px; color: #666; margin-bottom: 12px;">${report.description}</p>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px;">
            <span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 4px;">
              ${report.status}
            </span>
            <span style="color: #666;">
              ${new Date(report.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      `);
      
      markersRef.current.push(reportMarker);
    });

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userPosition, reports]);

  if (!userPosition) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <p className="text-muted-foreground">Chargement de la carte...</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} className="rounded-lg" />
      
      {/* Custom styles for markers and controls */}
      <style>{`
        .current-location-marker {
          background: transparent !important;
          border: none !important;
        }
        .report-marker {
          filter: hue-rotate(240deg) saturate(1.2);
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