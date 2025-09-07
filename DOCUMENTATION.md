# Documentation SenAlerte

## Vue d'ensemble

**SenAlerte** est une plateforme de signalement citoyen pour le Sénégal, permettant aux citoyens de signaler des problèmes urbains (voirie, éclairage public, propreté, etc.) et aux organisations municipales de les traiter efficacement.

### Informations générales
- **Nom du projet** : SenAlerte
- **Développeur** : Digital Master Solution
- **Contact** : digitalmsolution2025@gmail.com
- **Site web** : https://dms-sn.com
- **Déploiement** : Vercel
- **Base de données** : Supabase (PostgreSQL)

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
│   │   ├── organization/   # Composants pour les organisations
│   │   └── ui/            # Composants UI de base (shadcn/ui)
│   ├── pages/             # Pages de l'application
│   │   ├── admin/         # Interface d'administration
│   │   ├── organization/  # Interface des organisations
│   │   └── ...           # Pages publiques
│   ├── stores/           # Gestion d'état (Zustand)
│   ├── hooks/            # Hooks React personnalisés
│   ├── integrations/     # Intégrations externes
│   │   └── supabase/     # Configuration Supabase
│   ├── services/         # Services métier
│   └── utils/            # Utilitaires
├── supabase/
│   ├── migrations/       # Migrations de base de données
│   └── functions/        # Edge Functions
└── public/              # Assets statiques
```

## Fonctionnalités principales

### 1. Signalement citoyen
- **Interface de signalement** : Formulaire complet avec géolocalisation
- **Types de signalements** : Voirie, éclairage, propreté, mobilier urbain, etc.
- **Médias** : Upload de photos et enregistrement audio
- **Géolocalisation** : GPS automatique avec fallback manuel
- **Code de suivi** : Code unique généré pour chaque signalement

### 2. Interface d'administration
- **Tableau de bord** : Statistiques et métriques en temps réel
- **Gestion des signalements** : CRUD complet avec assignation
- **Gestion des organisations** : Approbation et configuration
- **Gestion des utilisateurs** : CRUD pour les super-admins
- **Gestion des catégories** : Configuration des types de signalements

### 3. Interface organisation
- **Tableau de bord** : Vue des signalements assignés
- **Signalements disponibles** : Liste des signalements non assignés
- **Signalements gérés** : Suivi des signalements en cours
- **Notifications** : Système de messagerie intégré
- **Paramètres** : Configuration du profil organisation

### 4. Fonctionnalités techniques
- **Authentification JWT** : Sessions sécurisées avec refresh automatique
- **Géolocalisation temps réel** : Suivi GPS continu
- **Upload de fichiers** : Photos et audio avec compression
- **Notifications push** : Système de notifications en temps réel
- **Responsive design** : Interface adaptée mobile/desktop
- **PWA ready** : Support des fonctionnalités PWA

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

### Environnements
- **Développement** : `npm run dev`
- **Production** : Vercel (déploiement automatique)

### Configuration
- **Variables d'environnement** : Configuration Supabase
- **Build** : `npm run build`
- **Preview** : `npm run preview`

## Utilisation

### Pour les citoyens
1. Accéder à la page d'accueil
2. Cliquer sur "Signaler"
3. Remplir le formulaire avec :
   - Type de problème
   - Description détaillée
   - Informations personnelles
   - Photo/audio (optionnel)
4. Confirmer la géolocalisation
5. Envoyer le signalement
6. Recevoir un code de suivi

### Pour les organisations
1. S'inscrire via `/organization/signup`
2. Attendre l'approbation admin
3. Se connecter via `/organization/login`
4. Accéder au tableau de bord
5. Consulter les signalements assignés
6. Mettre à jour le statut des signalements

### Pour les administrateurs
1. Se connecter via `/admin/login`
2. Accéder au tableau de bord admin
3. Gérer les organisations et utilisateurs
4. Superviser tous les signalements
5. Configurer les catégories

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

### Fonctionnalités futures
- **Application mobile** : Version native iOS/Android
- **Notifications push** : Intégration FCM
- **Analytics avancées** : Tableaux de bord détaillés
- **API publique** : Documentation et accès tiers
- **Multi-langue** : Support Wolof, Anglais
- **Géofencing** : Zones de signalement automatiques

### Optimisations techniques
- **Performance** : Lazy loading et code splitting
- **SEO** : Optimisation pour les moteurs de recherche
- **Accessibilité** : Conformité WCAG 2.1
- **Tests** : Couverture de tests unitaires et E2E

## Support et contact

### Documentation technique
- **Code** : Commentaires inline et JSDoc
- **API** : Documentation Supabase
- **Déploiement** : Guide Vercel

### Contact
- **Développeur** : Digital Master Solution
- **Email** : digitalmsolution2025@gmail.com
- **Site** : https://dms-sn.com

---

*Documentation générée le ${new Date().toLocaleDateString('fr-FR')} - Version 1.0*
