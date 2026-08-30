import { test, expect } from '@playwright/test';

test.describe('Domain 1: Authentication & Role-Based Access Controls', () => {

  test('Positive: Login page renders with all interactive elements', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('Negative: Invalid login credentials display appropriate error', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    
    await emailInput.fill('nonexistent-user-qa@hamperly.test');
    await passwordInput.fill('WrongPassword123!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Verify error notification or toast appears
    await expect(page.locator('body')).toContainText(/invalid|failed|not found|error/i, { timeout: 7000 });
  });

  test('Route Guard: Unauthenticated visit to /admin redirects to /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Route Guard: Unauthenticated visit to /account/orders redirects to /login', async ({ page }) => {
    await page.goto('/account/orders');
    await expect(page).toHaveURL(/.*\/login.*/, { timeout: 15000 });
  });

});
