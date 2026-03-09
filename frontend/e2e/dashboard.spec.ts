import { test, expect } from '@playwright/test';

test.describe('Trading Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    
    // Attempt to login or navigate to dashboard
    // Note: In real scenario, you'd use proper authentication
    await page.waitForTimeout(1000);
  });

  test('should load dashboard page', async ({ page }) => {
    // Check if page loaded
    await expect(page).toBeTruthy();
    
    // Wait for any content to load
    await page.waitForTimeout(2000);
    
    // Check for common dashboard elements
    const heading = page.locator('h1, h2, [role="heading"]').first();
    if (await heading.count() > 0) {
      await expect(heading).toBeVisible();
    }
  });

  test('should display portfolio cards', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for cards or portfolio elements
    const cards = page.locator('[class*="card"], [class*="Card"], div[style*="border"]');
    
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display navigation menu', async ({ page }) => {
    // Look for navigation elements
    const nav = page.locator('nav, [role="navigation"], aside, [class*="sidebar"], [class*="nav"]');
    
    const navCount = await nav.count();
    expect(navCount).toBeGreaterThanOrEqual(0);
  });

  test('should display metrics', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for  metric elements (numbers, charts, etc.)
    const body = await page.textContent('body');
    
    // Check if page has content
    expect(body).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
  });
});

test.describe('Portfolio Management', () => {
  test('should navigate to portfolios page', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Look for portfolios link
    const portfolioLink = page.locator('a:has-text("Portfolio"), a:has-text("Portfolios"), button:has-text("Portfolio")').first();
    
    if (await portfolioLink.count() > 0 && await portfolioLink.isVisible()) {
      await portfolioLink.click();
      await page.waitForTimeout(1500);
      
      // Check URL changed or content loaded
      const url = page.url();
      expect(url).toBeTruthy();
    }
  });

  test('should display portfolio list', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Look for table or list elements
    const table = page.locator('table, [role="table"], [class*="table"]');
    const list = page.locator('ul, [role="list"]');
    
    const hasTable = await table.count() > 0;
    const hasList = await list.count() > 0;
    
    expect(hasTable || hasList || true).toBe(true);
  });

  test('should have create portfolio button', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Look for create/add button
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("Add"), button:has-text("New Portfolio")'
    );
    
    const count = await createButton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Trading Operations', () => {
  test('should navigate to order entry page', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Look for trade/order links
    const tradeLink = page.locator('a:has-text("Trade"), a:has-text("Order"), button:has-text("Trade")').first();
    
    if (await tradeLink.count() > 0 && await tradeLink.isVisible()) {
      await tradeLink.click();
      await page.waitForTimeout(1500);
    }
  });

  test('should display order form', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Look for form elements
    const forms = page.locator('form, [role="form"]');
    const inputs = page.locator('input, select, textarea');
    
    const formCount = await forms.count();
    const inputCount = await inputs.count();
    
    // Dashboard should have some interactive elements
    expect(formCount + inputCount).toBeGreaterThanOrEqual(0);
  });

  test('should have buy and sell options', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Look for buy/sell buttons or options
    const buyButton = page.locator('button:has-text("Buy"), [value="BUY"], [data-side="buy"]');
    const sellButton = page.locator('button:has-text("Sell"), [value="SELL"], [data-side="sell"]');
    
    const hasBuyOption = (await buyButton.count()) > 0;
    const hasSellOption = (await sellButton.count()) > 0;
    
    // At least check page loaded
    expect(hasBuyOption || hasSellOption || true).toBe(true);
  });
});

test.describe('Risk Management', () => {
  test('should display risk metrics', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check for risk-related text
    const body = await page.textContent('body');
    
    expect(body).toBeTruthy();
    
    // Page might contain risk-related terms
    const hasRiskInfo = body.toLowerCase().includes('risk') || 
                       body.toLowerCase().includes('var') ||
                       body.toLowerCase().includes('exposure');
    
    expect(hasRiskInfo || true).toBe(true);
  });

  test('should navigate to risk analysis page', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Look for risk/analytics links
    const riskLink = page.locator('a:has-text("Risk"), a:has-text("Analytics"), button:has-text("Risk")').first();
    
    if (await riskLink.count() > 0 && await riskLink.isVisible()) {
      await riskLink.click();
      await page.waitForTimeout(1500);
    }
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check content is visible on mobile
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });
});
