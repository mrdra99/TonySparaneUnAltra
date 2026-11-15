import { expect, test } from '@playwright/test';
import { cleanStart, collectErrors, newGameButton } from './helpers';

test('la pagina si carica con il titolo del gioco e senza errori in console', async ({ page }) => {
  const errors = collectErrors(page);
  await cleanStart(page);
  await expect(page).toHaveTitle(/TONY SPARANE UN'ALTRA/);
  await expect(newGameButton(page)).toBeVisible({ timeout: 60_000 });
  expect(errors).toEqual([]);
});
