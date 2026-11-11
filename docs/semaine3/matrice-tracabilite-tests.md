# Matrice de traçabilité entre exigences et tests

## Périmètre

Cette matrice met en relation les exigences EF-32, EF-33, RG-03, ENF-03 et
ENF-04 du cahier des charges avec les tests existants. Les tests paramétrés
sont mentionnés avec leur nom exact et leur portée réelle.

Les états utilisés sont :

- **Couvert** : les assertions vérifient directement le scénario ;
- **Partiellement couvert** : une partie du scénario est vérifiée, mais une
  condition ou une limite importante ne l’est pas ;
- **Absent** : aucun test existant ne vérifie le scénario.

## Traçabilité

| Exigence concernée | Scénario à vérifier | Fichier de test | Nom exact du test (`it` ou `test`) | Assertions qui prouvent le comportement | État | Justification de l’état |
|---|---|---|---|---|---|---|
| EF-32 | Un étudiant candidate à une offre publiée sans message. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `crée une candidature sans message pour une offre publiée` | Vérifie `response.status === 201`, le `offerId`, `message === null`, `status === "IN_PROGRESS"` et un identifiant positif. | Couvert | Le test vérifie explicitement la création et le statut initial d’une candidature sans message. |
| EF-32 | Un étudiant candidate avec un message facultatif. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `crée une candidature avec un message` | Vérifie `response.status === 201` et que le message retourné est conservé après suppression des espaces superflus. | Couvert | Le message facultatif et son résultat sont directement vérifiés. |
| EF-32 | Un utilisateur qui n’est pas étudiant ne peut pas candidater. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `refuse un utilisateur %s` | Pour un administrateur et un contact, vérifie le statut `403` et le code `FORBIDDEN`. | Couvert | Le contrôle du rôle côté serveur est testé pour les deux profils non étudiants. |
| EF-32 | Une candidature est refusée si l’offre n’est pas publiée. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `refuse une offre qui n'est pas publiée` | Vérifie le statut `409` et le code `OFFER_NOT_PUBLISHED`. | Couvert | Le test couvre directement la condition de candidature à une offre publiée. |
| EF-32 — authentification | Une candidature sans authentification est refusée. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `refuse une candidature sans authentification` | Envoie `POST /applications` sans en-tête `Authorization` et vérifie le statut `401` et le code `UNAUTHENTICATED`. | Couvert | Le refus d’une requête non authentifiée est explicitement testé pour la création d’une candidature. |
| RG-03 | Un étudiant ne peut candidater qu’à une offre publiée. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `refuse une offre qui n'est pas publiée` | Vérifie que l’offre non publiée produit `409` avec `OFFER_NOT_PUBLISHED`. | Couvert | RG-03 est vérifiée directement pour le statut de l’offre utilisé par le seed. |
| RG-03 | Une offre inexistante est refusée. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `refuse une offre inexistante` | Envoie une candidature étudiante avec `offerId: 999999` et vérifie le statut `404` et le code `NOT_FOUND`. | Couvert | Le service vérifie explicitement l’existence de l’offre avant d’évaluer son statut. Le `404` est un comportement technique testé, et non une exigence explicitement formulée par EF-32 ou EF-33. |
| EF-32 | Un étudiant ne peut pas créer une deuxième candidature active ou traitée pour la même offre. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `refuse un doublon avec le statut %s` | Pour `IN_PROGRESS`, `SELECTED` et `REJECTED`, vérifie `409` et `APPLICATION_ALREADY_EXISTS`. | Couvert | Les trois statuts non retirés sont explicitement testés, y compris les statuts traités. |
| EF-32 — robustesse | Plusieurs candidatures retirées peuvent être conservées pour une même offre et un même étudiant. | [`backend/tests/db/constraints.test.ts`](../../backend/tests/db/constraints.test.ts) | `autorise plusieurs candidatures retirées pour la même offre et le même étudiant` | Insère deux candidatures `WITHDRAWN` et vérifie que les deux insertions ne lèvent pas d’exception. | Couvert | Ce scénario confirme la conservation de l’historique et la possibilité technique de repostuler. |
| EF-32 — robustesse | Une nouvelle candidature est possible après un retrait. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `autorise ensuite une nouvelle candidature sur la même offre` | Vérifie le retrait en `200`, puis la nouvelle candidature en `201`, son statut `IN_PROGRESS` et un nouvel identifiant. | Couvert | Le parcours retrait puis nouvelle candidature est vérifié de bout en bout par l’API. |
| EF-32 | Un étudiant peut retirer sa candidature tant qu’elle est `IN_PROGRESS`. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `retire une candidature en cours et la conserve dans l'historique` | Vérifie `200`, le statut retourné `WITHDRAWN`, puis relit la liste et vérifie que la candidature est conservée avec ce statut. | Couvert | Le test vérifie à la fois l’autorisation du retrait et la conservation de l’historique. |
| EF-32 | Une candidature `SELECTED`, `REJECTED` ou `WITHDRAWN` ne peut plus être retirée. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `refuse le retrait d'une candidature %s` | Pour les trois statuts, vérifie `409` et `APPLICATION_NOT_WITHDRAWABLE`. | Couvert | Les trois états non retirables sont explicitement couverts. |
| EF-32 — contrôle de propriété | Un étudiant ne peut pas retirer la candidature d’un autre étudiant. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `refuse le retrait d'une candidature appartenant à un autre étudiant` | Vérifie le statut `403` et le code `FORBIDDEN`. | Couvert | La séparation entre le propriétaire de la candidature et un autre étudiant est vérifiée côté serveur. |
| EF-32 — contrôle de rôle | Un administrateur ou un contact ne peut pas retirer une candidature. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `refuse le retrait à un %s` | Pour les deux profils, vérifie `403` et `FORBIDDEN`. | Couvert | Le retrait est protégé par le rôle côté backend. |
| EF-32 — authentification | Le retrait sans authentification est refusé. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `refuse le retrait sans authentification` | Envoie `POST /applications/:applicationId/withdraw` sans en-tête `Authorization` et vérifie le statut `401` et le code `UNAUTHENTICATED`. | Couvert | Le refus d’une requête non authentifiée est explicitement testé pour le retrait. |
| EF-32 — validation d’entrée | L’identifiant de candidature doit être un entier positif. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `refuse un identifiant invalide` | Avec `not-an-id`, vérifie `400` et `INVALID_PARAMETER`. | Partiellement couvert | Le test vérifie une valeur non numérique, mais ne couvre pas les valeurs numériques nulles ou négatives. |
| EF-32 — interface | L’étudiant doit confirmer avant le retrait ; une annulation ne doit rien modifier. | [`frontend/tests/ApplicationsPage.test.tsx`](../../frontend/tests/ApplicationsPage.test.tsx) | `demande confirmation avant de retirer` | Simule `window.confirm` à `false`, vérifie que la confirmation est appelée et que « En cours » reste affiché. | Couvert | Le scénario d’annulation de l’action est explicitement testé côté interface. |
| EF-32 — interface | Le retrait déclenche une requête puis actualise la liste. | [`frontend/tests/ApplicationsPage.test.tsx`](../../frontend/tests/ApplicationsPage.test.tsx) | `retire une candidature en cours puis actualise la liste` | Vérifie l’appel `POST` vers `/api/applications/1/withdraw` avec le token et trois appels fetch au total, dont le rechargement. | Partiellement couvert | Le test vérifie les appels réseau et le déclenchement du rechargement, mais pas le contenu final affiché après celui-ci. |
| EF-32 — interface | Une erreur de retrait est affichée à l’étudiant. | [`frontend/tests/ApplicationsPage.test.tsx`](../../frontend/tests/ApplicationsPage.test.tsx) | `affiche une erreur de retrait` | Retourne `409` et vérifie l’affichage du message « Cette candidature ne peut plus être retirée ». | Couvert | La présentation d’une erreur de retrait est directement vérifiée. |
| EF-33 | L’étudiant consulte ses propres candidatures, sans recevoir l’identifiant interne de l’étudiant. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `retourne uniquement les candidatures de l'étudiant connecté` | Vérifie une seule candidature appartenant au profil attendu, ses informations d’offre et l’absence de propriété `studentId`. | Partiellement couvert | Le test vérifie le résultat attendu et l’absence de `studentId`, mais ne démontre pas explicitement qu’une candidature appartenant à un autre étudiant est exclue. |
| EF-33 — authentification | La consultation sans authentification est refusée. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `refuse la consultation sans authentification` | Envoie `GET /applications/me` sans en-tête `Authorization` et vérifie le statut `401` et le code `UNAUTHENTICATED`. | Couvert | Le refus d’une requête non authentifiée est explicitement testé pour la consultation. |
| EF-33 | Un étudiant ne reçoit pas les candidatures d’un autre étudiant. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `n'expose pas les candidatures d'un autre étudiant` | Avec le token de Lucas, vérifie le statut `200`, la présence de `APPLICATION.LUCAS_FLEET_APP` et l’absence de `APPLICATION.MATEUSZ_CLOUD_MIGRATION` dans les identifiants retournés. | Couvert | Le test démontre explicitement l’inclusion de sa candidature et l’exclusion de l’identifiant d’un autre étudiant. |
| EF-33 | Les quatre statuts sont affichés avec les libellés attendus. | [`frontend/tests/ApplicationsPage.test.tsx`](../../frontend/tests/ApplicationsPage.test.tsx) | `affiche les informations et les quatre statuts en français` | Vérifie la présence de « En cours », « Retenue », « Non retenue » et « Retirée », ainsi que les offres et le message. | Couvert | Les quatre statuts exigés par EF-33 sont tous présents dans les assertions. |
| EF-33 | Une liste vide est signalée clairement. | [`frontend/tests/ApplicationsPage.test.tsx`](../../frontend/tests/ApplicationsPage.test.tsx) | `affiche un état vide` | Vérifie l’affichage de « Vous n'avez encore aucune candidature. ». | Couvert | L’état limite sans candidature est explicitement vérifié. |
| EF-33 | Les candidatures retirées restent visibles dans l’historique. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `conserve les candidatures retirées et sépare les historiques` | Insère deux candidatures `WITHDRAWN`, vérifie qu’elles sont toutes les deux retournées et que le statut `WITHDRAWN` est présent. | Couvert | La conservation et la séparation de l’historique sont directement testées. |
| EF-33 | Un administrateur ou un contact ne peut pas consulter « mes candidatures ». | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `refuse l'accès à un %s` | Pour les deux profils, vérifie `403` et `FORBIDDEN`. | Couvert | La consultation est limitée au rôle étudiant côté serveur. |
| ENF-03 | Chaque action de candidature est protégée côté serveur par rôle et authentification. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `refuse un utilisateur %s`; `refuse l'accès à un %s`; `refuse le retrait à un %s`; `refuse une candidature sans authentification`; `refuse la consultation sans authentification`; `refuse le retrait sans authentification` | Les tests de rôle vérifient `403` et `FORBIDDEN` pour les profils non autorisés ; les trois nouveaux tests sans token vérifient `401` et `UNAUTHENTICATED`. | Couvert | Les opérations de création, consultation et retrait disposent maintenant de contrôles backend pour les rôles interdits et l’absence d’authentification. |
| ENF-04 | Les données personnelles des candidatures sont accessibles uniquement à la personne concernée. | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | `n'expose pas les candidatures d'un autre étudiant`; `retourne uniquement les candidatures de l'étudiant connecté`; `refuse l'accès à un %s` | Vérifie le statut `200`, la présence de l’identifiant de Lucas, l’absence de celui de Mateusz, l’absence de `studentId` dans le DTO et les refus `403` pour administrateur/contact. | Couvert | Le filtrage entre deux étudiants est désormais démontré explicitement ; l’accès aux candidatures d’autrui est aussi refusé aux autres profils. |
| ENF-04 | Aucune donnée personnelle ne figure dans les URL. | Aucun test correspondant | — | Aucun test ne vérifie systématiquement les URL utilisées par les services frontend. | Absent | Le chemin `/applications/me` ne contient pas de donnée personnelle, mais cette observation n’est pas une assertion de test. |
| ENF-04 — robustesse | Une session expirée renvoie l’utilisateur vers la gestion de session non autorisée. | [`frontend/tests/ApplicationsPage.test.tsx`](../../frontend/tests/ApplicationsPage.test.tsx) | `signale une session expirée` | Simule une réponse `401` et vérifie l’appel de `onUnauthorized`. | Couvert | Le comportement frontend associé à une session expirée est explicitement vérifié, sans prouver à lui seul toute l’exigence RGPD. |

## Bilan des lacunes

### Couvertures solides

- EF-32 est largement couverte côté API : création avec ou sans message,
  offre publiée, rôles autorisés, doublons, retrait, historique et
  repostulage.
- EF-33 est couverte pour l’affichage des quatre statuts, l’état vide et la
  conservation des candidatures retirées.
- ENF-03 est couverte pour les trois actions de candidature, avec des contrôles
  de rôle et d’authentification côté serveur.

### Couvertures partielles ou absentes

1. **ENF-04** : le filtrage entre étudiants est maintenant testé, mais il
   manque un contrôle systématique de tous les champs exposés et des URL
   frontend.
2. **EF-32 côté interface** : le test de rechargement vérifie les appels réseau,
   mais pas le contenu final affiché après le rechargement.
3. **EF-33 côté interface** : les statuts sont testés avec des données
   simulées ; il n’existe pas de test d’intégration vérifiant la chaîne complète
   API → validation JSON → affichage.

## Tests prioritaires à ajouter

1. Ajouter un test de confidentialité vérifiant précisément le DTO retourné
   et l’absence de données personnelles non nécessaires.
2. Ajouter un test frontend qui vérifie la liste effectivement mise à jour
   après un retrait réussi.
3. Ajouter des tests de service frontend vérifiant que les URL ne contiennent
   jamais d’e-mail, de nom ou d’autre donnée personnelle.

## Résultats de validation

La commande `npm run check` a été exécutée avec succès :

- 147 tests backend réussis ;
- 60 tests frontend réussis ;
- 207 tests réussis au total ;
- aucune erreur ni avertissement de lint ;
- vérification TypeScript réussie ;
- builds backend et frontend réussis.
