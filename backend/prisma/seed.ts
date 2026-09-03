/**
 * Amorçage de la base.
 *
 * Crée le compte administratrice, les paramètres de plateforme par défaut et un
 * petit jeu de démonstration (membres + annonces publiées) pour que le catalogue
 * ne soit pas vide à la première ouverture. Le script est idempotent : il peut
 * être relancé sans dupliquer quoi que ce soit.
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type ItemCondition, type PackageFormat } from '@prisma/client';
import { DEFAULT_SETTINGS, SETTINGS_KEY } from '@nissa/shared';
import * as bcrypt from 'bcryptjs';

process.loadEnvFile?.();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL absent. Renseigne apps/api/.env avant de lancer le seed.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@nissa-dressing.fr';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin1234';
const ADMIN_PSEUDO = process.env.ADMIN_PSEUDO ?? 'Nissa Admin';
const DEMO_PASSWORD = 'Soeur1234';

const daysFromNow = (days: number): Date => new Date(Date.now() + days * 86_400_000);

const DOSSIER_VISUELS = join(__dirname, 'seed-photos');
const DOSSIER_UPLOADS = join(process.cwd(), process.env.UPLOAD_DIR ?? 'var/uploads', 'photos');

/**
 * Installe un visuel de démonstration dans le dossier d'upload et renvoie le
 * chemin relatif tel qu'il est stocké sur l'annonce.
 *
 * Les fichiers sont versionnés dans prisma/seed-photos : le catalogue de
 * démonstration est ainsi reproductible sur n'importe quelle machine, sans
 * dépendre d'un service d'images externe. Ils sont déjà au format produit par
 * l'application (WebP, sans métadonnées EXIF).
 */
async function installerVisuel(fichier: string): Promise<string[]> {
  try {
    await mkdir(DOSSIER_UPLOADS, { recursive: true });
    await copyFile(join(DOSSIER_VISUELS, fichier), join(DOSSIER_UPLOADS, fichier));
    return [`photos/${fichier}`];
  } catch {
    // Visuel absent : l'annonce reste valable, le front affiche « photo à venir ».
    return [];
  }
}

async function main(): Promise<void> {
  // ————— Paramètres de plateforme —————
  await prisma.setting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: DEFAULT_SETTINGS as unknown as object },
    update: {},
  });
  console.log('✓ Paramètres de plateforme');

  // ————— Administratrice —————
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      passwordHash: adminHash,
      nom: 'Nissa',
      prenom: 'Administratrice',
      pseudo: ADMIN_PSEUDO,
      role: 'ADMIN',
      status: 'MEMBER',
      accessFeePaidAt: new Date(),
      acceptedTermsAt: new Date(),
      recipientName: 'Nissa Dressing',
      addressLine1: '1 rue de la Modestie',
      postalCode: '75001',
      city: 'Paris',
      country: 'France',
      stripeConnectStatus: 'COMPLETE',
    },
    update: { role: 'ADMIN', status: 'MEMBER' },
  });
  console.log(`✓ Administratrice : ${admin.email} / ${ADMIN_PASSWORD}`);

  // ————— Membres de démonstration —————
  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  /**
   * Un pseudo de démonstration peut avoir été repris par un vrai compte au fil
   * des essais. L'upsert porte sur l'e-mail : il partirait alors créer un
   * compte dont le pseudo est déjà pris, et tout le seed s'arrêterait sur une
   * violation d'unicité. On laisse plutôt ce membre de côté, en le disant.
   */
  const pseudoDisponible = async (email: string, pseudo: string): Promise<boolean> => {
    const occupant = await prisma.user.findUnique({
      where: { pseudo },
      select: { email: true },
    });
    if (!occupant || occupant.email === email) return true;
    console.log(`• ${email} ignoré : le pseudo « ${pseudo} » appartient à ${occupant.email}`);
    return false;
  };

  const sellers = await Promise.all(
    [
      {
        email: 'amina@exemple.fr',
        pseudo: 'amina.dressing',
        prenom: 'Amina',
        nom: 'B.',
        city: 'Lyon',
        postalCode: '69003',
        line1: '12 rue des Oliviers',
      },
      {
        email: 'khadija@exemple.fr',
        pseudo: 'oum.khadija',
        prenom: 'Khadija',
        nom: 'M.',
        city: 'Lille',
        postalCode: '59000',
        line1: '5 avenue des Jasmins',
      },
      {
        email: 'safiya@exemple.fr',
        pseudo: 'safiya.store',
        prenom: 'Safiya',
        nom: 'K.',
        city: 'Marseille',
        postalCode: '13006',
        line1: '30 boulevard du Levant',
      },
    ].map(async (seller) => {
      if (!(await pseudoDisponible(seller.email, seller.pseudo))) return null;

      return prisma.user.upsert({
        where: { email: seller.email },
        create: {
          email: seller.email,
          passwordHash: demoHash,
          nom: seller.nom,
          prenom: seller.prenom,
          pseudo: seller.pseudo,
          status: 'MEMBER',
          accessFeePaidAt: new Date(),
          acceptedTermsAt: new Date(),
          freeBoostUntil: daysFromNow(30),
          recipientName: `${seller.prenom} ${seller.nom}`,
          addressLine1: seller.line1,
          postalCode: seller.postalCode,
          city: seller.city,
          country: 'France',
          // Aucun compte Stripe inventé : un identifiant fabriqué se fait
          // passer pour une inscription terminée, puis fait échouer aussi bien
          // le reversement que l'onboarding — la vendeuse ne peut même plus
          // créer le vrai compte, puisque le code croit qu'elle en a un.
          stripeAccountId: null,
          stripeConnectStatus: 'NOT_STARTED',
        },
        update: {},
      });
    }),
  );
  // Les vendeuses effectivement disponibles pour porter les annonces de la
  // vitrine — celles dont le pseudo était pris ont été écartées plus haut.
  const vendeuses = sellers.filter((seller) => seller !== null);
  if (vendeuses.length === 0) {
    throw new Error(
      'Aucune vendeuse de démonstration n’a pu être créée : leurs pseudos sont tous pris par de vrais comptes.',
    );
  }
  console.log(
    `✓ ${vendeuses.length} membres de démonstration (mot de passe : ${DEMO_PASSWORD})`,
  );

  // ————— Une candidature en attente, pour tester la file de validation —————
  // La candidature est remise en attente si une démonstration ou un test l'a
  // déjà traitée : la file de validation du back-office doit toujours avoir
  // quelque chose à montrer après un `db:seed`.
  await prisma.user.upsert({
    where: { email: 'candidate@exemple.fr' },
    create: {
      email: 'candidate@exemple.fr',
      passwordHash: demoHash,
      nom: 'T.',
      prenom: 'Maryam',
      pseudo: 'maryam.candidate',
      status: 'PENDING_REVIEW',
      acceptedTermsAt: new Date(),
      // Pas d'audio réel : la file de validation affichera la candidature sans lecteur.
    },
    update: { status: 'PENDING_REVIEW', reviewedAt: null, rejectionReason: null },
  });
  console.log('✓ 1 candidature en attente de validation');

  // ————— Annonces publiées —————
  interface AnnonceDemo {
    title: string;
    /** Visuel de prisma/seed-photos, facultatif. */
    photo?: string;
    categoryId: string;
    subcategoryId: string;
    size: string;
    material: string;
    color: string;
    condition: ItemCondition;
    brand: string | null;
    priceCents: number;
    packageFormat: PackageFormat;
    description: string;
    boosted: boolean;
  }

  const listings: AnnonceDemo[] = [
    {
      title: 'Abaya Dubaï brodée manches larges',
      photo: 'abaya-dubai.webp',
      categoryId: 'femme',
      subcategoryId: 'femme-abaya',
      size: 'M (40)',
      material: 'Nidha',
      color: 'Noir',
      condition: 'TRES_BON_ETAT',
      brand: null,
      priceCents: 4500,
      packageFormat: 'MOYEN',
      description:
        'Abaya Dubaï portée deux fois, aucune trace d’usure. Broderie discrète aux poignets, tissu Nidha épais et non transparent. Coupe évasée, longueur 1m40.',
      boosted: true,
    },
    {
      title: 'Khimar 2 voiles soie de Médine',
      photo: 'khimar-medine.webp',
      categoryId: 'femme',
      subcategoryId: 'femme-khimar',
      size: 'Taille unique',
      material: 'Medina silk',
      color: 'Beige',
      condition: 'NEUF',
      brand: null,
      priceCents: 1500,
      packageFormat: 'PETIT',
      description:
        'Khimar deux voiles en soie de Médine, jamais porté. Longueur mi-cuisse, très couvrant et opaque. Couleur beige sable.',
      boosted: false,
    },
    {
      title: 'Ensemble jilbeb 2 pièces bleu nuit',
      photo: 'jilbeb-bleu-nuit.webp',
      categoryId: 'femme',
      subcategoryId: 'femme-jilbeb',
      size: 'L (44)',
      material: 'Crêpe',
      color: 'Bleu marine',
      condition: 'BON_ETAT',
      brand: null,
      priceCents: 3000,
      packageFormat: 'MOYEN',
      description:
        'Jilbeb deux pièces (cape + jupe) en crêpe fluide. Porté une saison, très bon état général, quelques plis à repasser.',
      boosted: false,
    },
    {
      title: 'Qamis enfant blanc col mao',
      photo: 'qamis-enfant.webp',
      categoryId: 'enfant-garcon',
      subcategoryId: 'eg-qamis',
      size: '6 ans',
      material: 'Coton',
      color: 'Blanc',
      condition: 'TRES_BON_ETAT',
      brand: 'Sunna Kids',
      priceCents: 2000,
      packageFormat: 'PETIT',
      description:
        'Qamis blanc pour garçon, coton épais, col mao. Porté pour l’Aïd uniquement. Aucune tache.',
      boosted: false,
    },
    {
      title: 'Robe de cérémonie bébé fille',
      photo: 'robe-bebe-ceremonie.webp',
      categoryId: 'bebe-fille',
      subcategoryId: 'bf-robe',
      size: '12 mois',
      material: 'Satin',
      color: 'Rose',
      condition: 'NEUF_ETIQUETTE',
      brand: null,
      priceCents: 1800,
      packageFormat: 'PETIT',
      description:
        'Robe de cérémonie neuve avec étiquette, jamais portée. Doublure coton, fermeture dos par boutons pression.',
      boosted: false,
    },
    {
      title: 'Sittar noir opaque',
      photo: 'sittar-noir.webp',
      categoryId: 'accessoires',
      subcategoryId: 'acc-sittar',
      size: 'Taille unique',
      material: 'Polyester',
      color: 'Noir',
      condition: 'NEUF',
      brand: null,
      priceCents: 2500,
      packageFormat: 'PETIT',
      description:
        'Sittar noir totalement opaque, neuf sans étiquette. Élastique de tête confortable, ne glisse pas.',
      boosted: true,
    },
    {
      title: 'Manteau long légiféré doublé',
      photo: 'manteau-legifere.webp',
      categoryId: 'femme',
      subcategoryId: 'femme-manteaux-vestes',
      size: 'S (38)',
      material: 'Laine',
      color: 'Marron',
      condition: 'BON_ETAT',
      brand: null,
      priceCents: 6500,
      packageFormat: 'GRAND',
      description:
        'Manteau long ample et non cintré, doublé pour l’hiver. Descend sous les genoux, manches longues couvrantes.',
      boosted: false,
    },
    {
      title: 'Lot de 3 sous-hijabs jersey',
      photo: 'sous-hijabs.webp',
      categoryId: 'accessoires',
      subcategoryId: 'acc-sous-hijab',
      size: 'Taille unique',
      material: 'Jersey',
      color: 'Noir',
      condition: 'NEUF',
      brand: null,
      priceCents: 900,
      packageFormat: 'PETIT',
      description:
        'Lot de trois sous-hijabs en jersey extensible : un noir, un beige, un gris. Neufs, jamais portés.',
      boosted: false,
    },
  ];

  let created = 0;
  let illustrated = 0;
  for (const [index, listing] of listings.entries()) {
    const seller = vendeuses[index % vendeuses.length];

    // On ne cherche que parmi les annonces encore *en ligne* : si la pièce de
    // démonstration a été vendue ou retirée entre-temps (tests de bout en bout,
    // démonstration à la cliente), on en recrée une pour que le catalogue reste
    // présentable. Relancer `npm run db:seed` remet ainsi la vitrine d'aplomb
    // sans rien détruire de l'historique des commandes.
    const enLigne = await prisma.listing.findFirst({
      where: { title: listing.title, sellerId: seller.id, status: 'PUBLISHED' },
      select: { id: true, photos: true },
    });

    if (enLigne) {
      // L'annonce est déjà là : on se contente de lui rendre son visuel s'il
      // manque, par exemple après un premier amorçage sans les fixtures.
      if (listing.photo && enLigne.photos.length === 0) {
        const photos = await installerVisuel(listing.photo);
        if (photos.length) {
          await prisma.listing.update({ where: { id: enLigne.id }, data: { photos } });
          illustrated += 1;
        }
      }
      continue;
    }

    await prisma.listing.create({
      data: {
        sellerId: seller.id,
        title: listing.title,
        categoryId: listing.categoryId,
        subcategoryId: listing.subcategoryId,
        size: listing.size,
        material: listing.material,
        color: listing.color,
        condition: listing.condition,
        brand: listing.brand,
        priceCents: listing.priceCents,
        photos: listing.photo ? await installerVisuel(listing.photo) : [],
        packageFormat: listing.packageFormat,
        description: listing.description,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        moderatedAt: new Date(),
        moderatedById: admin.id,
        ...(listing.boosted ? { boostedUntil: daysFromNow(30) } : {}),
      },
    });
    created += 1;
  }
  const total = await prisma.listing.count({ where: { status: 'PUBLISHED' } });
  console.log(
    `✓ ${created} annonce(s) publiée(s), ${illustrated} illustrée(s) — ${total} en ligne au total`,
  );

  // ————— Une annonce en attente de modération —————
  const TITRE_PAPILLON = 'Abaya papillon à modérer';
  const VISUEL_PAPILLON = 'abaya-papillon.webp';

  const pendingExists = await prisma.listing.findFirst({
    where: { status: 'PENDING_REVIEW' },
    select: { id: true },
  });
  if (!pendingExists) {
    await prisma.listing.create({
      data: {
        sellerId: vendeuses[0].id,
        title: TITRE_PAPILLON,
        categoryId: 'femme',
        subcategoryId: 'femme-abaya',
        size: 'M (42)',
        material: 'Nidha',
        color: 'Noir',
        condition: 'BON_ETAT',
        brand: null,
        priceCents: 3500,
        photos: await installerVisuel(VISUEL_PAPILLON),
        packageFormat: 'MOYEN',
        description:
          'Abaya coupe papillon, portée quelques fois. Déposée pour tester la file de modération du back-office.',
        status: 'PENDING_REVIEW',
      },
    });
    console.log('✓ 1 annonce en attente de modération');
  }

  // Rattrapage des exemplaires plus anciens.
  //
  // Une même pièce de démonstration existe souvent en plusieurs exemplaires :
  // vendue, refusée, puis redéposée. Seule la copie en ligne passe par la
  // boucle ci-dessus, alors que les autres restent visibles — dans
  // l'historique des commandes, dans « Mes annonces » et dans la file de
  // modération, qui se juge précisément sur les photos. Sans ce rattrapage, le
  // catalogue est illustré mais le reste du site ne l'est pas.
  const visuelParTitre = new Map<string, string>(
    [
      ...listings.map((annonce) => [annonce.title, annonce.photo] as const),
      [TITRE_PAPILLON, VISUEL_PAPILLON] as const,
    ].filter((paire): paire is readonly [string, string] => Boolean(paire[1])),
  );

  let rattrapees = 0;
  for (const [titre, fichier] of visuelParTitre) {
    const sansVisuel = await prisma.listing.findMany({
      where: { title: titre, photos: { isEmpty: true } },
      select: { id: true },
    });
    if (!sansVisuel.length) continue;

    const photos = await installerVisuel(fichier);
    if (!photos.length) continue;

    await prisma.listing.updateMany({
      where: { id: { in: sansVisuel.map((annonce) => annonce.id) } },
      data: { photos },
    });
    rattrapees += sansVisuel.length;
  }
  if (rattrapees) {
    console.log(`✓ ${rattrapees} exemplaire(s) plus ancien(s) illustré(s)`);
  }

  console.log('\nBase amorcée. Connexion administratrice :');
  console.log(`  ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`Membres de démonstration : amina@exemple.fr / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error('Échec du seed :', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
