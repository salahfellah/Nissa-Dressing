# Visuels de démonstration

Photos d'illustration du catalogue de démonstration, installées par
`npm run db:seed`. Elles sont versionnées ici pour que la vitrine soit
reproductible sur n'importe quelle machine, sans dépendre d'un service externe.

## Contrainte : la charte de modération s'applique aussi à ces images

Le site refuse les photos portées (hors vêtements couvrants) et **toute
représentation d'âme**, c'est-à-dire tout être animé — humain ou animal
(voir `frontend/content/legal/charte-de-moderation.md`). Il serait incohérent
que le catalogue de démonstration enfreigne les règles qu'il affiche.

Ces visuels respectent donc la charte :

- aucun visage, aucune personne, aucun mannequin, aucun animal ;
- vêtements pliés à plat ou suspendus sur cintre ;
- les motifs floraux sont admis : une plante n'est pas un être animé.

**Toute photo ajoutée ici doit passer le même contrôle.**

## Format

Déjà au format produit par l'application (`UploadsService`) : WebP, 1600 px
maximum, qualité 82, métadonnées EXIF supprimées. Le seed se contente de les
copier dans `var/uploads/photos/`.

Pour ajouter un visuel :

1. déposer l'image ici, convertie au format ci-dessus ;
2. renseigner `photo: 'nom-du-fichier.webp'` sur l'annonce correspondante dans
   `prisma/seed.ts` ;
3. relancer `npm run db:seed` — une annonce déjà en ligne mais sans visuel se
   voit attribuer le sien, sans être recréée.

## Couverture actuelle

Les neuf annonces de démonstration ont leur visuel.

| Annonce | Visuel | Provenance |
|---|---|---|
| Abaya Dubaï brodée manches larges | `abaya-dubai.webp` | — |
| Khimar 2 voiles soie de Médine | `khimar-medine.webp` | — |
| Qamis enfant blanc col mao | `qamis-enfant.webp` | — |
| Manteau long légiféré doublé | `manteau-legifere.webp` | — |
| Lot de 3 sous-hijabs jersey | `sous-hijabs.webp` | — |
| Abaya papillon à modérer | `abaya-papillon.webp` | Pexels 19895958 |
| Ensemble jilbeb 2 pièces bleu nuit | `jilbeb-bleu-nuit.webp` | Pexels 6275994 |
| Robe de cérémonie bébé fille | `robe-bebe-ceremonie.webp` | Pexels 30791355 |
| Sittar noir opaque | `sittar-noir.webp` | Pexels 7946641 |

Les quatre derniers viennent de Pexels, dont la licence autorise l'usage
commercial et la modification sans attribution. Chacun a été regardé avant
d'être retenu : aucun ne montre de personne, de visage, de mannequin ni
d'animal.

### Ce que ces quatre visuels montrent réellement

Le catalogue de démonstration n'a pas de photothèque : ces visuels illustrent
l'annonce, ils ne la documentent pas. Deux sont fidèles, deux sont des
approximations qu'il faudra remplacer par de vraies photos produit :

| Visuel | Fidélité |
|---|---|
| `abaya-papillon.webp` | Fidèle — vêtement long, manches larges, sur cintre. |
| `robe-bebe-ceremonie.webp` | Proche — vêtement de bébé rose sur cintre, mais tricot et non satin. |
| `jilbeb-bleu-nuit.webp` | Approximation — étoffe bleu nuit drapée, pas le deux-pièces. |
| `sittar-noir.webp` | Approximation — étoffe noire opaque drapée, pas le sittar monté. |

La charte impose par ailleurs que l'annonce montre **l'article réel** et non une
image d'illustration : ces visuels conviennent à la vitrine de démonstration,
pas à une annonce réelle.
