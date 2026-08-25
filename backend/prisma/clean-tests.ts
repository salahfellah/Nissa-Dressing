/**
 * Retire les données laissées par les suites de tests.
 *
 *   npm run db:clean
 *
 * Les tests créent des comptes, des annonces et des commandes pour être
 * rejouables. Sans ménage, ces traces s'accumulent et faussent la lecture du
 * site : des candidatures fantômes dans la file de validation, des litiges qui
 * n'ont jamais eu lieu, des compteurs gonflés. Les chiffres restent exacts —
 * ils comptent bien ce qu'il y a en base — mais ce qu'il y a en base n'est plus
 * représentatif.
 *
 * Ne supprime que ce qui porte une signature de test. Le jeu de démonstration
 * (administratrice, trois vendeuses, leurs annonces, la candidature de
 * démonstration) n'est jamais touché.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

process.loadEnvFile?.();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL absent. Renseigne backend/.env.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/** Comptes créés par les scénarios : nour<horodatage>@…, reset<horodatage>@… */
const COMPTES_DE_TEST = /^(nour|reset)[0-9]+@exemple\.fr$/;

/** Titres produits par les scénarios. */
const TITRES_DE_TEST = [
  'Khimar de test',
  'Abaya a mettre en avant',
  'Abaya a retirer',
  'Abaya de test achat',
  'Paire incoherente',
  'Chaussettes usagees',
  'Taille hors referentiel',
];

async function main(): Promise<void> {
  const comptes = await prisma.user.findMany({
    where: { email: { contains: '@exemple.fr' } },
    select: { id: true, email: true },
  });
  const idsDeTest = comptes.filter((c) => COMPTES_DE_TEST.test(c.email)).map((c) => c.id);

  const annonces = await prisma.listing.findMany({
    where: { OR: TITRES_DE_TEST.map((titre) => ({ title: { startsWith: titre } })) },
    select: { id: true },
  });
  const idsAnnonces = annonces.map((a) => a.id);

  // L'ordre suit les clés étrangères : les commandes avant les annonces.
  // Messages et demandes de retour partent en cascade avec leur commande.
  const commandes = await prisma.order.deleteMany({
    where: {
      OR: [
        { listingId: { in: idsAnnonces } },
        { buyerId: { in: idsDeTest } },
        { sellerId: { in: idsDeTest } },
        // Une commande jamais payée retient son article : elle n'a rien à faire là.
        { status: 'PENDING_PAYMENT' },
      ],
    },
  });

  const supprimees = await prisma.listing.deleteMany({ where: { id: { in: idsAnnonces } } });
  const utilisateurs = await prisma.user.deleteMany({ where: { id: { in: idsDeTest } } });
  const contacts = await prisma.contactRequest.deleteMany({
    where: { email: { startsWith: 'visiteuse' } },
  });
  const emails = await prisma.emailLog.deleteMany({});

  console.log(`✓ ${utilisateurs.count} compte(s) de test`);
  console.log(`✓ ${supprimees.count} annonce(s) de test`);
  console.log(`✓ ${commandes.count} commande(s) de test ou impayée(s)`);
  console.log(`✓ ${contacts.count} demande(s) de contact de test`);
  console.log(`✓ ${emails.count} entrée(s) du journal d’e-mails`);

  const restant = await prisma.listing.count({ where: { status: 'PUBLISHED' } });
  console.log(`\nCatalogue : ${restant} annonce(s) en ligne.`);
  console.log('Lance `npm run db:seed` pour restaurer ce qui manquerait à la vitrine.');
}

main()
  .catch((error) => {
    console.error('Échec du nettoyage :', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
