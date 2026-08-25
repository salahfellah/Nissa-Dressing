# Tests d'interface

Playwright pilote un vrai navigateur sur les parcours du site. Complémentaires
des tests d'API (`e2e/`) : ceux-ci prouvent que le serveur applique les règles,
ceux-là que la visiteuse est bien conduite au bon endroit et voit ce qu'il faut.

## Lancer

La pile doit tourner :

```bash
npm run db:up        # PostgreSQL + Mailpit
npm run dev:api      # API   sur :4000
npm run dev:web      # Front sur :3000
```

Puis :

```bash
cd frontend
npm run test:ui              # les deux formats (bureau + mobile)
npm run test:ui -- --project=mobile
npm run test:ui:report       # rapport HTML de la dernière exécution
```

### Pas de téléchargement de navigateur

La configuration utilise **Microsoft Edge déjà installé** (`channel: 'msedge'`)
plutôt que les binaires de Playwright : rien à récupérer, et c'est un vrai
Chromium. Sur une machine sans Edge, remplace `msedge` par `chrome`, ou lance
`npx playwright install chromium`.

## Ce qui est couvert

| Fichier | Couvre |
|---|---|
| `01-navigation.spec.ts` | Accueil, catalogue public, huit pages légales, page d'aide, gardes de parcours (visiteuse / membre / administratrice), connexion, déconnexion, route inconnue |
| `02-parcours.spec.ts` | Inscription (refus terminal, validations, étape audio), catalogue, page article, favoris, recherche, formulaire de dépôt d'annonce et ses règles conditionnelles |
| `03-responsive.spec.ts` | Absence de débordement horizontal sur 19 pages × 2 formats, navigation mobile, tableaux en cartes, taille des cibles tactiles, captures d'écran |

Deux formats sont joués : **1440 px** (bureau) et **390 px** (mobile).

## Principes

- **Les tests observent les vraies anomalies.** `surveillerLaConsole` remonte
  les exceptions et les réponses ≥ 400, en écartant ce qui n'est pas imputable
  au code : ressources internes de Next après un rechargement à chaud, et 401
  sur les routes d'authentification (réponse normale pour une visiteuse).
- **Les sélecteurs passent par les rôles et les libellés**, comme un lecteur
  d'écran. Un test qui ne trouve plus son champ signale souvent un vrai
  problème d'accessibilité — c'est ainsi qu'a été repérée l'absence de liaison
  `label`/`input`.
- **Le format mobile n'est pas une variante cosmétique** : les parcours y sont
  rejoués en entier, et les écarts (filtres repliés, tableaux en cartes) sont
  testés explicitement.

## Captures

`tests/captures/` contient un aperçu pleine page des écrans clés dans les deux
formats, régénéré à chaque exécution. Utile pour montrer l'avancement sans
lancer le projet.

## Ce qui n'est pas couvert

- **Le paiement réel.** Les parcours s'arrêtent à la redirection : le mode
  simulé est exercé par la suite d'API, le Checkout Stripe réel par personne.
- **L'enregistrement audio.** `MediaRecorder` demande un vrai micro ; seul le
  fait que l'envoi reste fermé sans audio est vérifié.
- **L'envoi d'un formulaire de vente complet** (il faudrait téléverser une
  photo depuis le navigateur) — couvert côté API dans `e2e/`.
