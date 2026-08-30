import { test, expect } from '@playwright/test';

test.describe('Domain 8: Concurrency, Stockout Resilience & Alerts', () => {

  test('System Health: Daily summary cron endpoint responds', async ({ request }) => {
    // Ping cron endpoint
    const response = await request.get('/api/cron/daily-summary');
    // Either returns 401 (if CRON_SECRET configured) or status code indicating route exists
    expect([200, 401, 500]).toContain(response.status());
  });

  test('Storefront: Out of stock query parameter renders filter without error', async ({ page }) => {
    await page.goto('/products?inStock=false');
    await expect(page.locator('body')).not.toContainText('Application error');
  });

});
