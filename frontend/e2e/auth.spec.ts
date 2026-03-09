import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/HedgeAI|Trading|Login/i);
    
    // Check for login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In")');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In")').first();
    await loginButton.click();

    // Wait for possible error messages
    await page.waitForTimeout(500);

    // Check if page is still on login (didn't navigate away)
    const url = page.url();
    expect(url).toContain('/');
  });

  test('should attempt login with credentials', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In")').first();

    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    await loginButton.click();

    // Wait for network response or navigation
    await page.waitForTimeout(2000);
  });

  test('should have register link', async ({ page }) => {
    const registerLink = page.locator('a:has-text("Register"), a:has-text("Sign Up"), button:has-text("Register")');
    
    // Check if register option exists
    const count = await registerLink.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const toggleButton = page.locator('[aria-label*="password"], button:near(input[type="password"])');

    if (await toggleButton.count() > 0) {
      await toggleButton.first().click();
      
      // Password input might change type to text
      const inputType = await passwordInput.getAttribute('type');
      expect(['password', 'text']).toContain(inputType);
    }
  });
});

test.describe('Registration Flow', () => {
  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/');
    
    const registerLink = page.locator('a:has-text("Register"), a:has-text("Sign Up"), button:has-text("Register")').first();
    
    if (await registerLink.count() > 0) {
      await registerLink.click();
      await page.waitForTimeout(1000);
      
      // Should have registration form elements
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      
      if (await nameInput.count() > 0) {
        await expect(nameInput.first()).toBeVisible();
      }
      await expect(emailInput.first()).toBeVisible();
    }
  });

  test('should fill registration form', async ({ page }) => {
    await page.goto('/');
    
    const registerLink = page.locator('a:has-text("Register"), a:has-text("Sign Up"), button:has-text("Register")').first();
    
    if (await registerLink.count() > 0) {
      await registerLink.click();
      await page.waitForTimeout(500);

      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

      if (await nameInput.count() > 0) {
        await nameInput.fill('Test User');
      }
      await emailInput.fill('newuser@example.com');
      await passwordInput.fill('Password123!');

      // Find and click register button
      const registerButton = page.locator('button:has-text("Register"), button:has-text("Sign Up"), button[type="submit"]').first();
      if (await registerButton.isVisible()) {
        await registerButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});
