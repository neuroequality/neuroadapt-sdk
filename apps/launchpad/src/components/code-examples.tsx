'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Check } from 'lucide-react'

export function CodeExamples() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const examples = {
    core: {
      basic: `import { PreferenceStore, VisualAdapter } from '@neuroadapt/core';

// Initialize preferences
const store = new PreferenceStore();
await store.initialize();

// Apply visual adaptations
const adapter = new VisualAdapter(store.getSensoryPreferences(), {
  autoApply: true
});

// Listen for preference changes
store.on('change', (changes) => {
  if (changes.sensory) {
    adapter.applyAdaptations(changes.sensory);
  }
});`,
      hooks: `import { usePreferences, useSensoryFocus } from '@neuroadapt/core';

function MyComponent() {
  const { 
    sensoryPreferences, 
    cognitivePreferences,
    updateSensoryPreference 
  } = usePreferences();

  const { isActive, toggle } = useSensoryFocus(sensoryPreferences, {
    autoApply: true
  });

  return (
    <div>
      <button onClick={() => updateSensoryPreference('darkMode', !sensoryPreferences.darkMode)}>
        Toggle Dark Mode
      </button>
      <button onClick={toggle}>
        {isActive ? 'Disable' : 'Enable'} Sensory Focus
      </button>
    </div>
  );
}`,
      cognitive: `import { CognitiveLoadEngine } from '@neuroadapt/core';

const engine = new CognitiveLoadEngine({
  preferences: cognitivePreferences
});

// Analyze text complexity
const metrics = engine.analyzeText(document.body.textContent);

// Listen for overload detection
engine.on('strategy-suggested', (strategy, context) => {
  if (strategy === 'chunk') {
    // Break content into smaller pieces
  } else if (strategy === 'offerBreak') {
    // Suggest a break to the user
  }
});

// Apply adaptations
const adaptedText = engine.applyStrategy('simplifyLanguage', originalText);`
    },
    ai: {
      basic: `import { PredictableAI, OpenAIAdapter } from '@neuroadapt/ai';

// Initialize AI adapter
const adapter = new OpenAIAdapter({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-turbo-preview'
});

// Create predictable AI instance
const ai = new PredictableAI(adapter, {
  tone: 'calm-supportive',
  explanationLevel: 'simple',
  consistencyLevel: 'high',
  allowUndo: true
});

// Generate response
const response = await ai.complete('Explain quantum computing');
console.log(response.content);`,
      streaming: `// Stream responses for better UX
for await (const chunk of ai.stream('Tell me about accessibility')) {
  if (chunk.done) {
    console.log('Stream complete');
  } else {
    process.stdout.write(chunk.delta);
  }
}

// Handle events
ai.on('response:start', ({ prompt }) => {
  console.log('Starting response for:', prompt);
});

ai.on('response:complete', ({ response }) => {
  console.log('Response completed:', response.content);
});`,
      cognitive: `// Sync with cognitive preferences
ai.updateFromCognitivePreferences(cognitivePreferences);

// Use undo functionality
const response1 = await ai.complete('First question');
const response2 = await ai.complete('Second question');

// Go back to previous response
const previousState = ai.undo();
if (previousState) {
  console.log('Restored:', previousState.response.content);
}`
    },
    integration: {
      nextjs: `// pages/_app.tsx
import { PreferenceProvider } from '@neuroadapt/core/react';

export default function App({ Component, pageProps }) {
  return (
    <PreferenceProvider>
      <Component {...pageProps} />
    </PreferenceProvider>
  );
}

// components/AccessibleComponent.tsx
import { usePreferences } from '@neuroadapt/core';

export function AccessibleComponent() {
  const { sensoryPreferences } = usePreferences();
  
  return (
    <div 
      className={sensoryPreferences.highContrast ? 'high-contrast' : ''}
      style={{ fontSize: \`\${sensoryPreferences.fontSize}em\` }}
    >
      Content adapts automatically
    </div>
  );
}`,
      vite: `// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['@neuroadapt/core', '@neuroadapt/ai']
  },
  build: {
    rollupOptions: {
      external: ['@neuroadapt/core', '@neuroadapt/ai']
    }
  }
});`,
      testing: `import { render, screen } from '@testing-library/react';
import { PreferenceStore, MemoryPreferenceStorage } from '@neuroadapt/core';

test('respects motion reduction preference', () => {
  const store = new PreferenceStore({
    storage: new MemoryPreferenceStorage()
  });
  
  store.updatePreferences({
    sensory: { motionReduction: true }
  });
  
  render(<MyComponent store={store} />);
  
  expect(document.documentElement).toHaveClass('neuro-motion-reduced');
});`
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Code Examples</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Get started quickly with these comprehensive examples showing how to integrate 
          NeuroAdapt SDK into your applications.
        </p>
      </div>

      <Tabs defaultValue="core" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="core">Core Package</TabsTrigger>
          <TabsTrigger value="ai">AI Package</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="core" className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Setup</CardTitle>
              <CardDescription>
                Initialize the preference store and visual adapter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{examples.core.basic}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(examples.core.basic, 'core-basic')}
                >
                  {copiedCode === 'core-basic' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>React Hooks</CardTitle>
              <CardDescription>
                Use React hooks for seamless integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{examples.core.hooks}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(examples.core.hooks, 'core-hooks')}
                >
                  {copiedCode === 'core-hooks' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cognitive Load Management</CardTitle>
              <CardDescription>
                Detect and respond to cognitive overload
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{examples.core.cognitive}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(examples.core.cognitive, 'core-cognitive')}
                >
                  {copiedCode === 'core-cognitive' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Predictable AI Setup</CardTitle>
              <CardDescription>
                Create consistent, adaptive AI responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{examples.ai.basic}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(examples.ai.basic, 'ai-basic')}
                >
                  {copiedCode === 'ai-basic' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Streaming Responses</CardTitle>
              <CardDescription>
                Handle real-time AI responses with events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{examples.ai.streaming}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(examples.ai.streaming, 'ai-streaming')}
                >
                  {copiedCode === 'ai-streaming' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cognitive Integration</CardTitle>
              <CardDescription>
                Sync AI behavior with cognitive preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{examples.ai.cognitive}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(examples.ai.cognitive, 'ai-cognitive')}
                >
                  {copiedCode === 'ai-cognitive' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Next.js Integration</CardTitle>
              <CardDescription>
                Set up NeuroAdapt in a Next.js application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{examples.integration.nextjs}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(examples.integration.nextjs, 'integration-nextjs')}
                >
                  {copiedCode === 'integration-nextjs' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vite Configuration</CardTitle>
              <CardDescription>
                Configure Vite for optimal NeuroAdapt bundling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{examples.integration.vite}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(examples.integration.vite, 'integration-vite')}
                >
                  {copiedCode === 'integration-vite' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Testing</CardTitle>
              <CardDescription>
                Test accessibility features in your components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{examples.integration.testing}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(examples.integration.testing, 'integration-testing')}
                >
                  {copiedCode === 'integration-testing' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>
            Install and start using NeuroAdapt SDK
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Installation</h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline">npm</Badge>
              <code className="bg-muted px-2 py-1 rounded text-sm">
                npm install @neuroadapt/core @neuroadapt/ai
              </code>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Package Overview</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Badge>@neuroadapt/core</Badge>
                <span className="text-sm text-muted-foreground">Preferences & adaptations</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge>@neuroadapt/ai</Badge>
                <span className="text-sm text-muted-foreground">Predictable AI interface</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge>@neuroadapt/vr</Badge>
                <span className="text-sm text-muted-foreground">VR safe spaces (coming)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge>@neuroadapt/quantum</Badge>
                <span className="text-sm text-muted-foreground">Quantum visualization (coming)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}