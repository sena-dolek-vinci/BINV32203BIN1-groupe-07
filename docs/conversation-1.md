# Conversation 1 — Travail avec GitHub Copilot


## 1. Initialisation de Copilot


### Échange 1


**Moi :**

/init


**GitHub Copilot :**


- Action : Requested chat rename


- Action : Inspect repository structure and worktree


I’m mapping the repository’s documented workflows and the frontend/backend boundaries before drafting the instruction file.


The repository already documents the intended layering and workflows, so I’m distilling those into concise, actionable guidance rather than duplicating the full architecture and API manuals.


- Action : « Demander à l’utilisateur » est en échec


- Action : Demander à l’utilisateur


Created [`.github/copilot-instructions.md`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/.github/copilot-instructions.md) with:

- Root-level setup, development, lint, typecheck, build, and test commands
- Examples for running individual backend and frontend tests
- Backend/frontend architecture and request/data flows
- SQLite migration, authentication, authorization, API error, and status-code conventions
- Links to the existing architecture, API, and pull-request documentation

Validated the file with `git diff --check`. Would you like to adjust the guidance or add coverage for any repository areas I may have missed?


## 2. Analyse et implémentation du filtre


### Échange 1


**Moi :**

Peux-tu analyser l’architecture du projet Gesta et m’expliquer comment sont organisés le frontend et le backend ? Identifie les différentes couches, leur rôle et les fichiers principaux. Appuie-toi sur le code existant et le README.md. Pour l’instant, ne modifie aucun fichier.


**GitHub Copilot :**


- Action : Requested chat rename


Je vais maintenant recouper la structure déclarée dans le README avec les points d’entrée, les routes et les modules métier réellement présents, en excluant les dépendances générées.


# Vue d’ensemble

Gesta est une application web organisée en **monorepo npm**, avec deux workspaces indépendants :

- **Frontend** : React + TypeScript + Vite dans [`frontend/`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend)
- **Backend** : Node.js + Express + TypeScript dans [`backend/`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend)
- **Base de données** : SQLite avec `better-sqlite3`, stockée dans `backend/data/gesta.db`
- **Documentation** : notamment [`README.md`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/README.md) et [`docs/architecture.md`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/docs/architecture.md)

Le lancement global est défini dans [`package.json`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/package.json) :

```text
npm run dev
 ├── backend : API Express sur http://localhost:3000
 └── frontend : application Vite sur http://localhost:5173
```

Le frontend appelle l’API avec des URLs de la forme `/api/...`. Le proxy Vite configuré dans [`frontend/vite.config.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/vite.config.ts) transmet ces requêtes vers le backend en supprimant le préfixe `/api`.

---

# Architecture globale

Le projet suit deux organisations complémentaires :

## Backend

```text
Requête HTTP
    ↓
Express et middlewares
    ↓
Controllers
    ↓
Services métier
    ↓
Repositories
    ↓
SQLite
```

Les mappers assurent les conversions entre les différentes représentations des données :

```text
Ligne SQL / DBO
    ↕
Objet métier
    ↕
DTO renvoyé par l’API
```

Cette organisation est explicitement documentée dans [`docs/architecture.md`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/docs/architecture.md).

## Frontend

Le frontend suit le modèle MVVM présenté dans la documentation :

```text
Pages
  ↓
Hooks
  ↓
Services HTTP / utils
  ↓
Models
```

Les pages assemblent les composants visuels et les hooks. Les composants restent réutilisables et ne connaissent pas directement les routes de l’application.

---

# Organisation du backend

## 1. Point d’entrée et composition de l’application

### [`backend/src/main.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/main.ts)

C’est le point d’entrée du serveur.

Il :

1. vérifie la version de Node ;
2. charge la configuration ;
3. initialise la base SQLite ;
4. applique les migrations ;
5. insère les données de démonstration si la base est vide ;
6. crée l’application Express ;
7. démarre le serveur sur `API_PORT`.

### [`backend/src/app.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/app.ts)

Ce fichier compose l’application :

- création des repositories ;
- création des services ;
- création du middleware d’authentification ;
- branchement des routes ;
- branchement des middlewares de gestion d’erreurs.

Les dépendances sont injectées par des fonctions comme :

```text
createCompaniesRepository(db)
createCompaniesService(repository)
createCompaniesRouter(service)
```

Cela rend les tests plus simples : les tests peuvent créer une application complète connectée à une base SQLite en mémoire.

---

## 2. Configuration

### [`backend/src/config.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/config.ts)

Cette couche lit les variables d’environnement :

- `API_PORT` : port de l’API, par défaut `3000` ;
- `DATABASE_PATH` : chemin vers la base SQLite ;
- `JWT_SECRET` : clé de signature des jetons ;
- `DEMO_AUTH_ENABLED` : activation du mode de connexion de démonstration ;
- `NODE_ENV` : utilisé pour empêcher le mode démo en production.

La configuration est validée au démarrage. Par exemple, un `JWT_SECRET` absent ou trop court empêche le serveur de démarrer.

---

## 3. Routes et controllers

Les controllers sont regroupés dans [`backend/src/controllers/`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/controllers).

Ils ont principalement trois responsabilités :

- lire les paramètres HTTP ;
- valider les entrées ;
- appeler le service approprié et produire la réponse HTTP.

Les routes principales sont :

| Préfixe | Fichier | Rôle |
|---|---|---|
| `/health` | [`health.controller.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/controllers/health.controller.ts) | Vérification de disponibilité |
| `/auth` | [`auth.controller.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/controllers/auth.controller.ts) | Utilisateurs de démo, connexion, session courante |
| `/companies` | [`companies.controller.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/controllers/companies.controller.ts) | Liste et recherche d’entreprises |
| `/offers` | [`offers.controller.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/controllers/offers.controller.ts) | Liste des offres selon le profil |

Exemple : le controller des entreprises valide le paramètre `?q=`, limite sa longueur, puis transmet la recherche au service.

Le controller ne contient donc pas directement les requêtes SQL ni les règles métier détaillées.

---

## 4. Middlewares d’authentification et d’autorisation

Les middlewares se trouvent dans [`backend/src/middlewares/`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/middlewares).

### [`authenticate.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/middlewares/authenticate.ts)

Il :

1. lit l’en-tête `Authorization` ;
2. vérifie le jeton ;
3. recharge l’utilisateur, ses rôles et ses entreprises depuis la base ;
4. place l’utilisateur authentifié dans `req.user`.

Une session absente, invalide, expirée ou associée à un compte inactif produit une erreur `401`.

### [`authorize.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/middlewares/authorize.ts)

Il applique une règle d’accès à une route et produit une erreur `403` si l’utilisateur n’a pas le droit nécessaire.

Les règles sont centralisées dans [`services/permissions.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/services/permissions.ts), avec notamment :

- `isAdmin`
- `isStudent`
- `hasContactRole`
- `canListOffers`

### [`errorHandler.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/middlewares/errorHandler.ts)

Les erreurs métier sont représentées par [`utils/httpError.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/utils/httpError.ts), puis transformées en réponse JSON uniforme :

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Vous n'avez pas accès à cette ressource"
  }
}
```

---

## 5. Services métier

Les services se trouvent dans [`backend/src/services/`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/services).

Ils portent les règles fonctionnelles et ne dépendent pas directement des objets Express `Request` et `Response`.

Principaux services :

- [`auth.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/services/auth.service.ts) : connexion démo, génération et validation des jetons ;
- [`companies.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/services/companies.service.ts) : visibilité des entreprises ;
- [`offers.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/services/offers.service.ts) : visibilité des offres selon le profil ;
- [`permissions.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/services/permissions.ts) : règles d’accès réutilisables.

Exemple de règle pour les offres :

- administrateur : toutes les offres ;
- étudiant : uniquement les offres publiées ;
- déposant : uniquement les offres qu’il a déposées ;
- contact sans rôle de déposant : accès refusé.

---

## 6. Repositories et accès aux données

Les repositories sont dans [`backend/src/repositories/`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/repositories).

Ils encapsulent les requêtes SQL et retournent des objets de type DBO, c’est-à-dire des données proches de la structure SQLite.

Principaux repositories :

- [`users.repository.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/repositories/users.repository.ts) ;
- [`companies.repository.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/repositories/companies.repository.ts) ;
- [`offers.repository.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/repositories/offers.repository.ts).

Par exemple, le repository des entreprises :

- utilise une requête SQL paramétrée ;
- permet la recherche sur le nom complet ou abrégé ;
- échappe les caractères spéciaux de `LIKE` ;
- filtre les entreprises actives pour les utilisateurs non administrateurs.

L’accès SQLite est centralisé dans [`backend/src/db/database.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/db/database.ts).

---

## 7. Models et mappers

Les modèles sont dans [`backend/src/models/`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/models).

Ils distinguent notamment :

- les types DBO correspondant aux colonnes SQL ;
- les objets métier utilisés par les services ;
- les DTO exposés par l’API.

Les mappers sont dans [`backend/src/mappers/`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/mappers).

Exemple :

- [`company.mapper.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/mappers/company.mapper.ts) convertit `short_name` en `shortName` ;
- il retire aussi certains champs internes avant de construire le DTO retourné par l’API.

Cette séparation évite d’exposer directement la structure SQL au frontend.

---

## 8. Base de données, migrations et seed

### Base et migrations

La connexion et l’initialisation sont réparties entre :

- [`database.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/db/database.ts) ;
- [`initialize.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/db/initialize.ts) ;
- [`migrate.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/db/migrate.ts).

Le schéma initial est défini dans [`001_initial.sql`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/db/migrations/001_initial.sql).

Il contient notamment :

- années académiques ;
- périodes ;
- entreprises ;
- contacts et rôles ;
- étudiants ;
- administrateurs ;
- offres ;
- candidatures ;
- stages.

Les migrations sont appliquées dans l’ordre et enregistrées dans une table `schema_migrations`.

### Données de démonstration

Les données sont dans [`backend/src/db/seed/`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/db/seed).

Les scripts d’exploitation de la base se trouvent dans [`backend/src/db/scripts/`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/db/scripts).

---

# Organisation du frontend

## 1. Point d’entrée et routage

### [`frontend/src/main.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/main.tsx)

Ce fichier :

- récupère l’élément HTML `#root` ;
- active `StrictMode` ;
- installe `BrowserRouter` ;
- rend le composant racine [`App.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/App.tsx).

### [`frontend/src/App.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/App.tsx)

`App` est le point central de l’interface.

Il :

- appelle `useAuth()` une seule fois ;
- vérifie la session ;
- affiche la page de connexion si nécessaire ;
- configure les routes React ;
- transmet le token et la fonction de déconnexion aux pages protégées.

Routes actuellement présentes :

| Route | Page | Accès |
|---|---|---|
| `/` | [`HomePage.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/pages/HomePage.tsx) | Utilisateur connecté |
| `/offres` | [`OffersPage.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/pages/OffersPage.tsx) | Administrateur, étudiant ou déposant |
| `/entreprises` | [`CompaniesPage.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/pages/CompaniesPage.tsx) | Utilisateur connecté |
| route inconnue | [`NotFoundPage.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/pages/NotFoundPage.tsx) | — |

---

## 2. Layout et composants communs

Les composants sont dans [`frontend/src/components/`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components).

### Structure générale

[`Layout.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/Layout.tsx) fournit la structure commune :

- titre Gesta ;
- navigation ;
- menu utilisateur ;
- bannière de mode démo ;
- zone principale de contenu.

Composants principaux :

- [`NavBar.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/NavBar.tsx) : navigation ;
- [`UserMenu.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/UserMenu.tsx) : utilisateur et déconnexion ;
- [`DemoBanner.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/DemoBanner.tsx) : indication du mode démo ;
- [`CompanyTable.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/CompanyTable.tsx) : tableau des entreprises ;
- [`OfferTable.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/OfferTable.tsx) : tableau des offres ;
- [`LoadingState.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/LoadingState.tsx), [`ErrorState.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/ErrorState.tsx) et [`EmptyState.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/EmptyState.tsx) : états génériques d’affichage.

---

## 3. Pages

Les pages se trouvent dans [`frontend/src/pages/`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/pages).

Elles jouent le rôle de coordinateur de l’interface :

- elles utilisent les hooks ;
- elles gèrent l’état de chargement, d’erreur et de résultat vide ;
- elles assemblent les composants visuels ;
- elles ne contiennent pas directement les appels `fetch`.

Exemple :

[`CompaniesPage.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/pages/CompaniesPage.tsx) :

1. conserve le texte de recherche ;
2. appelle `useCompanies` ;
3. affiche `LoadingState`, `ErrorState`, `EmptyState` ou `CompanyTable`.

---

## 4. Hooks

Les hooks sont dans [`frontend/src/hooks/`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/hooks).

Ils transforment les appels asynchrones en état directement exploitable par les pages.

Principaux hooks :

- [`useAuth.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/hooks/useAuth.ts) : session, connexion, validation du token et déconnexion ;
- [`useCompanies.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/hooks/useCompanies.ts) : chargement et recherche des entreprises ;
- [`useOffers.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/hooks/useOffers.ts) : chargement des offres ;
- [`useHealth.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/hooks/useHealth.ts) : état de disponibilité de l’API ;
- [`useDemoUsers.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/hooks/useDemoUsers.ts) : utilisateurs disponibles en mode démo.

`useCompanies` illustre bien la logique de cette couche :

- délai de 300 ms pendant la frappe ;
- annulation de la requête précédente avec `AbortController` ;
- conversion des erreurs en état d’interface ;
- retour à la connexion si l’API répond `401`.

---

## 5. Services frontend

Les services sont dans [`frontend/src/services/`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/services).

Ils sont responsables des appels HTTP :

- [`auth.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/services/auth.service.ts) ;
- [`companies.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/services/companies.service.ts) ;
- [`offers.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/services/offers.service.ts) ;
- [`health.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/services/health.service.ts).

Ils utilisent [`frontend/src/utils/api.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/utils/api.ts), qui :

- définit le préfixe `/api` ;
- vérifie le statut HTTP ;
- transforme les erreurs en `ApiError` ;
- valide la forme du JSON retourné avec des type guards.

Cette validation est complétée par [`frontend/src/utils/guards.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/utils/guards.ts).

---

## 6. Models et utils

Les modèles frontend se trouvent dans [`frontend/src/models/`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/models).

Ils décrivent les données consommées depuis l’API :

- [`company.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/models/company.ts) ;
- [`offer.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/models/offer.ts) ;
- [`user.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/models/user.ts) ;
- [`health.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/models/health.ts).

Les utilitaires comprennent notamment :

- [`storage.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/utils/storage.ts) : sauvegarde et suppression du token ;
- [`permissions.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/utils/permissions.ts) : règles d’affichage côté interface ;
- [`labels.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/utils/labels.ts) : traduction des statuts anglais en libellés français.

Les règles frontend servent à adapter l’affichage, mais la sécurité réelle reste assurée par le backend.

---

# Parcours complet : affichage des entreprises

Le parcours est représentatif de l’architecture complète :

```text
CompaniesPage
    ↓
useCompanies
    ↓
companies.service.ts
    ↓
fetch("/api/companies?q=...")
    ↓
Proxy Vite
    ↓
GET /companies?q=...
    ↓
authenticate
    ↓
companies.controller.ts
    ↓
companies.service.ts
    ↓
companies.repository.ts
    ↓
SQLite
```

Au retour :

```text
Ligne SQL
    ↓
CompanyDbo
    ↓
company.mapper.ts
    ↓
Company
    ↓
CompanyDto JSON
    ↓
type guard frontend
    ↓
useCompanies
    ↓
CompanyTable
```

La recherche côté interface ajoute également un délai et annule les requêtes obsolètes.

---

# Tests

Les tests sont séparés par workspace.

## Backend

Les tests sont dans [`backend/tests/`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/tests).

Ils couvrent notamment :

- authentification ;
- entreprises ;
- offres ;
- permissions ;
- migrations ;
- contraintes SQLite ;
- seed ;
- santé de l’API.

Ils utilisent SQLite en mémoire, grâce aux helpers [`testApp.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/tests/helpers/testApp.ts) et [`testDatabase.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/tests/helpers/testDatabase.ts).

## Frontend

Les tests sont dans [`frontend/tests/`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/tests).

Ils utilisent Vitest et Testing Library, avec des réponses API simulées par [`fetchMock.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/tests/helpers/fetchMock.ts).

---

# État fonctionnel actuel

D’après le README et le code, l’architecture de base est déjà en place pour :

- la connexion de démonstration ;
- la navigation selon le profil ;
- la liste et la recherche d’entreprises ;
- la liste des offres avec filtrage par profil ;
- l’authentification serveur ;
- les migrations et les données de démonstration ;
- les tests backend et frontend.

En revanche, plusieurs fonctionnalités métier restent volontairement absentes :

- création et modification d’offres ;
- validation et publication d’offres ;
- candidatures ;
- création et validation de stages ;
- gestion complète des entreprises et contacts ;
- conventions et exports ;
- authentification réelle par e-mail.

En résumé, Gesta possède une architecture en couches claire, avec une séparation nette entre :

- présentation ;
- orchestration frontend ;
- appels HTTP ;
- API Express ;
- règles métier ;
- accès SQL ;
- persistance SQLite.

Aucun fichier n’a été modifié.


### Échange 2


**Moi :**

Peux-tu maintenant m’expliquer précisément le parcours d’affichage des offres de stage, depuis le composant React jusqu’à la base de données SQLite ? Indique les fichiers concernés et explique comment les offres sont filtrées selon le profil de l’utilisateur. Ne modifie aucun fichier pour le moment.


**GitHub Copilot :**


Je vais suivre le flux réel de lecture des offres dans le code : rendu React, hook, appel HTTP, route Express, autorisation, service, repository SQL et transformation des données.


# Parcours complet d’affichage des offres

Le parcours suit cette chaîne :

```text
OfferTable
  ← OffersPage
  ← useOffers
  ← getOffers
  ← GET /api/offers
  ← proxy Vite
  ← GET /offers
  ← authenticate
  ← authorize(canListOffers)
  ← offers.controller
  ← offers.service
  ← offers.repository
  ← SQLite
```

La documentation de référence est [`docs/architecture.md`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/docs/architecture.md), notamment la section « Liste des offres selon le profil ».

---

## 1. L’utilisateur arrive sur la page des offres

La route `/offres` est déclarée dans [`frontend/src/App.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/App.tsx).

Avant même de rendre la page, `App` vérifie côté frontend que l’utilisateur peut consulter les offres :

```tsx
{canListOffers(auth.user) && (
  <Route path="/offres" element={<OffersPage ... />} />
)}
```

La fonction `canListOffers` se trouve dans [`frontend/src/utils/permissions.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/utils/permissions.ts).

Elle autorise l’affichage de la route si l’utilisateur est :

- administrateur ;
- étudiant ;
- contact ayant le rôle `DEPOSITOR`.

La même règle est utilisée dans [`frontend/src/components/NavBar.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/NavBar.tsx) pour afficher ou masquer le lien « Offres ».

Cette vérification frontend sert principalement à adapter l’interface. Elle ne constitue pas la protection principale : le backend refait sa propre vérification.

---

## 2. La page `OffersPage` déclenche le chargement

Le composant principal est [`frontend/src/pages/OffersPage.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/pages/OffersPage.tsx).

Il reçoit trois propriétés depuis `App` :

- `user` : l’utilisateur courant ;
- `token` : son jeton de session ;
- `onUnauthorized` : fonction de déconnexion si la session est invalide.

La page appelle ensuite :

```tsx
const { offers, isLoading, error } = useOffers(token, onUnauthorized);
```

Elle affiche aussi une description dépendant du profil :

- administrateur : « Toutes les offres, tous statuts confondus. »
- étudiant : « Les offres publiées. »
- contact : « Les offres que vous avez déposées. »

Cette description est informative. Le filtrage réel est effectué par le backend.

---

## 3. Le hook `useOffers` gère l’état asynchrone

Le hook est défini dans [`frontend/src/hooks/useOffers.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/hooks/useOffers.ts).

Il gère trois états :

```text
offers     : Offer[]
isLoading  : boolean
error      : string | null
```

Dans un `useEffect`, il :

1. crée un `AbortController` ;
2. appelle `getOffers(token, signal)` ;
3. stocke les offres reçues avec `setOffers` ;
4. positionne `isLoading` à `false` ;
5. transforme les erreurs en message d’interface ;
6. appelle `onUnauthorized()` si l’API répond avec le statut HTTP `401` ;
7. annule la requête lors du démontage ou d’un changement de token.

Le hook ne filtre pas les offres. Il consomme uniquement la liste déjà filtrée par l’API.

---

## 4. Le service frontend effectue la requête HTTP

Le service est [`frontend/src/services/offers.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/services/offers.service.ts).

Il appelle :

```text
GET /api/offers
Authorization: <token>
```

Le token est envoyé tel quel dans l’en-tête `Authorization`, sans préfixe `Bearer`.

Le service délègue ensuite la vérification de la réponse à [`frontend/src/utils/api.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/utils/api.ts), via `readJson`.

`readJson` :

1. vérifie `response.ok` ;
2. convertit une erreur HTTP en `ApiError` ;
3. décode le JSON ;
4. valide sa structure avec `isOfferList`, défini dans [`frontend/src/utils/guards.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/utils/guards.ts).

Le modèle frontend attendu est défini dans [`frontend/src/models/offer.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/models/offer.ts) :

```ts
interface Offer {
  id: number;
  title: string;
  companyShortName: string;
  academicYear: string;
  period: PeriodCode;
  status: OfferStatus;
}
```

---

## 5. Vite transmet la requête au backend

Le frontend utilise le préfixe `/api`, mais le backend expose directement `/offers`.

Le proxy est configuré dans [`frontend/vite.config.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/vite.config.ts) :

```text
Frontend : /api/offers
        ↓
Proxy Vite
        ↓
Backend : http://localhost:3000/offers
```

Le proxy :

- transmet la requête vers le port de l’API ;
- retire `/api` de l’URL.

---

# Traitement côté backend

## 6. Le middleware `authenticate` identifie l’utilisateur

Dans [`backend/src/app.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/app.ts), la route `/offers` est branchée ainsi :

```text
/offers
  → authenticate
  → createOffersRouter(...)
```

Le middleware est défini dans [`backend/src/middlewares/authenticate.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/middlewares/authenticate.ts).

Il :

1. lit l’en-tête `Authorization` ;
2. vérifie la signature du token ;
3. récupère son payload `{ kind, id }` ;
4. recharge l’utilisateur en base ;
5. recharge également ses rôles et ses rattachements aux entreprises ;
6. place le résultat dans `req.user`.

Le token ne contient donc pas toutes les autorisations. Les droits sont relus en base à chaque requête, ce qui évite que le frontend puisse modifier son propre profil ou ses rôles.

La logique est implémentée dans [`backend/src/services/auth.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/services/auth.service.ts).

Si l’utilisateur est absent, invalide, inactif ou si le token est incorrect, la requête s’arrête avec une réponse `401`.

---

## 7. Le controller protège la liste des offres

Le controller est [`backend/src/controllers/offers.controller.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/controllers/offers.controller.ts).

La route est définie avec le middleware :

```text
GET /
  → authorize(canListOffers)
  → récupération de l’utilisateur courant
  → offersService.listOffers(...)
```

Le middleware [`backend/src/middlewares/authorize.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/middlewares/authorize.ts) applique la fonction `canListOffers`.

La règle backend, dans [`backend/src/services/permissions.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/services/permissions.ts), est :

```text
ADMIN
ou STUDENT
ou CONTACT possédant le rôle DEPOSITOR
```

Tout autre contact reçoit une réponse :

```http
403 Forbidden
```

Le controller ne construit pas directement la requête SQL. Il récupère l’utilisateur courant, appelle le service et transforme chaque résultat en DTO :

```text
offersService.listOffers(user)
  → .map(toOfferDto)
  → res.json(...)
```

---

# Filtrage selon le profil

## 8. Le service détermine le filtre métier

La logique principale est dans [`backend/src/services/offers.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/services/offers.service.ts).

La fonction `visibilityFilter` convertit le profil de l’utilisateur en filtre de repository.

| Profil | Filtre appliqué |
|---|---|
| Administrateur | aucun filtre |
| Étudiant | `status = "PUBLISHED"` |
| Contact déposant | `depositorContactId = user.id` |
| Contact sans rôle déposant | accès refusé avec `403` |

### Administrateur

```text
OfferFilter = {}
```

L’administrateur voit toutes les offres, quels que soient leurs statuts :

- `SUBMITTED`
- `PENDING`
- `PUBLISHED`
- `ASSIGNED`
- `ARCHIVED`

### Étudiant

```text
OfferFilter = {
  status: "PUBLISHED"
}
```

L’étudiant ne voit que les offres publiées.

### Contact déposant

```text
OfferFilter = {
  depositorContactId: viewer.id
}
```

Le contact voit les offres dont il est le déposant, indépendamment de leur statut.

### Contact sans rôle `DEPOSITOR`

Le service refuse l’accès avec une erreur `403`. En pratique, ce cas est normalement déjà bloqué par `authorize(canListOffers)`, mais le service contient également sa propre protection.

Cette double protection permet de conserver la règle métier au niveau du service et de ne pas dépendre uniquement du branchement HTTP.

---

## 9. Le repository exécute la requête SQLite

Le repository est [`backend/src/repositories/offers.repository.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/repositories/offers.repository.ts).

Il reçoit un `OfferFilter` et traduit les filtres optionnels en paramètres SQL :

```text
status                 → valeur ou NULL
depositorContactId     → valeur ou NULL
```

La requête fait plusieurs jointures :

```sql
FROM offers o
JOIN companies c ON c.id = o.company_id
JOIN academic_years ay ON ay.id = o.academic_year_id
JOIN periods p ON p.id = o.period_id
```

Elle récupère :

- les informations de l’offre depuis `offers` ;
- le nom court de l’entreprise depuis `companies` ;
- le libellé de l’année depuis `academic_years` ;
- le code de période depuis `periods`.

Le filtrage SQL est :

```sql
WHERE (@status IS NULL OR o.status = @status)
  AND (
    @depositorContactId IS NULL
    OR o.depositor_contact_id = @depositorContactId
  )
```

Cela donne les cas suivants :

| Filtre transmis | Résultat SQL |
|---|---|
| `{}` | toutes les offres |
| `{ status: "PUBLISHED" }` | uniquement les offres publiées |
| `{ depositorContactId: 12 }` | uniquement les offres déposées par le contact `12` |

Les résultats sont triés ainsi :

```sql
ORDER BY ay.start_date DESC, o.created_at DESC
```

Les offres de l’année académique la plus récente apparaissent donc en premier, puis les offres les plus récemment créées dans cette année.

---

## 10. Structure SQLite utilisée

Le schéma est défini dans [`backend/src/db/migrations/001_initial.sql`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/db/migrations/001_initial.sql).

La table principale est `offers`. Elle contient notamment :

- `id`
- `company_id`
- `depositor_contact_id`
- `academic_year_id`
- `period_id`
- `title`
- `description`
- `status`
- `created_at`
- `updated_at`

Les statuts autorisés par SQLite sont :

```text
SUBMITTED
PENDING
PUBLISHED
ASSIGNED
ARCHIVED
```

Les contraintes structurelles sont assurées par SQLite, tandis que la visibilité selon le profil est décidée par le service backend.

La base est ouverte dans [`backend/src/db/database.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/db/database.ts), puis initialisée et migrée via [`backend/src/db/initialize.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/db/initialize.ts).

---

# Transformation des données au retour

## 11. De la ligne SQL vers l’objet métier

Le repository renvoie un `OfferDbo`, défini dans [`backend/src/models/offer.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/models/offer.ts).

Ses propriétés utilisent les noms SQL :

```text
company_id
company_short_name
academic_year_label
period_code
depositor_contact_id
```

Le mapper [`backend/src/mappers/offer.mapper.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/mappers/offer.mapper.ts) les transforme en objet métier :

```text
company_id           → company.id
company_short_name   → company.shortName
academic_year_label  → academicYear
period_code          → period
depositor_contact_id → depositorContactId
```

## 12. De l’objet métier vers le DTO API

Le même mapper crée ensuite un `OfferDto` destiné au frontend.

Le DTO de liste contient uniquement :

- `id`
- `title`
- `companyShortName`
- `academicYear`
- `period`
- `status`

Le champ `description`, présent dans la base et dans l’objet métier, n’est pas exposé dans la réponse de liste.

La réponse JSON ressemble donc à :

```json
[
  {
    "id": 1,
    "title": "Développement d'une application web",
    "companyShortName": "ACME",
    "academicYear": "2025-2026",
    "period": "P1",
    "status": "PUBLISHED"
  }
]
```

---

# Affichage final dans React

## 13. Retour dans `useOffers`

Le service frontend reçoit le JSON, vérifie sa structure avec `isOfferList`, puis renvoie un `Offer[]`.

Le hook `useOffers` place cette liste dans son état :

```text
setOffers(data)
```

`OffersPage` reçoit alors :

```text
offers
isLoading
error
```

Il affiche :

- [`ErrorState.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/ErrorState.tsx) en cas d’erreur ;
- [`LoadingState.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/LoadingState.tsx) pendant le chargement ;
- [`EmptyState.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/EmptyState.tsx) si la liste est vide ;
- [`OfferTable.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/OfferTable.tsx) si des offres sont disponibles.

## 14. Rendu du tableau

`OfferTable` parcourt le tableau :

```tsx
offers.map((offer) => ...)
```

Il affiche :

- le titre ;
- le nom court de l’entreprise ;
- l’année académique ;
- la période ;
- le statut.

Les codes techniques sont convertis en libellés français par [`frontend/src/utils/labels.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/utils/labels.ts).

Par exemple :

```text
P1          → libellé français de la période 1
PUBLISHED   → Publiée
```

Le composant [`StatusBadge.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/StatusBadge.tsx) applique ensuite le style correspondant au statut.

---

# Résumé du filtrage

Le filtrage existe à deux niveaux :

## Niveau interface

[`frontend/src/utils/permissions.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/utils/permissions.ts) et [`App.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/App.tsx) masquent le lien et la route `/offres` pour les utilisateurs non autorisés.

## Niveau serveur

Le backend est responsable de la sécurité réelle :

1. [`authenticate.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/middlewares/authenticate.ts) identifie l’utilisateur ;
2. [`authorize.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/middlewares/authorize.ts) vérifie le droit de consulter les offres ;
3. [`offers.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/services/offers.service.ts) choisit le filtre métier ;
4. [`offers.repository.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/repositories/offers.repository.ts) applique ce filtre dans la requête SQL.

Ainsi, un utilisateur ne peut pas contourner les règles en appelant directement l’API ou en modifiant le code frontend.

Aucun fichier n’a été modifié.


### Échange 3


**Moi :**

Peux-tu m’expliquer précisément comment les offres de stage sont récupérées et affichées, depuis le composant React jusqu’à la base de données SQLite ? Indique les fichiers concernés et explique comment les offres sont filtrées selon le profil de l’utilisateur. Appuie-toi sur le code existant et ne modifie aucun fichier.


**GitHub Copilot :**


Oui. Le parcours complet est le suivant :

```text
OfferTable
  ← OffersPage
  ← useOffers
  ← getOffers
  ← GET /api/offers
  ← proxy Vite
  ← GET /offers
  ← authenticate
  ← authorize(canListOffers)
  ← offers.controller
  ← offers.service
  ← offers.repository
  ← SQLite
```

## 1. Accès à la page côté React

La route `/offres` est déclarée dans [`frontend/src/App.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/App.tsx).

Elle n’est créée que si la fonction `canListOffers` autorise l’utilisateur :

```tsx
{canListOffers(auth.user) && (
  <Route path="/offres" element={<OffersPage ... />} />
)}
```

Cette même règle est utilisée dans [`frontend/src/components/NavBar.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/NavBar.tsx) pour afficher ou masquer le lien « Offres ».

La règle frontend, définie dans [`frontend/src/utils/permissions.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/utils/permissions.ts), autorise :

- un administrateur ;
- un étudiant ;
- un contact possédant le rôle `DEPOSITOR`.

Cette vérification adapte l’interface, mais la sécurité est réappliquée côté backend.

---

## 2. `OffersPage` déclenche le chargement

Le composant [`frontend/src/pages/OffersPage.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/pages/OffersPage.tsx) reçoit :

- `user` ;
- `token` ;
- `onUnauthorized`.

Il appelle le hook :

```tsx
const { offers, isLoading, error } = useOffers(token, onUnauthorized);
```

La page affiche également une description adaptée au profil :

- administrateur : toutes les offres ;
- étudiant : les offres publiées ;
- contact : les offres déposées par ce contact.

Cette description est informative. Le filtrage réel est effectué par le backend.

---

## 3. Le hook `useOffers` gère l’appel asynchrone

Le hook se trouve dans [`frontend/src/hooks/useOffers.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/hooks/useOffers.ts).

Il gère :

```text
offers
isLoading
error
```

Lors du montage du composant, il :

1. crée un `AbortController` ;
2. appelle `getOffers(token, signal)` ;
3. place les données reçues dans `offers` ;
4. termine l’état de chargement ;
5. déconnecte l’utilisateur si l’API renvoie `401` ;
6. annule la requête si le composant est démonté.

Le hook ne filtre pas la liste. Il consomme les offres déjà filtrées par le serveur.

---

## 4. Le service frontend appelle l’API

Le service est [`frontend/src/services/offers.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/services/offers.service.ts).

Il effectue :

```http
GET /api/offers
Authorization: <token>
```

Le préfixe `/api` est défini dans [`frontend/src/utils/api.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/utils/api.ts).

La fonction `readJson` :

- vérifie le statut HTTP ;
- transforme les erreurs en `ApiError` ;
- décode le JSON ;
- valide sa structure avec `isOfferList`, dans [`frontend/src/utils/guards.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/utils/guards.ts).

Le modèle frontend attendu est défini dans [`frontend/src/models/offer.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/models/offer.ts).

---

## 5. Le proxy Vite transmet la requête au backend

Dans [`frontend/vite.config.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/vite.config.ts), Vite configure un proxy :

```text
/api/offers
    ↓ suppression de /api
/offers
    ↓
http://localhost:3000/offers
```

Le frontend utilise donc `/api/offers`, tandis que le backend expose `/offers`.

---

# Traitement côté backend

## 6. Authentification de la requête

Dans [`backend/src/app.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/app.ts), la route `/offers` est protégée par `authenticate`.

Le middleware est défini dans [`backend/src/middlewares/authenticate.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/middlewares/authenticate.ts).

Il :

1. lit l’en-tête `Authorization` ;
2. vérifie le token ;
3. récupère son identité (`kind` et `id`) ;
4. recharge l’utilisateur en base ;
5. recharge ses rôles ;
6. place l’utilisateur dans `req.user`.

La logique de lecture et de validation de l’utilisateur se trouve dans [`backend/src/services/auth.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/services/auth.service.ts).

Un token invalide, absent, expiré ou associé à un compte inactif produit une réponse `401`.

Le token ne contient donc pas toutes les autorisations : le backend relit les droits en base à chaque requête.

---

## 7. Le controller vérifie l’autorisation

Le controller est [`backend/src/controllers/offers.controller.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/controllers/offers.controller.ts).

La route est organisée ainsi :

```text
GET /offers
  → authenticate
  → authorize(canListOffers)
  → offersService.listOffers(...)
  → réponse JSON
```

Le middleware [`backend/src/middlewares/authorize.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/middlewares/authorize.ts) applique `canListOffers`, définie dans [`backend/src/services/permissions.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/services/permissions.ts).

Sont autorisés :

```text
ADMIN
STUDENT
CONTACT avec le rôle DEPOSITOR
```

Un contact qui n’est que promoteur ou signataire reçoit une réponse `403`.

---

# Filtrage des offres

## 8. Le service choisit le filtre métier

La logique est dans [`backend/src/services/offers.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/services/offers.service.ts).

Le profil de l’utilisateur est transformé en `OfferFilter`.

### Administrateur

```ts
{}
```

L’administrateur voit toutes les offres, quel que soit leur statut :

```text
SUBMITTED
PENDING
PUBLISHED
ASSIGNED
ARCHIVED
```

### Étudiant

```ts
{ status: "PUBLISHED" }
```

L’étudiant ne voit que les offres publiées.

### Contact déposant

```ts
{ depositorContactId: viewer.id }
```

Le contact voit uniquement les offres dont il est le déposant.

Ce filtre ne dépend pas du statut : il peut donc voir ses offres déposées même si elles sont encore `SUBMITTED`, `PENDING`, etc.

### Contact sans rôle déposant

Le service refuse l’accès avec une erreur `403`. Cette protection complète celle du middleware `authorize`.

---

## 9. Le repository construit la requête SQL

Le repository est [`backend/src/repositories/offers.repository.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/repositories/offers.repository.ts).

Il reçoit un filtre contenant éventuellement :

```text
status
depositorContactId
```

Ces valeurs sont converties en paramètres SQL, ou en `NULL` lorsqu’aucun filtre n’est nécessaire.

La requête principale est conceptuellement :

```sql
SELECT ...
FROM offers o
JOIN companies c
  ON c.id = o.company_id
JOIN academic_years ay
  ON ay.id = o.academic_year_id
JOIN periods p
  ON p.id = o.period_id
WHERE (@status IS NULL OR o.status = @status)
  AND (
    @depositorContactId IS NULL
    OR o.depositor_contact_id = @depositorContactId
  )
ORDER BY ay.start_date DESC, o.created_at DESC
```

Les jointures permettent de récupérer dans une seule requête :

- les informations de l’offre ;
- le nom court de l’entreprise ;
- le libellé de l’année académique ;
- le code de période.

Les résultats sont triés par année académique décroissante, puis par date de création décroissante.

---

## 10. Tables SQLite concernées

Le schéma est défini dans [`backend/src/db/migrations/001_initial.sql`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/db/migrations/001_initial.sql).

La table centrale est `offers`, avec notamment :

```text
id
company_id
depositor_contact_id
academic_year_id
period_id
title
description
status
created_at
updated_at
```

Les autres tables utilisées pour l’affichage sont :

- `companies` ;
- `academic_years` ;
- `periods`.

Les statuts autorisés par le schéma sont :

```text
SUBMITTED
PENDING
PUBLISHED
ASSIGNED
ARCHIVED
```

La connexion SQLite est gérée dans [`backend/src/db/database.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/db/database.ts), et l’initialisation dans [`backend/src/db/initialize.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/db/initialize.ts).

---

# Transformation des données

## 11. DBO vers objet métier

Le repository retourne un objet `OfferDbo`, défini dans [`backend/src/models/offer.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/models/offer.ts).

Ses propriétés reprennent les noms SQL :

```text
company_id
company_short_name
academic_year_label
period_code
depositor_contact_id
```

Le mapper [`backend/src/mappers/offer.mapper.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/mappers/offer.mapper.ts) les convertit en objet métier :

```text
company_id           → company.id
company_short_name   → company.shortName
academic_year_label  → academicYear
period_code          → period
depositor_contact_id → depositorContactId
```

## 12. Objet métier vers DTO API

Le même mapper crée ensuite un `OfferDto` pour la réponse HTTP.

Le DTO de liste contient :

```text
id
title
companyShortName
academicYear
period
status
```

Le champ `description`, présent dans la base et dans l’objet métier, n’est pas exposé dans la liste.

La réponse JSON peut ressembler à ceci :

```json
[
  {
    "id": 1,
    "title": "Développement d'une application web",
    "companyShortName": "ACME",
    "academicYear": "2025-2026",
    "period": "P1",
    "status": "PUBLISHED"
  }
]
```

---

# Affichage final dans React

## 13. Retour dans `OffersPage`

Après validation du JSON :

```text
getOffers
  → useOffers
  → OffersPage
```

`OffersPage` choisit l’affichage selon l’état :

- erreur : [`ErrorState.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/ErrorState.tsx) ;
- chargement : [`LoadingState.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/LoadingState.tsx) ;
- liste vide : [`EmptyState.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/EmptyState.tsx) ;
- données disponibles : [`OfferTable.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/OfferTable.tsx).

## 14. Rendu du tableau

`OfferTable` parcourt les offres :

```tsx
offers.map((offer) => ...)
```

Il affiche :

- `offer.title` ;
- `offer.companyShortName` ;
- `offer.academicYear` ;
- `offer.period` ;
- `offer.status`.

Les codes techniques sont traduits en français dans [`frontend/src/utils/labels.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/utils/labels.ts).

Par exemple :

```text
PUBLISHED → libellé français « Publiée »
P1        → libellé français de la période 1
```

Le statut est rendu avec [`frontend/src/components/StatusBadge.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/StatusBadge.tsx).

---

# Synthèse du filtrage

Le filtrage est réalisé côté serveur, et non dans `OfferTable` ou `OffersPage`.

| Profil | Autorisation | Filtre SQL |
|---|---|---|
| Administrateur | Oui | Aucun filtre |
| Étudiant | Oui | `status = 'PUBLISHED'` |
| Contact déposant | Oui | `depositor_contact_id = user.id` |
| Contact sans rôle déposant | Non | Réponse `403` |

Le frontend masque la route et le lien pour les profils non autorisés, mais le backend reste l’autorité réelle :

```text
authenticate
  → vérifie l’identité

authorize(canListOffers)
  → vérifie le droit d’accès

offers.service
  → choisit le filtre métier

offers.repository
  → applique le filtre dans SQLite
```

Aucun fichier n’a été modifié.


### Échange 4


**Moi :**

À partir de ton analyse du projet, crée un document HTML dans le dossier `docs/` qui explique clairement l’architecture de Gesta et le parcours d’affichage des offres, du frontend jusqu’à la base de données. Identifie également les fichiers qui devront probablement être modifiés pour ajouter un filtre par période (P1, P2, Autre). Ne modifie aucun fichier du code de l’application : crée uniquement le document HTML.


**GitHub Copilot :**


Je vais créer uniquement un document HTML autonome dans `docs/`, avec une vue d’architecture, le parcours complet des offres et une section dédiée aux fichiers probablement concernés par un futur filtre de période.


Le document HTML a été créé :

- [architecture-et-filtrage-offres.html](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/docs/architecture-et-filtrage-offres.html)

Il contient :

- l’organisation générale du frontend, du backend et de SQLite ;
- les différentes couches et leurs responsabilités ;
- le parcours complet d’une offre, de `OfferTable` jusqu’à la requête SQL ;
- le fonctionnement de l’authentification et de l’autorisation ;
- le filtrage actuel selon le profil :
  - administrateur : toutes les offres ;
  - étudiant : offres `PUBLISHED` ;
  - déposant : ses propres offres ;
  - autres contacts : accès refusé ;
- les fichiers probablement concernés par l’ajout d’un filtre `P1`, `P2`, `OTHER` ;
- les adaptations attendues côté frontend, backend et tests.

Vérification effectuée : seul le fichier HTML demandé a été créé. Aucun fichier de code de l’application n’a été modifié.


### Échange 5


**Moi :**

Je souhaite maintenant implémenter le filtre des offres par période : Toutes les périodes, P1, P2 et Autre (OTHER).

Avant de modifier le code, propose-moi un plan d’implémentation étape par étape en indiquant les fichiers concernés côté frontend, backend et tests.

Le filtrage doit être effectué côté backend et respecter les règles de visibilité actuelles selon le profil utilisateur.

Ne modifie encore aucun fichier. Je veux d’abord comprendre et valider ton plan.


**GitHub Copilot :**


Voici un plan d’implémentation proposé. Il conserve les règles de visibilité existantes et ajoute uniquement un filtre optionnel par période.

# Objectif fonctionnel

Ajouter dans la page des offres un sélecteur avec quatre choix :

| Libellé affiché | Valeur technique |
|---|---|
| Toutes les périodes | absence de paramètre, ou filtre `undefined` |
| P1 | `P1` |
| P2 | `P2` |
| Autre | `OTHER` |

Le frontend enverait par exemple :

```text
GET /api/offers
GET /api/offers?period=P1
GET /api/offers?period=P2
GET /api/offers?period=OTHER
```

Le backend appliquerait ensuite simultanément :

1. le filtre de visibilité lié au profil ;
2. le filtre de période demandé.

Exemples :

```text
Étudiant + P1
→ offres PUBLISHED de la période P1

Déposant + P2
→ offres déposées par ce contact et rattachées à P2

Administrateur + OTHER
→ toutes les offres rattachées à OTHER
```

---

# Étape 1 — Vérifier et réutiliser les types existants

## Fichiers concernés

- [`frontend/src/models/offer.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/models/offer.ts)
- [`backend/src/models/offer.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/models/offer.ts)

Les deux côtés possèdent déjà les codes de période :

```text
P1
P2
OTHER
```

Le plan consiste à réutiliser le type existant `PeriodCode`, sans modifier le schéma SQLite ni ajouter de migration.

La valeur « Toutes les périodes » ne doit pas être ajoutée à `PeriodCode`, car elle ne représente pas une valeur stockée en base. Elle correspondrait à l’absence de filtre.

---

# Étape 2 — Ajouter le sélecteur côté page

## Fichier concerné

- [`frontend/src/pages/OffersPage.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/pages/OffersPage.tsx)

Ajouter dans la page :

- un état local représentant la période sélectionnée ;
- une valeur initiale correspondant à « Toutes les périodes » ;
- un élément `<select>` ou un composant équivalent ;
- les options :
  - Toutes les périodes ;
  - P1 ;
  - P2 ;
  - Autre.

Exemple de logique attendue :

```text
selectedPeriod = undefined → toutes les périodes
selectedPeriod = "P1"      → P1
selectedPeriod = "P2"      → P2
selectedPeriod = "OTHER"   → Autre
```

La page transmettrait ensuite la valeur au hook `useOffers`.

Le tableau [`OfferTable.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/OfferTable.tsx) ne devrait pas être modifié : il affiche déjà la période de chaque offre et n’est pas responsable du filtrage.

---

# Étape 3 — Faire circuler le filtre dans le hook

## Fichier concerné

- [`frontend/src/hooks/useOffers.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/hooks/useOffers.ts)

Modifier la signature du hook afin d’accepter la période sélectionnée.

Le `useEffect` devra dépendre de cette valeur :

```text
token
onUnauthorized
period
```

Ainsi, chaque changement de sélection déclenchera un nouvel appel API.

Le hook continuera à gérer :

- le chargement ;
- les erreurs ;
- les réponses `401` ;
- l’annulation avec `AbortController`.

Le filtre ne sera pas appliqué localement sur `offers`. Le hook demandera directement au backend la liste correspondant à la période.

---

# Étape 4 — Ajouter le paramètre dans le service frontend

## Fichier concerné

- [`frontend/src/services/offers.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/services/offers.service.ts)

Faire évoluer `getOffers` pour accepter une période optionnelle.

Le service construira l’URL avec `URLSearchParams` :

```text
period === undefined → /api/offers
period === "P1"      → /api/offers?period=P1
period === "P2"      → /api/offers?period=P2
period === "OTHER"   → /api/offers?period=OTHER
```

L’utilisation de `URLSearchParams` permet de conserver le même style que dans [`companies.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/services/companies.service.ts).

Le service continuera à déléguer :

- la vérification du statut HTTP à [`frontend/src/utils/api.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/utils/api.ts) ;
- la validation du JSON à [`frontend/src/utils/guards.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/utils/guards.ts).

Aucun changement ne devrait être nécessaire dans ces deux fichiers.

---

# Étape 5 — Valider le paramètre dans le controller backend

## Fichier concerné

- [`backend/src/controllers/offers.controller.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/controllers/offers.controller.ts)

Ajouter la lecture et la validation de `req.query.period`.

Le controller devra accepter :

```text
P1
P2
OTHER
```

Et traiter les cas suivants :

| Requête | Comportement |
|---|---|
| `/offers` | toutes les périodes |
| `/offers?period=P1` | filtre P1 |
| `/offers?period=P2` | filtre P2 |
| `/offers?period=OTHER` | filtre Autre |
| `/offers?period=INVALID` | erreur HTTP 400 |
| `/offers?period=P1&period=P2` | erreur HTTP 400, si le paramètre apparaît plusieurs fois |

La validation doit être faite côté backend, même si le frontend limite les choix possibles. Cela empêche un client externe d’envoyer des valeurs invalides.

Le controller transmettrait ensuite une période validée au service :

```text
offersService.listOffers(currentUser, period)
```

ou, de manière plus extensible, un objet de critères.

---

# Étape 6 — Combiner le filtre de période avec les règles métier

## Fichier concerné

- [`backend/src/services/offers.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/services/offers.service.ts)

Faire évoluer le calcul de `visibilityFilter` pour qu’il conserve les règles actuelles tout en ajoutant le champ de période.

Le filtre final pourrait être conceptuellement :

```ts
interface OfferFilter {
  status?: OfferStatus;
  depositorContactId?: number;
  periodCode?: PeriodCode;
}
```

La combinaison attendue serait :

### Administrateur

```text
{}
+ période éventuelle
```

### Étudiant

```text
status = PUBLISHED
+ période éventuelle
```

### Contact déposant

```text
depositorContactId = viewer.id
+ période éventuelle
```

Il est important de ne pas remplacer le filtre lié au profil par le filtre de période. Les deux critères doivent être combinés.

La règle d’autorisation restera inchangée :

- `canListOffers` continue de déterminer qui peut consulter les offres ;
- le service continue de refuser les profils sans droit de consultation.

Le fichier [`backend/src/services/permissions.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/services/permissions.ts) ne devrait donc pas être modifié.

---

# Étape 7 — Appliquer le filtre dans la requête SQL

## Fichier concerné

- [`backend/src/repositories/offers.repository.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/repositories/offers.repository.ts)

Ajouter `periodCode` au type `OfferFilter` et aux paramètres de la requête.

La requête joint déjà la table `periods`, donc le filtrage peut être effectué directement sur `p.code` :

```sql
AND (@periodCode IS NULL OR p.code = @periodCode)
```

Le comportement serait :

```text
periodCode = NULL   → toutes les périodes
periodCode = 'P1'   → uniquement P1
periodCode = 'P2'   → uniquement P2
periodCode = 'OTHER' → uniquement Autre
```

Cette solution est préférable à un filtrage frontend, car :

- seules les données autorisées et utiles sont renvoyées ;
- les règles de visibilité et de période sont appliquées dans la même requête ;
- la base reste la source de vérité ;
- le comportement est cohérent pour tous les clients de l’API.

---

# Étape 8 — Vérifier les libellés frontend

## Fichier à vérifier

- [`frontend/src/utils/labels.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/utils/labels.ts)

Le code `OTHER` existe déjà pour les périodes. Il faudra vérifier que son libellé est bien `Autre`.

Si le libellé existe déjà, aucune modification ne sera nécessaire. Sinon, ajouter uniquement l’entrée manquante pour que :

- le sélecteur affiche « Autre » ;
- le tableau continue d’afficher « Autre » pour les offres concernées.

Le libellé « Toutes les périodes » est un libellé d’interface uniquement et ne doit pas être ajouté aux codes métier.

---

# Étape 9 — Ajouter les tests backend

## Fichier principal

- [`backend/tests/offers.test.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/tests/offers.test.ts)

Ajouter des tests couvrant :

## Sans filtre

- administrateur : toutes les offres ;
- étudiant : uniquement les offres publiées ;
- déposant : uniquement ses propres offres.

## Avec `P1`

- administrateur : toutes les offres P1 ;
- étudiant : offres P1 et `PUBLISHED` uniquement ;
- déposant : ses offres P1 uniquement.

## Avec `P2`

Vérifier les mêmes règles pour P2.

## Avec `OTHER`

Vérifier les mêmes règles pour `OTHER`.

## Valeurs invalides

Tester notamment :

```text
period=INVALID
period=
period=P1&period=P2
```

Le comportement attendu devra être confirmé lors de l’implémentation, mais le plan recommande une réponse `400` pour les valeurs invalides et les paramètres dupliqués.

## Sécurité

Ajouter ou conserver un test vérifiant qu’un contact sans rôle `DEPOSITOR` reçoit `403`, y compris lorsqu’il fournit un paramètre `period`.

Le filtre de période ne doit jamais permettre de contourner le filtrage par profil.

---

# Étape 10 — Ajouter les tests frontend

## Fichier principal

- [`frontend/tests/OffersPage.test.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/tests/OffersPage.test.tsx)

Ajouter des tests pour vérifier :

1. la présence du sélecteur ;
2. la sélection initiale « Toutes les périodes » ;
3. l’appel sans paramètre lorsqu’aucun filtre n’est choisi ;
4. l’appel avec `period=P1` ;
5. l’appel avec `period=P2` ;
6. l’appel avec `period=OTHER` ;
7. le rafraîchissement de la liste après changement ;
8. la conservation du comportement d’erreur et de chargement.

Les mocks HTTP existants dans [`frontend/tests/helpers/fetchMock.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/tests/helpers/fetchMock.ts) pourront probablement être réutilisés.

Les tests de [`frontend/tests/NavBar.test.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/tests/NavBar.test.tsx) devraient rester inchangés, sauf si l’ajout du contrôle modifie indirectement le rendu de navigation.

---

# Étape 11 — Mettre à jour la documentation

## Fichiers concernés

- [`backend/API.md`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/API.md)
- [`docs/architecture.md`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/docs/architecture.md)
- [`docs/architecture-et-filtrage-offres.html`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/docs/architecture-et-filtrage-offres.html)

Documenter :

```text
GET /offers?period=P1
GET /offers?period=P2
GET /offers?period=OTHER
```

Préciser également que le paramètre est combiné avec les règles de visibilité :

- étudiant : `PUBLISHED` + période éventuelle ;
- déposant : ses propres offres + période éventuelle ;
- administrateur : période éventuelle sans restriction de statut.

---

# Étape 12 — Validation finale

Après l’implémentation, lancer progressivement :

```bash
npm test --workspace backend
npm test --workspace frontend
npm run typecheck
npm run lint
npm run build
```

Puis, si tout est concluant :

```bash
npm run check
```

Les tests prioritaires seront d’abord :

```bash
npm test --workspace backend -- offers.test.ts
npm test --workspace frontend -- OffersPage.test.tsx
```

---

# Liste synthétique des fichiers

## Frontend à modifier probablement

- [`frontend/src/pages/OffersPage.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/pages/OffersPage.tsx)
- [`frontend/src/hooks/useOffers.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/hooks/useOffers.ts)
- [`frontend/src/services/offers.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/services/offers.service.ts)
- éventuellement [`frontend/src/utils/labels.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/utils/labels.ts)

## Backend à modifier probablement

- [`backend/src/controllers/offers.controller.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/controllers/offers.controller.ts)
- [`backend/src/services/offers.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/services/offers.service.ts)
- [`backend/src/repositories/offers.repository.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/repositories/offers.repository.ts)

## Tests à modifier probablement

- [`backend/tests/offers.test.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/tests/offers.test.ts)
- [`frontend/tests/OffersPage.test.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/tests/OffersPage.test.tsx)

## Fichiers probablement inchangés

- [`backend/src/models/offer.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/models/offer.ts)
- [`backend/src/mappers/offer.mapper.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/mappers/offer.mapper.ts)
- [`backend/src/services/permissions.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/services/permissions.ts)
- [`backend/src/db/migrations/001_initial.sql`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/db/migrations/001_initial.sql)
- [`frontend/src/components/OfferTable.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/components/OfferTable.tsx)

Aucun fichier n’a été modifié.


### Échange 6


**Moi :**

Je valide ton plan. Commençons uniquement par le backend.

Implémente le filtre optionnel `period` pour `GET /offers`, avec les valeurs `P1`, `P2` et `OTHER`.

Le controller doit refuser les valeurs invalides et les paramètres dupliqués avec une erreur HTTP 400.

Le service doit combiner ce filtre avec les règles de visibilité existantes selon le profil utilisateur.

Le repository doit appliquer le filtre dans la requête SQL.

Ajoute également les tests backend correspondants.

Ne modifie aucun fichier frontend pour le moment. N’ajoute aucune dépendance ni migration.

Explique-moi les modifications effectuées et les résultats des tests.


**GitHub Copilot :**


Je vais limiter les changements au backend et à ses tests : valider `period` au controller, propager le critère au service/repository, puis couvrir les combinaisons de profils, périodes et erreurs HTTP 400.


Le backend possède déjà le type `PeriodCode` et la jointure SQL vers `periods`. Je vais donc ajouter un critère optionnel au filtre existant, sans migration, puis tester séparément la validation HTTP et la combinaison période + profil.


La logique backend est en place, y compris la validation des valeurs et des paramètres répétés. Je lance maintenant les tests ciblés et la vérification TypeScript pour détecter d’éventuels écarts de typage ou d’ordre des résultats seedés.


- Action : Run backend offer tests


- Action : Typecheck backend


- Action : Lint backend


- Action : Rerun backend offer tests


Les tests ciblés passent après correction de l’ordre attendu par le seed, et le typecheck/lint backend passent. Je vérifie la documentation et lance maintenant toute la suite backend avant de conclure.


- Action : Run full backend tests


Implémentation backend terminée. Aucun fichier frontend, aucune dépendance et aucune migration n’ont été ajoutés ou modifiés.

## Modifications réalisées

### Validation du paramètre HTTP

Dans [`backend/src/controllers/offers.controller.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/controllers/offers.controller.ts) :

- ajout de la lecture de `req.query.period` ;
- valeurs acceptées :
  - `P1`
  - `P2`
  - `OTHER`
- absence du paramètre : toutes les périodes ;
- valeur inconnue, vide ou paramètre répété : erreur `400 INVALID_QUERY`.

Exemples :

```text
GET /offers
GET /offers?period=P1
GET /offers?period=P2
GET /offers?period=OTHER
GET /offers?period=INVALID       → 400
GET /offers?period=P1&period=P2 → 400
```

Le type partagé `PeriodCode` et la constante `PERIOD_CODES` sont maintenant définis dans [`backend/src/models/offer.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/models/offer.ts).

### Combinaison avec la visibilité métier

Dans [`backend/src/services/offers.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/services/offers.service.ts), le filtre de période est combiné au filtre existant :

| Profil | Filtre appliqué |
|---|---|
| Administrateur | période éventuelle |
| Étudiant | `status = PUBLISHED` + période éventuelle |
| Contact déposant | `depositorContactId = user.id` + période éventuelle |
| Contact sans rôle `DEPOSITOR` | `403 FORBIDDEN` |

Le filtre de période ne remplace donc jamais les règles de visibilité existantes.

### Filtrage SQL

Dans [`backend/src/repositories/offers.repository.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/src/repositories/offers.repository.ts) :

- ajout de `periodCode` dans `OfferFilter` ;
- ajout du paramètre SQL `@periodCode` ;
- filtrage effectué sur la table déjà jointe `periods` :

```sql
AND (@periodCode IS NULL OR p.code = @periodCode)
```

Aucune modification du schéma SQLite n’était nécessaire.

### Tests ajoutés

Dans [`backend/tests/offers.test.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/tests/offers.test.ts), les tests couvrent :

- filtrage administrateur pour `P1`, `P2` et `OTHER` ;
- filtrage étudiant combiné avec `PUBLISHED` ;
- filtrage d’un déposant combiné avec ses propres offres ;
- valeurs invalides ;
- valeur vide ;
- paramètre `period` dupliqué ;
- conservation des règles d’accès existantes.

La documentation API a également été mise à jour dans [`backend/API.md`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/backend/API.md).

## Résultats des vérifications

| Commande | Résultat |
|---|---|
| `npm test --workspace backend -- tests/offers.test.ts` | **21 tests réussis** |
| `npm test --workspace backend` | **118 tests réussis dans 9 fichiers** |
| `npm run typecheck --workspace backend` | **Réussi** |
| `npm run lint --workspace backend` | **Réussi sans avertissement** |
| `git diff --check` | **Réussi** |

Les seuls fichiers suivis modifiés pour cette évolution sont des fichiers backend, les tests backend et la documentation API.


### Échange 7


**Moi :**

Le backend est terminé et les tests passent. Je souhaite maintenant implémenter uniquement le frontend du filtre par période.

Ajoute dans `OffersPage.tsx` un sélecteur avec les choix « Toutes les périodes », « P1 », « P2 » et « Autre ».

Fais circuler la période sélectionnée dans `useOffers.ts` et `offers.service.ts` afin que le frontend envoie le paramètre `period` au backend.

Chaque changement de période doit actualiser la liste des offres.

Conserve la gestion actuelle du chargement, des erreurs et de l’authentification.

Ajoute les tests frontend nécessaires et exécute-les.

Ne modifie aucun fichier backend, n’ajoute aucune dépendance et explique-moi les changements réalisé


**GitHub Copilot :**


Je vais limiter les changements au frontend : inspecter la page, le hook, le service et les tests existants, puis ajouter le sélecteur, propager le filtre et vérifier les tests ciblés sans toucher au backend.


Le type `PeriodCode` et les libellés `P1`, `P2`, `Autre` existent déjà côté frontend. Je vais donc ajouter seulement l’état et le sélecteur dans la page, puis propager une période optionnelle au hook et au service avec `URLSearchParams`, sans toucher aux composants backend.


- Action : « Appliquer un correctif » est en échec


Le premier patch a appliqué correctement le hook et le service, mais la page n’importait pas encore `useState`, donc les hunks restants n’ont pas été appliqués. Je reprends uniquement ces parties et j’ajusterai les tests avec le comportement réel du mock `fetch`.


Le sélecteur et la propagation du paramètre sont ajoutés. Le hook réinitialise aussi l’état de chargement et l’erreur à chaque changement de période afin de conserver un comportement cohérent lors du rechargement. Je lance les tests frontend ciblés, puis le typecheck et le lint frontend.


- Action : Run frontend offers tests


- Action : Typecheck frontend


- Action : Lint frontend


Les tests et le typecheck frontend passent. Le lint refuse toutefois les appels synchrones à `setState` directement dans l’effet ; je vais reprendre le motif déjà utilisé par `useCompanies.ts` en encapsulant le chargement dans une fonction locale, puis relancer les vérifications.


- Action : Rerun frontend offers tests


- Action : Rerun frontend lint


- Action : Rerun frontend typecheck


Les tests ciblés, le lint et le typecheck frontend passent. Je lance la suite frontend complète pour vérifier que le changement ne casse pas les autres pages ou composants.


- Action : Run full frontend test suite


Le filtre frontend par période est implémenté. Aucun fichier backend n’a été modifié pendant cette étape et aucune dépendance n’a été ajoutée.

## Modifications réalisées

### Sélecteur dans `OffersPage`

Dans [`frontend/src/pages/OffersPage.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/pages/OffersPage.tsx) :

- ajout d’un sélecteur accessible avec le libellé `Filtrer par période` ;
- choix disponibles :
  - Toutes les périodes ;
  - P1 ;
  - P2 ;
  - Autre ;
- la valeur par défaut est « Toutes les périodes » ;
- le type existant `PeriodCode` est réutilisé ;
- le tableau des offres reste inchangé.

Lorsque « Toutes les périodes » est sélectionné, aucun paramètre `period` n’est envoyé.

### Propagation dans `useOffers`

Dans [`frontend/src/hooks/useOffers.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/hooks/useOffers.ts) :

- ajout d’un paramètre optionnel `period` ;
- inclusion de cette valeur dans les dépendances du `useEffect` ;
- chaque changement de période déclenche donc un nouvel appel API ;
- l’état de chargement est réinitialisé à chaque nouvelle requête ;
- l’état d’erreur est également réinitialisé ;
- la gestion existante de l’annulation, des erreurs HTTP et des sessions expirées est conservée.

### Paramètre HTTP dans le service

Dans [`frontend/src/services/offers.service.ts`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/src/services/offers.service.ts) :

- ajout d’un paramètre optionnel `period` ;
- construction de l’URL avec `URLSearchParams`.

Exemples générés :

```text
/api/offers
/api/offers?period=P1
/api/offers?period=P2
/api/offers?period=OTHER
```

Le token continue d’être envoyé dans l’en-tête `Authorization`.

### Tests frontend

Dans [`frontend/tests/OffersPage.test.tsx`](/Users/sena/bloc_3/IA_pour_developpeurs/projet/BINV32203BIN1-groupe-07/frontend/tests/OffersPage.test.tsx), ajout de tests vérifiant :

- la présence du sélecteur ;
- la sélection initiale « Toutes les périodes » ;
- l’envoi de `period=P1` ;
- l’envoi de `period=P2` ;
- l’envoi de `period=OTHER` ;
- la mise à jour de la sélection et le rechargement de la liste.

## Résultats des vérifications

| Commande | Résultat |
|---|---|
| `npm test --workspace frontend -- tests/OffersPage.test.tsx` | **7 tests réussis** |
| `npm test --workspace frontend` | **49 tests réussis dans 7 fichiers** |
| `npm run typecheck --workspace frontend` | **Réussi** |
| `npm run lint --workspace frontend` | **Réussi sans avertissement** |
| `git diff --check` | **Réussi** |

Le frontend envoie désormais correctement le paramètre `period` au backend, qui applique déjà le filtrage selon la période et le profil utilisateur.
