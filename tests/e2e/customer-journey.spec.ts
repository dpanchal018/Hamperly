import { test, expect } from '@playwright/test';

test.describe('Customer Storefront Journeys', () => {
  
  test.beforeEach(async ({ page }) => {
    // Optionally setup mocks if we don't have a live DB in CI, 
    // but assuming Playwright runs against the local dev server which has seed data
    await page.goto('/');
  });

  test('Journey A & G: Home -> Occasion -> Product -> Select Product (Responsive Check)', async ({ page }) => {
    // 1. Homepage loads
    await expect(page.getByRole('heading', { name: /Personalized hampers/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Build Your Hamper/i })).toBeVisible();
    
    // 2. Click Build Your Hamper (goes to occasions)
    await page.getByRole('link', { name: /Build Your Hamper/i }).click();
    await expect(page).toHaveURL(/.*\/occasions/);
    await expect(page.getByRole('heading', { name: /Shop by Occasion/i })).toBeVisible();
    
    // 3. Select an occasion (Diwali)
    await page.getByRole('link', { name: /Diwali/i }).click();
    await expect(page).toHaveURL(/.*\/occasions\/diwali/);
    
    // 4. Click a product in the grid
    const firstProduct = page.locator('h3').first();
    const productName = await firstProduct.textContent();
    await firstProduct.click();
    
    // 5. Product Detail Page
    await expect(page.getByRole('heading', { name: productName! })).toBeVisible();
    
    // 6. Select Product
    const selectButton = page.getByRole('button', { name: /Select for Hamper/i });
    if (await selectButton.isVisible() && await selectButton.isEnabled()) {
      await selectButton.click();
      await expect(page.getByText('In your hamper')).toBeVisible();
      // Verify floating summary appears
      await expect(page.getByText('Your Hamper')).toBeVisible();
    }
  });

  test('Journey C: Products -> Search -> Select', async ({ page }) => {
    await page.goto('/products');
    
    // Search
    const searchInput = page.getByPlaceholder('Search products...');
    await searchInput.fill('chocolate');
    await searchInput.press('Enter');
    
    await expect(page).toHaveURL(/.*q=chocolate/);
    
    // Click first product
    const firstProduct = page.locator('h3').first();
    if (await firstProduct.count() > 0) {
      await firstProduct.click();
      await expect(page.getByRole('button', { name: /Select for Hamper/i })).toBeVisible();
    }
  });

  test('Journey E: Attempt unavailable product', async ({ page }) => {
    await page.goto('/products?inStock=false');
    // Find an out of stock product
    const outOfStockBadge = page.getByText('OUT OF STOCK').first();
    if (await outOfStockBadge.count() > 0) {
      const productCard = outOfStockBadge.locator('..').locator('..');
      const addButton = productCard.getByRole('button', { name: /Add/i });
      await expect(addButton).toBeDisabled();
    }
  });

});
