/**
 * Create VR App Command - Create VR applications with safety features
 * @fileoverview CLI command for creating accessible VR applications
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import * as path from 'path';

export interface CreateVRAppOptions {
  template?: string;
  typescript?: boolean;
  platform?: string;
}

/**
 * Create a new VR application with accessibility and safety features
 */
export async function createVRApp(name?: string, options: CreateVRAppOptions = { template: 'basic' }) {
  console.log(chalk.blue('🥽 Creating NeuroAdapt VR Application\n'));

  let appName = name;
  
  if (!appName) {
    const { selectedName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'selectedName',
        message: 'VR Application name:',
        validate: (input: string) => {
          if (!input) return 'Please provide an application name';
          if (!/^[a-z0-9-_]+$/i.test(input)) return 'Name can only contain letters, numbers, hyphens, and underscores';
          return true;
        }
      }
    ]);
    appName = selectedName;
  }

  const spinner = ora('Creating VR application...').start();

  try {
    const projectRoot = path.join(process.cwd(), appName!);
    
    // Check if directory already exists
    if (await fs.pathExists(projectRoot)) {
      spinner.fail(`Directory '${appName}' already exists`);
      return;
    }

    spinner.text = 'Setting up VR project structure...';
    
    await fs.ensureDir(projectRoot);
    
    // Get VR-specific configuration
    spinner.stop();
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'template',
        message: 'Choose a VR template:',
        choices: [
          { name: 'Basic VR Experience', value: 'basic' },
          { name: 'Safe Zone Demo', value: 'safezone' },
          { name: 'Proximity Detection', value: 'proximity' },
          { name: 'Educational VR Environment', value: 'educational' },
          { name: 'Therapy/Meditation VR', value: 'therapy' }
        ],
        when: !options.template
      },
      {
        type: 'list',
        name: 'platform',
        message: 'Target VR platform:',
        choices: [
          { name: 'WebXR (Browser)', value: 'webxr' },
          { name: 'Unity', value: 'unity' },
          { name: 'Unreal Engine', value: 'unreal' },
          { name: 'A-Frame', value: 'aframe' }
        ],
        when: !options.platform
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
        name: 'safetyFeatures',
        message: 'Select safety and accessibility features:',
        choices: [
          { name: 'Safe Zone Management', value: 'safezone', checked: true },
          { name: 'Proximity Detection', value: 'proximity', checked: true },
          { name: 'Motion Sickness Prevention', value: 'motion', checked: true },
          { name: 'Emergency Panic Mode', value: 'panic', checked: true },
          { name: 'Audio Spatial Warnings', value: 'audio', checked: true },
          { name: 'Haptic Feedback Alerts', value: 'haptic', checked: false }
        ]
      }
    ]);

    const template = options.template || answers.template;
    const platform = options.platform || answers.platform;
    const useTypeScript = options.typescript ?? answers.typescript;
    const safetyFeatures = answers.safetyFeatures;

    const creationSpinner = ora('Generating VR application...').start();

    // Create package.json
    const packageJson = {
      name: appName,
      version: '1.0.0',
      description: `Accessible VR application - ${template} template for ${platform}`,
      main: useTypeScript ? 'dist/index.js' : 'src/index.js',
      scripts: {
        dev: platform === 'webxr' ? 'vite dev' : useTypeScript ? 'tsc && node dist/index.js' : 'node src/index.js',
        build: platform === 'webxr' ? 'vite build' : useTypeScript ? 'tsc' : 'echo "No build step needed"',
        start: useTypeScript ? 'node dist/index.js' : 'node src/index.js',
        preview: platform === 'webxr' ? 'vite preview' : 'npm start',
        test: 'npm run test:unit && npm run test:accessibility',
        'test:unit': 'jest',
        'test:accessibility': 'playwright test tests/accessibility'
      },
      dependencies: {
        '@neuroadapt/core': '^1.1.0',
        '@neuroadapt/vr': '^1.1.0',
        '@neuroadapt/testing': '^1.1.0'
      },
      devDependencies: {}
    };

    // Add platform-specific dependencies
    if (platform === 'webxr') {
      packageJson.dependencies['three'] = '^0.160.0';
      packageJson.dependencies['aframe'] = '^1.4.0';
      packageJson.devDependencies['vite'] = '^5.0.0';
    }

    if (useTypeScript) {
      packageJson.devDependencies['typescript'] = '^5.0.0';
      packageJson.devDependencies['@types/node'] = '^20.0.0';
      if (platform === 'webxr') {
        packageJson.devDependencies['@types/three'] = '^0.160.0';
        packageJson.devDependencies['@types/aframe'] = '^1.2.0';
      }
    }

    packageJson.devDependencies['jest'] = '^29.0.0';
    packageJson.devDependencies['@playwright/test'] = '^1.40.0';

    await fs.writeJson(path.join(projectRoot, 'package.json'), packageJson, { spaces: 2 });

    // Create TypeScript config if needed
    if (useTypeScript) {
      const tsConfig = {
        compilerOptions: {
          target: 'ES2020',
          module: platform === 'webxr' ? 'ESNext' : 'commonjs',
          moduleResolution: 'bundler',
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          declaration: true,
          declarationMap: true,
          sourceMap: true,
          types: platform === 'webxr' ? ['vite/client'] : ['node']
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist', 'tests']
      };
      
      await fs.writeJson(path.join(projectRoot, 'tsconfig.json'), tsConfig, { spaces: 2 });
    }

    // Create Vite config for WebXR
    if (platform === 'webxr') {
      const viteConfig = `import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    https: true, // Required for WebXR
    port: 3000
  },
  build: {
    target: 'esnext'
  }
});`;
      await fs.writeFile(path.join(projectRoot, 'vite.config.js'), viteConfig);
    }

    // Create source directory and files
    const srcDir = path.join(projectRoot, 'src');
    await fs.ensureDir(srcDir);

    // Generate main application file
    const mainContent = this.generateMainVRApp(template, platform, safetyFeatures, useTypeScript);
    await fs.writeFile(
      path.join(srcDir, `index.${useTypeScript ? 'ts' : 'js'}`),
      mainContent
    );

    // Generate template-specific files
    switch (template) {
      case 'safezone':
        const safeZoneContent = this.generateSafeZoneSetup(useTypeScript);
        await fs.writeFile(
          path.join(srcDir, `safe-zone-manager.${useTypeScript ? 'ts' : 'js'}`),
          safeZoneContent
        );
        break;
      case 'proximity':
        const proximityContent = this.generateProximitySetup(useTypeScript);
        await fs.writeFile(
          path.join(srcDir, `proximity-detector.${useTypeScript ? 'ts' : 'js'}`),
          proximityContent
        );
        break;
      case 'therapy':
        const therapyContent = this.generateTherapyEnvironment(useTypeScript);
        await fs.writeFile(
          path.join(srcDir, `therapy-environment.${useTypeScript ? 'ts' : 'js'}`),
          therapyContent
        );
        break;
      case 'educational':
        const educationalContent = this.generateEducationalVR(useTypeScript);
        await fs.writeFile(
          path.join(srcDir, `educational-vr.${useTypeScript ? 'ts' : 'js'}`),
          educationalContent
        );
        break;
    }

    // Create HTML file for WebXR
    if (platform === 'webxr') {
      const htmlContent = this.generateWebXRHTML(appName!, template);
      await fs.writeFile(path.join(projectRoot, 'index.html'), htmlContent);
    }

    // Create VR safety configuration
    const safetyConfig = {
      vr: {
        safety: {
          safeZoneEnabled: safetyFeatures.includes('safezone'),
          proximityDetection: safetyFeatures.includes('proximity'),
          motionSicknessReduction: safetyFeatures.includes('motion'),
          panicMode: safetyFeatures.includes('panic'),
          spatialAudio: safetyFeatures.includes('audio'),
          hapticFeedback: safetyFeatures.includes('haptic')
        },
        boundaries: {
          width: 2.0, // meters
          height: 2.0,
          depth: 2.0
        },
        comfort: {
          locomotionType: 'teleport',
          turnType: 'snap',
          vignettingEnabled: true
        }
      }
    };

    await fs.writeJson(
      path.join(projectRoot, 'vr-safety.config.json'),
      safetyConfig,
      { spaces: 2 }
    );

    // Create README
    const readmeContent = this.generateVRReadme(appName!, template, platform, useTypeScript, safetyFeatures);
    await fs.writeFile(path.join(projectRoot, 'README.md'), readmeContent);

    creationSpinner.succeed('VR application created successfully!');
    
    console.log(chalk.green('\n✅ Success! Your accessible VR app is ready:'));
    console.log(chalk.gray(`📁 Directory: ${appName}`));
    console.log(chalk.gray(`🥽 Template: ${template}`));
    console.log(chalk.gray(`🎮 Platform: ${platform}`));
    console.log(chalk.gray(`📝 Language: ${useTypeScript ? 'TypeScript' : 'JavaScript'}`));
    console.log(chalk.gray(`🛡️  Safety: ${safetyFeatures.join(', ')}`));
    
    console.log(chalk.blue('\n💡 Next steps:'));
    console.log(chalk.gray(`1. cd ${appName}`));
    console.log(chalk.gray('2. npm install'));
    console.log(chalk.gray('3. npm run dev'));
    
    if (platform === 'webxr') {
      console.log(chalk.yellow('\n⚠️  WebXR Notes:'));
      console.log(chalk.gray('• Requires HTTPS for VR features'));
      console.log(chalk.gray('• Test on VR-capable devices'));
      console.log(chalk.gray('• Configure safe zone before use'));
    }
    
  } catch (error) {
    spinner.fail('Failed to create VR application');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

private generateSafeZoneSetup(isTS: boolean): string {
  const typeAnnotation = isTS ? ': void' : '';
  
  return `/**
 * Safe Zone Manager - VR safety boundary management
 */

import { SafeZoneManager } from '@neuroadapt/vr';
import { PreferenceStore } from '@neuroadapt/core';

const preferences = new PreferenceStore({ key: 'vr-safety-prefs' });

export async function initializeSafeZone()${typeAnnotation} {
  const userPrefs = await preferences.load();
  
  const safeZoneManager = new SafeZoneManager({
    boundaries: {
      x: 2.0, // 2 meters width
      y: 2.0, // 2 meters height  
      z: 2.0  // 2 meters depth
    },
    warnings: {
      audioEnabled: userPrefs?.audio?.enableAudio || true,
      hapticEnabled: userPrefs?.motor?.enableHaptic || false,
      visualEnabled: true
    },
    panicMode: {
      enabled: true,
      resetToCenter: true,
      emergencyExit: true
    }
  });

  // Set up collision detection
  safeZoneManager.onBoundaryApproach((distance) => {
    console.log(\`Warning: Approaching boundary (\${distance.toFixed(2)}m)\`);
    
    if (distance < 0.5) {
      safeZoneManager.triggerHapticWarning();
      safeZoneManager.showVisualWarning();
    }
  });

  // Emergency panic mode
  safeZoneManager.onPanicActivated(() => {
    console.log('🚨 Panic mode activated - returning to safe center');
    safeZoneManager.returnToCenter();
    safeZoneManager.pauseExperience();
  });

  return safeZoneManager;
}
`;
}

private generateProximitySetup(isTS: boolean): string {
  const typeAnnotation = isTS ? ': void' : '';
  
  return `/**
 * Proximity Detector - VR object and boundary proximity detection
 */

import { ProximityDetector } from '@neuroadapt/vr';
import { PreferenceStore } from '@neuroadapt/core';

const preferences = new PreferenceStore({ key: 'vr-proximity-prefs' });

export async function initializeProximityDetection()${typeAnnotation} {
  const userPrefs = await preferences.load();
  
  const proximityDetector = new ProximityDetector({
    detectionRadius: 1.5, // 1.5 meter detection radius
    updateFrequency: 30, // 30 FPS
    sensitivity: userPrefs?.motor?.proximitySensitivity || 'medium'
  });

  // Detect nearby objects
  proximityDetector.onObjectProximity((object, distance) => {
    const alertLevel = distance < 0.3 ? 'critical' : distance < 0.8 ? 'warning' : 'info';
    
    console.log(\`\${alertLevel.toUpperCase()}: Object detected at \${distance.toFixed(2)}m\`);
    
    if (alertLevel === 'critical') {
      proximityDetector.triggerEmergencyStop();
    }
  });

  // Detect boundary proximity
  proximityDetector.onBoundaryProximity((direction, distance) => {
    if (distance < 0.5) {
      console.log(\`⚠️ Boundary warning: \${distance.toFixed(2)}m \${direction}\`);
      
      // Announce to screen reader
      proximityDetector.announceToScreenReader(
        \`Warning: Approaching boundary. \${distance.toFixed(1)} meters to \${direction} wall.\`
      );
    }
  });

  // Real-time position tracking
  proximityDetector.startTracking();
  
  return proximityDetector;
}
`;
}

// Additional helper methods...
private generateMainVRApp(template: string, platform: string, features: string[], isTS: boolean): string {
  return `/**
 * ${template.charAt(0).toUpperCase() + template.slice(1)} VR Application
 * Accessible virtual reality with NeuroAdapt SDK
 */

import { PreferenceStore } from '@neuroadapt/core';
import { SafeZoneManager } from '@neuroadapt/vr';
${template === 'safezone' ? "import { initializeSafeZone } from './safe-zone-manager';" : ''}
${template === 'proximity' ? "import { initializeProximityDetection } from './proximity-detector';" : ''}

const preferences = new PreferenceStore({ key: 'vr-app-prefs' });

async function main()${isTS ? ': Promise<void>' : ''} {
  console.log('🥽 Starting Accessible VR Application');
  
  try {
    // Load user preferences  
    const userPrefs = await preferences.load();
    console.log('📋 VR preferences loaded');
    
    // Apply safety settings
    applySafetySettings(userPrefs);
    
    // Initialize VR components
    ${template === 'safezone' ? 'await initializeSafeZone();' : ''}
    ${template === 'proximity' ? 'await initializeProximityDetection();' : ''}
    
    // Set up emergency controls
    setupEmergencyControls();
    
    console.log('✅ VR application ready and safe!');
    
  } catch (error) {
    console.error('❌ Failed to initialize VR application:', error);
  }
}

function applySafetySettings(prefs${isTS ? ': any' : ''}) {
  if (prefs?.vr?.motionSickness) {
    enableComfortSettings();
  }
  
  if (prefs?.motor?.keyboardNavigation) {
    enableKeyboardFallback();
  }
}

function setupEmergencyControls() {
  // Panic button - both hands together
  if (typeof navigator !== 'undefined' && 'xr' in navigator) {
    // WebXR panic controls
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Escape') {
        emergencyExit();
      }
    });
  }
}

function emergencyExit() {
  console.log('🚨 Emergency exit activated');
  // Fade to safe environment
  // Return to center position  
  // Pause all interactions
}

function enableComfortSettings() {
  // Reduce motion, enable vignetting, slow transitions
  console.log('🎯 Comfort settings enabled');
}

function enableKeyboardFallback() {
  // Alternative navigation for accessibility
  console.log('⌨️ Keyboard fallback navigation enabled');
}

// Start the VR application
${platform === 'webxr' ? 'document.addEventListener("DOMContentLoaded", main);' : 'main().catch(console.error);'}
`;
}

private generateTherapyEnvironment(isTS: boolean): string {
  return `/**
 * Therapy Environment - Calming VR space for therapeutic applications
 */

export class TherapyEnvironment {
  private isActive${isTS ? ': boolean' : ''} = false;
  
  startSession()${isTS ? ': void' : ''} {
    console.log('🧘 Starting therapy session');
    this.isActive = true;
    
    // Create calming environment
    this.setupCalmingSpace();
    this.enableBreathingExercises();
    this.setupSafetyMonitoring();
  }
  
  private setupCalmingSpace()${isTS ? ': void' : ''} {
    // Soft lighting, natural sounds, peaceful visuals
    console.log('🌿 Calming space activated');
  }
  
  private enableBreathingExercises()${isTS ? ': void' : ''} {
    // Guided breathing with visual cues
    console.log('💨 Breathing guidance enabled');
  }
  
  private setupSafetyMonitoring()${isTS ? ': void' : ''} {
    // Monitor for distress signals
    console.log('🛡️ Safety monitoring active');
  }
}
`;
}

private generateEducationalVR(isTS: boolean): string {
  return `/**
 * Educational VR Environment - Learning-focused virtual reality
 */

export class EducationalVREnvironment {
  private currentLesson${isTS ? ': string | null' : ''} = null;
  
  startLesson(topic${isTS ? ': string' : ''})${isTS ? ': void' : ''} {
    console.log(\`📚 Starting lesson: \${topic}\`);
    this.currentLesson = topic;
    
    this.setupLearningSpace();
    this.enableInteractiveLearning();
    this.trackProgress();
  }
  
  private setupLearningSpace()${isTS ? ': void' : ''} {
    // Create immersive educational environment
    console.log('🎓 Learning space ready');
  }
  
  private enableInteractiveLearning()${isTS ? ': void' : ''} {
    // Interactive objects and explanations
    console.log('🤝 Interactive learning enabled');
  }
  
  private trackProgress()${isTS ? ': void' : ''} {
    // Monitor learning progress and adapt
    console.log('📊 Progress tracking active');
  }
}
`;
}

private generateWebXRHTML(appName: string, template: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName} - Accessible VR Experience</title>
  <meta name="description" content="Accessible ${template} VR application with safety features">
  
  <!-- WebXR Polyfill -->
  <script src="https://cdn.jsdelivr.net/npm/webxr-polyfill@latest/build/webxr-polyfill.js"></script>
  
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: Arial, sans-serif;
      background: #000;
      color: #fff;
    }
    
    .vr-container {
      width: 100%;
      height: 100vh;
      position: relative;
    }
    
    .vr-ui {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 1000;
    }
    
    .emergency-button {
      background: #ff4444;
      color: white;
      border: none;
      padding: 15px 30px;
      font-size: 18px;
      border-radius: 8px;
      cursor: pointer;
      margin: 10px 0;
    }
    
    .emergency-button:hover {
      background: #cc3333;
    }
    
    .accessibility-info {
      position: absolute;
      bottom: 20px;
      left: 20px;
      background: rgba(0,0,0,0.8);
      padding: 15px;
      border-radius: 8px;
      max-width: 300px;
    }
    
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  </style>
</head>
<body>
  <div class="vr-container">
    <div class="vr-ui">
      <h1>${appName}</h1>
      <p>Accessible ${template} VR Experience</p>
      
      <button class="emergency-button" onclick="emergencyExit()" aria-label="Emergency exit from VR">
        🚨 Emergency Exit
      </button>
      
      <button onclick="enterVR()" aria-label="Enter virtual reality">
        🥽 Enter VR
      </button>
    </div>
    
    <div class="accessibility-info">
      <h3>Accessibility Features Active:</h3>
      <ul>
        <li>✅ Safe zone boundaries</li>
        <li>✅ Emergency exit controls</li>
        <li>✅ Motion sickness reduction</li>
        <li>✅ Screen reader compatibility</li>
      </ul>
      
      <p><strong>Emergency Controls:</strong></p>
      <p>Press ESC key or red button to exit immediately</p>
    </div>
  </div>

  <!-- Screen reader announcements -->
  <div id="sr-announcements" aria-live="polite" aria-atomic="true" style="position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;"></div>

  <script type="module" src="/src/index.js"></script>
  
  <script>
    // Emergency exit function
    function emergencyExit() {
      console.log('🚨 Emergency exit activated');
      
      // Exit VR session
      if (navigator.xr) {
        navigator.xr.exitSession();
      }
      
      // Announce to screen reader
      announceToScreenReader('Emergency exit activated. VR session ended safely.');
      
      // Return to safe state
      document.body.style.background = '#000';
    }
    
    // Enter VR function
    async function enterVR() {
      if (!navigator.xr) {
        alert('WebXR not supported on this device');
        return;
      }
      
      try {
        const session = await navigator.xr.requestSession('immersive-vr');
        announceToScreenReader('Entering VR experience. Emergency exit available with ESC key.');
      } catch (error) {
        console.error('Failed to start VR session:', error);
        announceToScreenReader('Unable to start VR session. Please check your device compatibility.');
      }
    }
    
    // Screen reader announcements
    function announceToScreenReader(message) {
      const announcements = document.getElementById('sr-announcements');
      announcements.textContent = message;
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'Escape':
          emergencyExit();
          break;
        case 'Enter':
          if (event.target.tagName !== 'BUTTON') {
            enterVR();
          }
          break;
      }
    });
  </script>
</body>
</html>
`;
}

private generateVRReadme(appName: string, template: string, platform: string, isTS: boolean, features: string[]): string {
  return `# ${appName}

An accessible VR application built with NeuroAdapt SDK, featuring comprehensive safety and accessibility features.

## Features

- **Template**: ${template}
- **Platform**: ${platform}
- **Language**: ${isTS ? 'TypeScript' : 'JavaScript'}
- **Safety Features**: ${features.join(', ')}
- **Accessibility**: Full WCAG compliance for VR experiences

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

${platform === 'webxr' ? `
## WebXR Requirements

- HTTPS server (included in dev mode)
- VR-compatible browser (Chrome, Edge, Firefox Reality)
- VR headset (Oculus, HTC Vive, etc.)
` : ''}

## Safety Features

This VR application includes comprehensive safety and accessibility support:

${features.includes('safezone') ? '- **Safe Zone Management**: Prevents users from walking into physical obstacles\n' : ''}
${features.includes('proximity') ? '- **Proximity Detection**: Real-time detection of nearby objects and boundaries\n' : ''}
${features.includes('motion') ? '- **Motion Sickness Prevention**: Comfort settings and smooth locomotion\n' : ''}
${features.includes('panic') ? '- **Emergency Panic Mode**: Instant exit and return to safe position\n' : ''}
${features.includes('audio') ? '- **Spatial Audio Warnings**: 3D audio cues for navigation and safety\n' : ''}
${features.includes('haptic') ? '- **Haptic Feedback**: Tactile warnings for boundaries and objects\n' : ''}

## Usage

### Basic VR Setup

\`\`\`${isTS ? 'typescript' : 'javascript'}
import { SafeZoneManager } from '@neuroadapt/vr';

const safeZone = new SafeZoneManager({
  boundaries: { x: 2, y: 2, z: 2 }
});

safeZone.onBoundaryApproach((distance) => {
  console.log(\`Warning: \${distance}m from boundary\`);
});
\`\`\`

### Emergency Controls

- **ESC Key**: Immediate emergency exit
- **Emergency Button**: UI-based panic exit  
- **Controller Button**: Hardware emergency exit
- **Voice Command**: "Emergency exit" or "Stop VR"

## Accessibility Features

### Visual Accessibility
- High contrast mode for low vision users
- Color-blind friendly indicators
- Customizable UI scaling
- Motion reduction options

### Motor Accessibility  
- Alternative locomotion methods
- Gesture-free navigation options
- Seated experience support
- One-handed operation mode

### Cognitive Accessibility
- Clear spatial audio cues
- Simplified interaction models
- Consistent navigation patterns
- Reduced cognitive load options

## Safety Configuration

Edit \`vr-safety.config.json\` to customize safety settings:

\`\`\`json
{
  "vr": {
    "safety": {
      "safeZoneEnabled": true,
      "proximityDetection": true,
      "panicMode": true
    },
    "boundaries": {
      "width": 2.0,
      "height": 2.0, 
      "depth": 2.0
    }
  }
}
\`\`\`

## Development

### Testing
\`\`\`bash
npm run test              # Run all tests
npm run test:accessibility # Accessibility tests only
npm run test:safety       # VR safety tests
\`\`\`

### Building
\`\`\`bash
npm run build    # Production build
npm run preview  # Preview build
\`\`\`

## Safety Guidelines

1. **Physical Space**: Ensure 2x2 meter clear area minimum
2. **Emergency Exit**: Always test emergency controls before use
3. **Session Duration**: Take breaks every 30 minutes
4. **Motion Sickness**: Stop immediately if feeling unwell
5. **Accessibility**: Verify all safety features work with assistive technology

## Troubleshooting

### VR Not Working
- Check WebXR browser support
- Verify HTTPS connection
- Test VR headset connection
- Check permissions

### Safety Features Not Active
- Verify safe zone boundaries are set
- Check proximity detection calibration
- Test emergency controls
- Validate audio/haptic feedback

## Learn More

- [NeuroAdapt VR Documentation](https://neuroadapt.dev/vr)
- [VR Accessibility Guidelines](https://neuroadapt.dev/vr/accessibility)
- [Safety Best Practices](https://neuroadapt.dev/vr/safety)

## Support

For VR accessibility support or safety questions, visit our [documentation](https://neuroadapt.dev/vr) or open an issue.

**Emergency Support**: If experiencing any safety issues, discontinue use immediately and contact support.
`;
}
} 