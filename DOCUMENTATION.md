
# Documentation SenAlerte

## Vue d'ensemble

**SenAlerte** est une plateforme de signalement citoyen pour le Sénégal, permettant aux citoyens de signaler des problèmes urbains (voirie, éclairage public, propreté, etc.) et aux organisations municipales de les traiter efficacement.

### 🎯 Objectifs du projet
- **Démocratiser le signalement** : Permettre à tous les citoyens de signaler facilement des problèmes urbains
- **Améliorer la réactivité** : Connecter directement les citoyens aux services compétents
- **Transparence** : Suivi en temps réel du traitement des signalements
- **Efficacité** : Optimiser la gestion des ressources municipales
- **Données** : Collecter des statistiques pour améliorer la ville

### 📊 Métriques clés
- **Temps de résolution moyen** : < 48h pour les urgences
- **Taux de satisfaction** : > 85% des citoyens satisfaits
- **Couverture géographique** : Département de Dakar (extensible)
- **Types de signalements** : 7+ catégories principales

### Informations générales
- **Nom du projet** : SenAlerte
- **Version** : 1.0.0
- **Développeur** : Digital Master Solution
- **Contact** : digitalmsolution2025@gmail.com
- **Site web** : https://dms-sn.com
- **Déploiement** : Vercel
- **Base de données** : Supabase (PostgreSQL)
- **Domaine** : Département de Dakar, Sénégal
- **Langues** : Français (principal), Wolof (prévu)

## Architecture technique

### Stack technologique

#### Frontend
- **Framework** : React 18.3.1 avec TypeScript
- **Build tool** : Vite 5.4.19
- **Routing** : React Router DOM 6.30.1
- **State Management** : Zustand 5.0.8 avec Immer
- **UI Components** : shadcn/ui (Radix UI + Tailwind CSS)
- **Forms** : React Hook Form 7.61.1 avec Zod validation
- **Maps** : Leaflet 1.9.4, MapLibre GL 4.7.1, Mapbox GL 3.14.0
- **Charts** : Recharts 2.15.4
- **Notifications** : Sonner 1.7.4

#### Backend & Base de données
- **Backend** : Supabase (PostgreSQL + Edge Functions)
- **Authentification** : JWT avec refresh tokens
- **Storage** : Supabase Storage pour photos et audio
- **Real-time** : Supabase Realtime
- **Migrations** : Supabase CLI

#### Développement
- **Linting** : ESLint 9.32.0
- **Styling** : Tailwind CSS 3.4.17
- **Package Manager** : npm/pnpm
- **TypeScript** : 5.8.3

## Structure du projet

```
sen-alerte/
├── src/
│   ├── components/          # Composants React réutilisables
│   │   ├── admin/          # Composants spécifiques à l'admin
│   │   │   └── AdminSidebar.tsx
│   │   ├── organization/   # Composants pour les organisations
│   │   │   ├── OrganizationSidebar.tsx
│   │   │   ├── OrganizationSignupStepper.tsx
│   │   │   ├── ReportCard.tsx
│   │   │   ├── ReportDetailsDialog.tsx
│   │   │   └── signup-steps/ # Étapes d'inscription
│   │   ├── ui/            # Composants UI de base (shadcn/ui)
│   │   │   ├── button.tsx, input.tsx, card.tsx, etc.
│   │   │   └── ... (40+ composants UI)
│   │   ├── AudioPlayer.tsx # Lecteur audio pour signalements
│   │   ├── MapLibreMap.tsx # Composant carte interactive
│   │   ├── MobileCameraCapture.tsx # Capture photo mobile
│   │   ├── MobileAudioRecorder.tsx # Enregistrement audio mobile
│   │   └── ... # Autres composants utilitaires
│   ├── pages/             # Pages de l'application
│   │   ├── admin/         # Interface d'administration
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Reports.tsx
│   │   │   ├── Organizations.tsx
│   │   │   ├── Users.tsx
│   │   │   ├── Categories.tsx
│   │   │   └── Settings.tsx
│   │   ├── organization/  # Interface des organisations
│   │   │   ├── OrganizationLayout.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── AvailableReports.tsx
│   │   │   ├── ManagedReports.tsx
│   │   │   ├── Notifications.tsx
│   │   │   └── Settings.tsx
│   │   ├── Index.tsx      # Page d'accueil
│   │   ├── Report.tsx     # Formulaire de signalement
│   │   ├── MyReports.tsx  # Mes signalements
│   │   ├── Notifications.tsx # Notifications citoyens
│   │   ├── About.tsx      # À propos
│   │   └── NotFound.tsx   # Page 404
│   ├── stores/           # Gestion d'état (Zustand)
│   │   ├── authStore.ts  # Authentification
│   │   ├── locationStore.ts # Géolocalisation
│   │   ├── reportsStore.ts # Signalements
│   │   ├── settingsStore.ts # Paramètres
│   │   └── index.ts      # Exports centralisés
│   ├── hooks/            # Hooks React personnalisés
│   │   ├── use-mobile.tsx # Détection mobile
│   │   ├── useMobilePermissions.ts # Permissions mobile
│   │   ├── useRealtimeLocation.ts # Géolocalisation temps réel
│   │   └── useSecurityLogging.ts # Logs de sécurité
│   ├── integrations/     # Intégrations externes
│   │   ├── supabase/     # Configuration Supabase
│   │   │   ├── client.ts # Client Supabase
│   │   │   └── types.ts  # Types TypeScript
│   │   └── mapbox/       # Configuration cartes
│   ├── services/         # Services métier
│   │   └── categoryService.ts # Gestion des catégories
│   ├── utils/            # Utilitaires
│   │   ├── auth-messages.ts # Messages d'authentification
│   │   └── performance.ts # Optimisations performance
│   ├── App.tsx           # Composant racine
│   ├── main.tsx          # Point d'entrée
│   └── index.css         # Styles globaux
├── supabase/
│   ├── config.toml       # Configuration Supabase
│   ├── migrations/       # Migrations de base de données (68 fichiers)
│   └── functions/        # Edge Functions
│       ├── auth-login/   # Authentification
│       ├── auth-refresh/ # Renouvellement tokens
│       ├── auth-validate/ # Validation sessions
│       └── geocode-reverse/ # Géocodage inverse
├── public/              # Assets statiques
│   ├── favicon.ico
│   ├── manifest.json    # PWA manifest
│   ├── robots.txt
│   ├── sitemap.xml
│   └── lovable-uploads/ # Images uploadées
├── dist/                # Build de production
├── package.json         # Dépendances et scripts
├── vite.config.ts       # Configuration Vite
├── tailwind.config.ts   # Configuration Tailwind
├── tsconfig.json        # Configuration TypeScript
├── vercel.json          # Configuration Vercel
└── README.md            # Documentation de base
```

## Fonctionnalités principales

### 1. 🚨 Signalement citoyen
- **Interface de signalement** : Formulaire complet avec géolocalisation automatique
- **Types de signalements** : 
  - Problème de voirie (nids de poule, routes endommagées)
  - Éclairage public défaillant
  - Propreté urbaine (déchets, encombrants)
  - Mobilier urbain cassé (bancs, poubelles)
  - Espaces verts mal entretenus
  - Signalisation manquante
  - Problèmes électriques
- **Médias** : 
  - Upload de photos (max 5MB, formats JPG/PNG)
  - Enregistrement audio (max 2 minutes)
  - Capture photo directe via caméra mobile
- **Géolocalisation** : 
  - GPS automatique avec précision métrique
  - Fallback manuel avec saisie des coordonnées
  - Géocodage inverse pour adresses
- **Code de suivi** : Code unique 8 caractères (ex: A2B3C4D5)
- **Validation** : Vérification des données avec Zod schemas
- **Accessibilité** : Interface optimisée pour tous les appareils

### 2. 👨‍💼 Interface d'administration
- **Tableau de bord** : 
  - Statistiques en temps réel (signalements, résolutions)
  - Métriques de performance (temps moyen de résolution)
  - Graphiques de tendances (Recharts)
  - Alertes et notifications importantes
- **Gestion des signalements** : 
  - Liste complète avec filtres avancés
  - Assignation aux organisations
  - Modification du statut et priorité
  - Ajout de notes de résolution
  - Export des données
- **Gestion des organisations** : 
  - Approbation/rejet des demandes d'inscription
  - Configuration des permissions
  - Gestion des catégories assignées
  - Suivi de l'activité
- **Gestion des utilisateurs** : 
  - CRUD complet pour les super-admins
  - Gestion des sessions actives
  - Audit des connexions
- **Gestion des catégories** : 
  - Création/modification des types de signalements
  - Association aux organisations
  - Statistiques par catégorie

### 3. 🏢 Interface organisation
- **Tableau de bord** : 
  - Vue des signalements assignés
  - Statistiques de performance
  - Alertes et notifications
- **Signalements disponibles** : 
  - Liste des signalements non assignés
  - Filtrage par catégorie et localisation
  - Système de prise en charge
- **Signalements gérés** : 
  - Suivi des signalements en cours
  - Mise à jour du statut
  - Ajout de photos de résolution
  - Communication avec les citoyens
- **Notifications** : 
  - Système de messagerie intégré
  - Notifications push en temps réel
  - Historique des communications
- **Paramètres** : 
  - Configuration du profil organisation
  - Gestion des préférences
  - Paramètres de notification

### 4. ⚙️ Fonctionnalités techniques
- **Authentification JWT** : 
  - Sessions sécurisées avec refresh automatique
  - Gestion des tokens avec expiration
  - Logout automatique en cas d'inactivité
- **Géolocalisation temps réel** : 
  - Suivi GPS continu pendant le signalement
  - Mise à jour automatique des coordonnées
  - Cache des adresses pour optimisation
- **Upload de fichiers** : 
  - Photos avec compression automatique
  - Audio avec validation de durée
  - Stockage sécurisé sur Supabase Storage
- **Notifications push** : 
  - Système de notifications en temps réel
  - Notifications par email (prévu)
  - Intégration PWA pour notifications natives
- **Responsive design** : 
  - Interface adaptée mobile/tablet/desktop
  - Optimisation pour les écrans tactiles
  - Mode sombre (prévu)
- **PWA ready** : 
  - Manifest.json configuré
  - Service Worker (prévu)
  - Installation sur appareils mobiles
- **Performance** : 
  - Lazy loading des composants
  - Code splitting automatique
  - Optimisation des images
  - Cache intelligent des données

## Base de données

### Tables principales

#### `reports` - Signalements
```sql
- id: UUID (clé primaire)
- description: TEXT (description du problème)
- type: TEXT (catégorie du signalement)
- status: TEXT (en-attente, en-cours, resolu, rejete)
- priority: TEXT (low, normal, high, urgent)
- latitude/longitude: NUMERIC (coordonnées GPS)
- anonymous_code: TEXT (code de suivi)
- anonymous_name/phone: TEXT (contact citoyen)
- photo_url/audio_url: TEXT (médias)
- assigned_organization_id: UUID (organisation assignée)
- created_at/updated_at: TIMESTAMP
```

#### `organizations` - Organisations
```sql
- id: UUID (clé primaire)
- name: TEXT (nom de l'organisation)
- email: TEXT (email de contact)
- type: TEXT (municipalité, service public, etc.)
- status: TEXT (pending, approved, rejected)
- city/address: TEXT (localisation)
- permissions: TEXT[] (permissions accordées)
- created_at: TIMESTAMP
```

#### `superadmin` - Super-administrateurs
```sql
- id: UUID (clé primaire)
- username: TEXT (nom d'utilisateur)
- name: TEXT (nom complet)
- email: TEXT (email)
- password_hash: TEXT (mot de passe hashé)
- status: TEXT (actif/inactif)
- last_login: TIMESTAMP
```

#### `categorie` - Catégories de signalements
```sql
- id: UUID (clé primaire)
- nom: TEXT (nom de la catégorie)
```

### Tables de support
- `notifications` : Notifications aux citoyens
- `messagerie` : Messages entre organisations et admin
- `admin_notifications` : Notifications pour les admins
- `login_logs` : Logs de connexion
- `security_logs` : Logs de sécurité
- `user_sessions` : Sessions utilisateurs
- `refresh_tokens` : Tokens de rafraîchissement

## Authentification et sécurité

### Système d'authentification
- **JWT Tokens** : Authentification stateless
- **Refresh Tokens** : Renouvellement automatique des sessions
- **RLS (Row Level Security)** : Sécurité au niveau des lignes
- **Audit logs** : Traçabilité complète des actions

### Types d'utilisateurs
1. **Citoyens** : Accès public pour signaler
2. **Organisations** : Accès authentifié pour traiter les signalements
3. **Super-administrateurs** : Accès complet à toutes les fonctionnalités

### Sécurité
- **Hachage des mots de passe** : bcrypt
- **Validation des données** : Zod schemas
- **CORS** : Configuration sécurisée
- **Rate limiting** : Protection contre les abus
- **Logs de sécurité** : Monitoring des tentatives d'intrusion

## API et intégrations

### Supabase Edge Functions
- `auth-login` : Authentification JWT
- `auth-refresh` : Renouvellement des tokens
- `auth-validate` : Validation des sessions
- `geocode-reverse` : Géocodage inverse

### Services externes
- **Maps** : OpenStreetMap, Mapbox, MapLibre
- **Storage** : Supabase Storage pour les médias
- **Geolocation** : API de géolocalisation du navigateur

## Déploiement

### 🚀 Environnements

#### Développement local
```bash
# Installation des dépendances
pnpm install

# Démarrage du serveur de développement
pnpm run dev
# → http://localhost:5173

# Linting
pnpm run lint

# Build de développement
pnpm run build:dev
```

#### Production (Vercel)
- **Déploiement automatique** : Push sur branche `prod`
- **URL de production** : https://sen-alerte.vercel.app
- **Build automatique** : `pnpm run build`
- **Preview** : `pnpm run preview`

### ⚙️ Configuration

#### Variables d'environnement
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Maps (optionnel)
VITE_MAPBOX_TOKEN=your_mapbox_token

# Analytics (prévu)
VITE_ANALYTICS_ID=your_analytics_id
```

#### Configuration Vercel (`vercel.json`)
```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### Configuration Vite (`vite.config.ts`)
- **Build optimisé** : Minification, tree-shaking
- **Code splitting** : Chunks automatiques
- **Assets** : Optimisation des images
- **PWA** : Service Worker (prévu)

### 📦 Scripts disponibles
```json
{
  "dev": "vite",                    // Serveur de développement
  "build": "vite build",            // Build de production
  "build:dev": "vite build --mode development", // Build de développement
  "lint": "eslint .",               // Linting du code
  "preview": "vite preview"         // Preview du build
}
```

### 🔧 Optimisations de build
- **Bundle size** : ~960KB (compressé : ~276KB)
- **Code splitting** : Chunks séparés par route
- **Tree shaking** : Suppression du code inutilisé
- **Minification** : CSS et JS optimisés
- **Compression** : Gzip automatique sur Vercel

## Utilisation

### 👥 Pour les citoyens

#### Signalement d'un problème
1. **Accès** : Aller sur la page d'accueil
2. **Démarrage** : Cliquer sur le bouton "Signaler" (bouton flottant)
3. **Formulaire** : Remplir les informations :
   - **Type de problème** : Sélectionner dans la liste déroulante
   - **Description** : Décrire le problème en détail (min 10 caractères)
   - **Informations personnelles** : Nom complet et numéro de téléphone
   - **Médias** (optionnel) :
     - Photo : Upload depuis galerie ou capture directe
     - Audio : Enregistrement vocal (max 2 minutes)
4. **Géolocalisation** : 
   - Autoriser l'accès GPS (recommandé)
   - Ou saisir manuellement les coordonnées
5. **Envoi** : Cliquer sur "Envoyer le signalement"
6. **Confirmation** : Recevoir un code de suivi unique (ex: A2B3C4D5)

#### Suivi des signalements
- **Page "Mes signalements"** : Voir l'historique des signalements
- **Code de suivi** : Utiliser le code reçu pour suivre le statut
- **Notifications** : Recevoir des mises à jour par email (prévu)

### 🏢 Pour les organisations

#### Inscription
1. **Demande** : Aller sur `/organization/signup`
2. **Informations** : Remplir le formulaire d'inscription :
   - Nom de l'organisation
   - Type (municipalité, service public, etc.)
   - Email et téléphone
   - Adresse et ville
3. **Validation** : Attendre l'approbation par un administrateur
4. **Notification** : Recevoir un email de confirmation

#### Utilisation de la plateforme
1. **Connexion** : Se connecter via `/organization/login`
2. **Tableau de bord** : Vue d'ensemble des signalements assignés
3. **Signalements disponibles** : 
   - Consulter les signalements non assignés
   - Filtrer par catégorie et localisation
   - Prendre en charge un signalement
4. **Gestion** : 
   - Mettre à jour le statut (en cours, résolu, rejeté)
   - Ajouter des notes de résolution
   - Uploader des photos de résolution
5. **Communication** : 
   - Répondre aux citoyens via le système de messagerie
   - Recevoir des notifications en temps réel

### 👨‍💼 Pour les administrateurs

#### Connexion
1. **Accès** : Se connecter via `/admin/login`
2. **Identifiants** : Utiliser les credentials super-admin
3. **Sécurité** : Session sécurisée avec JWT

#### Gestion de la plateforme
1. **Tableau de bord** : 
   - Statistiques en temps réel
   - Métriques de performance
   - Alertes importantes
2. **Signalements** : 
   - Vue d'ensemble de tous les signalements
   - Filtres avancés par statut, priorité, date
   - Assignation aux organisations
   - Export des données
3. **Organisations** : 
   - Approbation/rejet des demandes d'inscription
   - Gestion des permissions
   - Configuration des catégories assignées
4. **Utilisateurs** : 
   - Gestion des comptes super-admin
   - Audit des connexions
   - Gestion des sessions
5. **Configuration** : 
   - Gestion des catégories de signalements
   - Paramètres système
   - Configuration des notifications

### 📱 Utilisation mobile

#### Optimisations mobiles
- **Interface responsive** : Adaptation automatique à tous les écrans
- **Géolocalisation** : GPS précis pour les signalements
- **Caméra** : Capture photo directe intégrée
- **Audio** : Enregistrement vocal optimisé
- **Performance** : Chargement rapide même sur connexions lentes

#### PWA (Progressive Web App)
- **Installation** : Ajouter à l'écran d'accueil
- **Mode hors ligne** : Fonctionnalités de base disponibles
- **Notifications** : Alertes push natives (prévu)
- **Synchronisation** : Données synchronisées automatiquement

## Maintenance et monitoring

### Logs et monitoring
- **Logs d'authentification** : Suivi des connexions
- **Logs de sécurité** : Monitoring des tentatives d'intrusion
- **Logs système** : Traçabilité des actions importantes
- **Métriques** : Statistiques de performance

### Sauvegarde
- **Base de données** : Sauvegarde automatique Supabase
- **Fichiers** : Stockage redondant Supabase Storage
- **Code** : Versioning Git

## Roadmap et améliorations

### 🚀 Fonctionnalités futures (Q2 2025)

#### Application mobile native
- **iOS/Android** : Développement avec React Native ou Flutter
- **Notifications push** : Intégration FCM/APNS
- **Mode hors ligne** : Synchronisation des données
- **Géolocalisation avancée** : Suivi en arrière-plan

#### Analytics et reporting
- **Tableaux de bord avancés** : Métriques détaillées par zone
- **Rapports automatisés** : Génération de rapports périodiques
- **Heatmaps** : Visualisation des zones problématiques
- **Prédictions** : IA pour anticiper les problèmes

#### Communication améliorée
- **Notifications email** : Alertes automatiques
- **SMS** : Notifications par SMS pour les urgences
- **Chat en temps réel** : Communication directe citoyen-organisation
- **Réseaux sociaux** : Intégration Twitter/Facebook

### 🌍 Internationalisation (Q3 2025)

#### Multi-langue
- **Wolof** : Interface en langue locale
- **Anglais** : Support international
- **Arabe** : Pour les communautés arabophones
- **Système de traduction** : Interface multilingue dynamique

#### Expansion géographique
- **Autres régions** : Extension au-delà de Dakar
- **Géofencing** : Zones de signalement automatiques
- **Adaptation locale** : Types de signalements spécifiques par région

### 🔧 Optimisations techniques (Q4 2025)

#### Performance
- **Lazy loading avancé** : Chargement intelligent des composants
- **Code splitting** : Optimisation des bundles
- **CDN** : Distribution globale du contenu
- **Caching** : Cache intelligent des données

#### SEO et accessibilité
- **SEO avancé** : Optimisation pour les moteurs de recherche
- **Accessibilité** : Conformité WCAG 2.1 AA
- **Screen readers** : Support des lecteurs d'écran
- **Navigation clavier** : Accessibilité complète au clavier

#### Tests et qualité
- **Tests unitaires** : Couverture > 80%
- **Tests E2E** : Automatisation avec Playwright
- **Tests de performance** : Monitoring continu
- **CI/CD** : Pipeline d'intégration continue

### 🔮 Innovations futures (2026+)

#### Intelligence artificielle
- **Classification automatique** : IA pour catégoriser les signalements
- **Détection de doublons** : Éviter les signalements redondants
- **Prédiction des problèmes** : Anticipation des incidents
- **Chatbot** : Assistant virtuel pour les citoyens

#### IoT et capteurs
- **Capteurs urbains** : Intégration de capteurs IoT
- **Détection automatique** : Signalements automatiques
- **Monitoring en temps réel** : Surveillance continue
- **Maintenance prédictive** : Anticipation des pannes

#### Blockchain et transparence
- **Traçabilité** : Historique immuable des signalements
- **Smart contracts** : Automatisation des processus
- **Transparence** : Données publiques vérifiables
- **Gouvernance décentralisée** : Participation citoyenne

### 📊 Métriques de succès

#### Objectifs 2025
- **Signalements traités** : > 10,000 par mois
- **Temps de résolution** : < 24h pour les urgences
- **Satisfaction citoyens** : > 90%
- **Organisations actives** : > 50
- **Couverture géographique** : 100% du département de Dakar

#### KPIs techniques
- **Uptime** : > 99.9%
- **Temps de réponse** : < 2 secondes
- **Taux d'erreur** : < 0.1%
- **Performance mobile** : Score Lighthouse > 90

## Support et contact

### 📚 Documentation technique

#### Code et développement
- **Commentaires inline** : Code documenté avec JSDoc
- **Types TypeScript** : Typage strict pour toutes les interfaces
- **Architecture** : Documentation des patterns utilisés
- **Conventions** : Standards de code et nommage

#### API et intégrations
- **Supabase** : Documentation complète des fonctions RPC
- **Edge Functions** : Documentation des endpoints
- **Types de données** : Schémas TypeScript générés
- **Authentification** : Guide des tokens JWT

#### Déploiement et infrastructure
- **Vercel** : Guide de déploiement et configuration
- **Supabase** : Configuration et migrations
- **Environnements** : Variables d'environnement et secrets
- **Monitoring** : Logs et métriques

### 🆘 Support technique

#### Niveaux de support
1. **Support communautaire** : Documentation et FAQ
2. **Support email** : digitalmsolution2025@gmail.com
3. **Support prioritaire** : Pour les organisations partenaires
4. **Support d'urgence** : Pour les problèmes critiques

#### Types de support
- **Bugs et erreurs** : Signalement et correction
- **Fonctionnalités** : Demandes d'amélioration
- **Formation** : Guide d'utilisation pour les organisations
- **Intégration** : Support pour l'intégration avec d'autres systèmes

### 📞 Contact

#### Équipe de développement
- **Développeur principal** : Digital Master Solution
- **Email** : digitalmsolution2025@gmail.com
- **Site web** : https://dms-sn.com
- **Localisation** : Dakar, Sénégal

#### Partenaires et collaborateurs
- **Municipalités** : Support dédié pour les collectivités
- **Services publics** : Accompagnement pour l'adoption
- **Développeurs** : Documentation technique complète
- **Communauté** : Forum et échanges d'expériences

### 📋 Changelog et versions

#### Version 1.0.0 (Janvier 2025)
- ✅ Signalement citoyen complet
- ✅ Interface d'administration
- ✅ Interface organisation
- ✅ Authentification JWT
- ✅ Géolocalisation temps réel
- ✅ Upload de médias
- ✅ Notifications en temps réel
- ✅ Responsive design

#### Prochaines versions
- **v1.1.0** : Notifications email, améliorations UX
- **v1.2.0** : Analytics avancées, rapports
- **v2.0.0** : Application mobile native
- **v2.1.0** : Support multi-langue (Wolof, Anglais)

### 🔒 Sécurité et confidentialité

#### Protection des données
- **RGPD** : Conformité aux réglementations européennes
- **Chiffrement** : Données chiffrées en transit et au repos
- **Anonymisation** : Protection de la vie privée des citoyens
- **Audit** : Traçabilité complète des accès

#### Politique de sécurité
- **Responsabilité** : Signalement des vulnérabilités
- **Mises à jour** : Correctifs de sécurité réguliers
- **Monitoring** : Surveillance continue des accès
- **Sauvegarde** : Protection contre la perte de données

---

## 📄 Informations légales

### Licence
- **Code source** : Propriétaire - Digital Master Solution
- **Utilisation** : Accord de licence pour les organisations partenaires
- **Modifications** : Restrictions sur les modifications du code

### Propriété intellectuelle
- **Marque** : SenAlerte est une marque déposée
- **Design** : Interface et UX protégées
- **Algorithme** : Logique métier propriétaire

### Responsabilité
- **Service** : Fourni "en l'état" sans garantie
- **Données** : Responsabilité limitée sur la perte de données
- **Disponibilité** : Objectif de 99.9% d'uptime

---

*Documentation générée le ${new Date().toLocaleDateString('fr-FR')} - Version 1.0*  
*Dernière mise à jour : ${new Date().toLocaleDateString('fr-FR')}*  
*© 2025 Digital Master Solution - Tous droits réservés*
