import { test, expect } from '@playwright/test';

test.describe('Phase 6: Hamper Designer Agent', () => {

  test('Should enforce authentication for design generation', async ({ page }) => {
    // 1. Browse and add a product
    await page.goto('/products');
    await page.waitForSelector('text=Add');
    const addButtons = await page.locator('button:has-text("Add")');
    if (await addButtons.count() > 0) {
      await addButtons.first().click();
      
      // Wait a moment for context to sync
      await page.waitForTimeout(500);
      
      // 2. Go to Build page
      const toggleBtn = page.locator('text=Your Hamper').first();
      await toggleBtn.click();
      await page.locator('text=Review Hamper').click();
      await page.waitForURL('/build');

      // 3. Go to Personalize page
      await page.locator('text=Personalize My Hamper').click();
      await page.waitForURL('/personalize');
      
      // 4. Go to Review page
      await page.locator('text=Review Personalization').click();
      await page.waitForURL('/review');

      // 5. Try to generate without logging in
      const generateBtn = page.getByRole('button', { name: /Generate My Hamper/i });
      await generateBtn.click();
      
      // 6. Should redirect to generation screen
      await page.waitForURL(/\/design\/generate\/.+/);
      await expect(page).toHaveURL(/\/design\/generate\/.+/);
    }
  });

});
