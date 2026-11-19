# Bilan de la semaine 4 - Gesta

## 1. Audit des tests EF-32 et EF-33

La semaine a inclus un audit ciblé des exigences EF-32 (candidature et retrait) et EF-33
(consultation des candidatures et statuts), appuyé sur la matrice de traçabilité
[matrice-tracabilite-tests.md](../semaine3/matrice-tracabilite-tests.md) et sur les tests
backend/frontends existants. Le résultat a été vérifié avec le skill
`test-gap-audit` et sa carte heuristique de couverture. Cette carte a identifié 90 fichiers
source et 23 fichiers de test ; elle a signalé notamment les services, contrôleurs,
repositories et composants comme pistes à confirmer par lecture directe. Elle n'est pas
elle-même une preuve de couverture exhaustive.

| Cas vérifié | Test existant | Assertion principale | Manque confirmé ou écarté |
|---|---|---|---|
| Candidature avec ou sans message | `crée une candidature sans message pour une offre publiée` ; `crée une candidature avec un message` | `201`, identifiant positif, `message`, `IN_PROGRESS` | Écarté : les deux parcours sont explicitement couverts. |
| Candidature interdite à un profil non étudiant | `refuse un utilisateur %s` | `403` et `FORBIDDEN` pour administrateur et contact | Écarté : EF-32 et les contrôles de rôle sont couverts. |
| Offre publiée obligatoire | `refuse une offre qui n'est pas publiée` | `409` et `OFFER_NOT_PUBLISHED` | Écarté : la condition RG-03 est directement testée. |
| Doublon de candidature | `refuse un doublon avec le statut %s` | `409` et `APPLICATION_ALREADY_EXISTS` pour `IN_PROGRESS`, `SELECTED`, `REJECTED` | Écarté : les états actifs ou déjà traités sont couverts. |
| Retrait d'une candidature en cours | `retire une candidature en cours et la conserve dans l'historique` | `200`, statut `WITHDRAWN`, puis relecture de l'historique | Écarté : autorisation et conservation sont vérifiées côté API. |
| Candidature sélectionnée, rejetée ou déjà retirée | `refuse le retrait d'une candidature %s` | `409` et `APPLICATION_NOT_WITHDRAWABLE` | Écarté : les trois états non retirables sont couverts. |
| Retrait d'une candidature inexistante | Aucun test avant renforcement ; test ajouté ensuite : `refuse le retrait d'une candidature inexistante` | `404` et `NOT_FOUND` pour l'identifiant `999999` | **Manque confirmé**, puis couvert par un test ajouté. |
| Isolation entre étudiants | `n'expose pas les candidatures d'un autre étudiant` | Présence de la candidature de Lucas, absence de celle de Mateusz | Écarté : le filtrage entre étudiants est démontré. |
| Consultation réservée à l'étudiant | `refuse l'accès à un %s` | `403` et `FORBIDDEN` pour administrateur et contact | Écarté : l'accès aux autres profils est couvert. |
| Affichage des quatre statuts EF-33 | `affiche les informations et les quatre statuts en français` | Présence de « En cours », « Retenue », « Non retenue », « Retirée » | Écarté : tous les libellés exigés sont testés côté composant. |
| Liste sans candidature | `affiche un état vide` | Présence de « Vous n'avez encore aucune candidature. » | Écarté : l'état vide est couvert côté interface. |
| Historique des candidatures retirées | `conserve les candidatures retirées et sépare les historiques` | Deux candidatures `WITHDRAWN` conservées et retournées | Écarté : la conservation de l'historique est vérifiée. |
| Identifiant de retrait invalide | `refuse un identifiant invalide` | `400` pour une valeur non numérique | Écart partiel : les valeurs numériques négatives ou nulles ne sont pas toutes testées. |
| Rechargement après retrait | `retire une candidature en cours puis actualise la liste` | Appel POST, rechargement, total de trois appels fetch | Écart partiel : les appels sont vérifiés, mais pas le contenu final du rechargement. |
| Chaîne API vers interface EF-33 | Aucun test d'intégration complet | Aucun | Manque confirmé : les données et statuts sont principalement testés avec des réponses simulées. |
| Aucune donnée personnelle dans les URL | Aucun test systématique | Aucun | Manque confirmé pour un contrôle systématique des URLs frontend et des champs exposés. |

## 2. Tests ajoutés ou améliorés après l'audit

- Un test backend a été ajouté dans
  [`backend/tests/applications.test.ts`](../../backend/tests/applications.test.ts:229) pour
  vérifier qu'un étudiant tente de retirer l'identifiant `999999` reçoit `404` avec le code
  `NOT_FOUND`.
- Le test
  [`n'expose pas les candidatures d'un autre étudiant`](../../backend/tests/applications.test.ts:128)
  renforce la séparation entre les historiques étudiant.
- Les tests frontend existants couvrent les quatre statuts, l'état vide, la confirmation
  avant retrait, l'actualisation après retrait et l'affichage d'une erreur de retrait.

## 3. Skill test-driven-development

Le dossier `.github/skills/test-driven-development/` a été installé avec son guide principal
et sa référence sur la rédaction de bons tests. Il comprend notamment le cycle RED-GREEN-
REFACTOR et impose d'écrire puis d'exécuter les tests avant toute modification applicative.

Les instructions
[`.github/copilot-instructions.md`](../../.github/copilot-instructions.md:89) ont été
complétées pour exiger l'application de ce skill lors de tout ajout de fonctionnalité ou
correctif, sous réserve des demandes de documentation seules.

## 4. Développement EF-30 selon le cycle TDD

EF-30 a été développé en respectant le cycle TDD :

1. **Phase RED** : des tests backend et frontend ont été préparés sans modification du code
   applicatif. Ils ont ensuite été exécutés et ont échoué pour l'absence de prise en charge
   de la recherche : 3 tests backend EF-30 échouaient, ainsi que 2 tests frontend EF-30.
2. **Validation humaine** : après ajustement du lot, les seuls tests liés aux exigences
   métier ont été conservés. Les utilisateurs ont explicitement validé ce lot avant toute
   implémentation.
3. **Phase GREEN** : le paramètre `q`, sa recherche dans le titre, sa combinaison avec
   `period`, le champ de recherche frontend et le message adapté ont été implémentés.
   Les tests ciblés sont devenus verts : 24 tests backend réussis et 11 tests frontend
   réussis pour les fichiers concernés.

Les tests ajoutés figurent dans
[`backend/tests/offers.test.ts`](../../backend/tests/offers.test.ts:171) et
[`frontend/tests/OffersPage.test.tsx`](../../frontend/tests/OffersPage.test.tsx:63).

## 5. Vérifications automatisées

Les vérifications globales ont été exécutées avec `npm run check`. Elles ont produit :

- backend : 151 tests réussis ;
- frontend : 62 tests réussis ;
- total : 213 tests réussis ;
- lint : réussi ;
- typecheck : réussi ;
- build backend et build/frontend : réussis.

Les tests ciblés EF-30 ont également été exécutés séparément : 24 tests backend et 11 tests
frontend ont réussi.

## 6. Tests manuels

Les essais manuels rapportés pour EF-30 sont les suivants :

| Action manuelle | Résultat attendu / observé |
|---|---|
| Recherche `REACT` | Le titre contenant « React » est trouvé malgré la casse différente. |
| Recherche `xyz123` | Aucun titre ne correspond ; la liste est vide et un message adapté est affiché. |
| Recherche `React` avec période P1 | Aucun résultat, la recherche étant combinée avec P1 et aucune offre React n'étant publiée sur cette période. |
| Recherche `React` avec période P2 | L'offre « Application React de gestion de flotte » est trouvée. |
| Recherche avec espaces autour du mot-clé | Les espaces au début et à la fin sont ignorés ; le même résultat que pour la recherche sans espaces est obtenu. |

Ces essais confirment les comportements recherchés côté interface, mais aucune capture,
aucun journal d'exécution ou aucune procédure reproductible n'a été conservé dans le dépôt.

## 7. Limites et problèmes restants

- EF-32/EF-33 n'ont pas encore de test d'intégration complet vérifiant API, validation JSON
  et affichage frontend dans une même chaîne.
- Le test de rechargement après retrait vérifie les appels réseau mais ne vérifie pas le
  statut final affiché après la réponse du rechargement.
- La validation complète des identifiants de retrait reste partielle pour les valeurs
  numériques négatives ou nulles.
- L'audit ne confirme pas systématiquement que toutes les URLs frontend évitent les données
  personnelles ; cette vérification reste à renforcer.
- Les essais manuels EF-30 ne disposent pas de traces automatisées persistantes dans le
  dépôt ; ils doivent être rejoués pour une remise contenant une procédure reproductible.
- Aucune demande métier ne prévoyait une tolérance aux accents ou une recherche approximative ;
  ces comportements ne sont donc pas implémentés volontairement.
