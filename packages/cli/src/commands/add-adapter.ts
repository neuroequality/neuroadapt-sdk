/**
 * Add Adapter Command - Add AI adapters to existing projects
 * @fileoverview CLI command for adding accessibility adapters
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';

export interface AddAdapterOptions {
  adapter?: string;
  force?: boolean;
}

/**
 * Add accessibility adapter to existing project
 */
export async function addAdapter(adapterType?: string, options: AddAdapterOptions = {}) {
  console.log(chalk.blue('🔧 Adding NeuroAdapt Accessibility Adapter\n'));

  let adapter = adapterType;
  
  if (!adapter) {
    const { selectedAdapter } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedAdapter',
        message: 'Which adapter would you like to add?',
        choices: [
          { name: 'OpenAI Adapter', value: 'openai' },
          { name: 'Claude Adapter', value: 'claude' },
          { name: 'Ollama Adapter', value: 'ollama' },
          { name: 'All Adapters', value: 'all' }
        ]
      }
    ]);
    adapter = selectedAdapter;
  }

  const spinner = ora('Adding adapter configuration...').start();

  try {
    const projectRoot = process.cwd();
    const packageJsonPath = path.join(projectRoot, 'package.json');
    
    if (!await fs.pathExists(packageJsonPath)) {
      spinner.fail('No package.json found. Please run this command in a project directory.');
      return;
    }

    const packageJson = await fs.readJson(packageJsonPath);
    
    // Add dependencies
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};

    dependencies['@neuroadapt/ai'] = '^1.1.0';
    
    if (adapter === 'openai' || adapter === 'all') {
      dependencies['openai'] = '^4.0.0';
    }
    if (adapter === 'claude' || adapter === 'all') {
      dependencies['@anthropic-ai/sdk'] = '^0.20.0';
    }
    if (adapter === 'ollama' || adapter === 'all') {
      dependencies['ollama'] = '^0.5.0';
    }

    packageJson.dependencies = dependencies;
    packageJson.devDependencies = devDependencies;

    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

    // Create configuration file
    const configPath = path.join(projectRoot, 'neuroadapt.config.js');
    if (!await fs.pathExists(configPath) || options.force) {
      const configContent = generateAdapterConfig(adapter);
      await fs.writeFile(configPath, configContent);
    }

    // Create example usage file
    const examplePath = path.join(projectRoot, 'src', 'neuroadapt-example.ts');
    await fs.ensureDir(path.dirname(examplePath));
    
    if (!await fs.pathExists(examplePath) || options.force) {
      const exampleContent = generateExampleUsage(adapter);
      await fs.writeFile(examplePath, exampleContent);
    }

    spinner.succeed('Adapter configuration added successfully!');
    
    console.log(chalk.green('\n✅ Success! Next steps:'));
    console.log(chalk.gray('1. Run `npm install` or `pnpm install` to install dependencies'));
    console.log(chalk.gray('2. Configure your API keys in environment variables'));
    console.log(chalk.gray('3. Check `src/neuroadapt-example.ts` for usage examples'));
    
  } catch (error) {
    spinner.fail('Failed to add adapter configuration');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

function generateAdapterConfig(adapter: string): string {
  return `/**
 * NeuroAdapt Configuration
 * Configure accessibility adapters for your application
 */

export default {
  adapters: {
    ${adapter === 'openai' || adapter === 'all' ? `
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      features: ['cognitive-assistance', 'content-adaptation']
    },` : ''}
    ${adapter === 'claude' || adapter === 'all' ? `
    claude: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: 'claude-3-sonnet-20240229',
      features: ['cognitive-assistance', 'content-simplification']
    },` : ''}
    ${adapter === 'ollama' || adapter === 'all' ? `
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: 'llama2',
      features: ['local-processing', 'privacy-focused']
    },` : ''}
  },
  accessibility: {
    cognitive: {
      enabled: true,
      adaptationLevel: 'medium',
      processingPace: 'normal'
    },
    sensory: {
      enabled: true,
      highContrast: false,
      motionReduction: false,
      fontSize: 16
    },
    motor: {
      enabled: true,
      keyboardNavigation: true,
      largerTargets: false
    }
  }
};
`;
}

function generateExampleUsage(adapter: string): string {
  return `/**
 * NeuroAdapt Usage Example
 * Example implementation of accessibility adapters
 */

import { createAdapter } from '@neuroadapt/ai';
import { PreferenceStore } from '@neuroadapt/core';
import config from '../neuroadapt.config.js';

// Initialize preference store
const preferences = new PreferenceStore({ key: 'neuroadapt-prefs' });

// Create adapter based on configuration
${adapter === 'openai' || adapter === 'all' ? `
// OpenAI Adapter Example
const openaiAdapter = createAdapter('openai', {
  apiKey: config.adapters.openai?.apiKey,
  model: config.adapters.openai?.model
});
` : ''}

${adapter === 'claude' || adapter === 'all' ? `
// Claude Adapter Example  
const claudeAdapter = createAdapter('claude', {
  apiKey: config.adapters.claude?.apiKey,
  model: config.adapters.claude?.model
});
` : ''}

${adapter === 'ollama' || adapter === 'all' ? `
// Ollama Adapter Example
const ollamaAdapter = createAdapter('ollama', {
  baseUrl: config.adapters.ollama?.baseUrl,
  model: config.adapters.ollama?.model
});
` : ''}

// Example: Adapt content for cognitive accessibility
export async function adaptContentForUser(content: string) {
  try {
    const userPrefs = await preferences.load();
    
    if (userPrefs?.cognitive.explanationLevel === 'simple') {
      ${adapter === 'openai' ? 'const result = await openaiAdapter.simplifyContent(content);' : 
        adapter === 'claude' ? 'const result = await claudeAdapter.simplifyContent(content);' :
        adapter === 'ollama' ? 'const result = await ollamaAdapter.simplifyContent(content);' :
        'const result = await openaiAdapter.simplifyContent(content);'}
      return result.adaptedContent;
    }
    
    return content;
  } catch (error) {
    console.error('Content adaptation failed:', error);
    return content; // Fallback to original content
  }
}

// Example: Get personalized accessibility recommendations
export async function getAccessibilityRecommendations() {
  try {
    const userPrefs = await preferences.load();
    
    ${adapter === 'openai' ? 'const recommendations = await openaiAdapter.getRecommendations(userPrefs);' : 
      adapter === 'claude' ? 'const recommendations = await claudeAdapter.getRecommendations(userPrefs);' :
      adapter === 'ollama' ? 'const recommendations = await ollamaAdapter.getRecommendations(userPrefs);' :
      'const recommendations = await openaiAdapter.getRecommendations(userPrefs);'}
    
    return recommendations;
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    return [];
  }
}
`;
} 