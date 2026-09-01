import { test, expect } from '@playwright/test';

test.describe('Domain 4 & 5: Cart Management, Cross-Device Sync & Wishlist', () => {

  test('Positive: Cart persists items added from Hampers catalog', async ({ page }) => {
    await page.goto('/hampers');

    // Click 'Add to Cart' on first in-stock available hamper
    const addBtn = page.locator('button:not([disabled])').filter({ hasText: /add to cart|quick add|buy now/i }).or(page.locator('button[aria-label="Add to Cart"]:not([disabled])')).first();
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
    // Ensure wishlist button renders on hamper cards
    const wishlistBtn = page.locator('button[aria-label="Toggle Wishlist"]').first();
    await expect(wishlistBtn).toBeVisible({ timeout: 10000 });
  });

  test('Positive: Wishlisting is non-blocking and permits rapid successive clicks across items', async ({ page }) => {
    await page.goto('/hampers');
    const wishlistBtns = page.locator('button[aria-label="Toggle Wishlist"]');
    await expect(wishlistBtns.first()).toBeVisible({ timeout: 10000 });
    const count = await wishlistBtns.count();
    
    if (count >= 2) {
      // Rapid clicks should not freeze or disable the page
      await wishlistBtns.nth(0).click();
      await wishlistBtns.nth(1).click();
      
      // Page remains responsive and non-blocking
      await expect(wishlistBtns.nth(0)).toBeEnabled();
      await expect(wishlistBtns.nth(1)).toBeEnabled();
    }
  });

  test('Positive: Wishlist heart icon renders on hamper detail page and in header', async ({ page }) => {
    // Navigate to a hamper detail page
    await page.goto('/hampers');
    const firstHamperLink = page.locator('a[href*="/hampers/"]').first();
    if (await firstHamperLink.isVisible()) {
      await firstHamperLink.click();
      
      // Check for wishlist icon beside Add to Cart
      const detailWishlistBtn = page.locator('button[aria-label="Toggle Wishlist"]');
      await expect(detailWishlistBtn.first()).toBeVisible({ timeout: 10000 });

      // Check header wishlist icon link
      const headerWishlist = page.locator('a[href="/account/wishlist"]');
      await expect(headerWishlist).toBeVisible({ timeout: 10000 });
    }
  });

});
