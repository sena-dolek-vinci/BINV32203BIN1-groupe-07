Bilan de la semaine 5 — Gesta

1. Préparation des scénarios E2E

Deux scénarios de tests E2E ont été définis pour la fonctionnalité EF-30, qui permet de rechercher des offres de stage par leur titre.

Les scénarios sont disponibles dans le fichier scenarios.md.

Scénario	Type	Objectif
Scénario 1	Cas nominal	Vérifier que la recherche REACT affiche uniquement l’offre correspondante, indépendamment de la casse.
Scénario 2	Cas limite	Vérifier que la recherche xyz123 affiche un message d’absence de résultats.

Ces scénarios ont été choisis sur la base des essais manuels réalisés durant la semaine 4. Ils ont été rédigés avant de demander à Copilot de générer les tests automatisés.

2. Playwright MCP

Le serveur Playwright MCP a été démarré localement sur le port 8931.

Cependant, conformément à la nouvelle consigne orale du professeur durant la séance, la partie concernant l’utilisation de Playwright MCP n’a pas été poursuivie.

Le serveur a donc été arrêté et nous sommes directement passées à Playwright Test.

Aucun scénario n’a été exécuté avec MCP.

3. Installation et configuration de Playwright Test

Playwright Test a été installé à la racine du projet avec la commande :

npm init playwright@latest

Les choix de configuration sont les suivants :

* Langage : TypeScript.
* Répertoire des tests : e2e.
* Navigateurs : Chromium, Firefox et WebKit.
* Adresse du frontend : http://localhost:5173.
* Aucune configuration GitHub Actions supplémentaire.
* Démarrage manuel de l’application avec npm run dev.

Le fichier de configuration est disponible dans playwright.config.ts.

Le test d’exemple généré automatiquement par Playwright a été supprimé, car il ne concernait pas Gesta.

4. Génération des tests automatisés

Copilot a été utilisé en mode Agent pour générer les deux tests à partir des scénarios préparés.

Le fichier créé est recherche-offres.spec.ts.

Les tests utilisent le profil étudiant Louis Claes en mode démo.

Chaque test vérifie les conditions initiales et réalise son propre parcours de connexion et de navigation.

Les sélecteurs utilisent principalement les rôles et les libellés accessibles de l’interface.

Assertions du scénario 1

* Présence de l’offre « Application React de gestion de flotte ».
* Présence du statut « Publiée ».
* Présence d’une seule offre dans le tableau des résultats.
* Absence de l’offre « API REST de facturation ».

Assertions du scénario 2

* Affichage du message « Aucune offre ne correspond à la recherche. ».
* Absence du tableau des offres.
* Absence de message d’erreur identifié par le rôle alert.

Le code généré a été relu avant son exécution. Aucune modification du code applicatif n’a été nécessaire pour faire réussir les tests.

5. Résultats des vérifications automatisées

Les tests E2E ont été exécutés manuellement avec la commande :

npx playwright test

Les deux scénarios ont été exécutés sur Chromium, Firefox et WebKit.

Exécution	Résultat	Durée
Première exécution	6/6 tests réussis	8,1 secondes
Deuxième exécution	6/6 tests réussis	3,2 secondes

Les deux exécutions consécutives ont réussi sans modification intermédiaire.

La commande npm run check a également été exécutée.

Vérification	Résultat
Lint	0 erreur et 0 avertissement
Typecheck	Réussi
Tests backend	151/151 réussis
Tests frontend	62/62 réussis
Build backend	Réussi
Build frontend	Réussi

Au total, les 213 tests existants ont réussi.

La commande npm run check n’inclut pas les tests Playwright, qui ont été exécutés séparément.

6. Vérification de la détection d’une régression

Afin de vérifier l’efficacité des tests E2E, un défaut temporaire a été introduit dans le fichier frontend/src/hooks/useOffers.ts.

La ligne originale :

getOffers(token, period, search, controller.signal)

A été temporairement remplacée par :

getOffers(token, period, undefined, controller.signal)

Cette modification empêche la transmission du mot-clé de recherche au backend.

Le scénario 1 a ensuite été exécuté avec la commande :

npx playwright test --project=chromium -g "Scénario 1"

Le test a échoué pour la raison attendue :

* Nombre de lignes attendu : 2 (un en-tête et une offre).
* Nombre de lignes obtenu : 5 (un en-tête et quatre offres).

L’assertion toHaveCount(2) a donc correctement détecté que le filtrage ne fonctionnait plus.

Le code original a ensuite été restauré et l’ensemble des tests E2E a été relancé.

Résultat : 6/6 tests réussis en 3,0 secondes.

Cette expérience démontre que le test est capable de détecter une régression de la fonctionnalité de recherche.

7. Comparaison entre Playwright MCP et Playwright Test

Que permet Playwright MCP dans une conversation avec un agent ?

Playwright MCP permet à un agent de naviguer dans une application, de cliquer sur des éléments, de remplir des champs et d’observer les résultats directement depuis une conversation.

Dans notre cas, aucune interaction avec le navigateur via MCP n’a été réalisée, conformément à la nouvelle consigne du professeur.

Qu’apportent les scripts Playwright Test par rapport à un compte rendu MCP ?

Les scripts permettent de conserver les tests dans le dépôt, de les réexécuter automatiquement et de vérifier les résultats à l’aide d’assertions précises.

Ils permettent également de détecter des régressions après une modification du code.

Quand privilégier chaque approche ?

Playwright MCP est particulièrement utile pour explorer une interface, comprendre son fonctionnement ou investiguer un problème.

Playwright Test est préférable pour vérifier régulièrement des comportements définis et détecter automatiquement des régressions.

Les deux approches sont complémentaires.

8. Limites et points d’attention

* La partie MCP n’a pas été réalisée conformément à la nouvelle consigne du professeur.
* Les tests E2E reposent sur les données de démonstration de Gesta.
* Les deux scénarios ne couvrent pas tous les comportements possibles de la recherche, notamment la combinaison avec le filtre de période.
* L’exécution de npm audit a identifié une vulnérabilité de gravité élevée dans body-parser@2.3.0, une dépendance indirecte d’Express. Cette vulnérabilité n’a pas été corrigée durant cette séance afin de ne pas modifier les dépendances du backend en dehors du périmètre du travail demandé.
* Les tests E2E doivent actuellement être lancés séparément des vérifications globales du projet.