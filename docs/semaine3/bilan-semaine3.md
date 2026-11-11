# Bilan de la semaine 3 — Harnais agentique : guider et vérifier

## 1. Objectif de la semaine

La semaine avait quatre objectifs principaux :

- identifier les guides et les senseurs du harnais agentique ;
- analyser la couverture des exigences EF-32 et EF-33 ;
- renforcer les tests existants ;
- auditer les guides du projet par rapport aux bonnes pratiques enseignées
  en Web 2.

## 2. Travail réalisé

### Activité 1 — Identification et classification

La matrice [`matrice-guides-senseurs.md`](./matrice-guides-senseurs.md)
identifie les guides et senseurs présents dans le dépôt.

Les guides documentaires retenus sont le cahier des charges, les instructions
du projet, la documentation d’architecture et le modèle de pull request. Les
tests, le lint, TypeScript, le build et l’orchestration npm sont classés comme
senseurs computationnels.

Aucun guide computationnel ni senseur inférentiel automatisé n’a été confirmé.
Les essais manuels sont distingués comme des vérifications humaines.

### Activité 2 — Traçabilité des tests

La matrice [`matrice-tracabilite-tests.md`](./matrice-tracabilite-tests.md)
relie EF-32, EF-33, RG-03, ENF-03 et ENF-04 aux tests existants.

Elle distingue les scénarios couverts, partiellement couverts et absents. Elle
montre notamment que les fonctionnalités de candidature, de consultation, de
retrait, d’autorisation et d’isolation entre étudiants sont largement testées,
tout en conservant certaines limites concernant l’interface et les URL.

### Activité 3 — Renforcement des tests backend

Cinq tests ont été ajoutés dans
[`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts).

| Test ajouté | Vérification | Régression détectée |
|---|---|---|
| `refuse une candidature sans authentification` | `POST /applications` sans en-tête `Authorization` renvoie `401` avec le code `UNAUTHENTICATED`. | Détecte une régression qui permettrait de créer une candidature sans session authentifiée. |
| `refuse la consultation sans authentification` | `GET /applications/me` sans en-tête `Authorization` renvoie `401` avec le code `UNAUTHENTICATED`. | Détecte une exposition de candidatures à une requête non authentifiée. |
| `refuse le retrait sans authentification` | `POST /applications/:applicationId/withdraw` sans en-tête `Authorization` renvoie `401` avec le code `UNAUTHENTICATED`. | Détecte la possibilité de modifier ou retirer une candidature sans session. |
| `refuse une offre inexistante` | Une candidature étudiante vers `offerId: 999999` renvoie `404` avec le code `NOT_FOUND`. | Détecte une mauvaise gestion des identifiants d’offre inconnus ou une réponse HTTP erronée. |
| `n'expose pas les candidatures d'un autre étudiant` | Avec le token de Lucas, la réponse `200` contient sa candidature et n’inclut pas l’identifiant de la candidature de Mateusz. | Détecte une fuite de candidatures appartenant à un autre étudiant. |

### Activité 4 — Audit des guides Web 2

La section « Audit des guides — bonnes pratiques Web 2 » de
[`matrice-guides-senseurs.md`](./matrice-guides-senseurs.md) compare les guides
aux notions TypeScript et HTTP/REST du cours.

L’audit confirme notamment la présence de consignes sur les type guards, les
headers d’authentification, les paramètres HTTP, les codes d’erreur, les
fichiers REST Client et la documentation API Markdown. Il relève aussi
l’absence de consignes explicites sur l’immutabilité, `map()`/`filter()`,
`?.`, `??`, `!`, le spread, le destructuring, JSDoc et OpenAPI/Swagger.

### Activité 5 — Activité facultative

L’activité 5 était facultative et n’a pas été réalisée.

## 3. Résultats de validation

Avant les améliorations, la suite comptait :

- 142 tests backend ;
- 60 tests frontend ;
- 202 tests au total.

Après l’ajout des cinq tests backend :

- 147 tests backend réussis ;
- 60 tests frontend réussis ;
- 207 tests réussis au total.

La commande `npm run check` a été exécutée intégralement avec succès :

- lint : aucune erreur ni avertissement ;
- TypeScript : réussi ;
- build backend : réussi ;
- build frontend : réussi.

## 4. Limites restantes

Les matrices indiquent encore plusieurs limites :

- le test frontend de retrait vérifie les appels réseau et le rechargement,
  mais pas précisément le contenu final affiché après actualisation ;
- aucun test spécifique ne vérifie l’absence de données personnelles dans les
  URL ;
- la validation de l’identifiant de candidature couvre une valeur non
  numérique, mais pas explicitement les valeurs nulles ou négatives ;
- la chaîne complète API → validation JSON → affichage frontend n’est pas
  couverte par un test d’intégration dédié ;
- la conformité complète à ENF-04 n’est pas démontrée par les seuls tests
  existants.

Ces limites ne signifient pas que les fonctionnalités sont absentes ; elles
indiquent seulement que certains comportements ne sont pas encore vérifiés
par des assertions dédiées.

## 5. Conclusion

La semaine 3 a permis d’identifier les mécanismes de guidage et de contrôle du
projet, de construire une traçabilité entre exigences et tests, et de renforcer
la sécurité backend des routes de candidature. Les cinq nouveaux tests portent
sur l’authentification, l’existence des offres et l’isolation des données entre
étudiants.

Le harnais fournit désormais une meilleure couverture automatisée, validée par
207 tests et par un `npm run check` réussi. Il reste toutefois des limites sur
la vérification détaillée de l’interface, des URL et de certains cas limites ;
les exigences ne doivent donc pas être considérées comme toutes entièrement
couvertes.

## Crédits IA restants

Au 11 novembre 2026, les crédits GitHub Copilot des deux membres du groupe sont les suivants :

- Membre 1 : 19 % utilisés, soit 81 % restants.
- Membre 2 : 0 % utilisés, soit 100 % restants.

Pour le membre 1, la prochaine réinitialisation des crédits est prévue le 1er décembre 2026.