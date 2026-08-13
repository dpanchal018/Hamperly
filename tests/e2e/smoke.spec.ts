import { test, expect } from '@playwright/test';

test('homepage has title', async ({ page }) => {
  await page.goto('/');
  // Basic check that it doesn't crash on load
  await expect(page).toHaveTitle(/Create Next App/);
});
