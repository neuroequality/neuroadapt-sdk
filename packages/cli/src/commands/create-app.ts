import { prompts } from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { copySync, ensureDirSync, writeJsonSync, readJsonSync } from 'fs-extra';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('..', import.meta.url));

interface CreateAppOptions {
  template: string;
  dir?: string;
  skipInstall?: boolean;
  skipGit?: boolean;
}

export async function createApp(name?: string, options: CreateAppOptions = {}) {
  console.log(chalk.cyan.bold('🧠 Creating NeuroAdapt Application\n'));

  // Get app name if not provided
  if (!name) {
    const response = await prompts([
      {
        type: 'input',
        name: 'appName',
        message: 'What is your app name?',
        default: 'my-neuroadapt-app',
        validate: (value: string) => {
          if (!value.trim()) return 'App name is required';
          if (!/^[a-z0-9-_]+$/i.test(value)) return 'App name can only contain letters, numbers, hyphens, and underscores';
          return true;
        }
      }
    ]);
    name = response.appName;
  }

  // Validate template
  const availableTemplates = ['react', 'vue', 'vanilla', 'next', 'vite'];
  if (!availableTemplates.includes(options.template)) {
    console.error(chalk.red(`Template "${options.template}" is not available.`));
    console.log(chalk.gray(`Available templates: ${availableTemplates.join(', ')}`));
    process.exit(1);
  }

  const targetDir = options.dir || resolve(process.cwd(), name);
  const templateDir = join(__dirname, '..', 'templates', options.template);

  console.log(chalk.gray(`Creating app in: ${targetDir}`));
  console.log(chalk.gray(`Using template: ${options.template}\n`));

  const spinner = ora('Creating project structure...').start();

  try {
    // Ensure target directory exists
    ensureDirSync(targetDir);

    // Copy template files
    copySync(templateDir, targetDir);

    // Update package.json with app name
    const packageJsonPath = join(targetDir, 'package.json');
    const packageJson = readJsonSync(packageJsonPath);
    packageJson.name = name;
    writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });

    spinner.succeed('Project structure created');

    // Install dependencies
    if (!options.skipInstall) {
      const installSpinner = ora('Installing dependencies...').start();
      try {
        execSync('npm install', { cwd: targetDir, stdio: 'ignore' });
        installSpinner.succeed('Dependencies installed');
      } catch (error) {
        installSpinner.fail('Failed to install dependencies');
        console.log(chalk.yellow('You can install dependencies manually by running:'));
        console.log(chalk.cyan(`  cd ${name}`));
        console.log(chalk.cyan('  npm install\n'));
      }
    }

    // Initialize git
    if (!options.skipGit) {
      const gitSpinner = ora('Initializing git repository...').start();
      try {
        execSync('git init', { cwd: targetDir, stdio: 'ignore' });
        execSync('git add .', { cwd: targetDir, stdio: 'ignore' });
        execSync('git commit -m "Initial commit with NeuroAdapt SDK"', { cwd: targetDir, stdio: 'ignore' });
        gitSpinner.succeed('Git repository initialized');
      } catch (error) {
        gitSpinner.fail('Failed to initialize git repository');
      }
    }

    // Success message
    console.log(chalk.green.bold('\n✅ Success! Created NeuroAdapt app'));
    console.log(chalk.gray(`\n📁 Project created at: ${targetDir}`));
    
    console.log(chalk.white('\n🚀 Next steps:'));
    if (process.cwd() !== targetDir) {
      console.log(chalk.cyan(`  cd ${name}`));
    }
    if (options.skipInstall) {
      console.log(chalk.cyan('  npm install'));
    }
    console.log(chalk.cyan('  npm run dev'));
    
    console.log(chalk.white('\n📚 Learn more:'));
    console.log('  Docs: https://neuroadapt.dev/docs');
    console.log('  Examples: https://neuroadapt.dev/examples');
    console.log('  Community: https://discord.gg/neuroadapt');

    console.log(chalk.white('\n🎨 Customize your app:'));
    console.log('  • Edit preferences in src/preferences.json');
    console.log('  • Add AI adapters with: neuroadapt add-adapter');
    console.log('  • Configure accessibility settings in the UI');
    
  } catch (error) {
    spinner.fail('Failed to create project');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

// Helper function to get prompts dynamically
async function prompts(questions: any[]): Promise<any> {
  const inquirer = await import('inquirer');
  return inquirer.default.prompt(questions);
}