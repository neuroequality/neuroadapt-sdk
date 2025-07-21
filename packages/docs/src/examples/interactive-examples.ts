/**
 * Interactive Examples - Live code examples for NeuroAdapt SDK
 * @fileoverview Provides interactive, executable examples for all SDK features
 */

export interface CodeExample {
  id: string;
  title: string;
  description: string;
  category: 'core' | 'ai' | 'quantum' | 'vr' | 'mobile' | 'testing' | 'enterprise';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  code: string;
  dependencies: string[];
  expectedOutput?: string;
  interactive: boolean;
  runnable: boolean;
}

export interface ExampleSection {
  title: string;
  description: string;
  examples: CodeExample[];
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  sections: TutorialSection[];
  resources: Resource[];
}

export interface TutorialSection {
  title: string;
  content: string;
  codeExample?: CodeExample;
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  starterCode: string;
  solution: string;
  hints: string[];
  validation: (code: string) => { passed: boolean; message: string };
}

export interface Resource {
  title: string;
  type: 'documentation' | 'video' | 'article' | 'tool' | 'reference';
  url: string;
  description: string;
}

/**
 * Interactive Examples Manager
 */
export class InteractiveExamplesManager {
  private examples: Map<string, CodeExample> = new Map();
  private sections: ExampleSection[] = [];
  private tutorials: Map<string, Tutorial> = new Map();

  constructor() {
    this.initializeExamples();
    this.initializeTutorials();
  }

  /**
   * Get all examples by category
   */
  getExamplesByCategory(category: string): CodeExample[] {
    return Array.from(this.examples.values()).filter(example => example.category === category);
  }

  /**
   * Get example by ID
   */
  getExample(id: string): CodeExample | undefined {
    return this.examples.get(id);
  }

  /**
   * Get all sections
   */
  getSections(): ExampleSection[] {
    return this.sections;
  }

  /**
   * Get tutorial by ID
   */
  getTutorial(id: string): Tutorial | undefined {
    return this.tutorials.get(id);
  }

  /**
   * Get all tutorials
   */
  getTutorials(): Tutorial[] {
    return Array.from(this.tutorials.values());
  }

  /**
   * Execute code example
   */
  async executeExample(id: string): Promise<{ output: string; error?: string }> {
    const example = this.examples.get(id);
    if (!example || !example.runnable) {
      return { output: '', error: 'Example not found or not runnable' };
    }

    try {
      // In a real implementation, this would use a sandboxed code execution environment
      const result = await this.simulateCodeExecution(example.code);
      return { output: result };
    } catch (error) {
      return { 
        output: '', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Validate exercise solution
   */
  validateExercise(tutorialId: string, exerciseId: string, code: string): { passed: boolean; message: string } {
    const tutorial = this.tutorials.get(tutorialId);
    if (!tutorial) {
      return { passed: false, message: 'Tutorial not found' };
    }

    for (const section of tutorial.sections) {
      const exercise = section.exercises.find(ex => ex.id === exerciseId);
      if (exercise) {
        return exercise.validation(code);
      }
    }

    return { passed: false, message: 'Exercise not found' };
  }

  // Private initialization methods
  private initializeExamples(): void {
    // Core Examples
    this.addExample({
      id: 'basic-preferences',
      title: 'Basic Preference Management',
      description: 'Learn how to create and manage user accessibility preferences',
      category: 'core',
      difficulty: 'beginner',
      tags: ['preferences', 'storage', 'accessibility'],
      interactive: true,
      runnable: true,
      dependencies: ['@neuroadapt/core'],
      code: `import { PreferenceStore, createDefaultPreferences } from '@neuroadapt/core';

// Create a preference store
const store = new PreferenceStore();

// Create default preferences
const defaultPrefs = createDefaultPreferences();

// Update visual preferences
const updatedPrefs = {
  ...defaultPrefs,
  sensory: {
    ...defaultPrefs.sensory,
    highContrast: true,
    fontSize: 18,
    motionReduction: true
  }
};

// Save preferences
await store.save(updatedPrefs);

// Load preferences
const savedPrefs = await store.load();

console.log('Saved preferences:', savedPrefs);`,
      expectedOutput: 'Saved preferences with high contrast, larger font, and motion reduction enabled'
    });

    this.addExample({
      id: 'visual-adapter',
      title: 'Visual Adaptation System',
      description: 'Implement visual adaptations for accessibility',
      category: 'core',
      difficulty: 'intermediate',
      tags: ['visual', 'adaptation', 'sensory'],
      interactive: true,
      runnable: true,
      dependencies: ['@neuroadapt/core'],
      code: `import { VisualAdapter } from '@neuroadapt/core';

// Create visual adapter
const adapter = new VisualAdapter();

// Configure for high contrast
await adapter.applyHighContrast({
  enabled: true,
  contrastRatio: 7.0,
  colorScheme: 'dark'
});

// Configure for motion reduction
await adapter.applyMotionReduction({
  enabled: true,
  reducedAnimations: true,
  staticPreferences: true
});

// Configure for font scaling
await adapter.applyFontScaling({
  scale: 1.5,
  minimumSize: 16,
  maximumSize: 32
});

console.log('Visual adaptations applied successfully');`,
      expectedOutput: 'High contrast, motion reduction, and font scaling configured'
    });

    // AI Examples
    this.addExample({
      id: 'ai-prediction',
      title: 'AI-Powered Preference Prediction',
      description: 'Use AI to predict user accessibility needs',
      category: 'ai',
      difficulty: 'intermediate',
      tags: ['ai', 'prediction', 'machine-learning'],
      interactive: true,
      runnable: true,
      dependencies: ['@neuroadapt/ai'],
      code: `import { PredictableAI } from '@neuroadapt/ai';

// Initialize AI predictor
const predictor = new PredictableAI();

// User interaction data
const userInteractions = [
  { type: 'click', element: 'button', timestamp: Date.now() - 1000, success: false },
  { type: 'scroll', element: 'page', timestamp: Date.now() - 500, success: true },
  { type: 'click', element: 'link', timestamp: Date.now(), success: true }
];

// Predict user needs
const prediction = await predictor.predictUserNeeds(userInteractions);

console.log('Predicted accessibility needs:', prediction);

// Get adaptation recommendations
const recommendations = await predictor.getAdaptationRecommendations(prediction);

console.log('Recommended adaptations:', recommendations);`,
      expectedOutput: 'AI predictions and recommendations based on user interaction patterns'
    });

    // Enterprise Examples
    this.addExample({
      id: 'sso-integration',
      title: 'Enterprise SSO Integration',
      description: 'Integrate with enterprise SSO systems',
      category: 'enterprise',
      difficulty: 'advanced',
      tags: ['sso', 'enterprise', 'authentication'],
      interactive: true,
      runnable: false,
      dependencies: ['@neuroadapt/ai'],
      code: `import { SSOManager } from '@neuroadapt/ai/enterprise';

// Configure SSO manager
const ssoManager = new SSOManager({
  defaultProvider: 'azure_ad',
  sessionTimeout: 8 * 60 * 60 * 1000,
  auditLogging: true
});

// Add Azure AD provider
ssoManager.addProvider({
  name: 'azure_ad',
  type: 'oidc',
  config: {
    clientId: 'your-client-id',
    issuer: 'https://login.microsoftonline.com/tenant-id/v2.0',
    redirectURI: '/auth/callback/azure',
    scopes: ['openid', 'profile', 'email', 'accessibility_preferences'],
    accessibilityClaimMapping: {
      preferencesClaim: 'accessibility_preferences',
      roleClaim: 'roles',
      departmentClaim: 'department',
      accessibilityNeedsClaim: 'accessibility_needs',
      accommodationsClaim: 'accommodations'
    }
  },
  enabled: true
});

// Initiate authentication
const { authUrl, state } = await ssoManager.authenticate('azure_ad');

console.log('Authentication URL:', authUrl);

// Handle callback (in production, this would be triggered by the redirect)
// const session = await ssoManager.handleCallback('azure_ad', authCode, state);`,
      expectedOutput: 'SSO authentication flow configured with accessibility preferences sync'
    });

    // Mobile Examples
    this.addExample({
      id: 'mobile-provider',
      title: 'React Native Accessibility Provider',
      description: 'Set up mobile accessibility features',
      category: 'mobile',
      difficulty: 'beginner',
      tags: ['mobile', 'react-native', 'provider'],
      interactive: true,
      runnable: false,
      dependencies: ['@neuroadapt/mobile', 'react-native'],
      code: `import React from 'react';
import { View, Text, Button } from 'react-native';
import { 
  MobileAccessibilityProvider, 
  useMobileAccessibility,
  useScreenReader,
  useHapticFeedback 
} from '@neuroadapt/mobile';

// Main app component
function App() {
  return (
    <MobileAccessibilityProvider
      hapticEnabled={true}
      announcements={true}
      onPreferencesChange={(prefs) => console.log('Preferences updated:', prefs)}
    >
      <AccessibleComponent />
    </MobileAccessibilityProvider>
  );
}

// Component using accessibility features
function AccessibleComponent() {
  const { state, actions } = useMobileAccessibility();
  const { announce } = useScreenReader();
  const { trigger } = useHapticFeedback();

  const handlePress = () => {
    announce('Button pressed');
    trigger('light');
    actions.updatePreferences({
      sensory: { fontSize: 18 }
    });
  };

  return (
    <View>
      <Text style={{ fontSize: state.largeText ? 20 : 16 }}>
        Accessible Mobile App
      </Text>
      <Button 
        title="Accessible Button"
        onPress={handlePress}
        accessibilityLabel="Press to update accessibility settings"
        accessibilityRole="button"
      />
    </View>
  );
}

export default App;`,
      expectedOutput: 'React Native app with accessibility provider and mobile-specific features'
    });

    // VR Examples
    this.addExample({
      id: 'vr-safe-zones',
      title: 'VR Safe Zone Management',
      description: 'Implement safe zones for VR accessibility',
      category: 'vr',
      difficulty: 'advanced',
      tags: ['vr', 'safety', 'spatial'],
      interactive: true,
      runnable: false,
      dependencies: ['@neuroadapt/vr'],
      code: `import { SafeZoneManager } from '@neuroadapt/vr';

// Create safe zone manager
const safeZoneManager = new SafeZoneManager({
  defaultZoneType: 'rectangular',
  emergencyStopEnabled: true,
  proximityWarningDistance: 0.5,
  hapticFeedbackEnabled: true
});

// Define safe zone boundary
const safeZone = {
  id: 'main-play-area',
  type: 'rectangular' as const,
  center: { x: 0, y: 0, z: 0 },
  dimensions: { width: 3, height: 2.5, depth: 3 },
  rotation: { x: 0, y: 0, z: 0 },
  metadata: {
    name: 'Main Play Area',
    description: 'Primary safe zone for VR activities'
  }
};

// Register the safe zone
safeZoneManager.addSafeZone(safeZone);

// Monitor user position
safeZoneManager.on('boundary_approached', (event) => {
  console.log('User approaching boundary:', event.distance);
  // Trigger visual/haptic warnings
});

safeZoneManager.on('boundary_exceeded', (event) => {
  console.log('User exceeded safe zone!');
  // Trigger emergency stop or guidance back to safe area
});

// Start monitoring
await safeZoneManager.startMonitoring();

console.log('VR safe zone monitoring active');`,
      expectedOutput: 'VR safe zone configured with boundary monitoring and emergency protocols'
    });

    // Testing Examples
    this.addExample({
      id: 'accessibility-testing',
      title: 'Automated Accessibility Testing',
      description: 'Set up automated accessibility tests',
      category: 'testing',
      difficulty: 'intermediate',
      tags: ['testing', 'automation', 'wcag'],
      interactive: true,
      runnable: true,
      dependencies: ['@neuroadapt/testing'],
      code: `import { WCAGValidator, NeuroAdaptTestRunner } from '@neuroadapt/testing';

// Create WCAG validator
const validator = new WCAGValidator({
  level: 'AA',
  includeNeuroAdaptRules: true
});

// Create test runner
const testRunner = new NeuroAdaptTestRunner({
  headless: true,
  viewportSize: { width: 1280, height: 720 }
});

// Run accessibility tests
async function runAccessibilityTests() {
  // Validate page accessibility
  const pageResult = await validator.validatePage('https://example.com');
  console.log('Page validation result:', pageResult);

  // Set accessibility preferences for testing
  await testRunner.setAccessibilityPreferences({
    motionReduction: true,
    highContrast: true,
    fontSize: 18
  });

  // Test keyboard navigation
  const keyboardResult = await testRunner.testKeyboardNavigation({
    startElement: 'body',
    expectedFocusOrder: ['#nav', '#main', '#footer']
  });
  console.log('Keyboard navigation result:', keyboardResult);

  // Test screen reader compatibility
  const screenReaderResult = await testRunner.testScreenReaderCompatibility({
    checkLabels: true,
    checkRoles: true,
    checkLandmarks: true
  });
  console.log('Screen reader result:', screenReaderResult);

  // Generate comprehensive report
  const report = await testRunner.generateReport();
  console.log('Test report:', report.summary);
}

runAccessibilityTests();`,
      expectedOutput: 'Comprehensive accessibility test results with WCAG compliance scores'
    });

    // Organize examples into sections
    this.sections = [
      {
        title: 'Getting Started',
        description: 'Basic examples to get you started with NeuroAdapt SDK',
        examples: [
          this.examples.get('basic-preferences')!,
          this.examples.get('visual-adapter')!
        ]
      },
      {
        title: 'AI-Powered Features',
        description: 'Examples using AI for adaptive accessibility',
        examples: [
          this.examples.get('ai-prediction')!
        ]
      },
      {
        title: 'Mobile Development',
        description: 'React Native and mobile-specific accessibility',
        examples: [
          this.examples.get('mobile-provider')!
        ]
      },
      {
        title: 'Enterprise Integration',
        description: 'Enterprise features and SSO integration',
        examples: [
          this.examples.get('sso-integration')!
        ]
      },
      {
        title: 'VR & Spatial Computing',
        description: 'Virtual reality and spatial accessibility features',
        examples: [
          this.examples.get('vr-safe-zones')!
        ]
      },
      {
        title: 'Testing & Quality Assurance',
        description: 'Automated testing and validation',
        examples: [
          this.examples.get('accessibility-testing')!
        ]
      }
    ];
  }

  private initializeTutorials(): void {
    // Beginner Tutorial
    this.addTutorial({
      id: 'getting-started',
      title: 'Getting Started with NeuroAdapt SDK',
      description: 'Learn the basics of implementing accessibility features',
      duration: 30,
      difficulty: 'beginner',
      prerequisites: ['Basic JavaScript/TypeScript knowledge', 'React familiarity'],
      sections: [
        {
          title: 'Setting Up Your First Accessible App',
          content: `In this section, you'll learn how to set up the NeuroAdapt SDK in your React application and create your first accessible component.

The NeuroAdapt SDK provides a comprehensive suite of tools for creating accessible applications that adapt to neurodivergent users' needs.`,
          codeExample: this.examples.get('basic-preferences'),
          exercises: [
            {
              id: 'setup-preferences',
              title: 'Create Custom Preferences',
              description: 'Create a custom preference configuration for a user with ADHD',
              starterCode: `import { createDefaultPreferences } from '@neuroadapt/core';

const customPrefs = createDefaultPreferences();
// TODO: Modify preferences for ADHD support`,
              solution: `import { createDefaultPreferences } from '@neuroadapt/core';

const customPrefs = createDefaultPreferences();
customPrefs.cognitive.processingPace = 'relaxed';
customPrefs.cognitive.chunkSize = 3;
customPrefs.sensory.motionReduction = true;
customPrefs.cognitive.allowInterruptions = false;`,
              hints: [
                'ADHD users often benefit from reduced processing pace',
                'Smaller chunk sizes help with focus',
                'Motion reduction can reduce distractions'
              ],
              validation: (code: string) => {
                const hasProcessingPace = code.includes('processingPace');
                const hasChunkSize = code.includes('chunkSize');
                const hasMotionReduction = code.includes('motionReduction');
                
                if (hasProcessingPace && hasChunkSize && hasMotionReduction) {
                  return { passed: true, message: 'Great! You\'ve configured appropriate ADHD support settings.' };
                }
                return { passed: false, message: 'Make sure to set processingPace, chunkSize, and motionReduction.' };
              }
            }
          ]
        }
      ],
      resources: [
        {
          title: 'NeuroAdapt Core API Reference',
          type: 'documentation',
          url: '/docs/api/core',
          description: 'Complete API documentation for the core package'
        },
        {
          title: 'Accessibility Guidelines for Developers',
          type: 'article',
          url: '/guides/accessibility-guidelines',
          description: 'Best practices for implementing accessible applications'
        }
      ]
    });

    // Advanced Tutorial
    this.addTutorial({
      id: 'enterprise-deployment',
      title: 'Enterprise Deployment with SSO',
      description: 'Learn to deploy NeuroAdapt SDK in enterprise environments',
      duration: 60,
      difficulty: 'advanced',
      prerequisites: [
        'Enterprise development experience',
        'SSO/OAuth knowledge',
        'DevOps familiarity'
      ],
      sections: [
        {
          title: 'Configuring Enterprise SSO',
          content: `Enterprise deployments require careful consideration of SSO integration, preference synchronization, and compliance requirements.

This tutorial covers setting up Azure AD integration, syncing accessibility preferences across enterprise systems, and maintaining WCAG compliance at scale.`,
          codeExample: this.examples.get('sso-integration'),
          exercises: [
            {
              id: 'sso-config',
              title: 'Configure SSO Provider',
              description: 'Set up a complete SSO configuration for your organization',
              starterCode: `import { SSOManager } from '@neuroadapt/ai/enterprise';

// TODO: Configure SSO manager with your organization's settings`,
              solution: `import { SSOManager } from '@neuroadapt/ai/enterprise';

const ssoManager = new SSOManager({
  defaultProvider: 'okta',
  sessionTimeout: 8 * 60 * 60 * 1000,
  auditLogging: true,
  encryptionKey: process.env.SSO_ENCRYPTION_KEY
});

ssoManager.addProvider({
  name: 'okta',
  type: 'oidc',
  config: {
    clientId: process.env.OKTA_CLIENT_ID,
    issuer: process.env.OKTA_ISSUER,
    redirectURI: '/auth/callback/okta',
    scopes: ['openid', 'profile', 'email', 'accessibility_preferences']
  },
  enabled: true
});`,
              hints: [
                'Use environment variables for sensitive configuration',
                'Enable audit logging for compliance',
                'Include accessibility_preferences in scopes'
              ],
              validation: (code: string) => {
                const hasEnvironmentVars = code.includes('process.env');
                const hasAuditLogging = code.includes('auditLogging: true');
                const hasAccessibilityScope = code.includes('accessibility_preferences');
                
                if (hasEnvironmentVars && hasAuditLogging && hasAccessibilityScope) {
                  return { passed: true, message: 'Excellent! You\'ve configured secure enterprise SSO.' };
                }
                return { passed: false, message: 'Ensure you use environment variables, enable audit logging, and include accessibility scopes.' };
              }
            }
          ]
        }
      ],
      resources: [
        {
          title: 'Enterprise Security Best Practices',
          type: 'documentation',
          url: '/docs/enterprise/security',
          description: 'Security considerations for enterprise deployments'
        },
        {
          title: 'SSO Integration Video Tutorial',
          type: 'video',
          url: '/videos/sso-integration',
          description: 'Step-by-step video guide for SSO setup'
        }
      ]
    });
  }

  private addExample(example: CodeExample): void {
    this.examples.set(example.id, example);
  }

  private addTutorial(tutorial: Tutorial): void {
    this.tutorials.set(tutorial.id, tutorial);
  }

  private async simulateCodeExecution(code: string): Promise<string> {
    // Simulate code execution for demonstration
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (code.includes('console.log')) {
      // Extract console.log statements for simulation
      const logs = code.match(/console\.log\(['"`]([^'"`]+)['"`]\)/g);
      if (logs) {
        return logs.map(log => log.replace(/console\.log\(['"`]([^'"`]+)['"`]\)/, '$1')).join('\n');
      }
    }
    
    return 'Code executed successfully';
  }
}

export default InteractiveExamplesManager; 