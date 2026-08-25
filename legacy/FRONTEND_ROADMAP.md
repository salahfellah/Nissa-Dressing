# Nissa Dressing — Revue du code actuel & feuille de route frontend

_Basée sur le cahier des charges "Marketplace 1500" (Qasr Web) et le code du repo au 10/08/2026._

---

## 1. État des lieux

**Ce qui existe (756 lignes, 2 composants) :**

| Écran | Statut | Écart vs CDC |
|---|---|---|
| Splash | ✅ | — |
| Login | ⚠️ UI seule | pas de "mot de passe oublié" |
| Inscription — éligibilité | ✅ | le refus n'est pas bloquant (retour arrière possible) |
| Inscription — formulaire | ✅ | — |
| Inscription — audio | ⚠️ factice | bouton mock, pas de `MediaRecorder`, pas d'upload de fichier |
| Inscription — confirmation | ✅ | — |
| Catalogue | ⚠️ vitrine | 6 catégories au lieu de l'arbre complet, données en dur, aucun filtre |

**Ce qui manque : ~85 % du périmètre V1.** Il n'y a ni routeur, ni page produit, ni tunnel d'achat, ni espace personnel, ni back-office.

### Problèmes techniques à corriger d'abord

1. **`npm run build` était cassé** — `tsconfig.node.json` déclenchait `TS6310`. Corrigé dans ce commit (ajout de `noEmit: false`, `emitDeclarationOnly`, `outDir`). Supprime aussi les artefacts commités par erreur : `vite.config.js`, `vite.config.d.ts`, `tsconfig.node.tsbuildinfo`, `tsconfig.tsbuildinfo` (désormais dans `.gitignore`).
2. **`dist/` et `node_modules/` sont versionnés** → `git rm -r --cached dist node_modules`.
3. **Palette dupliquée 3 fois** : `tailwind.config.js`, `COLORS` dans `AuthFlow.tsx`, classes `#C8A96A` en dur dans `Marketplace.tsx`. Une seule source de vérité : les tokens Tailwind (`bg-orDore`, `text-brunProfond`…).
4. **Styles inline** (`style={{ backgroundColor: ... }}`, `onFocus` qui mute le DOM) — impossible à thémer, casse le `hover`/`focus-visible`. À passer en classes Tailwind.
5. **Navigation par booléen** (`isAuthenticated`) — pas d'URL, pas de deep-link, pas de bouton retour navigateur.
6. **`<Logo>` dupliqué** dans les deux fichiers, avec deux implémentations différentes.

---

## 2. Architecture cible

```
src/
├── main.tsx
├── router.tsx                 # react-router-dom, routes + guards
├── types/index.ts             # User, Listing, Order, Message, ReturnRequest + enums de statut
├── data/
│   ├── categories.ts          # arbre complet du CDC §3.4 (6 catégories, ~100 sous-catégories)
│   ├── sizes.ts               # référentiel tailles (à fournir par la cliente)
│   └── conditions.ts          # état, matières, couleurs, formats de colis
├── api/                       # couche mock (Promise + setTimeout) → remplaçable par fetch
│   ├── auth.ts  listings.ts  orders.ts  messages.ts  admin.ts
├── context/
│   ├── AuthContext.tsx        # machine à états du membre (voir §3)
│   └── FavoritesContext.tsx
├── components/
│   ├── ui/                    # Button, Input, Select, Textarea, Badge, Modal, Card, Stepper, EmptyState
│   ├── layout/                # Header, MobileBottomNav, Footer, PageContainer
│   └── listing/               # ListingCard, ListingGrid, FilterPanel, PhotoUploader
└── pages/
    ├── auth/  catalog/  sell/  buy/  account/  support/  legal/  admin/
```

**Dépendances à ajouter :**

```bash
npm i react-router-dom react-hook-form zod @hookform/resolvers
npm i -D @types/node
# plus tard : @tanstack/react-query (quand le backend arrive)
```

---

## 3. La machine à états du membre (le cœur du CDC)

Le parcours d'inscription du CDC §3.1–3.2 est une machine à états. Encode-la explicitement dans `AuthContext`, chaque état ayant son écran :

```
guest
  → pending_review      (candidature soumise, audio envoyé)
  → rejected            (refus admin) | awaiting_payment (accepté → e-mail + lien Stripe 5 €)
  → payment_done        ("Paiement accepté, tu peux te connecter")
  → onboarding          (infos perso + adresse + Stripe Connect)
  → member              (accès complet)
admin                   (back-office)
```

Les guards de route en découlent directement. C'est la première brique à poser : tout le reste s'y branche.

---

## 4. Écrans manquants, par priorité

### Sprint 1 — Fondations (débloque tout le reste)
- [ ] `react-router-dom` + `AppLayout` (Header / Footer / `MobileBottomNav` style Vinted : Accueil · Recherche · **Vendre** · Messages · Compte)
- [ ] Design system `ui/` — extraire `Button`, `Input`, `Logo` en composants partagés, tout en tokens Tailwind
- [ ] `types/index.ts` + `data/categories.ts` (arbre complet du CDC) + couche `api/` mock
- [ ] `AuthContext` avec la machine à états ci-dessus

### Sprint 2 — Catalogue (la vitrine, c'est ce que la cliente voudra voir)
- [ ] **Page produit (PDP)** — galerie photos, prix, taille/matière/couleur/état/marque, format de colis, mention *"frais de port à la charge de l'acheteuse"*, profil vendeuse, bouton Acheter + Favori
- [ ] Page résultats de recherche + `FilterPanel` (catégorie, sous-catégorie, taille, matière, couleur, état, marque, fourchette de prix) + tri
- [ ] Navigation catégorie → sous-catégorie (mega-menu desktop, drawer mobile)
- [ ] Page Favoris
- [ ] Tri : annonces boostées en tête (CDC §3.5)

### Sprint 3 — Vente
- [ ] **Formulaire de dépôt d'annonce** multi-étapes : titre → catégorie/sous-catégorie → taille/matière/couleur/état/marque (+ "Sans marque") → prix → photos → format colis → description
  - encart ⚠️ photos : pas de photo portée sauf vêtements couvrants ; refus des représentations d'âme
  - format de colis avec aide contextuelle : Petit (grande enveloppe) / Moyen (boîte à chaussures) / Grand (carton de déménagement)
  - mentions conditionnelles : burkini *"uniquement si mastour de haut en bas"*, manteaux/vestes *"uniquement si légiférés"*
- [ ] Écran de confirmation "ta demande sera examinée"
- [ ] "Mes annonces" avec statuts : en attente / publiée / refusée (+ motif) / vendue
- [ ] Achat du boost (mensuel Stripe) + badge "1er mois offert"

### Sprint 4 — Achat & après-vente
- [ ] Tunnel de commande : adresse de livraison, récapitulatif (prix + frais de port + commission), redirection Stripe
- [ ] Confirmation de commande + **suivi de statut** (payée → expédiée → reçue) avec le bouton **"Confirmer la réception"** qui libère le séquestre
- [ ] Téléchargement du **bordereau d'envoi PDF** côté vendeuse
- [ ] **Messagerie** liée à la commande : liste des conversations + fil de discussion
- [ ] Formulaire de retour/remboursement (photos de l'article + du problème, coordonnées) + suivi de la demande

### Sprint 5 — Compte, aide, légal
- [ ] Espace personnel : profil, adresse postale, statut Stripe Connect, mes achats, mes ventes, mes favoris, mes boosts
- [ ] Onboarding première connexion (wizard + retour depuis Stripe Connect)
- [ ] Page d'aide : FAQ en accordéon + formulaire de contact (e-mail, pseudo/kunya, description)
- [ ] 8 pages légales → **un seul composant `LegalPage`** alimenté par des fichiers markdown (les textes sont fournis par la cliente : CGU, CGV, remboursement, mentions légales, RGPD, DAC7, charte de modération, paiement sécurisé)

### Sprint 6 — Back-office
- [ ] File de validation des inscriptions avec **lecteur audio** + accepter/refuser
- [ ] File de modération des annonces (accepter / refuser + motif)
- [ ] Gestion membres, commandes, litiges/retours, boosts
- [ ] Paramétrage du taux de commission

---

## 5. Corrections ciblées sur le code existant

| Fichier | Correction |
|---|---|
| `AuthFlow.tsx` §étape 3 | Vrai enregistreur : `navigator.mediaDevices.getUserMedia` + `MediaRecorder`, waveform/minuteur, relecture avant envoi, **et** fallback `<input type="file" accept="audio/*">` (le CDC dit "enregistrement **ou** dépôt") |
| `AuthFlow.tsx` §étape 1 | Le "Non" doit être terminal (pas de retour arrière possible vers l'étape 2) |
| `AuthFlow.tsx` | Validation réelle : format e-mail, force du mot de passe, pseudo unique, case CGU obligatoire |
| `AuthFlow.tsx` | `LoginView` : lien "Mot de passe oublié" mort → page dédiée |
| `Marketplace.tsx` | `filteredProducts` utilise `category.includes(split(' ')[0])` → "Enfant Fille" matche aussi "Enfant Garçon". Remplacer par un id de catégorie |
| `Marketplace.tsx` | `originalPrice` est chargé mais jamais affiché |
| `Marketplace.tsx` | Menu mobile : `isMenuOpen` bascule l'icône mais n'ouvre aucun panneau |
| Les deux | Extraire `<Logo>`, `<Button>`, `<Input>` dans `ui/` |
| Images | `placehold.co` → `loading="lazy"` + `srcset`, et prévoir un placeholder local (dépendance à un service externe en prod = risque) |

---

## 6. Points d'alerte projet (à remonter à la cliente)

- **§4.1 du CDC prévoit explicitement WordPress + WooCommerce multi-vendeurs** pour tenir dans les 1 500 €. Un développement React sur mesure couvrant tout le périmètre V1 représente plusieurs fois cette charge. Le CDC autorise une "solution équivalente retenue par le maître d'œuvre" — mais il faut assumer l'écart en connaissance de cause, ou ne coder sur mesure que le front en s'appuyant sur un backend headless (Medusa, Saleor, Supabase + Stripe Connect) pour ne pas réécrire le séquestre, les reversements et la messagerie.
- **Points non arbitrés qui bloquent le développement** (CDC §6) : taux et assiette de la commission, référentiel des tailles, montant du boost, placement sous-vêtements/chaussettes. Le référentiel des tailles bloque directement le formulaire de dépôt d'annonce (Sprint 3).
- **Fonctionnalités les plus coûteuses** du périmètre : séquestre Stripe Connect, génération PDF des bordereaux, enregistrement audio, messagerie. À chiffrer avant de s'engager sur un planning.
- **RGPD** : l'audio de serment est une donnée biométrique/vocale sensible → durée de conservation, base légale et droit à l'effacement doivent être explicités dans la politique de confidentialité.
