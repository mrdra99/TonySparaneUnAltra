import { expect, test } from '@playwright/test';
import { cleanStart, newGameButton, startNewGame } from './helpers';

test.describe('menu iniziale', () => {
  test('senza salvataggio mostra NUOVA PARTITA, COME SI GIOCA, CREDITI e non CONTINUA', async ({
    page,
  }) => {
    await cleanStart(page);
    await expect(newGameButton(page)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('button', { name: /COME SI GIOCA/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /CREDITI/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /CONTINUA/i })).toHaveCount(0);
  });

  test('i crediti mostrano il disclaimer di finzione', async ({ page }) => {
    await cleanStart(page);
    await page.getByRole('button', { name: /CREDITI/i }).click({ timeout: 60_000 });
    await expect(page.getByRole('note')).toContainText(/finzione|satira/i);
  });

  test('dopo una partita e un refresh compare CONTINUA e riporta in gioco', async ({ page }) => {
    await cleanStart(page);
    await startNewGame(page);
    await page.reload();
    const cont = page.getByRole('button', { name: /CONTINUA/i });
    await expect(cont).toBeVisible({ timeout: 60_000 });
    await cont.click();
    await expect(page.getByRole('progressbar', { name: 'Cazzatometro' })).toBeVisible({
      timeout: 15_000,
    });
  });
});
