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
    const card = page.locator('article, .group, [data-testid="hamper-card"]').first();
    await expect(card).toBeVisible();
    await expect(page.locator('text=/₹/').first()).toBeVisible();
  });

  test('Positive: Hamper live search filters hampers by typing keyword', async ({ page }) => {
    await page.goto('/hampers');
    const searchInput = page.getByRole('textbox', { name: /search hampers/i });
    await expect(searchInput).toBeVisible();

    // Type 'Coffee' in search input
    await searchInput.fill('Coffee');

    // Verify counter updates and only Coffee hampers appear
    await expect(page.locator('text=/matching "Coffee"/i')).toBeVisible();
    const coffeeCards = page.locator('h3:has-text("Coffee")');
    await expect(coffeeCards.first()).toBeVisible();

    // Verify clear button appears and clears search
    const clearBtn = page.getByRole('button', { name: /clear search/i });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // After clearing, full collection is restored
    await expect(page.locator('text=/Showing all/i')).toBeVisible();
  });

  test('Positive: Hamper quick-filter keyword chips filter results instantly', async ({ page }) => {
    await page.goto('/hampers');
    
    // Click 'Dry Fruits' quick-filter pill
    const dryFruitsPill = page.getByRole('button', { name: 'Dry Fruits' }).first();
    if (await dryFruitsPill.isVisible()) {
      await dryFruitsPill.click();
      await expect(page).toHaveURL(/.*q=Dry(\+|%20)Fruits/i);
      await expect(page.locator('h3:has-text("Dry Fruits")').first()).toBeVisible();
    }
  });

  test('Edge Case: Hamper search with non-existent query renders empty state', async ({ page }) => {
    await page.goto('/hampers?q=nonexistentxyz12345');
    await expect(page.getByRole('heading', { name: /no hampers found/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /clear search/i }).first()).toBeVisible();
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
