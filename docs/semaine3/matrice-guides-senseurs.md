# Matrice d’identification et de classification des guides et senseurs

## Contexte

Cette matrice recense les mécanismes réellement identifiés dans le dépôt Gesta
pour l’activité 1 « Harnais agentique : guider et vérifier ».

- Un **guide (feedforward)** oriente le travail avant ou pendant son exécution.
- Un **senseur (feedback)** observe, vérifie ou signale un résultat.
- Un mécanisme est **inférentiel** lorsqu’il nécessite une interprétation
  humaine.
- Un mécanisme est **computationnel** lorsqu’il est appliqué ou exécuté par un
  programme ou un outil.

Les contraintes SQLite et les règles métier de l’application sont conservées
dans le code, mais ne sont pas classées comme guides du harnais : elles
définissent le comportement de Gesta, et ne donnent pas d’instruction à
l’agent.

## Guide inférentiel

| Nom | Fichier ou outil | Rôle | Exemple concret | État |
|---|---|---|---|---|
| Cahier des charges Gesta | [`docs/cdc_gesta_developpement.md`](../cdc_gesta_developpement.md) | Définit les exigences et règles métier à interpréter avant l’implémentation. | RG-03 impose qu’un étudiant ne puisse candidater qu’à une offre publiée ; EF-32 et EF-33 définissent la candidature, la consultation et le retrait. | Configuré comme référence et utilisé pour définir le comportement. |
| Instructions du projet | [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md) | Oriente l’architecture, les conventions d’import, les permissions, les migrations et le contrat d’erreur. | Les permissions doivent être contrôlées par le backend et une évolution SQLite doit passer par une nouvelle migration. | Configuré et suivi dans le projet. |
| Documentation d’architecture | [`docs/architecture.md`](../architecture.md) | Décrit le découpage attendu entre controllers, services, repositories, mappers et interface frontend. | Les services portent les règles métier et ne dépendent pas de `Request` ou `Response`. | Configuré et appliqué dans les flux de candidature. |
| Modèle de pull request | [`.github/pull_request_template.md`](../../.github/pull_request_template.md) | Guide la description de la fonctionnalité, des changements, des tests, des droits et des points d’attention. | La checklist demande des tests d’erreur, une vérification backend des droits et la mise à jour de la documentation API. | Configuré ; c’est un guide documentaire, pas un contrôle automatique. |

## Guide computationnel

**Aucun guide computationnel confirmé.**

Les fichiers de configuration TypeScript et Oxlint, ainsi que les scripts de
test et de build, exécutent des contrôles sur le travail produit. Ils sont donc
classés comme **senseurs computationnels**, et non comme instructions données à
l’agent.

## Senseur inférentiel

**Aucun senseur inférentiel automatisé confirmé.**

Les essais manuels et les décisions métier sont des vérifications humaines
séparées. Ils ne constituent pas des senseurs inférentiels automatisés du
harnais. Le bilan documente notamment les essais de candidature, de consultation,
de retrait et de repostulage dans [`docs/semaine2/bilan-2.md`](../semaine2/bilan-2.md).

## Senseur computationnel

| Nom | Fichier ou outil | Rôle | Exemple concret | État |
|---|---|---|---|---|
| Contraintes TypeScript | [`backend/tsconfig.json`](../../backend/tsconfig.json), [`frontend/tsconfig.app.json`](../../frontend/tsconfig.app.json) | Détecte les erreurs de typage et certains défauts statiques. | `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals` et `noUnusedParameters` sont activés. | Configuré et vérifié par `npm run check`, sans erreur. |
| Règles Oxlint | [`backend/.oxlintrc.json`](../../backend/.oxlintrc.json), [`frontend/.oxlintrc.json`](../../frontend/.oxlintrc.json) | Contrôle automatiquement la qualité du code backend et frontend. | Le projet interdit notamment `any` explicite et impose `eqeqeq`; le frontend contrôle aussi les règles React Hooks. | Configuré et exécuté par `npm run check`, sans erreur ni avertissement. |
| Tests backend Vitest/Supertest | [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts) | Vérifient automatiquement les réponses HTTP, les droits et les transitions de statut. | Le fichier contient 27 tests sur la création, les doublons, la consultation, l’authentification et le retrait des candidatures. | Exécuté dans `npm run check` ; 147 tests backend réussis au total. |
| Tests frontend Vitest/Testing Library | [`frontend/tests/ApplicationsPage.test.tsx`](../../frontend/tests/ApplicationsPage.test.tsx) | Vérifient l’affichage et les interactions de la page « Mes candidatures ». | Le fichier contient 8 tests sur les quatre statuts, les erreurs, la session expirée et le retrait. | Exécuté dans `npm run check` ; 60 tests frontend réussis au total. |
| Build TypeScript/Vite | Scripts `build` de [`backend/package.json`](../../backend/package.json) et [`frontend/package.json`](../../frontend/package.json) | Vérifie que le backend et le frontend peuvent être compilés et empaquetés. | Le backend est compilé et les migrations sont copiées ; le frontend est construit avec Vite. | Exécuté dans `npm run check` avec succès. |
| Orchestration de validation npm | [`package.json`](../../package.json) | Enchaîne les contrôles automatisés du dépôt. | `npm run check` exécute le lint, le typecheck, les tests et le build. | Exécuté intégralement avec succès : 207 tests au total, aucune erreur de lint ou de typage et builds backend/frontend réussis. |

## Vérifications humaines séparées

Ces éléments ont bien été identifiés dans le dépôt, mais ne sont pas des guides
ou des senseurs computationnels du harnais :

- les essais manuels fonctionnels décrits dans
  [`docs/semaine2/bilan-2.md`](../semaine2/bilan-2.md) ;
- les décisions métier documentées dans ce même bilan, notamment le refus des
  candidatures actives ou traitées en double et l’autorisation d’une nouvelle
  candidature après retrait.

Ils correspondent à une appréciation humaine du résultat, et leur état est
**exécuté et vérifié manuellement**, selon le bilan.

## Résumé

| Catégorie | Résultat |
|---|---|
| Guide inférentiel | 4 guides documentaires identifiés |
| Guide computationnel | Aucun mécanisme confirmé |
| Senseur inférentiel | Aucun senseur automatisé confirmé |
| Senseur computationnel | TypeScript, Oxlint, tests, build et orchestration npm |

Les liens Markdown de cette matrice pointent vers des fichiers existants du
dépôt. Aucun fichier de code n’est modifié par cette activité.

## Audit des guides — bonnes pratiques Web 2

L’audit compare uniquement les notions du cours aux consignes effectivement
écrites dans les guides du projet. Une pratique absente d’un guide n’est pas
considérée comme une mauvaise implémentation.

| Bonne pratique Web 2 | Guide concerné et lignes exactes | Consigne réellement présente | Évaluation | Justification |
|---|---|---|---|---|
| Programmation fonctionnelle et immutabilité | Aucun des trois guides | Aucune consigne explicite sur la programmation fonctionnelle ou l’immutabilité. | Non | Cette notion n’est pas mentionnée dans les guides examinés. |
| `map()` et `filter()` | Aucun des trois guides | Aucune consigne sur l’utilisation de `map()` ou `filter()`. | Non | L’absence de cette consigne ne permet pas de conclure à une mauvaise implémentation. |
| Optional chaining `?.` et nullish coalescing `??` | Aucun des trois guides | Aucune consigne sur `?.` ou `??`. | Non | Ces opérateurs ne sont pas mentionnés. |
| Précautions avec l’opérateur `!` | Aucun des trois guides | Aucune consigne sur les assertions non nulles avec `!`. | Non | La pratique n’est pas documentée. |
| Spread et destructuring | Aucun des trois guides | Aucune consigne sur le spread ou le destructuring. | Non | La notion n’est pas abordée dans les guides. |
| Type guards | [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md) — lignes 50-51 ; [`docs/architecture.md`](../architecture.md) — ligne 92 | Les services frontend « validate JSON with type guards » ; les services frontend valident le JSON avec un type guard. | Oui | La pratique est explicitement recommandée dans les deux guides. |
| Méthodes HTTP GET, POST, PUT, PATCH et DELETE | [`docs/architecture.md`](../architecture.md) — lignes 72, 112 ; [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md) — lignes 84-86 | Les guides citent `POST /auth/demo-login`, `GET /companies?q=` et la mise à jour des exemples HTTP, mais ne prescrivent pas les cinq méthodes ni leur choix. | Partiel | Les méthodes HTTP apparaissent comme exemples ou routes existantes, sans consigne complète couvrant GET, POST, PUT, PATCH et DELETE. |
| Paramètres de chemin et de requête, body et headers | [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md) — lignes 40-46, 64-67 ; [`docs/architecture.md`](../architecture.md) — lignes 73, 112 | Les controllers valident les paramètres et le corps ; le token est envoyé dans `Authorization` ; `GET /companies?q=` illustre un paramètre de requête. | Partiel | Le body, les headers et les paramètres de requête sont documentés ou illustrés ; aucun guide ne prescrit explicitement les paramètres de chemin. |
| Codes HTTP 200, 201, 204, 400, 401, 403, 404, 409 et 500 | [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md) — lignes 78-80 ; [`docs/architecture.md`](../architecture.md) — lignes 47, 75-76 ; [`.github/pull_request_template.md`](../../.github/pull_request_template.md) — lignes 9-16 | Le contrat d’erreur `400`, `401`, `403`, `404` et `500` doit être préservé ; la checklist demande des tests d’erreur ; l’architecture décrit `401` et `403`. | Partiel | Les codes d’erreur sont explicitement documentés, mais `200`, `201`, `204` et `409` ne sont pas tous prescrits dans un contrat général. |
| Tests des API avec REST Client | [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md) — lignes 84-86 ; [`docs/architecture.md`](../architecture.md) — lignes 5-16 | Les fichiers `backend/http/*.http` doivent rester à jour ; l’arborescence décrit le dossier `backend/http/` comme contenant des requêtes REST Client. | Oui | Le guide Copilot demande explicitement de maintenir les exemples HTTP ; l’architecture identifie leur rôle. |
| Documentation API avec Markdown | [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md) — lignes 56-58, 84-86 ; [`docs/architecture.md`](../architecture.md) — ligne 11 | `backend/API.md` est identifié comme documentation des routes et doit rester à jour. | Oui | La documentation API Markdown est explicitement attendue et maintenue. |
| Documentation API avec JSDoc | Aucun des trois guides | Aucune consigne JSDoc. | Non | JSDoc n’est pas mentionné. |
| Documentation API avec OpenAPI/Swagger | Aucun des trois guides | Aucune consigne OpenAPI ou Swagger. | Non | OpenAPI et Swagger ne sont pas mentionnés. |

### Bilan de l’audit

Les points forts documentaires sont la validation des réponses JSON avec des
type guards, la description des paramètres HTTP et des headers, le contrat
d’erreur partiellement détaillé, les tests via fichiers HTTP et la
documentation API Markdown.

Les principales lacunes concernent les pratiques TypeScript de la séance 1 :
immutabilité, programmation fonctionnelle, opérateurs `?.`, `??` et `!`,
spread et destructuring. Les guides ne prescrivent pas non plus JSDoc,
OpenAPI/Swagger, ni l’ensemble des méthodes HTTP et des codes de succès.

Aucune contradiction explicite n’a été identifiée entre les guides et les
notions du cours. Les évaluations « non » signalent uniquement une absence de
consigne, et non une mauvaise implémentation.
