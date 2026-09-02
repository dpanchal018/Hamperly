import { test, expect } from '@playwright/test';

test.describe('Live Production Spider & Lifecycle Test', () => {
  // A simple set to track visited URLs if we were doing a full deep crawl
  const visited = new Set<string>();
  const errors: string[] = [];

  test('Should spider the homepage and detect no critical errors', async ({ page, baseURL }) => {
    // Listen for unhandled console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('404')) {
          errors.push(`Console Error on ${page.url()}: ${text}`);
        }
      }
    });

    // Listen for bad responses
    page.on('response', response => {
      if (response.status() >= 500) {
        errors.push(`API Error ${response.status()} on ${response.url()}`);
      }
    });

    await page.goto('/');
    await expect(page).toHaveTitle(/Hamperly/);
    
    // Check main navigation links
    const links = ['/hampers', '/products', '/about', '/policies/cancellation-return'];
    for (const link of links) {
      await page.goto(link);
      await expect(page.locator('body')).toBeVisible();
      const heading = await page.locator('h1, h2').first();
      await expect(heading).toBeVisible();
    }

    // Fail the test if we caught serious errors
    expect(errors).toHaveLength(0);
  });

  test('Full Checkout Lifecycle & Automatic Teardown', async ({ page }) => {
    // 1. Log in as the QA Bot
    await page.goto('/login');
    await page.fill('input[name="email"]', 'qa-crawler@hamperly.com');
    await page.fill('input[name="password"]', 'HamperlyQA123!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Verify successful login by checking for the redirect to homepage
    await page.waitForURL(url => url.pathname === '/', { timeout: 10000 });

    // 2. Go to hampers page and add the first pre-made hamper to cart
    await page.goto('/hampers');
    
    // CRITICAL: Next.js CartProvider fetches the cart from the cloud database on mount.
    // If Playwright clicks "Add to Cart" before this fetch completes, the cloud fetch 
    // will resolve and overwrite the newly added item with an empty cart!
    // We must wait for network idle to ensure loadCart() has completely finished.
    await page.waitForLoadState('networkidle');
    
    const firstHamperBtn = page.locator('button[aria-label="Add to Cart"]').first();
    await firstHamperBtn.waitFor({ state: 'visible' });
    await firstHamperBtn.click();
    
    // Crucial: Wait for the button state to change to "Added to Cart" to ensure React saved it to localStorage
    await expect(page.locator('button[aria-label="Added to Cart"]').first()).toBeVisible({ timeout: 10000 });
    
    // 3. Open cart slideover and proceed to checkout (SPA transition preserves context)
    const navCartBtn = page.locator('button').filter({ has: page.locator('.lucide-shopping-bag') }).first();
    await navCartBtn.click();
    
    const proceedBtn = page.locator('button:has-text("Proceed to Checkout")');
    await proceedBtn.waitFor({ state: 'visible' });
    await proceedBtn.click();
    
    // 4. Fill out Delivery Details
    await page.waitForURL('**/checkout', { timeout: 15000 });
    
    // Check if the form rendered, or if the cart mysteriously emptied
    await expect(async () => {
      const hasDelivery = await page.locator('text=Delivery Details').isVisible();
      const isEmpty = await page.locator('text=Your cart is empty').isVisible();
      expect(hasDelivery || isEmpty).toBeTruthy();
    }).toPass({ timeout: 15000 });

    if (await page.locator('text=Your cart is empty').isVisible()) {
      throw new Error("Cart was mysteriously empty on the checkout page. SPA state loss occurred.");
    }
    
    // If we have a saved address, the pincode input will be hidden
    const pincodeInput = page.locator('#delivery-pincode');
    
    if (await pincodeInput.isVisible()) {
      await pincodeInput.fill('390001');
      await expect(page.locator('#delivery-address')).toBeEnabled({ timeout: 10000 });
      await page.locator('#delivery-address').fill('123 Automated Testing St');
    }

    // 5. Confirm Order
    const confirmBtn = page.locator('button:has-text("Confirm Order")');
    await confirmBtn.click();

    // 6. Verify Success Page
    await page.waitForURL('**/checkout/success/**', { timeout: 15000 });
    await expect(page.locator('text=Order Confirmed')).toBeVisible();
    
    // 7. Teardown: Navigate to My Orders and Cancel
    await page.goto('/account/orders');
    
    // Click the first "Cancel Order" button
    const cancelBtn = page.locator('button:has-text("Cancel Order")').first();
    await cancelBtn.waitFor({ state: 'visible' });
    await cancelBtn.click();

    // Select reason and confirm in the dialog
    const reasonBtn = page.locator('button:has-text("Other")');
    await reasonBtn.click();
    await page.fill('textarea', 'Automated QA Teardown - Do Not Process');
    
    const confirmCancelBtn = page.locator('button:has-text("Confirm Cancellation")');
    await confirmCancelBtn.click();

    // Verify it cancelled successfully (toast appears or button disappears)
    await expect(page.locator('text=Order cancelled successfully')).toBeVisible();
  });
});
