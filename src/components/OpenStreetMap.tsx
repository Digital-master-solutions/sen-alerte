import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocationStore } from '@/stores/locationStore';
import { useSettingsStore } from '@/stores/settingsStore';

// Configuration des tuiles selon le thème
const TILE_LAYERS = {
  light: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  dark: {
    // Stadia Alidade Smooth Dark - palette gris/bleu élégante, moins noire
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://stadiamaps.com/">Stadia Maps</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }
};

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
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [gpsPosition, setGpsPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingPosition, setPendingPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const { currentLocation, setCurrentLocation, lastUpdateTime } = useLocationStore();
  const { display } = useSettingsStore();
  
  // Déterminer si on est en mode sombre
  const isDarkMode = display.theme === 'dark' || 
    (display.theme === 'system' && 
     typeof window !== 'undefined' && 
     window.matchMedia('(prefers-color-scheme: dark)').matches);
  
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
    
    // Ajouter le popup au marqueur avec support du mode sombre
    const popupBgClass = isDarkMode ? 'bg-gray-800' : 'bg-gray-50';
    const popupBorderClass = isDarkMode ? 'border-gray-600' : 'border-gray-200';
    const popupTextClass = isDarkMode ? 'text-gray-100' : 'text-gray-800';
    const popupSubTextClass = isDarkMode ? 'text-gray-300' : 'text-gray-700';
    
    gpsMarkerRef.current.bindPopup(`
      <div class="p-4 text-center min-w-[320px] ${isDarkMode ? 'dark-popup' : ''}">
        <div class="font-semibold text-green-500 mb-3 text-lg">📍 Position GPS</div>
        <div class="space-y-3 text-sm">
          <div class="${popupBgClass} border ${popupBorderClass} rounded-lg p-3">
            <div class="font-medium ${popupTextClass} mb-2">Coordonnées GPS :</div>
            <div class="font-mono text-xs ${popupSubTextClass} space-y-1">
              <div class="flex justify-between">
                <span class="font-medium">Latitude:</span>
                <span class="text-green-500">${position.lat.toFixed(7)}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Longitude:</span>
                <span class="text-green-500">${position.lng.toFixed(7)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `, {
      maxWidth: 350,
      className: 'custom-popup'
    });
  }, [isDarkMode]);

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
      setIsLocating(false);
      return;
    }

    isGettingPositionRef.current = true;
    setIsLocating(true);
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
      
      setIsLocating(false);
      
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
      setIsLocating(false);
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

    // Initialiser la carte avec interactions zoom désactivées (sauf boutons)
    const map = L.map(mapRef.current, {
      center: [14.7167, -17.4677], // Dakar
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,     // Désactiver zoom molette
      doubleClickZoom: false,     // Désactiver zoom double-clic
      touchZoom: false,           // Désactiver zoom pincement mobile
      boxZoom: false,             // Désactiver zoom par sélection
      keyboard: false             // Désactiver zoom clavier (+/- keys)
    });

    mapInstanceRef.current = map;

    // Ajouter la couche de tuiles selon le thème actuel
    const tileConfig = isDarkMode ? TILE_LAYERS.dark : TILE_LAYERS.light;
    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 19
    }).addTo(map);

    // Ajouter les contrôles personnalisés
    const addControls = () => {
      if (!mapInstanceRef.current) return;
      const mapInstance = mapInstanceRef.current;
      
      const existingControls = mapInstance.getContainer().querySelectorAll('.leaflet-control-custom');
      existingControls.forEach(control => control.remove());

      // Couleurs pour mode sombre plus visibles
      const controlBgColor = isDarkMode ? '#374151' : 'white';
      const controlBorderColor = isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)';
      const controlShadowColor = isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)';
      
      // Couleurs des icônes selon le thème
      const zoomIconColor = isDarkMode ? '#f3f4f6' : '#3b82f6';
      const locateIconColor = isDarkMode ? '#f3f4f6' : '#22c55e';

      // Icônes SVG avec couleurs explicites
      const svgIcons = {
        zoomIn: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${zoomIconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>`,
        zoomOut: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${zoomIconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>`,
        locate: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${locateIconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <line x1="12" y1="2" x2="12" y2="6"/>
          <line x1="12" y1="18" x2="12" y2="22"/>
          <line x1="2" y1="12" x2="6" y2="12"/>
          <line x1="18" y1="12" x2="22" y2="12"/>
        </svg>`
      };

      const createSimpleControl = (svgIcon: string, title: string, onClick: () => void, hoverColor: string, top: string) => {
        const container = document.createElement('div');
        container.className = 'leaflet-control leaflet-control-custom';
        const controlHoverBorderColor = isDarkMode ? '#60a5fa' : hoverColor;
        
        container.style.cssText = `
          position: absolute;
          top: ${top};
          right: 10px;
          z-index: 1000;
          background: ${controlBgColor};
          border-radius: 10px;
          box-shadow: 0 4px 14px ${controlShadowColor};
          transition: all 0.2s ease;
        `;
        
        const button = document.createElement('a');
        button.className = 'leaflet-control-button';
        button.innerHTML = svgIcon;
        button.title = title;
        button.href = '#';
        
        button.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          background: ${controlBgColor};
          border: 2px solid ${controlBorderColor};
          border-radius: 10px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px ${controlShadowColor};
        `;

        button.addEventListener('click', (e) => {
          e.preventDefault();
          onClick();
        });

        button.addEventListener('mouseenter', () => {
          button.style.transform = 'scale(1.08)';
          button.style.boxShadow = `0 6px 18px ${controlShadowColor}`;
          button.style.borderColor = controlHoverBorderColor;
          button.style.background = isDarkMode ? '#4b5563' : '#f8fafc';
        });

        button.addEventListener('mouseleave', () => {
          button.style.transform = 'scale(1)';
          button.style.boxShadow = `0 4px 12px ${controlShadowColor}`;
          button.style.borderColor = controlBorderColor;
          button.style.background = controlBgColor;
        });

        container.appendChild(button);
        return container;
      };

      const locationButton = createSimpleControl(
        svgIcons.locate,
        'Localiser ma position précisément',
        () => {
          console.log('🎯 Bouton de localisation cliqué');
          getExactGPSPosition();
        },
        '#22c55e',
        '10px'
      );

      const zoomInButton = createSimpleControl(
        svgIcons.zoomIn,
        'Zoomer (agrandir)',
        () => mapInstance.zoomIn(),
        '#3b82f6',
        '60px'
      );

      const zoomOutButton = createSimpleControl(
        svgIcons.zoomOut,
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

  // Changer les tuiles quand le thème change
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    
    const map = mapInstanceRef.current;
    const tileConfig = isDarkMode ? TILE_LAYERS.dark : TILE_LAYERS.light;
    
    // Supprimer l'ancienne couche et ajouter la nouvelle
    map.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 19
    }).addTo(map);
    
    // Recréer les contrôles avec les bonnes couleurs
    const existingControls = map.getContainer().querySelectorAll('.leaflet-control-custom');
    existingControls.forEach(control => control.remove());
    
    // Reconstruire les contrôles avec le bon thème (simplifié - les recréer au prochain render suffit)
    console.log('🎨 Thème changé, tuiles mises à jour:', isDarkMode ? 'sombre' : 'clair');
  }, [isDarkMode]);


  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Overlay de chargement qui masque la carte tant que la position n'est pas obtenue */}
      {isLocating && !gpsPosition && (
        <div className="absolute inset-0 z-[1002] bg-background flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-foreground">
              Localisation en cours...
            </p>
            <p className="text-sm text-muted-foreground">
              Veuillez patienter pendant que nous recherchons votre position GPS
            </p>
          </div>
        </div>
      )}
      
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
          background: white;
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 0;
          padding: 0;
        }
        
        .custom-popup .leaflet-popup-tip {
          background: white;
          border: 1px solid rgba(0,0,0,0.1);
        }
        
        /* Mode sombre pour les popups */
        .dark .custom-popup .leaflet-popup-content-wrapper {
          background: #1f2937 !important;
          color: #f3f4f6 !important;
          border-color: rgba(255,255,255,0.15) !important;
        }
        
        .dark .custom-popup .leaflet-popup-tip {
          background: #1f2937 !important;
          border-color: rgba(255,255,255,0.15) !important;
        }
        
        .dark .custom-popup .leaflet-popup-close-button {
          color: #f3f4f6 !important;
        }
        
        .dark .custom-popup .leaflet-popup-close-button:hover {
          color: white !important;
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
        
        /* Attribution en mode sombre */
        .dark .leaflet-control-attribution {
          background: rgba(17, 24, 39, 0.95) !important;
          color: rgba(255, 255, 255, 0.7) !important;
        }
        
        .dark .leaflet-control-attribution a {
          color: rgba(167, 243, 208, 0.9) !important;
        }
        
        /* Amélioration des couleurs du popup en mode sombre */
        .dark-popup .bg-gray-800 {
          background-color: #374151 !important;
        }
        
        .dark-popup .text-gray-100 {
          color: #f3f4f6 !important;
        }
        
        .dark-popup .text-gray-300 {
          color: #d1d5db !important;
        }
        
        .dark-popup .border-gray-600 {
          border-color: #4b5563 !important;
        }
      `}</style>
    </div>
  );
};

export default OpenStreetMap;