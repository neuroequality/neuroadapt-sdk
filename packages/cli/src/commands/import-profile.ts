/**
 * Import Profile Command - Import accessibility preferences
 * @fileoverview CLI command for importing user accessibility profiles
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';

export interface ImportProfileOptions {
  merge?: boolean;
  force?: boolean;
  backup?: boolean;
}

/**
 * Import accessibility profile into project
 */
export async function importProfile(profilePath?: string, options: ImportProfileOptions = {}) {
  console.log(chalk.blue('📥 Importing NeuroAdapt Accessibility Profile\n'));

  let inputPath = profilePath;
  
  if (!inputPath) {
    const { selectedPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'selectedPath',
        message: 'Path to accessibility profile file:',
        validate: async (input: string) => {
          if (!input) return 'Please provide a file path';
          if (!await fs.pathExists(input)) return 'File does not exist';
          return true;
        }
      }
    ]);
    inputPath = selectedPath;
  }

  const spinner = ora('Loading profile...').start();

  try {
    const projectRoot = process.cwd();
    const preferencesPath = path.join(projectRoot, '.neuroadapt', 'preferences.json');
    const configPath = path.join(projectRoot, 'neuroadapt.config.js');
    
    // Check if profile file exists
    if (!await fs.pathExists(inputPath!)) {
      spinner.fail(`Profile file not found: ${inputPath}`);
      return;
    }

    spinner.text = 'Parsing profile data...';
    
    // Load and parse profile based on file extension
    const ext = path.extname(inputPath!).toLowerCase();
    let profile: any;
    
    if (ext === '.json') {
      profile = await fs.readJson(inputPath!);
    } else if (ext === '.js' || ext === '.mjs') {
      const profileModule = await import(path.resolve(inputPath!));
      profile = profileModule.default || profileModule;
    } else {
      throw new Error(`Unsupported file format: ${ext}. Supported formats: .json, .js, .mjs`);
    }

    // Validate profile structure
    validateProfileStructure(profile);

    spinner.text = 'Checking existing configuration...';
    
    // Check for existing preferences
    const hasExistingPrefs = await fs.pathExists(preferencesPath);
    const hasExistingConfig = await fs.pathExists(configPath);
    
    let shouldProceed = true;
    let mergeMode = options.merge;
    let createBackup = options.backup;

    if ((hasExistingPrefs || hasExistingConfig) && !options.force) {
      spinner.stop();
      
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'Existing accessibility configuration found. What would you like to do?',
          choices: [
            { name: 'Merge with existing settings', value: 'merge' },
            { name: 'Replace existing settings', value: 'replace' },
            { name: 'Cancel import', value: 'cancel' }
          ]
        },
        {
          type: 'confirm',
          name: 'backup',
          message: 'Create backup of existing configuration?',
          default: true,
          when: (answers) => answers.action !== 'cancel'
        }
      ]);

      if (answers.action === 'cancel') {
        console.log(chalk.yellow('Import cancelled by user.'));
        return;
      }

      mergeMode = answers.action === 'merge';
      createBackup = answers.backup;
      shouldProceed = true;
    }

    if (!shouldProceed) return;

    const importSpinner = ora('Importing profile...').start();

    // Create backup if requested
    if (createBackup && (hasExistingPrefs || hasExistingConfig)) {
      const backupDir = path.join(projectRoot, '.neuroadapt', 'backups');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      await fs.ensureDir(backupDir);
      
      if (hasExistingPrefs) {
        await fs.copy(preferencesPath, path.join(backupDir, `preferences-${timestamp}.json`));
      }
      if (hasExistingConfig) {
        await fs.copy(configPath, path.join(backupDir, `config-${timestamp}.js`));
      }
      
      importSpinner.text = 'Backup created, applying new settings...';
    }

    // Apply profile settings
    await applyProfileSettings(profile, projectRoot, mergeMode, hasExistingPrefs, hasExistingConfig);

    importSpinner.succeed('Profile imported successfully!');
    
    console.log(chalk.green('\n✅ Import completed:'));
    console.log(chalk.gray(`📁 Source: ${inputPath}`));
    console.log(chalk.gray(`🔄 Mode: ${mergeMode ? 'Merged' : 'Replaced'}`));
    console.log(chalk.gray(`💾 Backup: ${createBackup ? 'Created' : 'Skipped'}`));
    
    console.log(chalk.blue('\n💡 Next steps:'));
    console.log(chalk.gray('• Restart your application to apply new settings'));
    console.log(chalk.gray('• Verify accessibility features are working as expected'));
    console.log(chalk.gray('• Customize settings further if needed'));
    
  } catch (error) {
    spinner.fail('Failed to import profile');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

function validateProfileStructure(profile: any) {
  if (!profile || typeof profile !== 'object') {
    throw new Error('Invalid profile: must be an object');
  }

  if (!profile.accessibility) {
    throw new Error('Invalid profile: missing accessibility configuration');
  }

  const required = ['cognitive', 'sensory', 'motor', 'audio'];
  for (const section of required) {
    if (!profile.accessibility[section]) {
      throw new Error(`Invalid profile: missing accessibility.${section} configuration`);
    }
  }
}

async function applyProfileSettings(
  profile: any, 
  projectRoot: string, 
  mergeMode: boolean, 
  hasExistingPrefs: boolean, 
  hasExistingConfig: boolean
) {
  const preferencesPath = path.join(projectRoot, '.neuroadapt', 'preferences.json');
  const configPath = path.join(projectRoot, 'neuroadapt.config.js');

  // Apply preferences
  let preferences = profile.accessibility;
  
  if (mergeMode && hasExistingPrefs) {
    const existing = await fs.readJson(preferencesPath);
    preferences = mergeDeep(existing, preferences);
  }

  // Add metadata
  preferences.importedAt = new Date().toISOString();
  preferences.importedFrom = profile.name || 'Unknown Profile';
  preferences.version = profile.version || '1.1.0';

  await fs.ensureDir(path.dirname(preferencesPath));
  await fs.writeJson(preferencesPath, preferences, { spaces: 2 });

  // Apply configuration if present
  if (profile.configuration) {
    let config = profile.configuration;
    
    if (mergeMode && hasExistingConfig) {
      const existingModule = await import(path.resolve(configPath));
      const existing = existingModule.default || existingModule;
      config = mergeDeep(existing, config);
    }

    const configContent = generateConfigFile(config);
    await fs.writeFile(configPath, configContent);
  }
}

function mergeDeep(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = mergeDeep(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

function generateConfigFile(config: any): string {
  return `/**
 * NeuroAdapt Configuration
 * Imported on ${new Date().toISOString()}
 */

export default ${JSON.stringify(config, null, 2)};
`;
} 