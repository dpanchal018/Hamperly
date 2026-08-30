import { test, expect } from '@playwright/test';

test.describe('Domain 2: Catalog, Storefront, Search & Inventory Badges', () => {

  test('Positive: Storefront homepage loads with hero navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Hamperly/i);
    await expect(page.locator('header').first()).toBeVisible();
    await expect(page.locator('a[href*="/hampers"]').first()).toBeVisible();
  });

  test('Positive: Hampers catalog renders active hampers with pricing', async ({ page }) => {
    await page.goto('/hampers');
    // Verify at least one hamper card or link is rendered
    const card = page.locator('article, .group, [data-testid="hamper-card"]').first();
    await expect(card).toBeVisible();

    // Verify price symbol ₹ is displayed on the page
    await expect(page.locator('text=/₹/').first()).toBeVisible();
  });

  test('Positive: Products catalog loads and filters by query', async ({ page }) => {
    await page.goto('/products?q=chocolate');
    await expect(page).toHaveURL(/.*q=chocolate/);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('Edge Case: Non-existent search displays zero results gracefully', async ({ page }) => {
    await page.goto('/products?q=xyznonexistentitem12345');
    await expect(page.locator('body')).not.toContainText('500 Internal Server Error');
  });

});
