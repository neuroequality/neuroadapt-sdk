/**
 * API Documentation
 * @fileoverview Auto-generated API documentation for all NeuroAdapt packages
 */

// Re-export all public APIs for documentation
export * from '@neuroadapt/core';
export * from '@neuroadapt/ai';
export * from '@neuroadapt/quantum';
export * from '@neuroadapt/vr';
export * from '@neuroadapt/mobile';
export * from '@neuroadapt/testing';

// Documentation metadata
export interface PackageDocumentation {
  name: string;
  version: string;
  description: string;
  mainFeatures: string[];
  apiReference: string;
  examples: string[];
  guides: string[];
}

export const packageDocs: Record<string, PackageDocumentation> = {
  core: {
    name: '@neuroadapt/core',
    version: '1.1.0',
    description: 'Core accessibility features and preference management',
    mainFeatures: [
      'Preference management and storage',
      'Visual accessibility adaptations',
      'Cognitive load monitoring',
      'Focus management system',
      'Sensory adaptation engine'
    ],
    apiReference: '/docs/api/core',
    examples: ['basic-preferences', 'visual-adapter', 'cognitive-monitoring'],
    guides: ['getting-started', 'preference-management', 'visual-adaptations']
  },
  ai: {
    name: '@neuroadapt/ai',
    version: '1.1.0',
    description: 'AI-powered accessibility personalization and enterprise features',
    mainFeatures: [
      'Predictive AI for user needs',
      'Adaptive learning systems',
      'Enterprise SSO integration',
      'Analytics dashboard',
      'Neural adaptation networks'
    ],
    apiReference: '/docs/api/ai',
    examples: ['ai-prediction', 'sso-integration', 'analytics-dashboard'],
    guides: ['ai-integration', 'enterprise-deployment', 'analytics-setup']
  },
  mobile: {
    name: '@neuroadapt/mobile',
    version: '1.1.0',
    description: 'React Native and mobile accessibility features',
    mainFeatures: [
      'React Native provider',
      'Platform-specific adaptations',
      'Gesture customization',
      'Mobile testing utilities',
      'Cross-platform compatibility'
    ],
    apiReference: '/docs/api/mobile',
    examples: ['mobile-provider', 'gesture-management', 'mobile-testing'],
    guides: ['mobile-setup', 'react-native-integration', 'gesture-customization']
  },
  vr: {
    name: '@neuroadapt/vr',
    version: '1.1.0',
    description: 'Virtual and augmented reality accessibility',
    mainFeatures: [
      'Safe zone management',
      'Proximity detection',
      'VR accessibility adaptations',
      'Spatial awareness',
      'Emergency protocols'
    ],
    apiReference: '/docs/api/vr',
    examples: ['vr-safe-zones', 'proximity-detection', 'vr-accessibility'],
    guides: ['vr-setup', 'safety-configuration', 'spatial-accessibility']
  },
  quantum: {
    name: '@neuroadapt/quantum',
    version: '1.1.0',
    description: 'Quantum-enhanced accessibility computing',
    mainFeatures: [
      'Quantum algorithms for accessibility',
      'Bloch sphere visualization',
      'Quantum optimization',
      'Advanced computing capabilities'
    ],
    apiReference: '/docs/api/quantum',
    examples: ['quantum-optimization', 'bloch-sphere', 'quantum-algorithms'],
    guides: ['quantum-setup', 'quantum-computing-basics', 'accessibility-optimization']
  },
  testing: {
    name: '@neuroadapt/testing',
    version: '1.1.0',
    description: 'Comprehensive accessibility testing and validation',
    mainFeatures: [
      'WCAG compliance testing',
      'Automated accessibility validation',
      'E2E testing utilities',
      'Custom accessibility assertions',
      'Reporting and analytics'
    ],
    apiReference: '/docs/api/testing',
    examples: ['accessibility-testing', 'wcag-validation', 'e2e-testing'],
    guides: ['testing-setup', 'accessibility-validation', 'automated-testing']
  }
}; 