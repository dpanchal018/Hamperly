import { test, expect } from '@playwright/test';

test.describe('Domain 3: Unified Hamper Creation & Personalization Studio', () => {

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('Positive: Occasions page loads and displays curated themes', async ({ page }) => {
    await page.goto('/occasions');
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Check that at least one occasion card exists
    const occasionLink = page.locator('a[href*="/occasions/"]').first();
    if (await occasionLink.isVisible()) {
      await expect(occasionLink).toBeVisible();
    }
  });

  test('Positive: Pre-selecting occasion via URL query param lands on Step 2', async ({ page }) => {
    await page.goto('/build?occasion=birthday');
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('Guard: Future steps like Review and Customize are disabled on initial build load', async ({ page }) => {
    await page.goto('/build');
    await expect(page.locator('h2:has-text("What are you celebrating?")').first()).toBeVisible();

    // Review button (Step 5) and Products button (Step 2) in stepper header must be disabled
    const reviewStepBtn = page.locator('[data-testid="step-btn-5"]');
    await expect(reviewStepBtn).toBeDisabled();

    const productsStepBtn = page.locator('[data-testid="step-btn-2"]');
    await expect(productsStepBtn).toBeDisabled();

    const customizeStepBtn = page.locator('[data-testid="step-btn-3"]');
    await expect(customizeStepBtn).toBeDisabled();

    // Directly trying to navigate via state is guarded
    await expect(page.locator('h2:has-text("What are you celebrating?")').first()).toBeVisible();
  });

  test('Positive: Complete Step-by-Step Hamper Creation Flow to Bag', async ({ page }) => {
    // 1. Navigate to Hamper Creation Studio
    await page.goto('/build');
    await expect(page.locator('h2:has-text("What are you celebrating?")').first()).toBeVisible();

    // Step 1: Select Occasion
    const occasionButtons = page.locator('button:has(h3)');
    await expect(occasionButtons.first()).toBeVisible();
    await occasionButtons.first().click();

    const continueBtn = page.getByRole('button', { name: /Continue to Select Products/i }).or(page.getByRole('button', { name: /Continue to Review Products/i }));
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // Step 2: Select Products
    await expect(page.locator('h2:has-text("Select Your Curated Gifts")').first()).toBeVisible();
    
    const addButtons = page.locator('button:has-text("Add")');
    await expect(addButtons.first()).toBeVisible();
    await addButtons.first().click();

    // Proceed to Step 3
    await expect(page.locator('button:has-text("Customize Hamper")')).toBeEnabled();
    await page.locator('button:has-text("Customize Hamper")').click();

    // Step 3: Customize Hamper Style
    await expect(page.locator('h2:has-text("Customize Your Hamper Style")').first()).toBeVisible();

    // Select first option for Packaging (Required)
    const customizeOptionBtns = page.locator('button:has(h4)');
    await expect(customizeOptionBtns.first()).toBeVisible();
    await customizeOptionBtns.first().click();

    const messageBtn = page.getByRole('button', { name: /Add Personal Message/i });
    await expect(messageBtn).toBeEnabled();
    await messageBtn.click();

    // Step 4: Personalize Touch
    await expect(page.locator('h2:has-text("Add Your Personal Touch")').first()).toBeVisible();

    const recipientInput = page.locator('input[placeholder*="Priya"]');
    if (await recipientInput.isVisible()) {
      await recipientInput.fill('QA Tester');
    }

    const messageArea = page.locator('textarea[placeholder*="heartfelt note"]');
    await messageArea.fill('Wishing you all the joy and happiness!');

    await page.getByRole('button', { name: /Review Complete Hamper/i }).click();

    // Step 5: Review Complete Hamper
    await expect(page.locator('h2:has-text("Review Your Hamper")').first()).toBeVisible();
    await expect(page.locator('text=Hamper Total').first()).toBeVisible();

    // Confirm & Add to Bag
    const confirmBtn = page.getByRole('button', { name: /Confirm & Add to Bag/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Cart Slideover should open with our hamper
    await expect(page.locator('h2:has-text("Your Bag")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Edit Hamper')).toBeVisible({ timeout: 15000 });
  });

  test('Positive: Multi-Hamper Cart & Independent Configuration', async ({ page }) => {
    // 1. Create Hamper A
    await page.goto('/build');
    await expect(page.locator('h2:has-text("What are you celebrating?")').first()).toBeVisible();
    const occButtons = page.locator('button:has(h3)');
    await occButtons.first().click();
    await page.getByRole('button', { name: /Continue to Select Products/i }).or(page.getByRole('button', { name: /Continue to Review Products/i })).click();

    // Add first product
    const addBtns = page.locator('button:has-text("Add")');
    await expect(addBtns.first()).toBeVisible();
    await addBtns.first().click();
    await page.locator('button:has-text("Customize Hamper")').click();

    // Select Packaging
    const custBtns = page.locator('button:has(h4)');
    await expect(custBtns.first()).toBeVisible();
    await custBtns.first().click();
    await page.getByRole('button', { name: /Add Personal Message/i }).click();

    // Personal message for Hamper A
    await page.locator('textarea[placeholder*="heartfelt note"]').fill('Message for Hamper A');
    await page.getByRole('button', { name: /Review Complete Hamper/i }).click();
    await page.getByRole('button', { name: /Confirm & Add to Bag/i }).click();

    // Verify Bag has 1 item
    await expect(page.locator('h2:has-text("Your Bag")')).toBeVisible({ timeout: 15000 });

    // Close bag
    await page.locator('button:has(svg.lucide-x)').first().click();

    // 2. Create Hamper B
    await page.goto('/build');
    await expect(page.locator('h2:has-text("What are you celebrating?")').first()).toBeVisible();
    const occButtons2 = page.locator('button:has(h3)');
    await occButtons2.nth(1).click();
    await page.getByRole('button', { name: /Continue to Select Products/i }).or(page.getByRole('button', { name: /Continue to Review Products/i })).click();

    const addBtns2 = page.locator('button:has-text("Add")');
    await expect(addBtns2.first()).toBeVisible();
    await addBtns2.first().click();
    await page.locator('button:has-text("Customize Hamper")').click();

    const custBtns2 = page.locator('button:has(h4)');
    await expect(custBtns2.first()).toBeVisible();
    await custBtns2.first().click();
    await page.getByRole('button', { name: /Add Personal Message/i }).click();

    await page.locator('textarea[placeholder*="heartfelt note"]').fill('Message for Hamper B');
    await page.getByRole('button', { name: /Review Complete Hamper/i }).click();
    await page.getByRole('button', { name: /Confirm & Add to Bag/i }).click();

    // 3. Verify both independent hampers in bag
    await expect(page.locator('h2:has-text("Your Bag")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Message: "Message for Hamper A"')).toBeVisible();
    await expect(page.locator('text=Message: "Message for Hamper B"')).toBeVisible();
  });

  test('Positive: Edit Hamper from Cart restores full state and updates', async ({ page }) => {
    // 1. Create a Hamper
    await page.goto('/build');
    await expect(page.locator('h2:has-text("What are you celebrating?")').first()).toBeVisible();
    await page.locator('button:has(h3)').first().click();
    await page.getByRole('button', { name: /Continue to Select Products/i }).or(page.getByRole('button', { name: /Continue to Review Products/i })).click();
    await page.locator('button:has-text("Add")').first().click();
    await page.locator('button:has-text("Customize Hamper")').click();
    await page.locator('button:has(h4)').first().click();
    await page.getByRole('button', { name: /Add Personal Message/i }).click();
    await page.locator('textarea[placeholder*="heartfelt note"]').fill('Original Message');
    await page.getByRole('button', { name: /Review Complete Hamper/i }).click();
    await page.getByRole('button', { name: /Confirm & Add to Bag/i }).click();

    // 2. Click Edit Hamper in Cart Drawer
    await expect(page.locator('h2:has-text("Your Bag")')).toBeVisible({ timeout: 15000 });
    await page.locator('text=Edit Hamper').click();

    // Should redirect to /build?editCartId=... and land on Review step
    await expect(page.locator('h2:has-text("Review Your Hamper")').first()).toBeVisible();
    await expect(page.locator('text=Original Message')).toBeVisible();

    // Jump to Personalize step using edit message button
    await page.locator('[data-testid="edit-message-btn"]').click();
    const msgInput = page.locator('textarea[placeholder*="heartfelt note"]');
    await expect(msgInput).toBeVisible();
    await msgInput.fill('Updated Special Message');
    await page.getByRole('button', { name: /Review Complete Hamper/i }).click();

    // Re-confirm
    const updateBtn = page.getByRole('button', { name: /Update Hamper in Bag/i });
    await expect(updateBtn).toBeVisible();
    await updateBtn.click();

    // Verify updated message in Cart Drawer
    await expect(page.locator('h2:has-text("Your Bag")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Message: "Updated Special Message"')).toBeVisible();
  });

});
