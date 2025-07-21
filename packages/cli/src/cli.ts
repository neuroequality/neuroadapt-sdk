#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createApp } from './commands/create-app.js';
import { createQuantumApp } from './commands/create-quantum-app.js';
import { createVRApp } from './commands/create-vr-app.js';
import { addAdapter } from './commands/add-adapter.js';
import { exportProfile } from './commands/export-profile.js';
import { importProfile } from './commands/import-profile.js';
import { initProject } from './commands/init-project.js';

const program = new Command();

program
  .name('neuroadapt')
  .description('CLI tools for NeuroAdapt SDK - Accessibility-first development')
  .version('1.1.0');

// Create app command
program
  .command('create-app')
  .alias('create')
  .description('Create a new NeuroAdapt application')
  .argument('[name]', 'Application name')
  .option('-t, --template <template>', 'Template to use (react, vue, vanilla, next)', 'react')
  .option('-d, --dir <directory>', 'Output directory')
  .option('--skip-install', 'Skip package installation')
  .option('--skip-git', 'Skip git initialization')
  .action(createApp);

// Create quantum app command
program
  .command('create-quantum-app')
  .alias('quantum')
  .description('Create a new accessible quantum computing application')
  .argument('[name]', 'Application name')
  .option('-t, --template <template>', 'Template to use (basic, educational, research)', 'basic')
  .option('-d, --dir <directory>', 'Output directory')
  .option('--bloch-sphere', 'Include Bloch sphere visualization')
  .option('--circuit-builder', 'Include quantum circuit builder')
  .option('--typescript', 'Use TypeScript')
  .option('--skip-install', 'Skip package installation')
  .action(createQuantumApp);

// Create VR app command
program
  .command('create-vr-app')
  .alias('vr')
  .description('Create a new accessible VR application with safety features')
  .argument('[name]', 'Application name')
  .option('-t, --template <template>', 'Template to use (basic, educational, therapeutic)', 'basic')
  .option('-d, --dir <directory>', 'Output directory')
  .option('--safe-zones', 'Include safe zone management')
  .option('--proximity-detection', 'Include proximity detection')
  .option('--typescript', 'Use TypeScript')
  .option('--skip-install', 'Skip package installation')
  .action(createVRApp);

// Add adapter command
program
  .command('add-adapter')
  .alias('add')
  .description('Add an AI adapter to existing project')
  .argument('[adapter]', 'Adapter type (openai, claude, ollama)')
  .option('-k, --key <apiKey>', 'API key for the adapter')
  .option('--no-config', 'Skip configuration setup')
  .action(addAdapter);

// Init project command
program
  .command('init')
  .description('Initialize NeuroAdapt in existing project')
  .option('-f, --framework <framework>', 'Framework (react, vue, vanilla)', 'react')
  .option('--typescript', 'Use TypeScript')
  .option('--skip-install', 'Skip package installation')
  .action(initProject);

// Export profile command
program
  .command('export-profile')
  .alias('export')
  .description('Export user preference profile')
  .argument('[output]', 'Output file path', 'neuroadapt-profile.json')
  .option('-p, --profile <profileId>', 'Profile ID to export', 'default')
  .option('--pretty', 'Pretty print JSON output')
  .action(exportProfile);

// Import profile command
program
  .command('import-profile')
  .alias('import')
  .description('Import user preference profile')
  .argument('<input>', 'Input file path')
  .option('-p, --profile <profileId>', 'Profile ID to import as', 'imported')
  .option('--overwrite', 'Overwrite existing profile')
  .action(importProfile);

// Help command
program
  .command('help')
  .description('Show help information')
  .action(() => {
    console.log(chalk.cyan.bold('NeuroAdapt CLI - Accessibility-First Development Tools\n'));
    
    console.log(chalk.white('🚀 Quick Start:'));
    console.log('  npx @neuroadapt/cli create-app my-app');
    console.log('  npx @neuroadapt/cli quantum quantum-demo');
    console.log('  npx @neuroadapt/cli vr vr-experience');
    console.log('  cd my-app && npm run dev\n');
    
    console.log(chalk.white('📦 Commands:'));
    console.log('  create-app         Create a new NeuroAdapt application');
    console.log('  create-quantum-app Create accessible quantum computing app');
    console.log('  create-vr-app      Create safe VR app with accessibility features');
    console.log('  add-adapter        Add AI adapter to existing project');
    console.log('  init               Initialize NeuroAdapt in existing project');
    console.log('  export             Export user preference profile');
    console.log('  import             Import user preference profile\n');
    
    console.log(chalk.white('🔧 Examples:'));
    console.log('  neuroadapt create-app --template next');
    console.log('  neuroadapt quantum my-qc-app --bloch-sphere --typescript');
    console.log('  neuroadapt vr my-vr-app --safe-zones --proximity-detection');
    console.log('  neuroadapt add-adapter openai --key sk-...');
    console.log('  neuroadapt export --profile my-profile --pretty\n');
    
    console.log(chalk.white('♿ Accessibility Features:'));
    console.log('  • Screen reader support and ARIA labels');
    console.log('  • Keyboard navigation and focus management');
    console.log('  • High contrast mode and font scaling');
    console.log('  • Motion reduction and sensory accommodations');
    console.log('  • VR safety protocols and emergency modes');
    console.log('  • Quantum visualization with color-blind support\n');
    
    console.log(chalk.gray('For more help: neuroadapt <command> --help'));
  });

// Error handling
program.configureHelp({
  sortSubcommands: true,
});

program.parseAsync().catch((error) => {
  console.error(chalk.red('Error:'), error.message);
  process.exit(1);
});

export { program };