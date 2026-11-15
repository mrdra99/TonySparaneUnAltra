import { expect, type Page } from '@playwright/test';

/** Errori di console da ignorare: note di driver/GPU in ambienti headless. */
const IGNORED = [/WebGL/i, /GPU stall/i, /GL Driver/i, /swiftshader/i, /favicon/i];

/** Raccoglie gli errori di console e le eccezioni della pagina. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !IGNORED.some((r) => r.test(m.text()))) errors.push(m.text());
  });
  return errors;
}

/** Svuota il localStorage al primo caricamento (partita pulita), ma non ai refresh successivi. */
export async function cleanStart(page: Page): Promise<void> {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('e2e-cleared')) {
      localStorage.clear();
      sessionStorage.setItem('e2e-cleared', '1');
    }
  });
  await page.goto('/');
}

export const newGameButton = (page: Page) => page.getByRole('button', { name: /NUOVA PARTITA/i });

/** Dal menu a "playing": nuova partita e attesa dell'HUD con il Cazzatometro. */
export async function startNewGame(page: Page): Promise<void> {
  await newGameButton(page).click({ timeout: 60_000 });
  await expect(page.getByRole('progressbar', { name: 'Cazzatometro' })).toBeVisible({
    timeout: 15_000,
  });
}
