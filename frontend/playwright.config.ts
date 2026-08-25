import { defineConfig, devices } from '@playwright/test';

/**
 * Tests d'interface.
 *
 * Ils pilotent Microsoft Edge déjà installé sur la machine (`channel: 'msedge'`)
 * plutôt que de télécharger les navigateurs de Playwright : rien à récupérer,
 * et c'est un vrai Chromium.
 *
 * Prérequis : l'API et le front doivent tourner (npm run dev:api / dev:web).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },

  reporter: [['list'], ['html', { outputFolder: 'tests/rapport', open: 'never' }]],
  outputDir: 'tests/resultats',

  use: {
    baseURL: process.env.WEB_URL ?? 'http://localhost:3000',
    locale: 'fr-FR',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'bureau',
      use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 1440, height: 900 } },
    },
    {
      // Le CDC insiste sur l'usage mobile : les mêmes parcours sont rejoués en 390 px.
      name: 'mobile',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        viewport: { width: 390, height: 844 },
        isMobile: false,
        hasTouch: true,
      },
    },
  ],
});
