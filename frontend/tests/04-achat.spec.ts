import { expect, request as playwrightRequest, test } from '@playwright/test';
import { COMPTES, seConnecter, surveillerLaConsole } from './aides';

const API = process.env.API_URL ?? 'http://localhost:4000/api';

/**
 * Prépare un article achetable et renvoie son identifiant.
 *
 * Le test crée sa propre annonce plutôt que d'en consommer une du catalogue de
 * démonstration : un achat retire l'article de la vente, et réutiliser les
 * annonces existantes viderait la vitrine au fil des exécutions.
 *
 * La mise en place passe par l'API — c'est l'interface qui est testée plus bas,
 * pas le dépôt d'annonce (déjà couvert par la suite `e2e/`).
 */
async function preparerArticle(titre: string): Promise<string> {
  const contexte = await playwrightRequest.newContext();

  const connexion = async (email: string, motDePasse: string) => {
    await contexte.post(`${API}/auth/login`, { data: { email, password: motDePasse } });
  };

  await connexion(COMPTES.vendeuse.email, COMPTES.vendeuse.motDePasse);
  const creation = await contexte.post(`${API}/listings`, {
    data: {
      title: titre,
      categoryId: 'femme',
      subcategoryId: 'femme-abaya',
      size: 'M (40)',
      material: 'Nidha',
      color: 'Noir',
      condition: 'NEUF',
      brand: null,
      priceCents: 2600,
      photos: ['photos/abaya-dubai.webp'],
      packageFormat: 'MOYEN',
      description: 'Article créé par le test d’interface pour valider le tunnel d’achat.',
    },
  });
  const annonce = await creation.json();
  expect(creation.ok(), `création impossible : ${JSON.stringify(annonce)}`).toBe(true);

  // L'annonce n'est visible qu'après validation (CDC §3.3).
  await connexion(COMPTES.admin.email, COMPTES.admin.motDePasse);
  const moderation = await contexte.post(`${API}/admin/listings/${annonce.id}/review`, {
    data: { accepted: true },
  });
  expect(moderation.ok(), 'modération impossible').toBe(true);

  await contexte.dispose();
  return annonce.id;
}

/**
 * Tunnel d'achat complet dans le navigateur — CDC §3.6.
 *
 * Ce parcours manquait, et son absence a laissé passer un blocage total : le
 * profil renvoyait `line2: null`, que le schéma d'adresse refusait, si bien
 * qu'aucune acheteuse sans complément d'adresse ne pouvait commander. Les tests
 * d'API ne l'avaient pas vu parce qu'ils fabriquaient l'adresse au lieu de
 * réutiliser celle du profil, comme le fait le front.
 */
test('achat de bout en bout : commande, paiement, séquestre, réception', async ({ page }) => {
  const { erreurs } = surveillerLaConsole(page);

  const listingId = await preparerArticle(`Abaya de test achat ${Date.now()}`);

  await seConnecter(page, COMPTES.membre);
  await page.goto(`/article/${listingId}`);

  // ————— Le détail des montants est lisible avant tout engagement —————
  await expect(page.getByRole('heading', { name: /abaya de test achat/i })).toBeVisible();
  await expect(page.getByText(/récapitulatif/i)).toBeVisible();
  await expect(page.getByText(/frais de port/i).first()).toBeVisible();
  await expect(page.getByText(/gardé en sécurité/i)).toBeVisible();

  const acheter = page.getByRole('button', { name: /acheter/i });
  await expect(acheter).toBeVisible();
  await acheter.click();

  // ————— Paiement (page simulée, faute de clé Stripe) —————
  await page.waitForURL(/\/paiement-simule/, { timeout: 30_000 });
  await expect(page.getByText(/paiement de ta commande/i)).toBeVisible();
  await expect(page.getByText(/séquestre/i).first()).toBeVisible();

  await page.getByRole('button', { name: /confirmer le paiement/i }).click();

  // ————— Suivi de commande : payée, fonds sous séquestre —————
  await page.waitForURL(/\/commande\//, { timeout: 30_000 });
  const urlCommande = page.url();

  await expect(page.getByRole('heading', { name: /commande ND-/i })).toBeVisible();
  await expect(page.getByText(/payée/i).first()).toBeVisible();
  // L'adresse reprise du profil est bien celle affichée.
  await expect(page.getByText(/adresse de livraison/i)).toBeVisible();

  // ————— L'article vendu quitte le catalogue (CDC §3.6) —————
  await page.goto('/recherche');
  await page.waitForLoadState('networkidle');
  await expect(page.locator(`a[href="/article/${listingId}"]`)).toHaveCount(0);

  // ————— La commande apparaît dans « Mes achats » —————
  await page.goto('/achats');
  await expect(page.locator(`a[href="${new URL(urlCommande).pathname}"]`)).toBeVisible({
    timeout: 20_000,
  });

  // ————— Confirmation de réception : libère le paiement —————
  await page.goto(urlCommande);
  const confirmer = page.getByRole('button', { name: /confirmer la réception/i });
  await expect(confirmer).toBeVisible();

  // L'action est irréversible : elle passe par une confirmation explicite.
  page.once('dialog', (dialog) => {
    expect(dialog.message()).toMatch(/définitive|annulée|versé/i);
    void dialog.accept();
  });
  await confirmer.click();

  await expect(page.getByText(/reçue/i).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('button', { name: /confirmer la réception/i })).toHaveCount(0);

  expect(erreurs, erreurs.join(' | ')).toHaveLength(0);
});
