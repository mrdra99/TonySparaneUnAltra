import { expect, test } from '@playwright/test';
import { cleanStart, startNewGame } from './helpers';

// Solo project desktop: tastiera e mouse.
test.skip(({ isMobile }) => isMobile, 'solo desktop');

test.describe('partita (desktop)', () => {
  test.beforeEach(async ({ page }) => {
    await cleanStart(page);
    await startNewGame(page);
  });

  test('HUD: Cazzatometro e suggerimenti comandi', async ({ page }) => {
    await expect(page.getByRole('progressbar', { name: 'Cazzatometro' })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Comandi' })).toBeVisible();
  });

  test('Esc apre la pausa con tutte le voci e RIPRENDI chiude', async ({ page }) => {
    await page.keyboard.press('Escape');
    const nav = page.getByRole('navigation', { name: 'Menu di pausa' });
    await expect(nav).toBeVisible();
    const voci = [
      /RIPRENDI/,
      /MISSIONI/,
      /REGISTRO DELLE LEGGENDE/,
      /IMPOSTAZIONI/,
      /RIAVVIA/,
      /TORNA AL MENU/,
    ];
    for (const name of voci) {
      await expect(nav.getByRole('button', { name })).toBeVisible();
    }
    await nav.getByRole('button', { name: /RIPRENDI/ }).click();
    await expect(nav).toHaveCount(0);
  });

  test('camminare (W) e correre (Shift+W) non genera errori', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.keyboard.down('w');
    await page.waitForTimeout(800);
    await page.keyboard.down('Shift');
    await page.waitForTimeout(800);
    await page.keyboard.up('Shift');
    await page.keyboard.up('w');
    await expect(page.getByRole('progressbar', { name: 'Cazzatometro' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('vicino a un NPC compare PARLA CON, E apre il dialogo e Esc lo chiude', async ({ page }) => {
    // Lo spawn e' a sud-centro, gli NPC nell'area di ritrovo a nord-est. Percorso a tentativi:
    // i tempi vanno tarati al primo collaudo reale (la camera parte alle spalle di Tony).
    const prompt = page.getByText(/PARLA CON/i);
    const route: [string, number][] = [
      ['w', 2200],
      ['d', 1500],
      ['w', 1200],
      ['a', 600],
    ];
    for (const [key, ms] of route) {
      if (await prompt.isVisible()) break;
      await page.keyboard.down(key);
      await page.waitForTimeout(ms);
      await page.keyboard.up(key);
    }
    await expect(prompt).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press('e');
    const dialog = page.getByRole('dialog', { name: 'Dialogo' });
    await expect(dialog).toBeVisible();
    // movimento bloccato: il dialogo resta aperto premendo i tasti di movimento
    await page.keyboard.down('w');
    await page.waitForTimeout(500);
    await page.keyboard.up('w');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });
});
