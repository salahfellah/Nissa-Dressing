import { expect, test } from '@playwright/test';
import { COMPTES, seConnecter, surveillerLaConsole } from './aides';

/** Parcours d'inscription, catalogue et dépôt d'annonce, dans le navigateur. */

test.describe('Inscription', () => {
  test('la réponse « Non » est terminale et le message reste doux', async ({ page }) => {
    await page.goto('/inscription');

    await page.getByRole('button', { name: /^non$/i }).click();

    await expect(page.getByRole('heading', { name: /merci d’être passée/i })).toBeVisible();
    await expect(page.getByText(/réservée aux femmes musulmanes voilées/i)).toBeVisible();

    // Aucun retour vers le formulaire n'est proposé : le refus est définitif (CDC §3.1).
    await expect(page.getByRole('button', { name: /retour/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /retour à l’accueil/i })).toBeVisible();
  });

  test('les champs manquants sont signalés champ par champ', async ({ page }) => {
    await page.goto('/inscription');
    await page.getByRole('button', { name: /^oui$/i }).click();

    await expect(page.getByRole('heading', { name: /faisons connaissance/i })).toBeVisible();
    await page.getByRole('button', { name: /continuer/i }).click();

    // Les messages sont bien rattachés aux champs, et formulés avec douceur.
    await expect(page.getByText(/ton prénom, s’il te plaît/i)).toBeVisible();
    await expect(page.getByText(/nous avons besoin de ton adresse e-mail/i)).toBeVisible();
    await expect(page.getByText(/merci d’accepter les CGU/i)).toBeVisible();
  });

  test('un mot de passe faible est refusé avec une consigne claire', async ({ page }) => {
    await page.goto('/inscription');
    await page.getByRole('button', { name: /^oui$/i }).click();

    await page.getByLabel(/^prénom/i).fill('Nour');
    await page.getByLabel(/^nom/i).fill('T.');
    await page.getByLabel(/pseudo/i).fill(`nour${Date.now()}`);
    await page.getByLabel(/adresse e-mail/i).fill(`nour${Date.now()}@exemple.fr`);
    await page.getByLabel(/mot de passe/i).fill('minuscule1');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /continuer/i }).click();

    await expect(page.getByText(/ajoute une majuscule/i)).toBeVisible();
  });

  test('un formulaire valide mène à l’étape du serment audio', async ({ page }) => {
    const suffixe = Date.now();
    await page.goto('/inscription');
    await page.getByRole('button', { name: /^oui$/i }).click();

    await page.getByLabel(/^prénom/i).fill('Nour');
    await page.getByLabel(/^nom/i).fill('T.');
    await page.getByLabel(/pseudo/i).fill(`nour${suffixe}`);
    await page.getByLabel(/adresse e-mail/i).fill(`nour${suffixe}@exemple.fr`);
    await page.getByLabel(/mot de passe/i).fill('Soeur1234');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /continuer/i }).click();

    await expect(page.getByRole('heading', { name: /une dernière étape/i })).toBeVisible();
    await expect(page.getByText(/dépôt de serment/i)).toBeVisible();
    // Sans audio, l'envoi reste fermé.
    await expect(page.getByRole('button', { name: /envoyer ma candidature/i })).toBeDisabled();
  });
});

test.describe('Catalogue et article', () => {
  test('une annonce s’ouvre et affiche prix, port et vendeuse', async ({ page }) => {
    const { erreurs } = surveillerLaConsole(page);

    await page.goto('/catalogue');
    await page.locator('article a[href^="/article/"]').first().click();

    await expect(page).toHaveURL(/\/article\//);
    await expect(page.getByText(/frais de port/i).first()).toBeVisible();
    await expect(page.getByText(/à la charge de l’acheteuse/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /description/i })).toBeVisible();

    expect(erreurs, erreurs.join('\n')).toHaveLength(0);
  });

  test('une visiteuse est invitée à rejoindre plutôt qu’à acheter', async ({ page }) => {
    await page.goto('/catalogue');
    await page.locator('article a[href^="/article/"]').first().click();

    await expect(page.getByRole('link', { name: /rejoindre pour acheter/i })).toBeVisible();
    await expect(page.getByText(/réservés aux sœurs de la communauté/i)).toBeVisible();
  });

  test('une membre peut mettre un article en favori et le retrouver', async ({ page }) => {
    await seConnecter(page, COMPTES.membre);
    await page.goto('/catalogue');

    const carte = page.locator('article').first();
    const titre = await carte.locator('h3').innerText();

    await carte.getByRole('button', { name: /ajouter aux favoris/i }).click();
    await expect(carte.getByRole('button', { name: /retirer des favoris/i })).toBeVisible();

    await page.goto('/favoris');
    await expect(page.getByText(titre).first()).toBeVisible({ timeout: 20_000 });

    // On remet l'état d'origine pour ne pas polluer les exécutions suivantes.
    await page.locator('article').filter({ hasText: titre }).first()
      .getByRole('button', { name: /retirer des favoris/i })
      .click();
  });

  test('la recherche filtre le catalogue', async ({ page }) => {
    await page.goto('/recherche');
    await expect(page.locator('article').first()).toBeVisible({ timeout: 20_000 });

    // Sous md, les filtres sont repliés derrière un bouton : on les déploie
    // comme le ferait une visiteuse sur son téléphone.
    const deplier = page.getByRole('button', { name: /^filtrer$/i });
    if (await deplier.isVisible()) await deplier.click();

    await page.getByLabel(/mots-clés/i).fill('zzzintrouvablezzz');
    await expect(page.getByText(/aucun article ne correspond/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/essaie d’élargir tes critères/i)).toBeVisible();
  });
});

test.describe('Dépôt d’annonce', () => {
  // Les requêtes sont limitées au contenu de la page : l'en-tête contient une
  // navigation « Catégories » et un formulaire de recherche qui, sinon,
  // capteraient les sélecteurs destinés au formulaire de vente.
  const formulaire = (page: import('@playwright/test').Page) => page.getByRole('main');

  test('le formulaire réagit à la catégorie choisie', async ({ page }) => {
    const { erreurs } = surveillerLaConsole(page);

    await seConnecter(page, COMPTES.vendeuse);
    await page.goto('/vendre');
    await expect(page.getByRole('heading', { name: /vendre un article/i })).toBeVisible();

    const zone = formulaire(page);

    // Tant qu'aucune catégorie n'est choisie, la sous-catégorie reste fermée.
    await expect(zone.getByLabel(/sous-catégorie/i)).toBeDisabled();

    await zone.getByLabel(/^catégorie/i).selectOption('femme');
    await expect(zone.getByLabel(/sous-catégorie/i)).toBeEnabled();

    // Mention conditionnelle du CDC §3.4 sur le burkini.
    await zone.getByLabel(/sous-catégorie/i).selectOption('femme-burkini');
    await expect(page.getByText(/mastour de haut en bas/i)).toBeVisible();

    // Le référentiel de tailles suit la catégorie choisie.
    await zone.getByLabel(/^catégorie/i).selectOption('bebe-fille');
    await zone.getByLabel(/sous-catégorie/i).selectOption('bf-pyjama');
    await expect(zone.getByLabel(/^taille/i).locator('option', { hasText: '12 mois' })).toHaveCount(1);

    expect(erreurs, erreurs.join(' | ')).toHaveLength(0);
  });

  test('les catégories « neuf uniquement » restreignent les états proposés', async ({ page }) => {
    await seConnecter(page, COMPTES.vendeuse);
    await page.goto('/vendre');
    const zone = formulaire(page);

    await zone.getByLabel(/^catégorie/i).selectOption('accessoires');
    await zone.getByLabel(/sous-catégorie/i).selectOption('acc-chaussettes');

    await expect(page.getByText(/n’accepte que des articles/i)).toBeVisible();
    // Seuls les deux états « neuf » subsistent, plus l'option vide.
    await expect(zone.getByLabel(/^état/i).locator('option')).toHaveCount(3);
  });

  test('l’avertissement photos du CDC est affiché', async ({ page }) => {
    await seConnecter(page, COMPTES.vendeuse);
    await page.goto('/vendre');
    const zone = formulaire(page);

    await expect(page.getByText(/ne doivent pas être prises portées/i)).toBeVisible();
    await expect(page.getByText(/représentation d’âme/i)).toBeVisible();

    // La tolérance dépend de la sous-catégorie choisie.
    await zone.getByLabel(/^catégorie/i).selectOption('femme');
    await zone.getByLabel(/sous-catégorie/i).selectOption('femme-abaya');
    await expect(page.getByText(/la photo portée est acceptée/i)).toBeVisible();

    await zone.getByLabel(/sous-catégorie/i).selectOption('femme-pull');
    await expect(page.getByText(/n’autorise pas les photos portées/i)).toBeVisible();
  });

  test('les frais de port changent avec le format de colis', async ({ page }) => {
    await seConnecter(page, COMPTES.vendeuse);
    await page.goto('/vendre');

    // Le format par défaut est « Petit » : 4,90 € de port.
    await expect(page.getByText(/4,90/)).toBeVisible();

    // Sélection par valeur : le libellé de « Petit » contient « grande enveloppe »,
    // et capterait une recherche sur « grand ».
    await page.locator('input[name="packageFormat"][value="GRAND"]').check({ force: true });
    await expect(page.getByText(/9,90/)).toBeVisible();
  });
});
