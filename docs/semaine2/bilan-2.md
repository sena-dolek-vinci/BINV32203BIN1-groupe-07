Bilan de la semaine 2 — Projet Gesta

1. Choix de planification

Nous avons choisi de travailler sur les exigences EF-32 et EF-33, en divisant l’implémentation en trois étapes :

1. Permettre à un étudiant de candidater à une offre publiée.
2. Permettre à un étudiant de consulter ses candidatures et leurs statuts.
3. Permettre à un étudiant de retirer une candidature non traitée.

Après lecture du premier plan proposé par Copilot, nous avons constaté qu’il concernait une fonctionnalité déjà réalisée : le filtrage des offres par période. Nous avons donc demandé un nouveau plan.

Nous avons également précisé deux règles métier : empêcher plusieurs candidatures actives ou traitées pour une même offre, mais autoriser une nouvelle candidature après un retrait.

2. Résultat

Les trois fonctionnalités ont été implémentées.

Un étudiant peut désormais candidater à une offre publiée avec un message facultatif, consulter ses candidatures sur la page « Mes candidatures » et retirer une candidature ayant le statut « En cours ».

Les candidatures retirées restent enregistrées et l’étudiant peut repostuler à la même offre.

Les fonctionnalités ont été validées par les tests automatisés et les essais manuels réalisés.

Les exigences EF-32 et EF-33 sont couvertes. La sélection des candidatures par un administrateur (EF-34) reste hors du périmètre de cette semaine.

3. Modifications

Nous avons ajouté ou modifié plusieurs fichiers.

Backend :

* applications.controller.ts : gestion des routes de candidature.
* applications.service.ts : application des règles métier.
* applications.repository.ts : accès aux candidatures dans SQLite.
* application.ts et application.mapper.ts : modèle et transformation des données.
* 002_applications_unique_active.sql : index unique partiel empêchant les doublons.
* app.ts et API.md : intégration et documentation des routes.

Frontend :

* ApplicationsPage.tsx : page « Mes candidatures ».
* ApplicationTable.tsx : affichage des candidatures et bouton « Retirer ».
* useApplications.ts : chargement et actualisation des candidatures.
* applications.service.ts : appels API.
* OffersPage.tsx et OfferTable.tsx : ajout de l’action « Candidater ».
* App.tsx, NavBar.tsx et labels.ts : navigation et affichage des statuts.

Après validation du plan, nous avons choisi d’utiliser un index unique partiel SQLite pour empêcher les doublons sans bloquer les nouvelles candidatures après un retrait.

4. Validation fonctionnelle

Nous avons testé manuellement les fonctionnalités dans l’application.

Les cas essayés sont notamment :

* Candidater à une offre publiée : candidature créée.
* Candidater une deuxième fois à la même offre : refus avec une erreur 409.
* Consulter « Mes candidatures » : les candidatures et leurs statuts s’affichent.
* Accéder à cette page avec un compte administrateur : accès refusé.
* Retirer une candidature « En cours » : le statut devient « Retirée ».
* Annuler la confirmation du retrait : la candidature reste inchangée.
* Repostuler après un retrait : une nouvelle candidature est créée et l’ancienne reste visible.

Ces essais ont donné les résultats attendus.

5. Qualité du code

Nous avons vérifié le respect de l’architecture existante : controllers, services, repositories et mappers.

Les autorisations sont contrôlées côté backend. Le retrait utilise une mise à jour conditionnelle pour éviter de modifier une candidature déjà traitée.

Pendant le développement, Copilot a rencontré plusieurs problèmes : erreurs de typage TypeScript, mauvaise insertion de certains tests et erreur de lint dans un hook React.

Ces problèmes ont été corrigés avant la validation finale.

Aucune erreur restante n’a été signalée par les vérifications exécutées. Une revue exhaustive du code n’a toutefois pas été réalisée.

6. Tests et commandes

Des tests backend et frontend ont été ajoutés pour vérifier la création, la consultation et le retrait des candidatures.

Commandes exécutées :

* npm test : 202 tests réussis (142 backend et 60 frontend).
* npm run typecheck : réussi.
* npm run lint : réussi.
* git diff --check : réussi.

Exemple de test : lorsqu’un étudiant retire une candidature au statut IN_PROGRESS, son statut devient WITHDRAWN. La candidature reste enregistrée et une nouvelle candidature à la même offre est autorisée.

Les tests automatisés et les vérifications manuelles réalisés n’ont pas révélé de problème restant sur ces fonctionnalités.