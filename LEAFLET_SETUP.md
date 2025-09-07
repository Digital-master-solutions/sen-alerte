# Configuration Leaflet

## Dépendances

Leaflet est déjà installé dans le projet (`leaflet` et `@types/leaflet` dans `package.json`).

## Fonctionnalités du composant LeafletMap

### ✅ Caractéristiques principales
- **Carte interactive** avec Leaflet (remplace MapLibreMap et OpenStreetMap)
- **Marqueurs pour les signalements** avec popups informatifs
- **Marqueur de position utilisateur** avec animation de pulsation
- **Sélecteur de style de carte** intégré
- **Bouton de recentrage** sur la position utilisateur
- **Contrôles de zoom** personnalisés

### 🗺️ Styles de carte disponibles
1. **OpenStreetMap** - Carte routière classique (par défaut)
2. **Satellite** - Vue satellite haute résolution (ESRI)
3. **Terrain** - Carte topographique (OpenTopoMap)
4. **Sombre** - Style sombre élégant (CARTO)

### 🎯 Contrôles utilisateur
- **Zoom** : Boutons +/- et zoom tactile
- **Recentrage** : Bouton ⌖ pour revenir à sa position
- **Style** : Menu déroulant pour changer le style de carte
- **Navigation** : Déplacement tactile et clavier désactivé

### 📍 Marqueurs
- **Position utilisateur** : Cercle vert avec animation de pulsation
- **Signalements** : Cercles bleus avec popups détaillés
- **Popups** : Informations sur le type, statut et date des signalements

## Utilisation

```tsx
import LeafletMap from "@/components/LeafletMap";

// Utilisation simple
<LeafletMap className="h-full w-full" />

// Avec styles personnalisés
<LeafletMap className="absolute inset-0" />
```

## Avantages de Leaflet

- ✅ **Gratuit et open source**
- ✅ **Léger et performant**
- ✅ **Large écosystème de plugins**
- ✅ **Support mobile excellent**
- ✅ **Documentation complète**
- ✅ **Communauté active**

## Remplacement des composants

- ❌ `MapLibreMap` → ✅ `LeafletMap`
- ❌ `OpenStreetMap` → ✅ `LeafletMap`

Le composant LeafletMap unifie et améliore les fonctionnalités des deux composants précédents.
