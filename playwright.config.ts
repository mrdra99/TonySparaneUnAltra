import { defineConfig, devices } from '@playwright/test';

/**
 * E2E: due project, desktop Chromium e mobile touch (Pixel 7).
 * I browser NON sono installati dallo scaffold: `npx playwright install chromium`.
 * Il webServer builda e serve la versione di produzione (`npm run preview`).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'mobile-pixel7',
      use: { ...devices['Pixel 7'], hasTouch: true },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
