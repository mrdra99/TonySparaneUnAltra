import { expect, test } from '@playwright/test';
import { cleanStart, startNewGame } from './helpers';

// Solo project mobile (Pixel 7, touch).
test.skip(({ isMobile }) => !isMobile, 'solo mobile');

test.describe('partita (mobile touch)', () => {
  test.beforeEach(async ({ page }) => {
    await cleanStart(page);
    await startNewGame(page);
  });

  test('controlli touch visibili e pausa funzionante', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Pausa' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Missioni' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Corri/ })).toBeVisible();
    await page.getByRole('button', { name: 'Pausa' }).tap();
    const nav = page.getByRole('navigation', { name: 'Menu di pausa' });
    await expect(nav).toBeVisible();
    await nav.getByRole('button', { name: /RIPRENDI/ }).tap();
    await expect(nav).toHaveCount(0);
  });

  test('trascinando il joystick non ci sono errori e la pagina non scorre', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const vp = page.viewportSize();
    if (!vp) throw new Error('viewport non disponibile');
    const cdp = await page.context().newCDPSession(page);
    const x0 = vp.width * 0.2;
    const y0 = vp.height * 0.7;
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: x0, y: y0, id: 1 }],
    });
    for (let i = 1; i <= 8; i++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x0, y: y0 - i * 8, id: 1 }],
      });
      await page.waitForTimeout(80);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(errors).toEqual([]);
  });

  test('a 360 px in portrait non c e scroll orizzontale e la pausa e raggiungibile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
    await expect(page.getByRole('button', { name: 'Pausa' })).toBeVisible();
  });
});
