/**
 * Init Project Command - Initialize NeuroAdapt in existing projects
 * @fileoverview CLI command for adding NeuroAdapt to existing projects
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';

export interface InitProjectOptions {
  force?: boolean;
  typescript?: boolean;
  features?: string[];
}

/**
 * Initialize NeuroAdapt in existing project
 */
export async function initProject(options: InitProjectOptions = {}) {
  console.log(chalk.blue('🚀 Initializing NeuroAdapt SDK in existing project\n'));

  const spinner = ora('Analyzing project structure...').start();

  try {
    const projectRoot = process.cwd();
    const packageJsonPath = path.join(projectRoot, 'package.json');
    
    if (!await fs.pathExists(packageJsonPath)) {
      spinner.fail('No package.json found. Please run this command in a project directory.');
      return;
    }

    const packageJson = await fs.readJson(packageJsonPath);
    const isTypeScript = options.typescript ?? (
      await fs.pathExists(path.join(projectRoot, 'tsconfig.json')) ||
      packageJson.devDependencies?.typescript ||
      packageJson.dependencies?.typescript
    );

    spinner.stop();

    // Get project configuration
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: packageJson.name || path.basename(projectRoot)
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select accessibility features to enable:',
        choices: [
          { name: 'Cognitive Load Management', value: 'cognitive', checked: true },
          { name: 'Sensory Adaptations (contrast, motion)', value: 'sensory', checked: true },
          { name: 'Motor Accessibility (keyboard nav)', value: 'motor', checked: true },
          { name: 'Audio Support (captions, descriptions)', value: 'audio', checked: true },
          { name: 'AI-Powered Personalization', value: 'ai', checked: false },
          { name: 'Quantum Computing Support', value: 'quantum', checked: false },
          { name: 'VR/AR Safety Features', value: 'vr', checked: false }
        ],
        when: !options.features
      },
      {
        type: 'list',
        name: 'framework',
        message: 'What framework are you using?',
        choices: [
          { name: 'React', value: 'react' },
          { name: 'Vue.js', value: 'vue' },
          { name: 'Angular', value: 'angular' },
          { name: 'Svelte', value: 'svelte' },
          { name: 'Vanilla JavaScript/TypeScript', value: 'vanilla' },
          { name: 'Node.js (Backend)', value: 'node' }
        ]
      },
      {
        type: 'confirm',
        name: 'setupTesting',
        message: 'Set up accessibility testing?',
        default: true
      }
    ]);

    const features = options.features || answers.features;
    const setupSpinner = ora('Setting up NeuroAdapt SDK...').start();

    // Update package.json with dependencies
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};

    // Core dependencies
    dependencies['@neuroadapt/core'] = '^1.1.0';

    // Feature-specific dependencies
    if (features.includes('ai')) {
      dependencies['@neuroadapt/ai'] = '^1.1.0';
    }
    if (features.includes('quantum')) {
      dependencies['@neuroadapt/quantum'] = '^1.1.0';
    }
    if (features.includes('vr')) {
      dependencies['@neuroadapt/vr'] = '^1.1.0';
    }

    // Framework-specific dependencies
    if (answers.framework === 'react') {
      dependencies['react'] = dependencies['react'] || '^18.0.0';
      dependencies['react-dom'] = dependencies['react-dom'] || '^18.0.0';
    }

    // Testing dependencies
    if (answers.setupTesting) {
      dependencies['@neuroadapt/testing'] = '^1.1.0';
      devDependencies['@playwright/test'] = '^1.40.0';
      devDependencies['axe-core'] = '^4.8.0';
    }

    packageJson.dependencies = dependencies;
    packageJson.devDependencies = devDependencies;

    // Add scripts
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts['accessibility:test'] = 'neuroadapt test accessibility';
    packageJson.scripts['accessibility:analyze'] = 'neuroadapt analyze';

    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

    setupSpinner.text = 'Creating configuration files...';

    // Create NeuroAdapt configuration
    const configPath = path.join(projectRoot, `neuroadapt.config.${isTypeScript ? 'ts' : 'js'}`);
    const configContent = generateConfig(features, answers.framework, isTypeScript);
    await fs.writeFile(configPath, configContent);

    // Create directory structure
    const neuroAdaptDir = path.join(projectRoot, '.neuroadapt');
    await fs.ensureDir(neuroAdaptDir);
    await fs.ensureDir(path.join(neuroAdaptDir, 'preferences'));
    await fs.ensureDir(path.join(neuroAdaptDir, 'analytics'));

    // Create initial preferences file
    const defaultPreferences = generateDefaultPreferences(features);
    await fs.writeJson(
      path.join(neuroAdaptDir, 'preferences', 'default.json'),
      defaultPreferences,
      { spaces: 2 }
    );

    // Create example implementation
    const srcDir = path.join(projectRoot, 'src');
    await fs.ensureDir(srcDir);
    
    const examplePath = path.join(srcDir, `neuroadapt-setup.${isTypeScript ? 'ts' : 'js'}`);
    const exampleContent = generateExampleImplementation(features, answers.framework, isTypeScript);
    await fs.writeFile(examplePath, exampleContent);

    // Create accessibility testing setup
    if (answers.setupTesting) {
      const testDir = path.join(projectRoot, 'tests', 'accessibility');
      await fs.ensureDir(testDir);
      
      const testContent = generateAccessibilityTests(answers.framework, isTypeScript);
      await fs.writeFile(
        path.join(testDir, `accessibility.test.${isTypeScript ? 'ts' : 'js'}`),
        testContent
      );
    }

    setupSpinner.succeed('NeuroAdapt SDK initialized successfully!');
    
    console.log(chalk.green('\n✅ Setup completed:'));
    console.log(chalk.gray(`📁 Configuration: neuroadapt.config.${isTypeScript ? 'ts' : 'js'}`));
    console.log(chalk.gray(`🎯 Features: ${features.join(', ')}`));
    console.log(chalk.gray(`⚙️  Framework: ${answers.framework}`));
    console.log(chalk.gray(`🧪 Testing: ${answers.setupTesting ? 'Enabled' : 'Disabled'}`));
    
    console.log(chalk.blue('\n💡 Next steps:'));
    console.log(chalk.gray('1. Run `npm install` or `pnpm install` to install dependencies'));
    console.log(chalk.gray(`2. Check \`src/neuroadapt-setup.${isTypeScript ? 'ts' : 'js'}\` for implementation examples`));
    console.log(chalk.gray('3. Configure your preferred AI adapters (if enabled)'));
    console.log(chalk.gray('4. Run accessibility tests with `npm run accessibility:test`'));
    
  } catch (error) {
    spinner.fail('Failed to initialize NeuroAdapt SDK');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

function generateConfig(features: string[], framework: string, isTypeScript: boolean): string {
  const configObj = {
    features: {
      cognitive: features.includes('cognitive'),
      sensory: features.includes('sensory'),
      motor: features.includes('motor'),
      audio: features.includes('audio'),
      ai: features.includes('ai'),
      quantum: features.includes('quantum'),
      vr: features.includes('vr')
    },
    framework,
    accessibility: {
      testing: {
        enabled: true,
        wcagLevel: 'AA',
        includeMobile: true
      },
      monitoring: {
        enabled: true,
        reportViolations: true
      }
    }
  };

  const typeAnnotation = isTypeScript ? ': NeuroAdaptConfig' : '';
  
  return `/**
 * NeuroAdapt SDK Configuration
 * Generated on ${new Date().toISOString()}
 */

${isTypeScript ? `import type { NeuroAdaptConfig } from '@neuroadapt/core';

` : ''}const config${typeAnnotation} = ${JSON.stringify(configObj, null, 2)};

export default config;
`;
}

function generateDefaultPreferences(features: string[]): any {
  return {
    version: '1.1.0',
    createdAt: new Date().toISOString(),
    cognitive: {
      readingSpeed: 'normal',
      processingPace: 'normal',
      explanationLevel: 'standard',
      allowInterruptions: true
    },
    sensory: {
      highContrast: false,
      darkMode: false,
      motionReduction: false,
      fontSize: 16,
      colorVisionFilter: 'none'
    },
    motor: {
      keyboardNavigation: true,
      mouseAlternatives: false,
      targetSizeIncrease: 0,
      dwellTime: 500
    },
    audio: {
      enableAudio: false,
      enableCaptions: false,
      volume: 0.7,
      audioDescription: false
    },
    features: {
      enabled: features
    }
  };
}

function generateExampleImplementation(features: string[], framework: string, isTypeScript: boolean): string {
  const imports: string[] = ['import { PreferenceStore } from \'@neuroadapt/core\';'];
  
  if (features.includes('ai')) {
    imports.push('import { createAdapter } from \'@neuroadapt/ai\';');
  }
  if (features.includes('quantum')) {
    imports.push('import { QuantumCircuit } from \'@neuroadapt/quantum\';');
  }
  if (features.includes('vr')) {
    imports.push('import { SafeZoneManager } from \'@neuroadapt/vr\';');
  }

  return `/**
 * NeuroAdapt SDK Setup Example
 * ${framework} implementation with ${features.join(', ')} features
 */

${imports.join('\n')}

// Initialize preference store
const preferences = new PreferenceStore({ key: 'neuroadapt-prefs' });

${features.includes('ai') ? `
// AI Adapter setup (configure with your API keys)
const aiAdapter = createAdapter('openai', {
  // apiKey: process.env.OPENAI_API_KEY
});
` : ''}

${features.includes('quantum') ? `
// Quantum computing setup
const quantumCircuit = new QuantumCircuit(2); // 2-qubit circuit
` : ''}

${features.includes('vr') ? `
// VR safety setup
const safeZoneManager = new SafeZoneManager({
  boundaries: { x: 2, y: 2, z: 2 }
});
` : ''}

// Example: Apply user preferences
export async function applyAccessibilitySettings() {
  try {
    const userPrefs = await preferences.load();
    
    if (userPrefs?.sensory.highContrast) {
      document.body.classList.add('high-contrast');
    }
    
    if (userPrefs?.sensory.darkMode) {
      document.body.classList.add('dark-mode');
    }
    
    if (userPrefs?.motor.keyboardNavigation) {
      // Enable enhanced keyboard navigation
      enableKeyboardNavigation();
    }
    
  } catch (error) {
    console.error('Failed to apply accessibility settings:', error);
  }
}

function enableKeyboardNavigation() {
  // Implementation depends on your framework
  console.log('Enhanced keyboard navigation enabled');
}

// Auto-initialize on page load
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', applyAccessibilitySettings);
}
`;
}

function generateAccessibilityTests(framework: string, isTypeScript: boolean): string {
  return `/**
 * Accessibility Tests
 * Automated WCAG compliance and NeuroAdapt feature testing
 */

import { test, expect } from '@playwright/test';
import { AccessibilityTester } from '@neuroadapt/testing';

const tester = new AccessibilityTester({
  wcagLevel: 'AA',
  includeMobile: true
});

test.describe('Accessibility Compliance', () => {
  test('should meet WCAG AA standards', async ({ page }) => {
    await page.goto('/');
    
    const results = await tester.runWCAGTests(page);
    expect(results.violations).toHaveLength(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    const results = await tester.testKeyboardNavigation(page);
    expect(results.passed).toBe(true);
  });

  test('should have proper contrast ratios', async ({ page }) => {
    await page.goto('/');
    
    const results = await tester.testColorContrast(page);
    expect(results.passed).toBe(true);
  });

  test('should support screen readers', async ({ page }) => {
    await page.goto('/');
    
    const results = await tester.testScreenReaderCompatibility(page);
    expect(results.passed).toBe(true);
  });
});

test.describe('NeuroAdapt Features', () => {
  test('should apply high contrast mode', async ({ page }) => {
    await page.goto('/');
    
    // Enable high contrast
    await page.evaluate(() => {
      window.neuroadapt?.preferences.update({
        sensory: { highContrast: true }
      });
    });
    
    const hasHighContrast = await page.locator('body.high-contrast').isVisible();
    expect(hasHighContrast).toBe(true);
  });

  test('should support motion reduction', async ({ page }) => {
    await page.goto('/');
    
    // Enable motion reduction
    await page.evaluate(() => {
      window.neuroadapt?.preferences.update({
        sensory: { motionReduction: true }
      });
    });
    
    const animations = await page.locator('[style*="animation"]').count();
    expect(animations).toBe(0);
  });
});
`;
} 