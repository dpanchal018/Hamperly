import { test, expect, Page } from '@playwright/test';

// ─── Shared error collector ────────────────────────────────────────────────
const criticalErrors: string[] = [];

function attachErrorListeners(page: Page) {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore browser-level noise that isn't our bug
      if (!text.includes('favicon') && !text.includes('net::ERR') && !text.includes('NEXT_REDIRECT')) {
        criticalErrors.push(`[Console Error] ${page.url()}: ${text}`);
      }
    }
  });
  page.on('response', response => {
    if (response.status() >= 500) {
      criticalErrors.push(`[HTTP 5xx] ${response.status()} on ${response.url()}`);
    }
  });
}

// ─── Helper: visit a page and assert it renders ────────────────────────────
async function visitAndCheck(page: Page, path: string, label: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 20000 });
  // Confirm page body is visible and we're not on an error page
  await expect(page.locator('body')).toBeVisible();
  const hasError = await page.locator('text=Application error').isVisible();
  if (hasError) criticalErrors.push(`[Render Error] ${label} (${path}) showed an Application Error`);
}

test.describe('Live Production Spider & Lifecycle Test', () => {

  // ── Test 1: Full public site spider ───────────────────────────────────────
  test('Should spider all static public pages and detect no critical errors', async ({ page }) => {
    attachErrorListeners(page);

    // 1. Static pages
    const staticRoutes = [
      { path: '/',                             label: 'Homepage' },
      { path: '/hampers',                      label: 'Hampers Listing' },
      { path: '/products',                     label: 'Products Listing' },
      { path: '/occasions',                    label: 'Occasions Listing' },
      { path: '/build',                        label: 'Build Your Hamper' },
      { path: '/custom-hamper',                label: 'Custom Hamper Info' },
      { path: '/personalize',                  label: 'Personalize' },
      { path: '/about',                        label: 'About Page' },
      { path: '/policies/cancellation-return', label: 'Cancellation Policy' },
      { path: '/login',                        label: 'Login Page' },
      { path: '/signup',                       label: 'Signup Page' },
    ];

    for (const route of staticRoutes) {
      await visitAndCheck(page, route.path, route.label);
    }

    // 2. Dynamic: crawl first hamper detail page from listing
    await page.goto('/hampers', { waitUntil: 'domcontentloaded', timeout: 20000 });
    const firstHamperLink = page.locator('a[href^="/hampers/"]').first();
    const hamperHref = await firstHamperLink.getAttribute('href');
    if (hamperHref) {
      await visitAndCheck(page, hamperHref, 'Hamper Detail Page');
    }

    // 3. Dynamic: crawl first product detail page from listing
    await page.goto('/products', { waitUntil: 'domcontentloaded', timeout: 20000 });
    const firstProductLink = page.locator('a[href^="/products/"]').first();
    const productHref = await firstProductLink.getAttribute('href');
    if (productHref) {
      await visitAndCheck(page, productHref, 'Product Detail Page');
    }

    // 4. Dynamic: crawl first occasion detail page from listing
    await page.goto('/occasions', { waitUntil: 'domcontentloaded', timeout: 20000 });
    const firstOccasionLink = page.locator('a[href^="/occasions/"]').first();
    const occasionHref = await firstOccasionLink.getAttribute('href');
    if (occasionHref) {
      await visitAndCheck(page, occasionHref, 'Occasion Detail Page');
    }

    // 5. Fail test if any critical errors were caught across all pages
    expect(criticalErrors, `Critical errors detected:\n${criticalErrors.join('\n')}`).toHaveLength(0);
  });

  // ── Test 2: Authenticated account pages ───────────────────────────────────
  test('Should render all authenticated account pages without errors', async ({ page }) => {
    attachErrorListeners(page);

    // Log in
    await page.goto('/login');
    await page.fill('input[name="email"]', 'qa-crawler@hamperly.com');
    await page.fill('input[name="password"]', 'HamperlyQA123!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(url => url.pathname === '/', { timeout: 15000 });

    const authRoutes = [
      { path: '/account/orders',   label: 'My Orders' },
      { path: '/account/profile',  label: 'My Profile' },
      { path: '/account/wishlist', label: 'My Wishlist' },
      { path: '/account/invoices', label: 'My Invoices' },
    ];

    for (const route of authRoutes) {
      await visitAndCheck(page, route.path, route.label);
    }

    expect(criticalErrors, `Critical errors detected:\n${criticalErrors.join('\n')}`).toHaveLength(0);
  });

  // ── Test 3: Full Checkout Lifecycle & Automatic Teardown ──────────────────
  test('Full Checkout Lifecycle & Automatic Teardown', async ({ page }) => {
    // 1. Log in as the QA Bot
    await page.goto('/login');
    await page.fill('input[name="email"]', 'qa-crawler@hamperly.com');
    await page.fill('input[name="password"]', 'HamperlyQA123!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(url => url.pathname === '/', { timeout: 10000 });

    // 2. Go to hampers page and wait for CartProvider to finish loading from cloud
    await page.goto('/hampers');
    await page.waitForTimeout(3000);
    
    const firstHamperBtn = page.locator('button[aria-label="Add to Cart"]').first();
    await firstHamperBtn.waitFor({ state: 'visible' });
    await firstHamperBtn.click();
    
    // Wait for button to confirm item was added (ensures localStorage saved)
    await expect(page.locator('button[aria-label="Added to Cart"]').first()).toBeVisible({ timeout: 10000 });
    
    // 3. Open cart slideover and navigate to checkout (SPA — preserves cart context)
    const navCartBtn = page.locator('button').filter({ has: page.locator('.lucide-shopping-bag') }).first();
    await navCartBtn.click();
    const proceedBtn = page.locator('button:has-text("Proceed to Checkout")');
    await proceedBtn.waitFor({ state: 'visible' });
    await proceedBtn.click();
    
    // 4. Fill Delivery Details
    await page.waitForURL('**/checkout', { timeout: 15000 });

    // Wait for the form to fully render (either pincode input or saved address)
    await expect(async () => {
      const hasDelivery = await page.locator('text=Delivery Details').isVisible();
      const isEmpty = await page.locator('text=Your cart is empty').isVisible();
      expect(hasDelivery || isEmpty).toBeTruthy();
    }).toPass({ timeout: 15000 });

    if (await page.locator('text=Your cart is empty').isVisible()) {
      throw new Error('Cart was empty on checkout page — SPA state loss occurred.');
    }
    
    const pincodeInput = page.locator('#delivery-pincode');
    if (await pincodeInput.isVisible()) {
      await pincodeInput.fill('390001');
      await expect(page.locator('#delivery-address')).toBeEnabled({ timeout: 10000 });
      await page.locator('#delivery-address').fill('123 Automated Testing St');
    }

    // 5. Confirm Order
    const confirmBtn = page.locator('button:has-text("Confirm Order")');
    await confirmBtn.waitFor({ state: 'visible' });
    await confirmBtn.click();

    // 6. Verify Success Page
    await page.waitForURL('**/checkout/success/**', { timeout: 30000 });
    await expect(page.locator('text=Order Confirmed')).toBeVisible({ timeout: 10000 });
    
    // 7. Teardown: Navigate to My Orders and Cancel the test order
    await page.goto('/account/orders', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    const cancelBtn = page.locator('button:has-text("Cancel Order")').first();
    await cancelBtn.waitFor({ state: 'visible', timeout: 15000 });
    await cancelBtn.click();

    const otherReasonBtn = page.locator('button:has-text("Other")');
    await otherReasonBtn.waitFor({ state: 'visible', timeout: 15000 });
    await otherReasonBtn.click();
    
    const cancelTextarea = page.locator('textarea[placeholder="Please tell us why..."]');
    await cancelTextarea.waitFor({ state: 'visible', timeout: 10000 });
    await cancelTextarea.fill('Automated QA Teardown - Do Not Process');
    
    const confirmCancelBtn = page.locator('button:has-text("Confirm Cancellation")');
    await confirmCancelBtn.click();

    // Verify: dialog closes = success
    await expect(page.locator('button:has-text("Confirm Cancellation")')).not.toBeVisible({ timeout: 15000 });
  });
});
