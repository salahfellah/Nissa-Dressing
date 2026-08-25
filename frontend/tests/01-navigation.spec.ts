import { expect, test } from '@playwright/test';
import { COMPTES, seConnecter, surveillerLaConsole } from './aides';

/**
 * Navigation et gardes de parcours — CDC §3.1 / §3.2.
 *
 * Les gardes sont vérifiées dans le navigateur, avec de vraies redirections :
 * la suite d'API prouve que le serveur refuse, ces tests prouvent que la
 * visiteuse est effectivement emmenée au bon endroit.
 */

test.describe('Accès public', () => {
  test('l’accueil présente le site et mène à l’inscription', async ({ page }) => {
    const { erreurs } = surveillerLaConsole(page);

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Nissa/i }).first()).toBeVisible();
    await expect(page.getByText(/élégance|modestie|foi/i).first()).toBeVisible();

    await page.getByRole('link', { name: /créer un compte/i }).click();
    await expect(page).toHaveURL(/\/inscription/);
    await expect(page.getByRole('heading', { name: /avant de commencer/i })).toBeVisible();

    expect(erreurs, erreurs.join('\n')).toHaveLength(0);
  });

  test('le catalogue est consultable sans compte', async ({ page }) => {
    const { erreurs } = surveillerLaConsole(page);

    await page.goto('/catalogue');
    await expect(page.getByRole('heading', { name: /élégance modeste/i })).toBeVisible();
    // Les annonces du jeu de démonstration doivent apparaître.
    await expect(page.locator('article').first()).toBeVisible({ timeout: 20_000 });

    expect(erreurs, erreurs.join('\n')).toHaveLength(0);
  });

  test('les huit pages légales s’affichent', async ({ page }) => {
    const pages = [
      'cgu',
      'conditions-de-vente',
      'politique-de-remboursement',
      'mentions-legales',
      'rgpd',
      'regles-fiscales',
      'charte-de-moderation',
      'paiement-securise',
    ];

    for (const slug of pages) {
      await page.goto(`/legal/${slug}`);
      await expect(page.locator('.legal-content h1')).toBeVisible();
      // Le contenu markdown doit être rendu, pas affiché brut.
      await expect(page.locator('.legal-content h2').first()).toBeVisible();
    }
  });

  test('la page d’aide affiche la FAQ et le formulaire de contact', async ({ page }) => {
    const { erreurs } = surveillerLaConsole(page);

    await page.goto('/aide');
    await expect(page.getByRole('heading', { name: /centre d’aide/i })).toBeVisible();

    // La première question est ouverte, sa réponse est donc lisible.
    await expect(page.getByText(/réservée aux femmes musulmanes voilées/i).first()).toBeVisible();

    // Un accordéon s'ouvre au clic.
    await page.getByRole('button', { name: /pourquoi 5 ?€ à l’inscription/i }).click();
    await expect(page.getByText(/accès à vie à la plateforme/i).first()).toBeVisible();

    await expect(page.getByRole('button', { name: /envoyer mon message/i })).toBeVisible();
    expect(erreurs, erreurs.join('\n')).toHaveLength(0);
  });
});

test.describe('Gardes de parcours', () => {
  test('une visiteuse est renvoyée vers la connexion sur les pages membres', async ({ page }) => {
    for (const route of ['/vendre', '/compte', '/favoris', '/messages', '/mes-annonces']) {
      await page.goto(route);
      await expect(page, `${route} devrait rediriger`).toHaveURL(/\/connexion/, { timeout: 20_000 });
    }
  });

  test('une visiteuse n’atteint pas le back-office', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/connexion/, { timeout: 20_000 });
  });

  test('une membre n’atteint pas le back-office', async ({ page }) => {
    await seConnecter(page, COMPTES.membre);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/connexion/, { timeout: 20_000 });
  });

  test('l’administratrice accède au tableau de bord', async ({ page }) => {
    const { erreurs } = surveillerLaConsole(page);

    await seConnecter(page, COMPTES.admin);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /tableau de bord/i })).toBeVisible();
    await expect(page.getByText(/sous séquestre/i).first()).toBeVisible();

    expect(erreurs, erreurs.join('\n')).toHaveLength(0);
  });

  test('une membre connectée qui revient sur la connexion est renvoyée au catalogue', async ({
    page,
  }) => {
    await seConnecter(page, COMPTES.membre);
    await page.goto('/connexion');
    await expect(page).toHaveURL(/\/catalogue/, { timeout: 20_000 });
  });

  test('une route inconnue ne casse pas la navigation', async ({ page }) => {
    const reponse = await page.goto('/cette-page-nexiste-pas');
    expect(reponse?.status()).toBe(404);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Connexion', () => {
  test('un mot de passe erroné affiche un message doux, sans quitter la page', async ({ page }) => {
    await page.goto('/connexion');
    await page.getByLabel(/adresse e-mail/i).fill(COMPTES.membre.email);
    await page.getByLabel(/mot de passe/i).fill('MauvaisMotDePasse1');
    await page.getByRole('button', { name: /me connecter/i }).click();

    await expect(page.getByRole('alert').filter({ hasText: /correspond/i })).toContainText(
      /ne correspond pas/i,
    );
    await expect(page).toHaveURL(/\/connexion/);
  });

  test('la déconnexion ramène à l’accueil et referme la session', async ({ page }) => {
    await seConnecter(page, COMPTES.membre);
    await page.goto('/compte');

    await page.getByRole('button', { name: /se déconnecter/i }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });

    await page.goto('/compte');
    await expect(page).toHaveURL(/\/connexion/, { timeout: 20_000 });
  });
});
