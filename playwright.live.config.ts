import { defineConfig, devices } from '@playwright/test';

/**
 * Live Site Configuration for Bug Crawler
 * Runs rigorously against the production environment.
 */
export default defineConfig({
  testDir: './tests/live',
  fullyParallel: false,
  retries: 1,
  workers: 1, // Single worker to avoid throttling/DDoS protection on live site
  reporter: [
    ['html', { outputFolder: 'validation-reports/live-site/html', open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: 'https://hamperly.vercel.app',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    navigationTimeout: 30000,
    actionTimeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
});
