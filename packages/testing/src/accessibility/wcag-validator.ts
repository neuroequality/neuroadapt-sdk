import axeCore from 'axe-core';

export interface WCAGValidationResult {
  level: 'A' | 'AA' | 'AAA';
  violations: WCAGViolation[];
  passes: WCAGPass[];
  incomplete: WCAGIncomplete[];
  summary: WCAGSummary;
}

export interface WCAGViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: WCAGNode[];
  tags: string[];
}

export interface WCAGPass {
  id: string;
  description: string;
  nodes: WCAGNode[];
}

export interface WCAGIncomplete {
  id: string;
  description: string;
  nodes: WCAGNode[];
}

export interface WCAGNode {
  target: string[];
  html: string;
  failureSummary?: string;
  impact?: string;
}

export interface WCAGSummary {
  violations: number;
  passes: number;
  incomplete: number;
  totalElements: number;
  complianceLevel: 'fail' | 'partial' | 'pass';
}

export class WCAGValidator {
  private axeInstance: typeof axeCore;

  constructor() {
    this.axeInstance = axeCore;
    this.configureAxe();
  }

  private configureAxe(): void {
    // Configure axe-core for NeuroAdapt specific rules
    this.axeInstance.configure({
      rules: {
        // Enhanced rules for neurodiversity
        'color-contrast-enhanced': { enabled: true },
        'focus-order-semantics': { enabled: true },
        'motion-sensitivity': { enabled: true },
        'cognitive-load': { enabled: true }
      },
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'neuroadapt'],
      branding: {
        brand: 'NeuroAdapt',
        application: 'NeuroAdapt WCAG Validator'
      }
    });

    // Add custom rules for NeuroAdapt
    this.addNeuroAdaptRules();
  }

  private addNeuroAdaptRules(): void {
    // Custom rule: Motion reduction compliance
    this.axeInstance.configure({
      rules: [{
        id: 'neuroadapt-motion-reduction',
        impact: 'serious',
        tags: ['neuroadapt', 'motion'],
        metadata: {
          description: 'Ensures motion animations respect user preferences',
          help: 'Motion should be reducible or disabled based on user preference'
        },
        selector: '[data-motion], .animate, [style*="animation"], [style*="transition"]',
        evaluate: (node: HTMLElement) => {
          // Check if element respects prefers-reduced-motion
          const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          const hasMotionClass = node.classList.contains('reduce-motion') || 
                                 node.closest('.reduce-motion');
          
          if (hasReducedMotion && !hasMotionClass) {
            this.data({
              messageKey: 'motionNotReduced',
              element: node.tagName.toLowerCase()
            });
            return false;
          }
          return true;
        }
      }]
    });

    // Custom rule: Cognitive load indicators
    this.axeInstance.configure({
      rules: [{
        id: 'neuroadapt-cognitive-load',
        impact: 'moderate',
        tags: ['neuroadapt', 'cognitive'],
        metadata: {
          description: 'Checks for cognitive load management features',
          help: 'Complex interfaces should provide cognitive load indicators'
        },
        selector: 'form, .complex-interface, [data-complexity="high"]',
        evaluate: (node: HTMLElement) => {
          const hasLoadIndicator = node.querySelector('[data-cognitive-load]') ||
                                  node.querySelector('.cognitive-load-indicator');
          
          if (!hasLoadIndicator) {
            this.data({
              messageKey: 'missingCognitiveLoadIndicator',
              element: node.tagName.toLowerCase()
            });
            return false;
          }
          return true;
        }
      }]
    });

    // Custom rule: Sensory adaptation support
    this.axeInstance.configure({
      rules: [{
        id: 'neuroadapt-sensory-adaptation',
        impact: 'serious',
        tags: ['neuroadapt', 'sensory'],
        metadata: {
          description: 'Validates sensory adaptation features',
          help: 'Visual content should support high contrast and color-blind users'
        },
        selector: '.visual-content, [data-visual], canvas, svg',
        evaluate: (node: HTMLElement) => {
          const hasHighContrastSupport = node.classList.contains('high-contrast-ready') ||
                                        node.hasAttribute('data-high-contrast');
          const hasColorBlindSupport = node.classList.contains('colorblind-friendly') ||
                                      node.hasAttribute('data-colorblind-safe');
          
          if (!hasHighContrastSupport || !hasColorBlindSupport) {
            this.data({
              messageKey: 'missingSensoryAdaptation',
              element: node.tagName.toLowerCase(),
              missing: {
                highContrast: !hasHighContrastSupport,
                colorBlind: !hasColorBlindSupport
              }
            });
            return false;
          }
          return true;
        }
      }]
    });
  }

  async validatePage(
    element: HTMLElement = document.body,
    level: 'A' | 'AA' | 'AAA' = 'AA'
  ): Promise<WCAGValidationResult> {
    const tags = this.getTagsForLevel(level);
    
    try {
      const results = await this.axeInstance.run(element, {
        tags,
        rules: {
          // Include NeuroAdapt specific rules
          'neuroadapt-motion-reduction': { enabled: true },
          'neuroadapt-cognitive-load': { enabled: true },
          'neuroadapt-sensory-adaptation': { enabled: true }
        }
      });

      return this.formatResults(results, level);
    } catch (error) {
      console.error('WCAG validation failed:', error);
      throw new Error(`WCAG validation failed: ${error}`);
    }
  }

  async validateComponent(
    component: HTMLElement,
    options: {
      level?: 'A' | 'AA' | 'AAA';
      includeNeuroAdaptRules?: boolean;
      customRules?: string[];
    } = {}
  ): Promise<WCAGValidationResult> {
    const { level = 'AA', includeNeuroAdaptRules = true, customRules = [] } = options;
    const tags = this.getTagsForLevel(level);
    
    if (includeNeuroAdaptRules) {
      tags.push('neuroadapt');
    }

    const rules: Record<string, { enabled: boolean }> = {};
    customRules.forEach(rule => {
      rules[rule] = { enabled: true };
    });

    const results = await this.axeInstance.run(component, { tags, rules });
    return this.formatResults(results, level);
  }

  async validateInteraction(
    element: HTMLElement,
    interactionType: 'click' | 'focus' | 'keyboard' | 'gesture'
  ): Promise<WCAGValidationResult> {
    // Simulate interaction and validate resulting state
    switch (interactionType) {
      case 'focus':
        element.focus();
        break;
      case 'click':
        element.click();
        break;
      case 'keyboard':
        // Simulate keyboard navigation
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        break;
    }

    // Wait for any async updates
    await new Promise(resolve => setTimeout(resolve, 100));

    return this.validateComponent(element, {
      level: 'AA',
      includeNeuroAdaptRules: true,
      customRules: ['focus-visible', 'interactive-controls-name']
    });
  }

  generateReport(results: WCAGValidationResult): string {
    const { summary, violations, passes } = results;
    
    let report = `# NeuroAdapt WCAG Validation Report\n\n`;
    report += `## Summary\n`;
    report += `- Compliance Level: ${summary.complianceLevel.toUpperCase()}\n`;
    report += `- Violations: ${summary.violations}\n`;
    report += `- Passes: ${summary.passes}\n`;
    report += `- Incomplete: ${summary.incomplete}\n`;
    report += `- Total Elements Tested: ${summary.totalElements}\n\n`;

    if (violations.length > 0) {
      report += `## Violations\n\n`;
      violations.forEach((violation, index) => {
        report += `### ${index + 1}. ${violation.description}\n`;
        report += `- **Impact**: ${violation.impact}\n`;
        report += `- **Help**: ${violation.help}\n`;
        report += `- **Affected Elements**: ${violation.nodes.length}\n`;
        report += `- **More Info**: ${violation.helpUrl}\n\n`;
        
        violation.nodes.slice(0, 3).forEach((node, nodeIndex) => {
          report += `  **Element ${nodeIndex + 1}**: \`${node.target.join(', ')}\`\n`;
          if (node.failureSummary) {
            report += `  *Failure*: ${node.failureSummary}\n`;
          }
        });
        
        if (violation.nodes.length > 3) {
          report += `  *...and ${violation.nodes.length - 3} more elements*\n`;
        }
        report += `\n`;
      });
    }

    if (passes.length > 0) {
      report += `## Successful Checks\n\n`;
      passes.slice(0, 10).forEach((pass, index) => {
        report += `${index + 1}. ${pass.description} (${pass.nodes.length} elements)\n`;
      });
      
      if (passes.length > 10) {
        report += `*...and ${passes.length - 10} more successful checks*\n`;
      }
    }

    return report;
  }

  private getTagsForLevel(level: 'A' | 'AA' | 'AAA'): string[] {
    const baseTags = ['wcag2a'];
    
    if (level === 'AA' || level === 'AAA') {
      baseTags.push('wcag2aa', 'wcag21aa');
    }
    
    if (level === 'AAA') {
      baseTags.push('wcag2aaa');
    }
    
    return baseTags;
  }

  private formatResults(axeResults: any, level: 'A' | 'AA' | 'AAA'): WCAGValidationResult {
    const violations: WCAGViolation[] = axeResults.violations.map((v: any) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.map((n: any) => ({
        target: n.target,
        html: n.html,
        failureSummary: n.failureSummary,
        impact: n.impact
      })),
      tags: v.tags
    }));

    const passes: WCAGPass[] = axeResults.passes.map((p: any) => ({
      id: p.id,
      description: p.description,
      nodes: p.nodes.map((n: any) => ({
        target: n.target,
        html: n.html
      }))
    }));

    const incomplete: WCAGIncomplete[] = axeResults.incomplete.map((i: any) => ({
      id: i.id,
      description: i.description,
      nodes: i.nodes.map((n: any) => ({
        target: n.target,
        html: n.html
      }))
    }));

    const totalElements = violations.reduce((acc, v) => acc + v.nodes.length, 0) +
                         passes.reduce((acc, p) => acc + p.nodes.length, 0);

    const criticalViolations = violations.filter(v => v.impact === 'critical').length;
    const seriousViolations = violations.filter(v => v.impact === 'serious').length;
    
    let complianceLevel: 'fail' | 'partial' | 'pass' = 'pass';
    if (criticalViolations > 0 || seriousViolations > 0) {
      complianceLevel = 'fail';
    } else if (violations.length > 0) {
      complianceLevel = 'partial';
    }

    return {
      level,
      violations,
      passes,
      incomplete,
      summary: {
        violations: violations.length,
        passes: passes.length,
        incomplete: incomplete.length,
        totalElements,
        complianceLevel
      }
    };
  }
}

// Utility functions for common validation scenarios
export async function validateNeuroAdaptComponent(
  component: HTMLElement
): Promise<WCAGValidationResult> {
  const validator = new WCAGValidator();
  return validator.validateComponent(component, {
    level: 'AA',
    includeNeuroAdaptRules: true,
    customRules: [
      'color-contrast-enhanced',
      'focus-order-semantics',
      'neuroadapt-motion-reduction',
      'neuroadapt-cognitive-load',
      'neuroadapt-sensory-adaptation'
    ]
  });
}

export async function validateAccessibilityWorkflow(
  steps: Array<{ element: HTMLElement; action: 'click' | 'focus' | 'keyboard' }>
): Promise<WCAGValidationResult[]> {
  const validator = new WCAGValidator();
  const results: WCAGValidationResult[] = [];

  for (const step of steps) {
    const result = await validator.validateInteraction(step.element, step.action);
    results.push(result);
  }

  return results;
}

export function createAccessibilityReport(results: WCAGValidationResult[]): string {
  const validator = new WCAGValidator();
  let report = `# NeuroAdapt Accessibility Workflow Report\n\n`;
  
  results.forEach((result, index) => {
    report += `## Step ${index + 1}\n`;
    report += validator.generateReport(result);
    report += `\n---\n\n`;
  });

  return report;
} 