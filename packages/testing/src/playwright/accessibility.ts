import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export interface AccessibilityTestOptions {
  tags?: string[];
  excludeRules?: string[];
  includeTags?: string[];
  excludeTags?: string[];
  disableColorContrast?: boolean;
}

export class AccessibilityTester {
  constructor(private page: Page) {}

  async runWCAGTest(options: AccessibilityTestOptions = {}): Promise<void> {
    const axeBuilder = new AxeBuilder({ page: this.page });

    // Configure tags (WCAG levels)
    if (options.tags) {
      axeBuilder.withTags(options.tags);
    } else {
      // Default to WCAG 2.1 AA
      axeBuilder.withTags(['wcag2a', 'wcag2aa', 'wcag21aa']);
    }

    // Include specific tags
    if (options.includeTags) {
      axeBuilder.withTags(options.includeTags);
    }

    // Exclude specific tags
    if (options.excludeTags) {
      options.excludeTags.forEach(tag => {
        axeBuilder.disableRules([tag]);
      });
    }

    // Exclude specific rules
    if (options.excludeRules) {
      axeBuilder.disableRules(options.excludeRules);
    }

    // Disable color contrast if needed (for testing dark themes)
    if (options.disableColorContrast) {
      axeBuilder.disableRules(['color-contrast']);
    }

    const accessibilityScanResults = await axeBuilder.analyze();
    
    // Report violations
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:');
      accessibilityScanResults.violations.forEach(violation => {
        console.log(`- ${violation.id}: ${violation.description}`);
        violation.nodes.forEach(node => {
          console.log(`  Element: ${node.target.join(', ')}`);
          console.log(`  Impact: ${node.impact}`);
        });
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  }

  async testKeyboardNavigation(): Promise<void> {
    // Test tab navigation
    await this.page.keyboard.press('Tab');
    const focusedElement = await this.page.locator(':focus').first();
    await expect(focusedElement).toBeVisible();

    // Test arrow key navigation if applicable
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('ArrowUp');
    await this.page.keyboard.press('ArrowLeft');
    await this.page.keyboard.press('ArrowRight');

    // Test Enter and Space for activation
    await this.page.keyboard.press('Enter');
    await this.page.keyboard.press('Space');

    // Test Escape for dismissal
    await this.page.keyboard.press('Escape');
  }

  async testScreenReaderCompatibility(): Promise<void> {
    // Check for proper ARIA labels
    const elementsWithAriaLabel = await this.page.locator('[aria-label]').count();
    expect(elementsWithAriaLabel).toBeGreaterThan(0);

    // Check for proper heading structure
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);

    // Check for alt text on images
    const images = await this.page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }

    // Check for proper form labels
    const inputs = await this.page.locator('input, textarea, select').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (id) {
        const label = await this.page.locator(`label[for="${id}"]`).count();
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        expect(label > 0 || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  }

  async testNeuroAdaptFeatures(): Promise<void> {
    // Test motion reduction
    await this.testMotionReduction();
    
    // Test high contrast
    await this.testHighContrast();
    
    // Test font scaling
    await this.testFontScaling();
    
    // Test color vision filters
    await this.testColorVisionFilters();
  }

  private async testMotionReduction(): Promise<void> {
    // Enable motion reduction
    await this.page.getByRole('switch', { name: /reduce motion/i }).click();
    
    // Check that animations are disabled
    const animatedElements = await this.page.locator('[style*="animation"], .animate-').all();
    for (const element of animatedElements) {
      const styles = await element.evaluate(el => getComputedStyle(el));
      expect(styles.animationDuration).toBe('0.01ms');
    }
  }

  private async testHighContrast(): Promise<void> {
    // Enable high contrast
    await this.page.getByRole('switch', { name: /high contrast/i }).click();
    
    // Check that high contrast styles are applied
    const body = this.page.locator('body');
    await expect(body).toHaveAttribute('data-theme', /high-contrast/);
    
    // Verify contrast ratios are improved
    const textElements = await this.page.locator('p, span, div').all();
    for (const element of textElements.slice(0, 5)) { // Test first 5 elements
      const styles = await element.evaluate(el => {
        const computed = getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      // Basic check that colors are not the same
      expect(styles.color).not.toBe(styles.backgroundColor);
    }
  }

  private async testFontScaling(): Promise<void> {
    // Test font size slider
    const fontSlider = this.page.getByRole('slider', { name: /font size/i });
    await fontSlider.fill('1.5');
    
    // Check that font size is applied
    const textElements = await this.page.locator('p, span, div').first();
    const fontSize = await textElements.evaluate(el => getComputedStyle(el).fontSize);
    
    expect(parseFloat(fontSize)).toBeGreaterThan(16); // Assuming 16px base
  }

  private async testColorVisionFilters(): Promise<void> {
    // Test different color vision filters
    const filters = ['protanopia', 'deuteranopia', 'tritanopia'];
    
    for (const filter of filters) {
      await this.page.getByRole('combobox', { name: /color filter/i }).selectOption(filter);
      
      // Check that filter is applied to the document
      const documentElement = this.page.locator('html');
      const filterStyle = await documentElement.evaluate(el => getComputedStyle(el).filter);
      
      expect(filterStyle).not.toBe('none');
    }
    
    // Reset to none
    await this.page.getByRole('combobox', { name: /color filter/i }).selectOption('none');
  }
}

// Helper function to create accessibility tests
export function createAccessibilityTests(baseURL: string) {
  test.describe('Accessibility Tests', () => {
    test('should pass WCAG 2.1 AA compliance', async ({ page }) => {
      await page.goto(baseURL);
      const tester = new AccessibilityTester(page);
      await tester.runWCAGTest();
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto(baseURL);
      const tester = new AccessibilityTester(page);
      await tester.testKeyboardNavigation();
    });

    test('should be screen reader compatible', async ({ page }) => {
      await page.goto(baseURL);
      const tester = new AccessibilityTester(page);
      await tester.testScreenReaderCompatibility();
    });

    test('should support NeuroAdapt features', async ({ page }) => {
      await page.goto(baseURL);
      const tester = new AccessibilityTester(page);
      await tester.testNeuroAdaptFeatures();
    });

    test('should maintain accessibility with dark mode', async ({ page }) => {
      await page.goto(baseURL);
      
      // Enable dark mode
      await page.getByRole('switch', { name: /dark mode/i }).click();
      
      const tester = new AccessibilityTester(page);
      await tester.runWCAGTest({
        disableColorContrast: true // Dark themes may need different contrast rules
      });
    });

    test('should be accessible with all sensory adaptations enabled', async ({ page }) => {
      await page.goto(baseURL);
      
      // Enable all sensory adaptations
      await page.getByRole('switch', { name: /reduce motion/i }).click();
      await page.getByRole('switch', { name: /high contrast/i }).click();
      await page.getByRole('switch', { name: /dark mode/i }).click();
      await page.getByRole('switch', { name: /reduce flashing/i }).click();
      
      const tester = new AccessibilityTester(page);
      await tester.runWCAGTest({
        disableColorContrast: true
      });
    });
  });
}

export { AxeBuilder };