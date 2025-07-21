import { test, expect, Page, BrowserContext } from '@playwright/test';
import type { WCAGValidationResult } from '../accessibility/wcag-validator.js';

export interface NeuroAdaptTestOptions {
  visualPreferences?: {
    highContrast?: boolean;
    fontScale?: number;
    colorBlindMode?: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  };
  motionPreferences?: {
    reduceMotion?: boolean;
    animationSpeed?: number;
  };
  cognitivePreferences?: {
    complexity?: 'low' | 'medium' | 'high';
    chunking?: boolean;
    breaks?: boolean;
  };
  testScreenReader?: boolean;
  testKeyboardOnly?: boolean;
  testMobile?: boolean;
}

export class NeuroAdaptTestRunner {
  private page: Page;
  private context: BrowserContext;

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
  }

  async setupAccessibilityPreferences(options: NeuroAdaptTestOptions): Promise<void> {
    // Set up visual preferences
    if (options.visualPreferences) {
      const { highContrast, fontScale, colorBlindMode } = options.visualPreferences;
      
      if (highContrast) {
        await this.page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
        await this.page.addStyleTag({
          content: `
            * { 
              background: white !important; 
              color: black !important; 
              border-color: black !important; 
            }
          `
        });
      }

      if (fontScale && fontScale !== 1) {
        await this.page.addStyleTag({
          content: `html { font-size: ${fontScale * 100}% !important; }`
        });
      }

      if (colorBlindMode !== 'none') {
        await this.simulateColorBlindness(colorBlindMode);
      }
    }

    // Set up motion preferences
    if (options.motionPreferences?.reduceMotion) {
      await this.page.emulateMedia({ reducedMotion: 'reduce' });
      await this.page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        `
      });
    }

    // Set up cognitive preferences in localStorage
    if (options.cognitivePreferences) {
      await this.page.evaluate((prefs) => {
        localStorage.setItem('neuroadapt-cognitive-prefs', JSON.stringify(prefs));
      }, options.cognitivePreferences);
    }
  }

  async testKeyboardNavigation(): Promise<{
    success: boolean;
    focusableElements: number;
    focusTraps: string[];
    tabOrder: string[];
    issues: string[];
  }> {
    const issues: string[] = [];
    const focusTraps: string[] = [];
    const tabOrder: string[] = [];

    // Get all focusable elements
    const focusableElements = await this.page.evaluate(() => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
      ];
      
      return Array.from(document.querySelectorAll(focusableSelectors.join(',')))
        .filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        })
        .map(el => ({
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          textContent: el.textContent?.trim().substring(0, 50),
          tabIndex: el.tabIndex
        }));
    });

    // Test tab navigation through all elements
    await this.page.keyboard.press('Tab');
    
    for (let i = 0; i < focusableElements.length; i++) {
      const focusedElement = await this.page.evaluate(() => {
        const focused = document.activeElement;
        return focused ? {
          tagName: focused.tagName,
          id: focused.id,
          className: focused.className,
          textContent: focused.textContent?.trim().substring(0, 50)
        } : null;
      });

      if (focusedElement) {
        tabOrder.push(`${focusedElement.tagName}${focusedElement.id ? '#' + focusedElement.id : ''}`);
        
        // Check if element is visually focused
        const hasVisualFocus = await this.page.evaluate(() => {
          const focused = document.activeElement;
          if (!focused) return false;
          
          const style = window.getComputedStyle(focused);
          return style.outline !== 'none' && style.outline !== '0px' ||
                 style.boxShadow.includes('focus') ||
                 focused.classList.contains('focus-visible');
        });

        if (!hasVisualFocus) {
          issues.push(`Element ${focusedElement.tagName} has no visible focus indicator`);
        }
      }

      // Check for focus traps
      const beforeTabElement = await this.page.evaluate(() => document.activeElement?.tagName);
      await this.page.keyboard.press('Tab');
      const afterTabElement = await this.page.evaluate(() => document.activeElement?.tagName);
      
      if (beforeTabElement === afterTabElement && i < focusableElements.length - 1) {
        focusTraps.push(`Focus trap detected at ${beforeTabElement}`);
      }
    }

    // Test reverse tab navigation
    await this.page.keyboard.press('Shift+Tab');
    const canTabBackward = await this.page.evaluate(() => document.activeElement !== document.body);
    
    if (!canTabBackward) {
      issues.push('Backward tab navigation not working properly');
    }

    return {
      success: issues.length === 0 && focusTraps.length === 0,
      focusableElements: focusableElements.length,
      focusTraps,
      tabOrder,
      issues
    };
  }

  async testScreenReaderCompatibility(): Promise<{
    success: boolean;
    ariaLabels: number;
    landmarks: string[];
    headingStructure: string[];
    liveRegions: string[];
    issues: string[];
  }> {
    const issues: string[] = [];

    // Check ARIA labels and descriptions
    const ariaInfo = await this.page.evaluate(() => {
      const elementsWithAria = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
      const landmarks = Array.from(document.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], header, nav, main, aside, footer'))
        .map(el => el.tagName + (el.getAttribute('role') ? `[${el.getAttribute('role')}]` : ''));
      
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(el => `${el.tagName}: ${el.textContent?.trim().substring(0, 50)}`);
      
      const liveRegions = Array.from(document.querySelectorAll('[aria-live], [role="status"], [role="alert"]'))
        .map(el => el.tagName + `[${el.getAttribute('aria-live') || el.getAttribute('role')}]`);

      return {
        ariaLabels: elementsWithAria.length,
        landmarks,
        headings,
        liveRegions
      };
    });

    // Validate heading structure
    const headingLevels = ariaInfo.headings.map(h => parseInt(h.charAt(1)));
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i-1] > 1) {
        issues.push(`Heading structure skip: H${headingLevels[i-1]} to H${headingLevels[i]}`);
      }
    }

    // Check for essential landmarks
    const hasMain = ariaInfo.landmarks.some(l => l.includes('main') || l.includes('MAIN'));
    const hasNavigation = ariaInfo.landmarks.some(l => l.includes('nav') || l.includes('navigation'));
    
    if (!hasMain) issues.push('Missing main landmark');
    if (!hasNavigation && ariaInfo.landmarks.length > 0) issues.push('Missing navigation landmark');

    // Test live region announcements
    await this.page.evaluate(() => {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.id = 'test-live-region';
      document.body.appendChild(liveRegion);
      
      liveRegion.textContent = 'Test announcement';
    });

    // Wait and check if live region was created
    const liveRegionExists = await this.page.locator('#test-live-region').isVisible();
    if (!liveRegionExists) {
      issues.push('Live region test failed');
    }

    return {
      success: issues.length === 0,
      ariaLabels: ariaInfo.ariaLabels,
      landmarks: ariaInfo.landmarks,
      headingStructure: ariaInfo.headings,
      liveRegions: ariaInfo.liveRegions,
      issues
    };
  }

  async testMotionSensitivity(): Promise<{
    success: boolean;
    animatedElements: number;
    respectsPreferences: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // Check for animated elements
    const animationInfo = await this.page.evaluate(() => {
      const animatedElements = document.querySelectorAll('*');
      let animatedCount = 0;
      let respectsPreferences = true;

      animatedElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const hasAnimation = style.animationName !== 'none' || 
                           style.transitionProperty !== 'none' ||
                           el.classList.contains('animate');
        
        if (hasAnimation) {
          animatedCount++;
          
          // Check if element respects reduced motion preference
          const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
          if (mediaQuery.matches) {
            const duration = parseFloat(style.animationDuration) || parseFloat(style.transitionDuration);
            if (duration > 0.01) { // More than 10ms indicates animation is still active
              respectsPreferences = false;
            }
          }
        }
      });

      return { animatedCount, respectsPreferences };
    });

    if (!animationInfo.respectsPreferences) {
      issues.push('Animations do not respect reduced motion preferences');
    }

    // Test with reduced motion enabled
    await this.page.emulateMedia({ reducedMotion: 'reduce' });
    await this.page.reload();

    const reducedMotionTest = await this.page.evaluate(() => {
      const animatedElements = document.querySelectorAll('*');
      let respectsReduced = true;

      animatedElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const duration = parseFloat(style.animationDuration) || parseFloat(style.transitionDuration);
        
        if (duration > 0.01) {
          respectsReduced = false;
        }
      });

      return respectsReduced;
    });

    if (!reducedMotionTest) {
      issues.push('Reduced motion preference not properly implemented');
    }

    return {
      success: issues.length === 0,
      animatedElements: animationInfo.animatedCount,
      respectsPreferences: animationInfo.respectsPreferences && reducedMotionTest,
      issues
    };
  }

  async testCognitiveLoad(): Promise<{
    success: boolean;
    complexityIndicators: number;
    chunkingSupport: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    const cognitiveInfo = await this.page.evaluate(() => {
      // Check for complexity indicators
      const complexityIndicators = document.querySelectorAll('[data-complexity], .complexity-indicator, [aria-describedby*="complexity"]').length;
      
      // Check for chunking support
      const chunkingElements = document.querySelectorAll('.chunk, [data-chunk], .step, .section');
      const hasChunking = chunkingElements.length > 0;
      
      // Check for progress indicators
      const progressIndicators = document.querySelectorAll('progress, [role="progressbar"], .progress, [data-progress]').length;
      
      // Check for break suggestions
      const breakIndicators = document.querySelectorAll('[data-break], .break-suggestion, .rest-reminder').length;

      return {
        complexityIndicators,
        hasChunking,
        progressIndicators,
        breakIndicators
      };
    });

    // Test form complexity
    const formComplexity = await this.page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      let complexForms = 0;

      forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea').length;
        if (inputs > 5) {
          complexForms++;
          // Check if complex form has chunking
          const hasFieldsets = form.querySelectorAll('fieldset').length > 1;
          const hasSteps = form.querySelector('[data-step], .step, .wizard-step');
          
          if (!hasFieldsets && !hasSteps) {
            return false;
          }
        }
      });

      return { complexForms, total: forms.length };
    });

    if (formComplexity.complexForms > 0) {
      issues.push(`${formComplexity.complexForms} complex forms lack proper chunking`);
    }

    if (cognitiveInfo.complexityIndicators === 0) {
      issues.push('No complexity indicators found for cognitive load management');
    }

    return {
      success: issues.length === 0,
      complexityIndicators: cognitiveInfo.complexityIndicators,
      chunkingSupport: cognitiveInfo.hasChunking,
      issues
    };
  }

  async testVRSafety(): Promise<{
    success: boolean;
    safetyFeatures: string[];
    emergencyControls: number;
    issues: string[];
  }> {
    const issues: string[] = [];
    const safetyFeatures: string[] = [];

    // Check for VR-specific safety features
    const vrSafetyInfo = await this.page.evaluate(() => {
      const features = [];
      
      // Check for panic button
      const panicButton = document.querySelector('[data-panic], .panic-button, #panic-button');
      if (panicButton) features.push('Panic Button');
      
      // Check for safe zone indicators
      const safeZones = document.querySelectorAll('[data-safe-zone], .safe-zone, [data-vr-boundary]');
      if (safeZones.length > 0) features.push('Safe Zones');
      
      // Check for comfort settings
      const comfortSettings = document.querySelector('[data-comfort], .comfort-settings, [data-vr-comfort]');
      if (comfortSettings) features.push('Comfort Settings');
      
      // Check for proximity warnings
      const proximityWarnings = document.querySelector('[data-proximity], .proximity-warning');
      if (proximityWarnings) features.push('Proximity Detection');
      
      // Check for locomotion options
      const locomotionOptions = document.querySelector('[data-locomotion], .locomotion-type');
      if (locomotionOptions) features.push('Locomotion Options');

      const emergencyControls = document.querySelectorAll('.emergency, [data-emergency], .panic, [aria-label*="emergency"]').length;

      return { features, emergencyControls };
    });

    safetyFeatures.push(...vrSafetyInfo.features);

    // Test panic button functionality if present
    const panicButton = this.page.locator('[data-panic], .panic-button, #panic-button').first();
    if (await panicButton.isVisible()) {
      await panicButton.click();
      
      // Check if panic mode was activated
      const panicModeActive = await this.page.evaluate(() => {
        return document.body.classList.contains('panic-mode') ||
               document.body.classList.contains('emergency-mode') ||
               document.querySelector('[data-panic-active]');
      });

      if (!panicModeActive) {
        issues.push('Panic button does not activate emergency mode');
      }
    } else if (this.page.url().includes('vr')) {
      issues.push('VR application missing panic button');
    }

    // Check for WebXR support indication
    const vrSupport = await this.page.evaluate(() => {
      return 'xr' in navigator || document.querySelector('[data-vr-status], .vr-status');
    });

    if (!vrSupport && this.page.url().includes('vr')) {
      issues.push('VR application does not indicate WebXR support status');
    }

    return {
      success: issues.length === 0,
      safetyFeatures,
      emergencyControls: vrSafetyInfo.emergencyControls,
      issues
    };
  }

  async runFullAccessibilityTest(options: NeuroAdaptTestOptions = {}): Promise<{
    overall: 'pass' | 'partial' | 'fail';
    keyboardNavigation: any;
    screenReader: any;
    motionSensitivity: any;
    cognitiveLoad: any;
    vrSafety?: any;
    summary: string;
  }> {
    await this.setupAccessibilityPreferences(options);

    const [keyboard, screenReader, motion, cognitive] = await Promise.all([
      this.testKeyboardNavigation(),
      this.testScreenReaderCompatibility(),
      this.testMotionSensitivity(),
      this.testCognitiveLoad()
    ]);

    // Test VR safety if it's a VR application
    let vrSafety;
    if (this.page.url().includes('vr') || await this.page.locator('[data-vr], .vr-app').count() > 0) {
      vrSafety = await this.testVRSafety();
    }

    const allTests = [keyboard, screenReader, motion, cognitive, vrSafety].filter(Boolean);
    const passedTests = allTests.filter(test => test.success).length;
    const totalTests = allTests.length;

    let overall: 'pass' | 'partial' | 'fail' = 'pass';
    if (passedTests === 0) {
      overall = 'fail';
    } else if (passedTests < totalTests) {
      overall = 'partial';
    }

    const summary = `Accessibility Test Results: ${passedTests}/${totalTests} tests passed. ` +
                   `Overall status: ${overall.toUpperCase()}`;

    return {
      overall,
      keyboardNavigation: keyboard,
      screenReader,
      motionSensitivity: motion,
      cognitiveLoad: cognitive,
      vrSafety,
      summary
    };
  }

  private async simulateColorBlindness(type: 'deuteranopia' | 'protanopia' | 'tritanopia'): Promise<void> {
    const filters = {
      deuteranopia: 'url("data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGZpbHRlciBpZD0iZGV1dGVyYW5vcGlhIj48ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMC42MjUgMC4zNzUgMCAwIDAgMC43IDAgMC4zIDAgMCAwIDAgMSAwIDAgMCAwIDAgMSAwIi8+PC9maWx0ZXI+PC9kZWZzPjwvc3ZnPiNkZXV0ZXJhbm9waWEi")',
      protanopia: 'url("data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGZpbHRlciBpZD0icHJvdGFub3BpYSI+PGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAuNTY3IDAgMC40MzMgMCAwIDAuNTU4IDAgMC40NDIgMCAwIDAgMC4yNDIgMC43NTggMCAwIDAgMCAwIDEgMCIvPjwvZmlsdGVyPjwvZGVmcz48L3N2Zz4jcHJvdGFub3BpYSI=)',
      tritanopia: 'url("data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGZpbHRlciBpZD0idHJpdGFub3BpYSI+PGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAuOTUgMC4wNSAwIDAgMCAwIDEgMCAwIDAgMCAwLjQzMyAwLjU2NyAwIDAgMCAwIDAgMSAwIi8+PC9maWx0ZXI+PC9kZWZzPjwvc3ZnPiN0cml0YW5vcGlhIg==")'
    };

    await this.page.addStyleTag({
      content: `body { filter: ${filters[type]}; }`
    });
  }
}

// Helper functions for setting up tests
export function createNeuroAdaptTest(
  testName: string,
  testFn: (testRunner: NeuroAdaptTestRunner) => Promise<void>,
  options: NeuroAdaptTestOptions = {}
) {
  return test(testName, async ({ page, context }) => {
    const testRunner = new NeuroAdaptTestRunner(page, context);
    await testRunner.setupAccessibilityPreferences(options);
    await testFn(testRunner);
  });
}

export function createAccessibilityTestSuite(
  suiteName: string,
  baseUrl: string,
  testScenarios: Array<{
    name: string;
    path: string;
    options?: NeuroAdaptTestOptions;
    customTests?: (runner: NeuroAdaptTestRunner) => Promise<void>;
  }>
) {
  test.describe(suiteName, () => {
    testScenarios.forEach(scenario => {
      createNeuroAdaptTest(
        scenario.name,
        async (testRunner) => {
          await testRunner.page.goto(`${baseUrl}${scenario.path}`);
          
          const results = await testRunner.runFullAccessibilityTest(scenario.options);
          
          expect(results.overall).not.toBe('fail');
          expect(results.keyboardNavigation.success).toBe(true);
          expect(results.screenReader.success).toBe(true);
          expect(results.motionSensitivity.success).toBe(true);
          
          if (scenario.customTests) {
            await scenario.customTests(testRunner);
          }
        },
        scenario.options
      );
    });
  });
} 