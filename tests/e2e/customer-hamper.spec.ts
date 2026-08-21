import { test, expect } from '@playwright/test';

test.describe('Phase 4: Hamper Builder', () => {
  test('Browse product -> Add to Hamper -> Open Hamper -> Verify item', async ({ page }) => {
    // 1. Go to homepage
    await page.goto('/');

    // 2. Click "Explore Products" or navigate to products
    await page.click('text=Explore Products');
    await page.waitForURL('/products');

    // 3. Wait for products to load and click Add on the first product
    await page.waitForSelector('text=Add');
    const addButtons = await page.locator('button:has-text("Add")');
    if (await addButtons.count() > 0) {
      await addButtons.first().click();

      // 4. The Add button should turn into a +/- quantity selector
      const quantityText = await page.locator('.text-rose-700.text-center').first();
      await expect(quantityText).toHaveText('1');

      // 5. Open Hamper via the floating FAB or sidebar
      // Click the floating button (which typically has a ShoppingBag icon and indicates items)
      const toggleBtn = page.locator('text=Your Hamper').first();
      await toggleBtn.click();

      const reviewHamperBtn = page.locator('text=Review Hamper');
      await expect(reviewHamperBtn).toBeVisible();
      await reviewHamperBtn.click();

      await page.waitForURL('/build');

      // 6. Verify item exists in the builder
      await expect(page.locator('text=Hamper Summary')).toBeVisible();
      await expect(page.locator('text=Total Items')).toBeVisible();
    }
  });
});
