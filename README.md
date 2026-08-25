# Nissa Dressing

Marketplace de vente entre sœurs — vêtements et accessoires conformes.
Implémentation de la **V1** du cahier des charges « Marketplace 1500 » (Qasr Web).

**Stack :** Next.js 16 (App Router) · NestJS 11 · PostgreSQL 18 · Prisma 7 · Stripe Connect · Tailwind CSS 4

---

## 1. Structure

Le front et l'API sont **deux projets indépendants**, chacun avec son propre
`package.json` et son propre `node_modules` :

```
nissa-dressing/
├── frontend/            Next.js — s'installe et se lance seul
├── backend/             NestJS + Prisma — s'installe et se lance seul
├── shared/              @nissa/shared — code métier commun aux deux
├── e2e/                 tests d'API de bout en bout (npm run test:e2e)
├── docker-compose.yml   PostgreSQL + Mailpit
├── package.json         raccourcis de commandes (ce n'est pas un monorepo npm)
└── legacy/              ancien prototype Vite, conservé pour référence
```

Côté front, les pages n'orchestrent que les données et la navigation ; tout le
rendu vit dans `frontend/src/components/`, regroupé par domaine :

```
components/
├── ui/          design system (Button, Field, Alert, Badge, Modal…)
├── layout/      en-tête, pied de page, navigation mobile
├── signup/      les cinq écrans du parcours d'inscription
├── sell/        les blocs du formulaire de dépôt d'annonce
├── listing/     galerie, caractéristiques, vendeuse, panneau d'achat
├── order/       suivi, récapitulatif, adresse, actions
├── account/     profil, adresse, mot de passe, Stripe, retours
└── admin/       carte de modération, tableau responsive
```

Aucun fichier ne dépasse ~230 lignes : un écran se lit d'un coup d'œil, et les
blocs partagés (formulaire d'adresse, carte Stripe) ne sont écrits qu'une fois.

`shared/` contient l'arbre des catégories du CDC §3.4, le référentiel des tailles,
les schémas de validation Zod et le calcul de commission. Le front et l'API en
dépendent via `"@nissa/shared": "file:../shared"` : une seule définition, donc
aucun risque qu'un champ valide côté navigateur soit refusé côté serveur.

> Pour déployer `frontend/` ou `backend/` séparément, copie aussi `shared/` à côté :
> le lien `file:../shared` doit rester résolvable.

---

## 2. Démarrage

### Prérequis

- Node.js 20+
- Docker (pour PostgreSQL et la boîte mail de développement)

### En quatre commandes

```bash
npm run setup      # installe shared, backend et frontend
npm run db:up      # démarre PostgreSQL + Mailpit
cp backend/.env.example backend/.env
npm run db:migrate && npm run db:seed
```

Puis, dans deux terminaux :

```bash
npm run dev:api    # API   → http://localhost:4000/api
npm run dev:web    # Front → http://localhost:3000
```

Chaque projet peut aussi se lancer seul : `cd backend && npm run dev`.

### Services Docker

| Service | Port | Usage |
|---|---|---|
| PostgreSQL 18 | `localhost:5435` | base de données |
| Mailpit | `localhost:8025` | **tous les e-mails du site**, consultables dans le navigateur |

Le port **5435** est choisi pour ne pas entrer en conflit avec un PostgreSQL déjà
installé sur le poste (5432) ni avec d'autres projets (5433, 5434). Change-le dans
`docker-compose.yml` et `backend/.env` si besoin.

### Comptes créés par le seed

| Rôle | Identifiants |
|---|---|
| Administratrice | `admin@nissa-dressing.fr` / `Admin1234` |
| Membres vendeuses | `amina@exemple.fr`, `khadija@exemple.fr`, `safiya@exemple.fr` / `Soeur1234` |
| Candidature en attente | visible dans `/admin/inscriptions` |

---

## 3. Fonctionner sans compte Stripe

Le projet est jouable de bout en bout **sans aucun compte tiers**.

- **Stripe** — sans `STRIPE_SECRET_KEY`, l'API bascule en mode simulé : les
  redirections de paiement pointent vers `/paiement-simule`, une page de
  développement qui confirme la transaction côté serveur. Frais d'accès, commande
  avec séquestre, reversement, boost et onboarding vendeuse fonctionnent tous.
  Dès qu'une vraie clé est renseignée, ce mode est refusé par l'API et seul le
  webhook signé fait foi.
- **E-mails** — capturés par Mailpit (`http://localhost:8025`). Sans Docker, laisse
  `SMTP_HOST` vide : les e-mails sont alors écrits dans `backend/var/mail/`. Dans
  tous les cas ils sont journalisés en base et relisibles depuis `/admin/support`.

---

## 4. Périmètre couvert (CDC §2.2)

| Exigence du CDC | Où |
|---|---|
| Inscription : éligibilité, audio de serment, validation manuelle | `/inscription`, `/admin/inscriptions` |
| E-mails du parcours (réception, acceptation, paiement, confirmation) | `backend/src/mail/mail.templates.ts` |
| Frais d'accès 5 €, accès à vie + 1 mois de boost offert | `/paiement` |
| Espace personnel : coordonnées, adresse, Stripe Connect Onboarding | `/configuration-compte`, `/compte` |
| Dépôt d'annonce + avertissements photos + modération | `/vendre`, `/admin/annonces` |
| Catalogue : recherche, filtres, favoris | `/catalogue`, `/recherche`, `/favoris` |
| Boost d'annonce payant (mensuel Stripe) | `/mes-annonces` |
| Séquestre : capture à la commande, reversement à la réception | `/commande/[id]` |
| Bordereau d'envoi PDF | `backend/src/pdf/pdf.service.ts` |
| Messagerie liée à la commande | `/messages` |
| Retrait automatique de l'annonce vendue | `OrdersService.confirmPaid` |
| Retour, bordereau de retour, message d'excuse type, remboursement | `/retours/nouveau/[orderId]`, `/admin/litiges` |
| Page d'aide : FAQ + formulaire de contact | `/aide` |
| 8 pages légales en pied de page | `/legal/[slug]` |
| Back-office : files de validation, membres, commandes, litiges, commission | `/admin` |

**Hors périmètre V1 (CDC §2.3)** : chatbot, évaluations entre membres, suivi de
colis via API transporteurs, étiquettes prépayées, application mobile native,
multilingue, parrainage, notifications push.

---

## 5. Responsive

Le site est utilisable de 320 px à grand écran.

- **Mobile** : barre de navigation fixe en bas (Accueil · Recherche · Vendre ·
  Messages · Compte), recherche en pleine largeur sur sa propre ligne, rail de
  catégories défilant avec libellés courts.
- **Desktop** : recherche intégrée à l'en-tête, mega-menu de catégories au survol,
  filtres du catalogue en colonne latérale collante.
- **Tableaux du back-office** : vrai `<table>` à partir de `md`, liste de cartes en
  dessous (`frontend/src/components/DataTable.tsx`) — un tableau à huit colonnes
  n'est lisible sur un téléphone ni en défilement horizontal ni en texte réduit.
- Les formulaires d'adresse passent en colonne sous 640 px, et le zoom reste
  autorisé (`maximum-scale=5`) pour ne pas pénaliser l'accessibilité.

Les polices sont **hébergées localement** (`frontend/public/fonts`, polices
variables, 104 Ko au total) : le navigateur des visiteuses ne contacte aucun CDN
tiers — cohérent avec l'engagement pris dans la politique de confidentialité — et
le build ne dépend pas d'un accès réseau sortant.

---

## 6. Le ton du site

La cliente a demandé un site « pour les sœurs », avec des messages **doux**. Ce
n'est pas une couche de vernis : c'est une contrainte de rédaction appliquée à
tous les textes, y compris ceux qu'on lit rarement.

- **Les erreurs n'accusent pas.** « Cet e-mail ou ce mot de passe ne correspond
  pas. Réessaie doucement. » plutôt qu'un « identifiants incorrects » sec.
- **Les refus s'excusent.** Une candidature non retenue, un retour refusé, une
  annonce à corriger : le message dit ce qui ne va pas, et le dit avec ménagement.
- **Les validations guident.** « Ajoute une majuscule à ton mot de passe »
  plutôt que « mot de passe invalide ».
- **Les moments heureux sont chaleureux** — « Merci, ma sœur ! », « baraka
  Allahu fiki », « in cha Allah » — sans en abuser au point de lasser.

Le registre est le tutoiement, comme sur les maquettes d'origine. Les textes
destinés à l'administratrice (back-office) restent factuels : elle travaille.

---

## 7. Points d'attention

### Contenus à fournir

Les huit pages légales vivent dans `frontend/content/legal/*.md`. Les passages
portant la mention `[À FOURNIR PAR LA CLIENTE]` attendent le texte définitif : il
se remplace **dans ces fichiers, sans toucher au code**, et le site affiche un
bandeau d'avertissement tant que le marqueur est présent. Conformément au CDC §2.4,
le forfait couvre l'intégration, non la rédaction juridique.

### Arbitrages du CDC §6

Les quatre points laissés « à définir » sont **paramétrables en back-office**
(`/admin/parametres`), sans redéploiement :

| Point | Valeur par défaut |
|---|---|
| Commission | 10 %, à la charge de l'acheteuse |
| Boost mensuel | 2,99 € |
| Frais de port | 4,90 € / 6,90 € / 9,90 € selon le format de colis |
| Frais d'accès | 5 €, 30 jours de boost offerts |

Le **référentiel des tailles** (CDC §6, « à fournir ») est dans
`shared/src/sizes.ts` et se remplace en éditant ce seul fichier. Le **placement des
sous-vêtements / maillots / chaussettes** suit le tableau source du CDC §3.4
(catégorie *Accessoires*) et se déplace dans `shared/src/categories.ts`.

### L'audio de serment est une donnée sensible

C'est le point RGPD le plus délicat du projet :

- stocké hors de la zone servie statiquement — jamais accessible par URL publique ;
- diffusé uniquement via une route authentifiée réservée à l'administratrice ;
- **supprimé du disque et de la base dès qu'une candidature est refusée**.

La durée de conservation en cas d'acceptation reste à arbitrer : elle est marquée
`[À FOURNIR PAR LA CLIENTE]` dans `frontend/content/legal/rgpd.md`.

### Écart avec le CDC §4.1

Le cahier des charges prévoit « WordPress + WooCommerce ou solution équivalente »
pour tenir dans l'enveloppe de 1 500 €. Ce dépôt est un développement sur mesure
Next.js / NestJS — le CDC l'autorise, mais la charge réelle dépasse largement le
forfait. À assumer en connaissance de cause.

---

## 8. Commandes

```bash
npm run setup                # installe les trois projets
npm run db:up / db:down      # démarre / arrête PostgreSQL + Mailpit
npm run db:migrate           # applique les migrations
npm run db:seed              # (ré)amorce le jeu de démonstration
npm run db:studio            # explorateur de base Prisma
npm run dev:api / dev:web    # développement
npm run build                # shared + backend + frontend
npm run typecheck            # vérification des types sur les trois projets
npm run test:e2e             # parcours d'API      (voir e2e/README.md)
npm run test:ui              # parcours navigateur (voir frontend/tests/README.md)
npm run test                 # les deux
```

Les deux suites exigent que la pile tourne. Celle d'API demande en plus des
limites de débit relevées le temps de l'exécution — `e2e/README.md` donne la
commande exacte.

**Deux niveaux, deux rôles.** `e2e/` interroge l'API en HTTP : elle prouve que
le serveur applique les règles (séquestre, modération, droits d'accès).
`frontend/tests/` pilote un vrai navigateur : elle prouve que la visiteuse est
conduite au bon endroit, sur les deux formats d'écran. Une règle métier cassée
est attrapée par la première ; un bouton devenu introuvable, par la seconde.

---

## 9. Sécurité

- Mots de passe hachés (bcrypt, coût 12) ; jamais lisibles, y compris par l'administratrice.
- Sessions par cookies `httpOnly` — inaccessibles au JavaScript de la page.
- Jetons de rafraîchissement stockés hachés et **tournés à chaque usage** ; toutes
  les sessions sont révoquées lors d'un changement de mot de passe.
- Authentification appliquée par défaut sur toutes les routes (`JwtAuthGuard`
  global) : une route n'est publique que si elle est explicitement `@Public()`.
- Statut et rôle relus en base à chaque requête, jamais pris dans le jeton — une
  validation d'inscription prend effet immédiatement.
- Limitation de débit sur l'inscription, la connexion, la réinitialisation et le contact.
- Photos réencodées en WebP, ce qui **supprime les métadonnées EXIF** (dont la géolocalisation).
- Aucune donnée bancaire ne transite par l'API : la saisie se fait chez Stripe.
- En production, un paiement n'est validé que par un **webhook Stripe signé**.

### Garde-fou au démarrage

Avec `NODE_ENV=production`, l'API **refuse de démarrer** si la configuration est
dangereuse, et dit précisément ce qui manque :

- secrets JWT absents, trop courts, identiques entre eux, ou encore ceux
  d'exemple (« à remplacer », « dev-… ») ;
- `ADMIN_PASSWORD` encore celui de la démonstration ;
- `COOKIE_SECURE=false` — les cookies de session circuleraient en clair ;
- `WEB_ORIGIN` en `http://` plutôt qu'en `https://` ;
- `STRIPE_SECRET_KEY` absente (les paiements seraient simulés) ou
  `STRIPE_WEBHOOK_SECRET` manquante.

Ces erreurs sont silencieuses autrement : un secret oublié laisse n'importe qui
forger un jeton d'administratrice. Un démarrage bruyamment raté vaut mieux.
