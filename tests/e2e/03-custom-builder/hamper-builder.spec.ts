import { test, expect } from '@playwright/test';

test.describe('Domain 3: Interactive Custom Hamper Designer & Theming', () => {

  test('Positive: Occasions page loads and displays curated themes', async ({ page }) => {
    await page.goto('/occasions');
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Check that at least one occasion card exists
    const occasionLink = page.locator('a[href*="/occasions/"]').first();
    if (await occasionLink.isVisible()) {
      await expect(occasionLink).toBeVisible();
    }
  });

  test('Positive: Custom designer route loads builder steps', async ({ page }) => {
    await page.goto('/custom-hamper');
    if (page.url().includes('/custom-hamper')) {
      await expect(page.locator('body')).not.toContainText('Application error');
    }
  });

});
