import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

// Custom icons
const currentLocationIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'current-location-marker'
});

const reportIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -28],
  shadowSize: [32, 32],
  className: 'report-marker'
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

function LocationUpdater({ position }: { position: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView(position, 13);
    }
  }, [position, map]);
  
  return null;
}

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({ className }) => {
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

  if (!userPosition) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <p className="text-muted-foreground">Chargement de la carte...</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <MapContainer
        center={userPosition}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <LocationUpdater position={userPosition} />
        
        {/* User's current location marker */}
        <Marker position={userPosition} icon={currentLocationIcon}>
          <Popup>
            <strong>Votre position actuelle</strong>
          </Popup>
        </Marker>
        
        {/* Reports markers */}
        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={reportIcon}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-semibold text-sm mb-1">{report.type}</h3>
                <p className="text-xs text-muted-foreground mb-2">{report.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-1 rounded text-white ${
                    report.status === 'resolu' ? 'bg-green-500' :
                    report.status === 'en-cours' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}>
                    {report.status}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Custom styles for markers */}
      <style>{`
        .current-location-marker {
          filter: hue-rotate(120deg) saturate(1.5);
        }
        .report-marker {
          filter: hue-rotate(240deg) saturate(1.2);
        }
      `}</style>
    </div>
  );
};

export default OpenStreetMap;