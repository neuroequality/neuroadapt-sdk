/**
 * Export Profile Command - Export accessibility preferences
 * @fileoverview CLI command for exporting user accessibility profiles
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';

export interface ExportProfileOptions {
  output?: string;
  format?: 'json' | 'yaml' | 'js';
  includePersonalData?: boolean;
}

/**
 * Export accessibility profile from project
 */
export async function exportProfile(profileName?: string, options: ExportProfileOptions = {}) {
  console.log(chalk.blue('📤 Exporting NeuroAdapt Accessibility Profile\n'));

  const spinner = ora('Scanning for accessibility profiles...').start();

  try {
    const projectRoot = process.cwd();
    const preferencesPath = path.join(projectRoot, '.neuroadapt', 'preferences.json');
    const configPath = path.join(projectRoot, 'neuroadapt.config.js');
    
    if (!await fs.pathExists(preferencesPath)) {
      spinner.fail('No accessibility preferences found in this project.');
      console.log(chalk.gray('Run your application first to generate preferences, or use `neuroadapt create-app` to start fresh.'));
      return;
    }

    spinner.text = 'Loading preferences...';
    
    const preferences = await fs.readJson(preferencesPath);
    let config = {};
    
    if (await fs.pathExists(configPath)) {
      // Dynamic import for ES modules
      const configModule = await import(path.resolve(configPath));
      config = configModule.default || configModule;
    }

    spinner.stop();

    // Get export options from user if not provided
    let format = options.format;
    let outputPath = options.output;
    let includePersonalData = options.includePersonalData;

    if (!format || !outputPath) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'format',
          message: 'Export format:',
          choices: [
            { name: 'JSON (recommended)', value: 'json' },
            { name: 'JavaScript/ES Module', value: 'js' },
            { name: 'YAML', value: 'yaml' }
          ],
          when: !format
        },
        {
          type: 'input',
          name: 'outputPath',
          message: 'Output file path:',
          default: `accessibility-profile.${format || 'json'}`,
          when: !outputPath
        },
        {
          type: 'confirm',
          name: 'includePersonalData',
          message: 'Include personal data (usage analytics, session data)?',
          default: false,
          when: includePersonalData === undefined
        }
      ]);

      format = format || answers.format;
      outputPath = outputPath || answers.outputPath;
      includePersonalData = includePersonalData ?? answers.includePersonalData;
    }

    const exportSpinner = ora('Generating profile export...').start();

    // Create exportable profile
    const profile = createExportableProfile(preferences, config, includePersonalData);
    
    // Generate output content based on format
    let content: string;
    const resolvedOutputPath = path.resolve(outputPath!);
    
    switch (format) {
      case 'json':
        content = JSON.stringify(profile, null, 2);
        break;
      case 'js':
        content = generateJSExport(profile);
        break;
      case 'yaml':
        content = generateYAMLExport(profile);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    await fs.ensureDir(path.dirname(resolvedOutputPath));
    await fs.writeFile(resolvedOutputPath, content, 'utf8');

    exportSpinner.succeed('Profile exported successfully!');
    
    console.log(chalk.green('\n✅ Export completed:'));
    console.log(chalk.gray(`📁 File: ${resolvedOutputPath}`));
    console.log(chalk.gray(`📊 Format: ${format?.toUpperCase()}`));
    console.log(chalk.gray(`🔒 Personal data: ${includePersonalData ? 'Included' : 'Excluded'}`));
    
    console.log(chalk.blue('\n💡 Usage:'));
    console.log(chalk.gray('• Share this profile with other developers'));
    console.log(chalk.gray('• Import it using `neuroadapt import-profile`'));
    console.log(chalk.gray('• Use it as a template for new projects'));
    
  } catch (error) {
    spinner.fail('Failed to export profile');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

function createExportableProfile(preferences: any, config: any, includePersonalData: boolean) {
  const profile = {
    name: preferences.name || 'Accessibility Profile',
    version: '1.1.0',
    createdAt: new Date().toISOString(),
    accessibility: {
      cognitive: {
        readingSpeed: preferences.cognitive?.readingSpeed || 'normal',
        processingPace: preferences.cognitive?.processingPace || 'normal',
        explanationLevel: preferences.cognitive?.explanationLevel || 'standard',
        allowInterruptions: preferences.cognitive?.allowInterruptions ?? true
      },
      sensory: {
        highContrast: preferences.sensory?.highContrast || false,
        darkMode: preferences.sensory?.darkMode || false,
        motionReduction: preferences.sensory?.motionReduction || false,
        fontSize: preferences.sensory?.fontSize || 16,
        colorVisionFilter: preferences.sensory?.colorVisionFilter || 'none'
      },
      motor: {
        keyboardNavigation: preferences.motor?.keyboardNavigation || false,
        mouseAlternatives: preferences.motor?.mouseAlternatives || false,
        targetSizeIncrease: preferences.motor?.targetSizeIncrease || 0,
        dwellTime: preferences.motor?.dwellTime || 500
      },
      audio: {
        enableAudio: preferences.audio?.enableAudio || false,
        enableCaptions: preferences.audio?.enableCaptions || false,
        volume: preferences.audio?.volume || 0.7,
        audioDescription: preferences.audio?.audioDescription || false
      }
    },
    configuration: {
      adapters: config.adapters || {},
      features: config.features || {}
    }
  };

  if (includePersonalData && preferences.analytics) {
    profile.analytics = {
      usagePatterns: preferences.analytics.usagePatterns,
      adaptationHistory: preferences.analytics.adaptationHistory,
      performanceMetrics: preferences.analytics.performanceMetrics
    };
  }

  return profile;
}

function generateJSExport(profile: any): string {
  return `/**
 * NeuroAdapt Accessibility Profile
 * Generated on ${new Date().toISOString()}
 */

export default ${JSON.stringify(profile, null, 2)};

export const accessibilityPreferences = ${JSON.stringify(profile.accessibility, null, 2)};

export const adapterConfiguration = ${JSON.stringify(profile.configuration, null, 2)};
`;
}

function generateYAMLExport(profile: any): string {
  // Simple YAML generation (for basic structures)
  const yamlContent = Object.entries(profile)
    .map(([key, value]) => `${key}: ${JSON.stringify(value, null, 2)}`)
    .join('\n');
    
  return `# NeuroAdapt Accessibility Profile
# Generated on ${new Date().toISOString()}

${yamlContent}
`;
} 