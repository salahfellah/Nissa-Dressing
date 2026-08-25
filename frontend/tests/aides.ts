import { expect, type Page } from '@playwright/test';

/** Comptes créés par `npm run db:seed`. */
export const COMPTES = {
  admin: { email: 'admin@nissa-dressing.fr', motDePasse: 'Admin1234' },
  membre: { email: 'amina@exemple.fr', motDePasse: 'Soeur1234' },
  vendeuse: { email: 'safiya@exemple.fr', motDePasse: 'Soeur1234' },
};

/** Connexion par le formulaire, comme le ferait une membre. */
export async function seConnecter(
  page: Page,
  compte: { email: string; motDePasse: string },
): Promise<void> {
  await page.goto('/connexion');
  await page.getByLabel(/adresse e-mail/i).fill(compte.email);
  await page.getByLabel(/mot de passe/i).fill(compte.motDePasse);
  await page.getByRole('button', { name: /me connecter/i }).click();
  await page.waitForURL(/\/(catalogue|configuration-compte|bienvenue)/, { timeout: 20_000 });
}

/**
 * Collecte les vraies anomalies d'une page.
 *
 * Une page qui s'affiche n'est pas une page qui fonctionne : une exception React
 * ou un appel d'API en 500 passent inaperçus à l'œil nu.
 *
 * Le suivi se fait sur les réponses HTTP plutôt que sur le texte de la console :
 * « Failed to load resource » ne dit ni quelle URL ni quel code, et le serveur de
 * développement en produit spontanément après un rechargement à chaud. On ne
 * retient donc que ce qui est imputable à l'application.
 */
export function surveillerLaConsole(page: Page): { erreurs: string[] } {
  const erreurs: string[] = [];

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const texte = message.text();

    // Bruit connu, sans rapport avec le code applicatif.
    if (/favicon|Download the React DevTools|preload/i.test(texte)) return;
    // Message opaque : la même anomalie est captée plus précisément ci-dessous.
    if (/Failed to load resource/i.test(texte)) return;

    erreurs.push(`console : ${texte}`);
  });

  page.on('pageerror', (error) => erreurs.push(`exception : ${error.message}`));

  page.on('response', (response) => {
    const url = response.url();
    const statut = response.status();
    if (statut < 400) return;

    // Ressources internes de Next : le serveur de développement recompile et
    // sert temporairement des 404 sur d'anciens fragments. Sans rapport avec le code.
    if (url.includes('/_next/')) return;
    // 401 sur les routes d'authentification : réponse normale pour une visiteuse.
    if (statut === 401 && /\/auth\/(me|refresh)/.test(url)) return;

    erreurs.push(`${statut} sur ${url}`);
  });

  return { erreurs };
}

/** Vérifie qu'aucune barre de défilement horizontale n'apparaît. */
export async function aucunDebordementHorizontal(page: Page): Promise<void> {
  const debordement = await page.evaluate(() => {
    const marge = 2; // tolérance pour les arrondis de sous-pixel
    return document.documentElement.scrollWidth > document.documentElement.clientWidth + marge;
  });
  expect(debordement, 'la page déborde horizontalement').toBe(false);
}

/**
 * Force le chargement des images en `loading="lazy"` avant une capture.
 *
 * Une capture pleine page ne déclenche pas le chargement différé : les visuels
 * sous la ligne de flottaison ressortent vides, et la capture donne une fausse
 * image du site. On parcourt donc la page, puis on attend que chaque image soit
 * réellement décodée.
 */
export async function chargerLesImages(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const pas = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += pas) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    window.scrollTo(0, 0);
  });

  await page
    .waitForFunction(
      () => Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0),
      undefined,
      { timeout: 15_000 },
    )
    .catch(() => undefined); // une image manquante ne doit pas faire échouer la capture
}
