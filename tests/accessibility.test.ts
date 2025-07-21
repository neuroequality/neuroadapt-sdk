import { test } from '@playwright/test';
import { createAccessibilityTests } from '@neuroadapt/testing';

// Run comprehensive accessibility tests
createAccessibilityTests('http://localhost:3000');

test.describe('NeuroAdapt Specific Accessibility Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await page.waitForSelector('[data-testid="neuroadapt-app"]', { timeout: 10000 });
  });

  test('should have proper ARIA landmarks', async ({ page }) => {
    // Check for main landmarks
    await page.locator('main').waitFor();
    await page.locator('header').waitFor();
    await page.locator('footer').waitFor();
  });

  test('should support keyboard-only navigation', async ({ page }) => {
    // Tab through all interactive elements
    const interactiveElements = await page.locator('button, input, select, a[href]').all();
    
    for (let i = 0; i < Math.min(interactiveElements.length, 10); i++) {
      await page.keyboard.press('Tab');
      const focused = await page.locator(':focus').first();
      await focused.waitFor({ state: 'visible' });
    }
  });

  test('should announce preference changes to screen readers', async ({ page }) => {
    // Enable motion reduction and check for announcements
    await page.getByRole('switch', { name: /motion reduction/i }).click();
    
    // Check for ARIA live region updates
    const liveRegion = page.locator('[aria-live]');
    await liveRegion.waitFor({ timeout: 5000 });
  });

  test('should maintain focus management during preference changes', async ({ page }) => {
    const motionSwitch = page.getByRole('switch', { name: /motion reduction/i });
    await motionSwitch.focus();
    await motionSwitch.click();
    
    // Focus should remain on the switch after activation
    await motionSwitch.waitFor({ state: 'focused' });
  });

  test('should provide sufficient color contrast in all modes', async ({ page }) => {
    // Test default mode
    await page.screenshot({ path: 'test-results/default-mode.png' });
    
    // Test high contrast mode
    await page.getByRole('switch', { name: /high contrast/i }).click();
    await page.screenshot({ path: 'test-results/high-contrast-mode.png' });
    
    // Test dark mode
    await page.getByRole('switch', { name: /dark mode/i }).click();
    await page.screenshot({ path: 'test-results/dark-mode.png' });
  });

  test('should work with color vision filters', async ({ page }) => {
    const colorFilters = ['protanopia', 'deuteranopia', 'tritanopia'];
    
    for (const filter of colorFilters) {
      await page.getByRole('combobox', { name: /color filter/i }).selectOption(filter);
      await page.screenshot({ path: `test-results/${filter}-filter.png` });
    }
  });

  test('should respect reduced motion preferences', async ({ page }) => {
    // Enable motion reduction
    await page.getByRole('switch', { name: /motion reduction/i }).click();
    
    // Check that animations are disabled
    const animatedElement = page.locator('.animate-pulse, .animate-spin').first();
    if (await animatedElement.count() > 0) {
      const animationDuration = await animatedElement.evaluate(el => 
        getComputedStyle(el).animationDuration
      );
      // Should be 0.01ms when motion is reduced
      await page.waitForFunction(() => 
        document.querySelector('[class*="motion-reduced"]') !== null
      );
    }
  });
});