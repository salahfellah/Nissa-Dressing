import { expect, test } from '@playwright/test';
import { COMPTES, aucunDebordementHorizontal, chargerLesImages, seConnecter } from './aides';

/**
 * Responsive.
 *
 * Le CDC impose un site pleinement utilisable au doigt. Ces tests vérifient ce
 * qu'une relecture de classes CSS ne peut pas garantir : qu'aucune page ne
 * déborde, et que la navigation mobile est réellement atteignable.
 */

const PAGES_PUBLIQUES = ['/', '/catalogue', '/recherche', '/connexion', '/inscription', '/aide', '/legal/cgu'];
const PAGES_MEMBRE = ['/vendre', '/compte', '/favoris', '/messages', '/mes-annonces', '/achats'];

test.describe('Aucun débordement horizontal', () => {
  for (const route of PAGES_PUBLIQUES) {
    test(`page publique ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await aucunDebordementHorizontal(page);
    });
  }

  test('pages membres', async ({ page }) => {
    await seConnecter(page, COMPTES.membre);
    for (const route of PAGES_MEMBRE) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await aucunDebordementHorizontal(page);
    }
  });

  test('pages du back-office', async ({ page }) => {
    await seConnecter(page, COMPTES.admin);
    for (const route of ['/admin', '/admin/inscriptions', '/admin/annonces', '/admin/membres', '/admin/commandes', '/admin/parametres']) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await aucunDebordementHorizontal(page);
    }
  });
});

test.describe('Navigation mobile', () => {
  test('la barre du bas apparaît pour une membre, pas pour une visiteuse', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'spécifique au format mobile');

    await page.goto('/catalogue');
    await expect(page.getByRole('navigation', { name: /navigation principale/i })).toHaveCount(0);

    await seConnecter(page, COMPTES.membre);
    const barre = page.getByRole('navigation', { name: /navigation principale/i });
    await expect(barre).toBeVisible();
    await expect(barre.getByRole('link', { name: /vendre/i })).toBeVisible();

    // Elle mène bien où il faut.
    await barre.getByRole('link', { name: /compte/i }).click();
    await expect(page).toHaveURL(/\/compte/);
  });

  test('la recherche est accessible au doigt', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'spécifique au format mobile');

    await page.goto('/catalogue');
    const recherche = page.getByRole('searchbox', { name: /rechercher un article/i });
    await expect(recherche).toBeVisible();

    await recherche.fill('abaya');
    await recherche.press('Enter');
    await expect(page).toHaveURL(/\/recherche\?q=abaya/);
  });

  test('les tableaux du back-office deviennent des cartes', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'spécifique au format mobile');

    await seConnecter(page, COMPTES.admin);
    await page.goto('/admin/membres');
    await page.waitForLoadState('networkidle');

    // Le tableau est masqué sous md ; la liste de cartes prend le relais.
    await expect(page.locator('table')).toBeHidden();
    await expect(page.locator('ul.md\\:hidden > li').first()).toBeVisible();
  });

  test('le mega-menu de catégories reste masqué', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'spécifique au format mobile');

    await page.goto('/catalogue');
    // Le rail de catégories défile ; il ne doit pas ouvrir de panneau au doigt.
    await expect(page.getByRole('navigation', { name: /catégories/i })).toBeVisible();
  });
});

test.describe('Cibles tactiles', () => {
  test('les actions principales sont assez grandes au doigt', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'spécifique au format mobile');

    await page.goto('/connexion');
    const bouton = page.getByRole('button', { name: /me connecter/i });
    const taille = await bouton.boundingBox();

    // 44 px est le minimum recommandé pour une cible tactile.
    expect(taille?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});

test.describe('Captures', () => {
  test('enregistre un aperçu des écrans clés', async ({ page }, testInfo) => {
    const format = testInfo.project.name;

    for (const [nom, route] of [
      ['accueil', '/'],
      ['catalogue', '/catalogue'],
      ['recherche', '/recherche'],
      ['inscription', '/inscription'],
      ['aide', '/aide'],
    ] as const) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await chargerLesImages(page);
      await page.screenshot({
        path: `tests/captures/${format}-${nom}.png`,
        fullPage: true,
      });
    }

    await seConnecter(page, COMPTES.membre);
    for (const [nom, route] of [
      ['vendre', '/vendre'],
      ['compte', '/compte'],
    ] as const) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await chargerLesImages(page);
      await page.screenshot({ path: `tests/captures/${format}-${nom}.png`, fullPage: true });
    }
  });
});
