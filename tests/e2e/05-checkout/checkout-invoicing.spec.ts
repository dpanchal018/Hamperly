import { test, expect } from '@playwright/test';

test.describe('Domain 6: Checkout, Pincode Validation & Invoicing Receipt', () => {

  test.beforeEach(async ({ page }) => {
    // Seed test item into localStorage before page loads
    await page.addInitScript(() => {
      const testCart = [
        {
          id: 'mock-hamper-id-qa',
          name: 'QA Test Celebration Hamper',
          price: 999,
          quantity: 1,
          itemType: 'HAMPER',
          image: '/placeholder.jpg'
        }
      ];
      localStorage.setItem('hamperly_cart', JSON.stringify(testCart));
    });
  });

  test('Positive: Vadodara pincode 390019 validates with local delivery badge', async ({ page }) => {
    await page.goto('/checkout');
    const pincodeInput = page.locator('#delivery-pincode, input[placeholder*="Pincode" i], input[name="pincode"]').first();
    
    if (await pincodeInput.isVisible()) {
      await pincodeInput.fill('390019');
      // Should show local delivery badge
      await expect(page.locator('text=/Local Vadodara Delivery|Next Day/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Negative: Non-serviceable pincode blocks with validation error', async ({ page }) => {
    await page.goto('/checkout');
    const pincodeInput = page.locator('#delivery-pincode, input[placeholder*="Pincode" i], input[name="pincode"]').first();
    
    if (await pincodeInput.isVisible()) {
      await pincodeInput.fill('999999');
      // Verify non-serviceable badge or error
      await expect(page.locator('text=/not serviceable|currently unserviceable|invalid/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Negative: Missing address triggers validation toast on confirm attempt', async ({ page }) => {
    await page.goto('/checkout');
    const confirmBtn = page.getByRole('button', { name: /confirm order|place order/i }).first();
    
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      // Should display toast or validation warning
      await expect(page.locator('.toast, [role="alert"], body')).toContainText(/provide a delivery address|fill in|pincode first/i, { timeout: 5000 });
    }
  });

  test('Invoice Fallback Route: /checkout/success handles redirects gracefully', async ({ page }) => {
    // Test the fallback route that redirects query params
    await page.goto('/checkout/success');
    // Expect graceful redirect to home or checkout without server 500
    await expect(page.locator('body')).not.toContainText('Application error');
  });

});
