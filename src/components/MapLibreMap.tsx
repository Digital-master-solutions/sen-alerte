import React, { useEffect, useRef } from "react";
import maplibregl, { Map as MlMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { supabase } from "@/integrations/supabase/client";

interface MapLibreMapProps {
  className?: string;
}

const MapLibreMap: React.FC<MapLibreMapProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [-14.4524, 14.4974], // Sénégal approx
      zoom: 5.2,
    });
    mapRef.current = map;

    const nav = new maplibregl.NavigationControl({ visualizePitch: true });
    map.addControl(nav, "top-right");

    map.scrollZoom.disable();

    let markers: Marker[] = [];

    const loadReports = async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id, latitude, longitude, type, status, created_at")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("Erreur chargement reports:", error);
        return;
      }

      // Clear existing markers
      markers.forEach((m) => m.remove());
      markers = [];

      data?.forEach((r) => {
        if (r.longitude == null || r.latitude == null) return;
        const el = document.createElement("div");
        el.className =
          "rounded-full border border-foreground/20 bg-primary/80 shadow-md w-3.5 h-3.5";
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([r.longitude, r.latitude])
          .addTo(map);
        markers.push(marker);
      });
    };

    map.on("load", loadReports);

    return () => {
      markers.forEach((m) => m.remove());
      map.remove();
    };
  }, []);

  return (
    <div className={className}>
      <div ref={containerRef} className="absolute inset-0 rounded-xl" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background/0 via-background/0 to-background/30 rounded-xl" />
    </div>
  );
};

export default MapLibreMap;
