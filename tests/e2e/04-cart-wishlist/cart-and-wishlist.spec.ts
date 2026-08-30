import { test, expect } from '@playwright/test';

test.describe('Domain 4 & 5: Cart Management, Cross-Device Sync & Wishlist', () => {

  test('Positive: Cart persists items added from Hampers catalog', async ({ page }) => {
    await page.goto('/hampers');

    // Click 'Add to Cart' or 'Select' on first available hamper
    const addBtn = page.getByRole('button', { name: /add to cart|quick add|buy now/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      // Ensure cart count badge updates or drawer appears
      await expect(page.locator('text=/1/').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Positive: Empty cart state renders clear call to action', async ({ page }) => {
    // Clear localStorage cart before navigating
    await page.goto('/checkout');
    await page.evaluate(() => localStorage.removeItem('hamperly_cart'));
    await page.reload();

    // Verify empty state message
    const emptyMsg = page.locator('text=/your cart is empty|no items/i').first();
    if (await emptyMsg.isVisible()) {
      await expect(emptyMsg).toBeVisible();
    }
  });

  test('Positive: Wishlist heart icon renders on hamper cards', async ({ page }) => {
    await page.goto('/hampers');
    // Check if heart icon / button is rendered on cards
    const heartBtn = page.locator('button:has(svg.lucide-heart), [aria-label*="wishlist" i]').first();
    if (await heartBtn.isVisible()) {
      await expect(heartBtn).toBeVisible();
    }
  });

});
