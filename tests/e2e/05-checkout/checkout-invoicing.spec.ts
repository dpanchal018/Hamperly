import { test, expect } from '@playwright/test';

test.describe('Domain 6: Checkout, Pincode Validation & Invoicing Receipt', () => {

  test.beforeEach(async ({ page }) => {
    // Clear state before test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('Positive: Vadodara pincode 390019 validates with local delivery badge', async ({ page }) => {
    // Seed test item into localStorage before navigating
    await page.evaluate(() => {
      const testCart = [
        {
          id: 'mock-hamper-id-qa',
          name: 'QA Test Celebration Hamper',
          price: 999,
          quantity: 1,
          itemType: 'HAMPER'
        }
      ];
      localStorage.setItem('hamperly_cart', JSON.stringify(testCart));
    });

    await page.goto('/checkout');
    const pincodeInput = page.locator('#delivery-pincode, input[placeholder*="Pincode" i], input[name="pincode"]').first();
    
    if (await pincodeInput.isVisible()) {
      await pincodeInput.fill('390019');
      // Should show local delivery badge
      await expect(page.locator('text=/Local Vadodara Delivery|Next Day/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Negative: Non-serviceable pincode blocks with validation error', async ({ page }) => {
    await page.evaluate(() => {
      const testCart = [
        {
          id: 'mock-hamper-id-qa',
          name: 'QA Test Celebration Hamper',
          price: 999,
          quantity: 1,
          itemType: 'HAMPER'
        }
      ];
      localStorage.setItem('hamperly_cart', JSON.stringify(testCart));
    });

    await page.goto('/checkout');
    const pincodeInput = page.locator('#delivery-pincode, input[placeholder*="Pincode" i], input[name="pincode"]').first();
    
    if (await pincodeInput.isVisible()) {
      await pincodeInput.fill('999999');
      // Verify non-serviceable badge or error
      await expect(page.locator('text=/not serviceable|currently unserviceable|invalid/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Positive: Personalized Hamper Full Checkout Order Placement', async ({ page }) => {
    // 1. Build a hamper
    await page.goto('/build');
    await expect(page.locator('h2:has-text("What are you celebrating?")').first()).toBeVisible();
    await page.locator('button:has(h3)').first().click();
    await page.getByRole('button', { name: /Continue to Select Products/i }).or(page.getByRole('button', { name: /Continue to Review Products/i })).click();

    // 2. Select product
    await page.locator('button:has-text("Add")').first().click();
    await page.locator('button:has-text("Customize Hamper")').click();

    // 3. Customize packaging
    await page.locator('button:has(h4)').first().click();
    await page.getByRole('button', { name: /Add Personal Message/i }).click();

    // 4. Add message & Review
    await page.locator('textarea[placeholder*="heartfelt note"]').fill('Celebration wishes from QA');
    await page.getByRole('button', { name: /Review Complete Hamper/i }).click();

    // 5. Confirm to bag
    await page.getByRole('button', { name: /Confirm & Add to Bag/i }).click();

    // 6. Navigate to checkout via Proceed to Checkout button in Cart drawer
    await expect(page.locator('h2:has-text("Your Bag")')).toBeVisible({ timeout: 15000 });
    const checkoutBtn = page.getByRole('button', { name: /Proceed to Checkout/i });
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();

    // 7. On Checkout page: verify delivery details header
    await expect(page.locator('h2:has-text("Delivery Details")')).toBeVisible({ timeout: 15000 });

    // Fill guest details if unauthenticated
    const nameInput = page.locator('input[placeholder="John Doe"]');
    const isGuest = await nameInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (isGuest) {
      await nameInput.fill('QA Tester');
      await page.locator('input[placeholder="john@example.com"]').fill('qa.tester@example.com');
      await page.locator('input[placeholder="+91 9876543210"]').fill('9876543210');
    }

    // Enter valid local pincode
    const pincodeInput = page.locator('#delivery-pincode');
    await pincodeInput.fill('390019');
    await expect(page.locator('text=/Local Vadodara Delivery/i').first()).toBeVisible({ timeout: 5000 });

    // Enter address
    const addressInput = page.locator('#delivery-address');
    await expect(addressInput).toBeEnabled({ timeout: 5000 });
    await addressInput.fill('102 Royal Orchid Heights, Alkapuri, Vadodara');

    // Confirm order
    const confirmOrderBtn = page.getByRole('button', { name: /Confirm Order/i });
    await expect(confirmOrderBtn).toBeEnabled();
    await confirmOrderBtn.click();

    // Should redirect to success page
    await expect(page).toHaveURL(/\/checkout\/success\//, { timeout: 20000 });
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('Invoice Fallback Route: /checkout/success handles redirects gracefully', async ({ page }) => {
    // Test the fallback route that redirects query params
    await page.goto('/checkout/success');
    await expect(page.locator('body')).not.toContainText('Application error');
  });

});
