import { test, expect } from '@playwright/test';

test.describe('Domain 7: Admin Order Lifecycle, Payments & Inventory Fulfillment', () => {

  test('Security: Unauthenticated access to admin purchases is strictly guarded', async ({ page }) => {
    await page.goto('/admin/customers-purchases');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Security: Unauthenticated access to admin customizations is strictly guarded', async ({ page }) => {
    await page.goto('/admin/customizations');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Positive: Admin login page renders clean authentication interface', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=/admin portal/i')).toBeVisible();
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible();
  });

});
