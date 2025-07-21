/**
 * Create Quantum App Command - Create quantum computing applications
 * @fileoverview CLI command for creating accessible quantum applications
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import * as path from 'path';

export interface CreateQuantumAppOptions {
  template?: string;
  typescript?: boolean;
  features?: string[];
}

/**
 * Create a new quantum computing application with accessibility features
 */
export async function createQuantumApp(name?: string, options: CreateQuantumAppOptions = { template: 'basic' }) {
  console.log(chalk.blue('⚛️  Creating NeuroAdapt Quantum Application\n'));

  let appName = name;
  
  if (!appName) {
    const { selectedName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'selectedName',
        message: 'Application name:',
        validate: (input: string) => {
          if (!input) return 'Please provide an application name';
          if (!/^[a-z0-9-_]+$/i.test(input)) return 'Name can only contain letters, numbers, hyphens, and underscores';
          return true;
        }
      }
    ]);
    appName = selectedName;
  }

  const spinner = ora('Creating quantum application...').start();

  try {
    const projectRoot = path.join(process.cwd(), appName!);
    
    // Check if directory already exists
    if (await fs.pathExists(projectRoot)) {
      spinner.fail(`Directory '${appName}' already exists`);
      return;
    }

    spinner.text = 'Setting up project structure...';
    
    await fs.ensureDir(projectRoot);
    
    // Get additional configuration
    spinner.stop();
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'template',
        message: 'Choose a quantum template:',
        choices: [
          { name: 'Basic Quantum Circuits', value: 'basic' },
          { name: 'Bloch Sphere Visualization', value: 'bloch' },
          { name: 'Quantum Algorithm Demo', value: 'algorithm' },
          { name: 'Educational Quantum Simulator', value: 'educational' }
        ],
        when: !options.template
      },
      {
        type: 'confirm',
        name: 'typescript',
        message: 'Use TypeScript?',
        default: true,
        when: options.typescript === undefined
      },
      {
        type: 'checkbox',
        name: 'accessibility',
        message: 'Select accessibility features:',
        choices: [
          { name: 'Screen Reader Support', value: 'screenreader', checked: true },
          { name: 'Keyboard Navigation', value: 'keyboard', checked: true },
          { name: 'High Contrast Mode', value: 'contrast', checked: true },
          { name: 'Motion Reduction', value: 'motion', checked: true },
          { name: 'Audio Descriptions', value: 'audio', checked: false }
        ]
      }
    ]);

    const template = options.template || answers.template;
    const useTypeScript = options.typescript ?? answers.typescript;
    const accessibilityFeatures = answers.accessibility;

    const creationSpinner = ora('Generating quantum application...').start();

    // Create package.json
    const packageJson = {
      name: appName,
      version: '1.0.0',
      description: `Accessible quantum computing application - ${template} template`,
      main: useTypeScript ? 'dist/index.js' : 'src/index.js',
      scripts: {
        dev: useTypeScript ? 'tsc && node dist/index.js' : 'node src/index.js',
        build: useTypeScript ? 'tsc' : 'echo "No build step needed"',
        start: useTypeScript ? 'node dist/index.js' : 'node src/index.js',
        test: 'npm run test:unit && npm run test:accessibility',
        'test:unit': 'jest',
        'test:accessibility': 'playwright test tests/accessibility'
      },
      dependencies: {
        '@neuroadapt/core': '^1.1.0',
        '@neuroadapt/quantum': '^1.1.0',
        '@neuroadapt/testing': '^1.1.0'
      },
      devDependencies: useTypeScript ? {
        'typescript': '^5.0.0',
        '@types/node': '^20.0.0',
        'jest': '^29.0.0',
        '@playwright/test': '^1.40.0'
      } : {
        'jest': '^29.0.0',
        '@playwright/test': '^1.40.0'
      }
    };

    await fs.writeJson(path.join(projectRoot, 'package.json'), packageJson, { spaces: 2 });

    // Create TypeScript config if needed
    if (useTypeScript) {
      const tsConfig = {
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          declaration: true,
          declarationMap: true,
          sourceMap: true
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist', 'tests']
      };
      
      await fs.writeJson(path.join(projectRoot, 'tsconfig.json'), tsConfig, { spaces: 2 });
    }

    // Create source directory and files
    const srcDir = path.join(projectRoot, 'src');
    await fs.ensureDir(srcDir);

    // Generate main application file
    const mainContent = generateMainApp(template, accessibilityFeatures, useTypeScript);
    await fs.writeFile(
      path.join(srcDir, `index.${useTypeScript ? 'ts' : 'js'}`),
      mainContent
    );

    // Generate template-specific files
    switch (template) {
      case 'bloch':
        const blochContent = generateBlochSphereInit(useTypeScript);
        await fs.writeFile(
          path.join(srcDir, `bloch-sphere.${useTypeScript ? 'ts' : 'js'}`),
          blochContent
        );
        break;
      case 'algorithm':
        const algorithmContent = generateQuantumAlgorithm(useTypeScript);
        await fs.writeFile(
          path.join(srcDir, `quantum-algorithm.${useTypeScript ? 'ts' : 'js'}`),
          algorithmContent
        );
        break;
      case 'educational':
        const educationalContent = generateEducationalSimulator(useTypeScript);
        await fs.writeFile(
          path.join(srcDir, `quantum-simulator.${useTypeScript ? 'ts' : 'js'}`),
          educationalContent
        );
        break;
      default: // basic
        const circuitContent = generateCircuitBuilderInit(useTypeScript);
        await fs.writeFile(
          path.join(srcDir, `quantum-circuit.${useTypeScript ? 'ts' : 'js'}`),
          circuitContent
        );
    }

    // Create accessibility configuration
    const accessibilityConfig = {
      quantum: {
        visualizations: {
          colorBlindFriendly: accessibilityFeatures.includes('contrast'),
          highContrast: accessibilityFeatures.includes('contrast'),
          reduceMotion: accessibilityFeatures.includes('motion'),
          audioDescriptions: accessibilityFeatures.includes('audio')
        },
        interactions: {
          keyboardNavigation: accessibilityFeatures.includes('keyboard'),
          screenReaderSupport: accessibilityFeatures.includes('screenreader'),
          alternativeInputs: true
        }
      }
    };

    await fs.writeJson(
      path.join(projectRoot, 'accessibility.config.json'),
      accessibilityConfig,
      { spaces: 2 }
    );

    // Create README
    const readmeContent = generateReadme(appName!, template, useTypeScript, accessibilityFeatures);
    await fs.writeFile(path.join(projectRoot, 'README.md'), readmeContent);

    creationSpinner.succeed('Quantum application created successfully!');
    
    console.log(chalk.green('\n✅ Success! Your accessible quantum app is ready:'));
    console.log(chalk.gray(`📁 Directory: ${appName}`));
    console.log(chalk.gray(`⚛️  Template: ${template}`));
    console.log(chalk.gray(`📝 Language: ${useTypeScript ? 'TypeScript' : 'JavaScript'}`));
    console.log(chalk.gray(`♿ Accessibility: ${accessibilityFeatures.join(', ')}`));
    
    console.log(chalk.blue('\n💡 Next steps:'));
    console.log(chalk.gray(`1. cd ${appName}`));
    console.log(chalk.gray('2. npm install'));
    console.log(chalk.gray('3. npm run dev'));
    
  } catch (error) {
    spinner.fail('Failed to create quantum application');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

function generateBlochSphereInit(isTS: boolean): string {
  const typeAnnotation = isTS ? ': void' : '';
  
  return `/**
 * Bloch Sphere Visualization - Accessible quantum state visualization
 */

import { BlochSphere } from '@neuroadapt/quantum';
import { PreferenceStore } from '@neuroadapt/core';

const preferences = new PreferenceStore({ key: 'quantum-prefs' });

export async function initializeBlochSphere()${typeAnnotation} {
  const userPrefs = await preferences.load();
  
  const sphere = new BlochSphere({
    container: '#bloch-container',
    accessibility: {
      colorBlindFriendly: userPrefs?.sensory?.colorVisionFilter !== 'none',
      highContrast: userPrefs?.sensory?.highContrast || false,
      screenReaderDescriptions: true,
      keyboardControls: userPrefs?.motor?.keyboardNavigation || false
    }
  });

  // Add quantum state
  sphere.setState([0.6, 0.8]); // |0⟩ + |1⟩ superposition
  
  // Enable accessibility features
  sphere.enableKeyboardNavigation();
  sphere.addScreenReaderDescriptions();
  
  return sphere;
}
`;
}

function generateCircuitBuilderInit(isTS: boolean): string {
  const typeAnnotation = isTS ? ': void' : '';
  
  return `/**
 * Quantum Circuit Builder - Accessible quantum circuit construction
 */

import { QuantumCircuit } from '@neuroadapt/quantum';
import { PreferenceStore } from '@neuroadapt/core';

const preferences = new PreferenceStore({ key: 'quantum-prefs' });

export async function initializeCircuitBuilder()${typeAnnotation} {
  const userPrefs = await preferences.load();
  
  const circuit = new QuantumCircuit(3); // 3-qubit circuit
  
  // Configure accessibility
  circuit.setAccessibilityOptions({
    keyboardNavigation: userPrefs?.motor?.keyboardNavigation || false,
    screenReaderSupport: true,
    highContrast: userPrefs?.sensory?.highContrast || false,
    reduceAnimations: userPrefs?.sensory?.motionReduction || false
  });

  // Add some basic gates
  circuit.addGate('H', 0); // Hadamard gate on qubit 0
  circuit.addGate('CNOT', [0, 1]); // CNOT gate between qubits 0 and 1
  circuit.addGate('H', 2); // Hadamard gate on qubit 2
  
  // Render circuit with accessibility features
  circuit.render('#circuit-container');
  
  return circuit;
}
`;
}

function generateMainApp(template: string, features: string[], isTS: boolean): string {
  return `/**
 * ${template.charAt(0).toUpperCase() + template.slice(1)} Quantum Application
 * Accessible quantum computing with NeuroAdapt SDK
 */

import { PreferenceStore } from '@neuroadapt/core';
${template === 'bloch' ? "import { initializeBlochSphere } from './bloch-sphere';" : ''}
${template === 'basic' ? "import { initializeCircuitBuilder } from './quantum-circuit';" : ''}

const preferences = new PreferenceStore({ key: 'quantum-app-prefs' });

async function main()${isTS ? ': Promise<void>' : ''} {
  console.log('🚀 Starting Accessible Quantum Application');
  
  try {
    // Load user preferences
    const userPrefs = await preferences.load();
    console.log('📋 User preferences loaded');
    
    // Apply accessibility settings
    applyAccessibilitySettings(userPrefs);
    
    // Initialize quantum components
    ${template === 'bloch' ? 'await initializeBlochSphere();' : ''}
    ${template === 'basic' ? 'await initializeCircuitBuilder();' : ''}
    
    console.log('✅ Quantum application ready!');
    
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
  }
}

function applyAccessibilitySettings(prefs${isTS ? ': any' : ''}) {
  if (prefs?.sensory?.highContrast) {
    document.body.classList.add('high-contrast');
  }
  
  if (prefs?.sensory?.motionReduction) {
    document.body.classList.add('reduce-motion');
  }
  
  if (prefs?.motor?.keyboardNavigation) {
    document.body.classList.add('keyboard-navigation');
  }
}

// Start the application
main().catch(console.error);
`;
}

function generateQuantumAlgorithm(isTS: boolean): string {
  return `/**
 * Quantum Algorithm Implementation - Accessible quantum algorithms
 */

import { QuantumCircuit } from '@neuroadapt/quantum';

export class AccessibleQuantumAlgorithm {
  private circuit${isTS ? ': QuantumCircuit' : ''};
  
  constructor(qubits${isTS ? ': number' : ''}) {
    this.circuit = new QuantumCircuit(qubits);
  }
  
  // Implement Deutsch-Jozsa algorithm with accessibility
  deutschJozsa()${isTS ? ': void' : ''} {
    console.log('🔬 Running Deutsch-Jozsa Algorithm');
    
    // Step 1: Initialize qubits
    this.circuit.addGate('H', 0); // Hadamard on first qubit
    this.circuit.addGate('X', 1); // X gate on second qubit
    this.circuit.addGate('H', 1); // Hadamard on second qubit
    
    // Step 2: Apply oracle (placeholder)
    this.circuit.addGate('CNOT', [0, 1]);
    
    // Step 3: Final Hadamard
    this.circuit.addGate('H', 0);
    
    // Measure and describe result
    const result = this.circuit.measure();
    this.announceResult(result);
  }
  
  private announceResult(result${isTS ? ': any' : ''})${isTS ? ': void' : ''} {
    const description = result === 0 ? 
      'Function is constant - all inputs produce the same output' :
      'Function is balanced - inputs produce different outputs';
    
    console.log(\`📊 Result: \${description}\`);
    
    // Add screen reader announcement
    if (typeof window !== 'undefined') {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.textContent = description;
      document.body.appendChild(announcement);
    }
  }
}
`;
}

function generateEducationalSimulator(isTS: boolean): string {
  return `/**
 * Educational Quantum Simulator - Learning-focused quantum computing
 */

import { QuantumCircuit } from '@neuroadapt/quantum';

export class EducationalQuantumSimulator {
  private circuit${isTS ? ': QuantumCircuit' : ''};
  private stepCount${isTS ? ': number' : ''} = 0;
  
  constructor() {
    this.circuit = new QuantumCircuit(2);
  }
  
  // Interactive quantum gate exploration
  exploreGates()${isTS ? ': void' : ''} {
    console.log('📚 Welcome to Quantum Gate Explorer');
    console.log('Press keys to add gates: H (Hadamard), X (Pauli-X), C (CNOT)');
    
    if (typeof window !== 'undefined') {
      document.addEventListener('keydown', this.handleKeyPress.bind(this));
    }
  }
  
  private handleKeyPress(event${isTS ? ': KeyboardEvent' : ''})${isTS ? ': void' : ''} {
    switch (event.key.toLowerCase()) {
      case 'h':
        this.addHadamardGate();
        break;
      case 'x':
        this.addPauliXGate();
        break;
      case 'c':
        this.addCNOTGate();
        break;
      case 'r':
        this.resetCircuit();
        break;
    }
  }
  
  private addHadamardGate()${isTS ? ': void' : ''} {
    this.circuit.addGate('H', 0);
    this.announceStep('Added Hadamard gate - creates superposition');
  }
  
  private addPauliXGate()${isTS ? ': void' : ''} {
    this.circuit.addGate('X', 0);
    this.announceStep('Added Pauli-X gate - flips qubit state');
  }
  
  private addCNOTGate()${isTS ? ': void' : ''} {
    this.circuit.addGate('CNOT', [0, 1]);
    this.announceStep('Added CNOT gate - creates entanglement');
  }
  
  private resetCircuit()${isTS ? ': void' : ''} {
    this.circuit = new QuantumCircuit(2);
    this.stepCount = 0;
    this.announceStep('Circuit reset');
  }
  
  private announceStep(description${isTS ? ': string' : ''})${isTS ? ': void' : ''} {
    this.stepCount++;
    console.log(\`Step \${this.stepCount}: \${description}\`);
    
    // Screen reader announcement
    if (typeof window !== 'undefined') {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.textContent = \`Step \${this.stepCount}: \${description}\`;
      document.body.appendChild(announcement);
      
      // Clean up old announcements
      setTimeout(() => announcement.remove(), 3000);
    }
  }
}
`;
}

function generateReadme(appName: string, template: string, isTS: boolean, features: string[]): string {
  return `# ${appName}

An accessible quantum computing application built with NeuroAdapt SDK.

## Features

- **Template**: ${template}
- **Language**: ${isTS ? 'TypeScript' : 'JavaScript'}  
- **Accessibility**: ${features.join(', ')}
- **Quantum Computing**: Circuit simulation, visualization, and algorithms

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## Accessibility Features

This application includes comprehensive accessibility support:

${features.includes('screenreader') ? '- **Screen Reader Support**: All quantum states and operations are announced\n' : ''}
${features.includes('keyboard') ? '- **Keyboard Navigation**: Full keyboard control of quantum circuits\n' : ''}
${features.includes('contrast') ? '- **High Contrast Mode**: Enhanced visibility for quantum visualizations\n' : ''}
${features.includes('motion') ? '- **Motion Reduction**: Reduced animations for motion sensitivity\n' : ''}
${features.includes('audio') ? '- **Audio Descriptions**: Spoken descriptions of quantum operations\n' : ''}

## Usage

### Basic Quantum Circuit

\`\`\`${isTS ? 'typescript' : 'javascript'}
import { QuantumCircuit } from '@neuroadapt/quantum';

const circuit = new QuantumCircuit(2);
circuit.addGate('H', 0);  // Hadamard gate
circuit.addGate('CNOT', [0, 1]);  // CNOT gate
circuit.render('#circuit-container');
\`\`\`

### Accessibility Configuration

\`\`\`${isTS ? 'typescript' : 'javascript'}
circuit.setAccessibilityOptions({
  keyboardNavigation: true,
  screenReaderSupport: true,
  highContrast: false,
  reduceAnimations: false
});
\`\`\`

## Keyboard Shortcuts

- **H**: Add Hadamard gate
- **X**: Add Pauli-X gate  
- **C**: Add CNOT gate
- **R**: Reset circuit
- **Tab**: Navigate between elements
- **Enter/Space**: Activate controls

## Learn More

- [NeuroAdapt SDK Documentation](https://neuroadapt.dev)
- [Quantum Computing Basics](https://neuroadapt.dev/quantum)
- [Accessibility Guidelines](https://neuroadapt.dev/accessibility)

## Support

For accessibility support or quantum computing questions, visit our [documentation](https://neuroadapt.dev) or open an issue.
`;
} 