Scénarios de tests E2E — EF-30

Scénario 1 — Recherche avec résultat (cas nominal)

État initial

* Le backend et le frontend de Gesta sont démarrés.
* L’utilisateur est connecté avec le rôle étudiant.
* L’offre publiée « Application React de gestion de flotte » est disponible et visible par l’étudiant.
* Au moins une autre offre publiée dont le titre ne contient pas « React » est disponible.
* Aucun filtre de période n’est sélectionné et le champ de recherche est vide.

Actions

1. Accéder à la page des offres de stage.
2. Saisir REACT dans le champ de recherche.
3. Observer la liste des offres affichées.

Résultats attendus

* L’offre « Application React de gestion de flotte » est affichée.
* Seules les offres publiées dont le titre contient le mot-clé recherché sont affichées.
* Les offres dont le titre ne contient pas « React » ne sont pas affichées.
* La recherche fonctionne indépendamment de la casse.

Scénario 2 — Recherche sans résultat (cas limite)

État initial

* Le backend et le frontend de Gesta sont démarrés.
* L’utilisateur est connecté avec le rôle étudiant.
* Des offres publiées sont disponibles et visibles par l’étudiant.
* Aucun titre d’offre ne contient le mot-clé xyz123.
* Aucun filtre de période n’est sélectionné et le champ de recherche est vide.

Actions

1. Accéder à la page des offres de stage.
2. Saisir xyz123 dans le champ de recherche.
3. Observer la liste des offres affichées.

Résultats attendus

* Aucune offre n’est affichée.
* Un message indiquant l’absence de résultats est affiché.
* Aucune erreur applicative n’est affichée.

Justification du choix des scénarios

Ces deux scénarios reprennent les essais manuels réalisés durant la semaine 4. Le premier vérifie le fonctionnement normal de la recherche par titre et son insensibilité à la casse. Le second vérifie le comportement de l’application lorsqu’aucune offre ne correspond au mot-clé saisi.