import { expect, test } from '@playwright/test';

test('la pagina si carica con il titolo del gioco', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/TONY SPARANE UN'ALTRA/);
});
