/**
 * Documentation Guides
 * @fileoverview Export comprehensive guides and tutorials
 */

// Guide metadata
export interface Guide {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'advanced' | 'enterprise' | 'mobile' | 'vr' | 'testing';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  prerequisites: string[];
  tags: string[];
  content: string;
}

export const guides: Guide[] = [
  {
    id: 'comprehensive-guide',
    title: 'NeuroAdapt SDK: Comprehensive Implementation Guide',
    description: 'Complete guide to implementing accessibility features with NeuroAdapt SDK',
    category: 'getting-started',
    difficulty: 'beginner',
    estimatedTime: 45,
    prerequisites: ['Basic React knowledge', 'JavaScript/TypeScript familiarity'],
    tags: ['getting-started', 'accessibility', 'implementation'],
    content: '' // Would be loaded from comprehensive-guide.md
  },
  {
    id: 'accessibility-best-practices',
    title: 'Accessibility Best Practices',
    description: 'Best practices for creating inclusive, accessible applications',
    category: 'getting-started',
    difficulty: 'intermediate',
    estimatedTime: 30,
    prerequisites: ['Basic accessibility knowledge'],
    tags: ['best-practices', 'wcag', 'inclusive-design'],
    content: ''
  },
  {
    id: 'enterprise-deployment',
    title: 'Enterprise Deployment Guide',
    description: 'Deploy NeuroAdapt SDK in enterprise environments',
    category: 'enterprise',
    difficulty: 'advanced',
    estimatedTime: 60,
    prerequisites: ['Enterprise development experience', 'SSO knowledge'],
    tags: ['enterprise', 'deployment', 'sso', 'scaling'],
    content: ''
  },
  {
    id: 'mobile-accessibility',
    title: 'Mobile Accessibility Implementation',
    description: 'Implement accessibility features in React Native apps',
    category: 'mobile',
    difficulty: 'intermediate',
    estimatedTime: 40,
    prerequisites: ['React Native experience'],
    tags: ['mobile', 'react-native', 'cross-platform'],
    content: ''
  },
  {
    id: 'vr-safety-guidelines',
    title: 'VR Safety and Accessibility Guidelines',
    description: 'Implement safe and accessible VR experiences',
    category: 'vr',
    difficulty: 'advanced',
    estimatedTime: 50,
    prerequisites: ['VR development experience'],
    tags: ['vr', 'safety', 'spatial-computing'],
    content: ''
  },
  {
    id: 'testing-automation',
    title: 'Automated Accessibility Testing',
    description: 'Set up comprehensive accessibility testing pipelines',
    category: 'testing',
    difficulty: 'intermediate',
    estimatedTime: 35,
    prerequisites: ['Testing framework knowledge'],
    tags: ['testing', 'automation', 'ci-cd', 'quality-assurance'],
    content: ''
  }
];

// Guide utilities
export function getGuidesByCategory(category: string): Guide[] {
  return guides.filter(guide => guide.category === category);
}

export function getGuidesByDifficulty(difficulty: string): Guide[] {
  return guides.filter(guide => guide.difficulty === difficulty);
}

export function getGuidesByTags(tags: string[]): Guide[] {
  return guides.filter(guide => 
    tags.some(tag => guide.tags.includes(tag))
  );
}

export function searchGuides(query: string): Guide[] {
  const lowerQuery = query.toLowerCase();
  return guides.filter(guide =>
    guide.title.toLowerCase().includes(lowerQuery) ||
    guide.description.toLowerCase().includes(lowerQuery) ||
    guide.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
} 