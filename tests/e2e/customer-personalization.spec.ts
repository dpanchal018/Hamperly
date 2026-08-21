import { test, expect } from '@playwright/test';

test.describe('Phase 5: Hamper Personalization', () => {

  test('Journey A & B: Complete Personalization Flow and Persistence', async ({ page }) => {
    // 1. Go to homepage and add a product
    await page.goto('/products');
    await page.waitForSelector('text=Add');
    const addButtons = await page.locator('button:has-text("Add")');
    if (await addButtons.count() > 0) {
      await addButtons.first().click();
      
      // 2. Go to Build page
      const toggleBtn = page.locator('text=Your Hamper').first();
      await toggleBtn.click();
      await page.locator('text=Review Hamper').click();
      await page.waitForURL('/build');

      // 3. Go to Personalize page
      await page.locator('text=Personalize My Hamper').click();
      await page.waitForURL('/personalize');

      // 4. Check defaults are loaded (e.g. Elegant Theme)
      const elegantThemeButton = page.locator('button', { hasText: 'Elegant' });
      await expect(elegantThemeButton).toHaveClass(/border-rose-500/);

      // 5. Change Theme
      const romanticThemeButton = page.locator('button', { hasText: 'Romantic' });
      await romanticThemeButton.click();
      await expect(romanticThemeButton).toHaveClass(/border-rose-500/);
      
      // 6. Enter Personal Message
      const textArea = page.locator('textarea');
      await textArea.fill('Happy Anniversary!');
      
      // 7. Verify persistence by reloading
      await page.reload();
      await expect(page.locator('button', { hasText: 'Romantic' })).toHaveClass(/border-rose-500/);
      await expect(page.locator('textarea')).toHaveValue('Happy Anniversary!');

      // 8. Go to Review page
      await page.locator('text=Review Personalization').click();
      await page.waitForURL('/review');

      // 9. Verify details on Review Page
      await expect(page.locator('text=Romantic')).toBeVisible();
      await expect(page.locator('text="Happy Anniversary!"')).toBeVisible();

      // 10. Generate
      await page.locator('text=Generate My Hamper').click();
      
      // 11. Verify Handoff Payload visibility
      await expect(page.locator('text=Ready for AI Generation!')).toBeVisible();
    }
  });

  test('Journey C & D: Personal Message Limits', async ({ page }) => {
    await page.goto('/personalize'); // Assuming we can just go there directly, though context might be empty
    // The page will show "Your Hamper is Empty" if no products exist. Let's add one first.
    
    await page.goto('/products');
    await page.waitForSelector('text=Add');
    const addButtons = await page.locator('button:has-text("Add")');
    if (await addButtons.count() > 0) {
      await addButtons.first().click();
      await page.goto('/personalize');
      
      const textArea = page.locator('textarea');
      
      // Valid message
      const validMsg = 'A'.repeat(250);
      await textArea.fill(validMsg);
      await expect(textArea).toHaveValue(validMsg);
      
      // Over limit - shouldn't allow typing beyond 250 because of our handler
      await textArea.fill('A'.repeat(251));
      // In our code: if (text.length <= 250) { updateField }
      // So if we paste 251, it doesn't update, it remains 250.
      await expect(textArea).toHaveValue(validMsg); 
    }
  });
});
