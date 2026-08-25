# Tests de bout en bout

Scénarios en boîte noire : ils attaquent l'API par HTTP, exactement comme le
ferait le navigateur. Aucun accès à Prisma ni aux services internes — c'est le
contrat réellement exposé qui est vérifié, codes d'erreur et règles d'accès
compris.

## Lancer

La pile doit tourner :

```bash
npm run db:up          # PostgreSQL + Mailpit
npm run dev:api        # API sur :4000
```

Puis, dans un autre terminal :

```bash
npm run test:e2e
```

### Limites de débit

L'API limite les tentatives de connexion et d'inscription (protection contre le
bourrage d'identifiants). La suite enchaîne assez d'authentifications pour
atteindre ce plafond : **démarre l'API avec des limites relevées** pour la
durée des tests.

```bash
THROTTLE_LIMIT=5000 AUTH_THROTTLE_LIMIT=500 SIGNUP_THROTTLE_LIMIT=500 CONTACT_THROTTLE_LIMIT=500 npm run dev:api
```

`THROTTLE_LIMIT` est la limite **globale**, toutes routes confondues (120 requêtes
par minute par défaut) : c'est elle que la suite atteint en premier, bien avant les
limites d'authentification.

Sans cela, les scénarios échouent en `429 Too Many Requests` — ce qui signale que
la protection fonctionne, pas qu'une fonctionnalité est cassée. Ne modifie pas
les valeurs par défaut dans `.env` : elles sont celles voulues en production.

## Contenu

| Fichier | Couvre |
|---|---|
| `01-parcours-vente.sh` | Inscription avec audio → validation → frais d'accès → dépôt d'annonce → modération → favoris → commande → séquestre → bordereau PDF → expédition → messagerie → réception → retour → remboursement (CDC §3.1 à §3.7) |
| `02-comptes-et-catalogue.sh` | Mot de passe oublié, boost offert et payant, formulaire de contact, retrait d'annonce, profil, filtres et tri du catalogue, rotation de session |
| `lib.sh` | Fonctions communes (connexion, extraction JSON, compteurs) |
| `fixtures/make-png.mjs` | Génère un PNG valide — l'API réencode réellement l'image, un fichier factice serait rejeté |

## Principes

- **Rejouables.** Chaque scénario crée ses propres données et raisonne en
  écarts (séquestre avant/après, non-lus avant/après) plutôt qu'en valeurs
  absolues : deux exécutions successives donnent le même résultat.
- **Les comptes de démonstration ne sont jamais abîmés.** Le test de
  réinitialisation de mot de passe crée un compte jetable, pour ne pas laisser
  `khadija@exemple.fr` avec un mot de passe inattendu.
- **Les refus comptent autant que les succès.** Le back-office fermé aux
  membres, le bordereau refusé à l'acheteuse, l'achat de son propre article,
  le jeton de réinitialisation rejoué : chacun est une assertion.
- **Les e-mails sont lus dans Mailpit**, jamais dans la base : le jeton de
  réinitialisation n'est pas exposé par l'API, le test passe donc par le même
  chemin que la membre.

## Ce qui n'est pas couvert

- **Le chemin Stripe réel.** Les scénarios s'exécutent en mode simulé. Ils
  prouvent l'orchestration (qui est débité, quand les fonds sont libérés, ce
  que la base enregistre), pas les appels à l'API Stripe.
- **L'interface.** Ce sont des tests d'API. Le rendu, le câblage des
  formulaires et les redirections de garde ne sont pas exercés ici.
- **Le nettoyage des paniers abandonnés** (tâche planifiée toutes les 10 min).
