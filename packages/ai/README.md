# @neuroadapt/ai

AI-powered adaptive preferences and content optimization for neurodivergent users. This package provides machine learning capabilities, behavior analytics, and AI provider integrations for the NeuroAdapt SDK.

## Features

- 🧠 **Predictive AI Engine**: Machine learning for adaptive preference recommendations
- 📊 **Behavior Analytics**: Real-time user interaction tracking and pattern detection
- 🔌 **AI Provider Abstraction**: Support for Claude, OpenAI, and Ollama models
- 🌊 **Streaming Content Adaptation**: Real-time content processing and optimization
- 🎯 **Accessibility Analysis**: AI-powered accessibility recommendations
- 📝 **Content Simplification**: Automated content adaptation for different reading levels

## Installation

```bash
npm install @neuroadapt/ai @neuroadapt/core
```

### Optional Dependencies

For AI providers, install the corresponding packages:

```bash
# For Claude/Anthropic
npm install anthropic

# For OpenAI
npm install openai

# Ollama works with local installation (no package needed)
```

## Quick Start

### Prediction Engine

```typescript
import { PredictionEngine } from '@neuroadapt/ai';

const engine = new PredictionEngine({
  autoTrain: true,
  minSamplesForTraining: 10,
  learningRate: 0.01,
});

// Record user interactions
engine.recordInteraction({
  timestamp: Date.now(),
  type: 'click',
  target: 'button',
  context: { page: 'settings' },
});

// Get preference predictions
const prediction = await engine.predictPreference(
  { motionReduction: false, fontSize: 1.0 },
  { timeOfDay: 20, viewport: { width: 1920, height: 1080 } }
);

console.log('Suggested preferences:', prediction.prediction);
console.log('Confidence:', prediction.confidence);
```

### Behavior Analytics

```typescript
import { BehaviorAnalytics } from '@neuroadapt/ai';

const analytics = new BehaviorAnalytics({
  enableRealTimeAnalysis: true,
  patternDetectionThreshold: 0.7,
});

// Start a session
const sessionId = analytics.startSession();

// Track interactions
analytics.trackInteraction({
  timestamp: Date.now(),
  type: 'scroll',
  target: 'main-content',
});

// Track preference changes
analytics.trackPreferenceChange({
  motionReduction: true,
  highContrast: false,
});

// Get insights
const insights = analytics.generateInsights();
console.log('Behavioral insights:', insights);
```

### AI Providers

#### Claude Provider

```typescript
import { ClaudeProvider } from '@neuroadapt/ai';

const claude = new ClaudeProvider({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-sonnet-20240229',
});

// Generate accessibility analysis
const suggestions = await claude.analyzeAccessibility(
  'Complex content with animations and small text',
  { motionReduction: false, fontSize: 0.9 }
);

// Simplify content
const simplified = await claude.simplifyContent(
  'The implementation utilizes sophisticated algorithms...',
  'simple'
);
```

#### OpenAI Provider

```typescript
import { OpenAIProvider } from '@neuroadapt/ai';

const openai = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-turbo-preview',
});

// Stream content generation
for await (const chunk of openai.generateStream({
  prompt: 'Explain accessibility in simple terms',
  maxTokens: 500,
})) {
  if (chunk.type === 'token') {
    process.stdout.write(chunk.content);
  }
}
```

#### Ollama Provider (Local)

```typescript
import { OllamaProvider } from '@neuroadapt/ai';

const ollama = new OllamaProvider({
  model: 'llama2',
  host: 'http://localhost:11434',
});

// Test local connection
const isAvailable = await ollama.testConnection();
if (isAvailable) {
  const response = await ollama.generate({
    prompt: 'Create accessible content guidelines',
    maxTokens: 300,
  });
}
```

### Content Adapter

```typescript
import { ContentAdapter } from '@neuroadapt/ai';

const adapter = new ContentAdapter({
  chunkSize: 500,
  enableRealTimeAnalysis: true,
});

// Process content with user preferences
const result = await adapter.processContent(
  '<p>Complex content with animations...</p>',
  {
    motionReduction: true,
    fontSize: 1.2,
    chunkSize: 2,
  }
);

console.log('Adapted content:', result.adaptedContent);
console.log('Applied adaptations:', result.adaptations);
```

## API Reference

### PredictionEngine

The core machine learning engine for adaptive preference prediction.

#### Constructor Options

```typescript
interface PredictionEngineConfig {
  modelPath?: string;              // Path to save/load model
  autoTrain?: boolean;             // Enable automatic training
  trainingInterval?: number;       // Training frequency (ms)
  minSamplesForTraining?: number;  // Minimum samples before training
  maxTrainingData?: number;        // Maximum training samples to keep
  learningRate?: number;           // Model learning rate
  featureEngineering?: boolean;    // Enable feature extraction
  enableOnlinelearning?: boolean;  // Enable real-time learning
}
```

#### Methods

- `recordInteraction(interaction: UserInteraction): void`
- `predictPreference(preferences, context?): Promise<PredictionResult>`
- `suggestAdaptations(state, interactions?): Promise<AdaptationSuggestion[]>`
- `addTrainingData(input, output, feedback?): void`
- `trainModel(): void`
- `getModelState(): ModelState`
- `reset(): void`

#### Events

- `prediction`: Emitted when predictions are generated
- `adaptation-suggested`: Emitted when adaptations are suggested
- `model-updated`: Emitted when model is retrained
- `training-complete`: Emitted after training completion
- `error`: Emitted on errors

### BehaviorAnalytics

Tracks and analyzes user behavior patterns for accessibility insights.

#### Constructor Options

```typescript
interface BehaviorAnalyticsConfig {
  sessionTimeout?: number;             // Session timeout (ms)
  maxSessionEvents?: number;           // Max events per session
  enableRealTimeAnalysis?: boolean;    // Enable real-time analysis
  patternDetectionThreshold?: number;  // Pattern detection sensitivity
  anomalyDetectionSensitivity?: number; // Anomaly detection sensitivity
  privacyMode?: boolean;               // Privacy-preserving mode
  bufferSize?: number;                 // Event buffer size
}
```

#### Methods

- `startSession(sessionId?): string`
- `endSession(): void`
- `trackInteraction(interaction: UserInteraction): void`
- `trackEvent(event: Partial<AnalyticsEvent>): void`
- `trackPreferenceChange(preferences, context?): void`
- `getSessionMetrics(): InteractionMetrics | null`
- `getEngagementMetrics(): EngagementMetrics | null`
- `analyzeBehaviorPatterns(): BehaviorPattern[]`
- `generateInsights(): BehaviorInsight[]`
- `exportData(options?): string`

#### Events

- `pattern-detected`: Emitted when patterns are detected
- `anomaly-detected`: Emitted when anomalies are found
- `insight-generated`: Emitted when insights are generated
- `data-collected`: Emitted when events are collected
- `error`: Emitted on errors

### AI Providers

All providers extend `BaseAIProvider` and implement:

#### Methods

- `generate(request: AIRequest): Promise<AIResponse>`
- `generateStream(request: AIRequest): AsyncGenerator<StreamChunk>`
- `analyzeAccessibility(content, preferences, context?): Promise<AdaptationSuggestion[]>`
- `simplifyContent(content, targetLevel, context?): Promise<string>`
- `getCapabilities(): ModelCapabilities`
- `getAvailableModels(): string[]`
- `testConnection(): Promise<boolean>`
- `estimateCost(request: AIRequest): number`

#### Events

- `stream-chunk`: Emitted during streaming
- `stream-complete`: Emitted when streaming completes
- `stream-error`: Emitted on streaming errors
- `rate-limit`: Emitted when rate limited
- `error`: Emitted on errors

### ContentAdapter

Real-time content adaptation and streaming processing.

#### Constructor Options

```typescript
interface ContentAdapterConfig {
  chunkSize?: number;              // Content chunk size
  processingDelay?: number;        // Processing delay (ms)
  enableRealTimeAnalysis?: boolean; // Enable real-time analysis
  adaptationThreshold?: number;    // Adaptation threshold
  maxConcurrentChunks?: number;    // Max concurrent processing
  retryAttempts?: number;          // Retry attempts on failure
}
```

#### Methods

- `processContent(content, preferences, context?): Promise<ProcessedContent>`
- `processStreamChunks(chunks, preferences, context?): Promise<void>`
- `queueContent(content, preferences, context?): string`
- `getProcessingStats(): ProcessingSummary`
- `clearCache(): void`
- `getCacheInfo(): { size: number; keys: string[] }`

#### Events

- `content-processed`: Emitted when content is processed
- `adaptation-suggested`: Emitted when adaptations are suggested
- `chunk-processed`: Emitted when chunks are processed
- `processing-complete`: Emitted when processing completes
- `error`: Emitted on errors

## Advanced Usage

### Custom AI Provider

```typescript
import { BaseAIProvider } from '@neuroadapt/ai';

class CustomProvider extends BaseAIProvider {
  getProviderName(): string {
    return 'CustomAI';
  }

  getCapabilities(): ModelCapabilities {
    return {
      textGeneration: true,
      textAnalysis: true,
      codeGeneration: false,
      reasoning: true,
      streaming: false,
      functionCalling: false,
      vision: false,
    };
  }

  getAvailableModels(): string[] {
    return ['custom-model-v1'];
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    // Implementation specific to your AI service
    return {
      content: 'Generated response',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      finishReason: 'stop',
    };
  }

  // Implement other required methods...
}
```

### Integration with Core Package

```typescript
import { PreferenceStore } from '@neuroadapt/core';
import { PredictionEngine, BehaviorAnalytics } from '@neuroadapt/ai';

// Create integrated accessibility system
const preferenceStore = new PreferenceStore();
const predictionEngine = new PredictionEngine();
const analytics = new BehaviorAnalytics();

// Connect systems
preferenceStore.on('preferences-updated', (preferences) => {
  analytics.trackPreferenceChange(preferences);
  
  predictionEngine.recordInteraction({
    timestamp: Date.now(),
    type: 'preference_change',
    value: preferences,
  });
});

// Get AI-powered recommendations
analytics.on('pattern-detected', async (pattern) => {
  const currentPreferences = preferenceStore.getPreferences();
  const suggestions = await predictionEngine.suggestAdaptations(
    currentPreferences,
    analytics.getSessionMetrics()
  );
  
  // Apply high-confidence suggestions automatically
  suggestions
    .filter(s => s.confidence === 'high' || s.confidence === 'very_high')
    .forEach(suggestion => {
      if (suggestion.type === 'sensory') {
        preferenceStore.updatePreferences({
          sensory: {
            [suggestion.target]: suggestion.action === 'enable',
          },
        });
      }
    });
});
```

### Privacy and Data Handling

The AI package is designed with privacy in mind:

- **Local Processing**: Prediction engine works offline
- **Optional Analytics**: Behavior tracking can be disabled
- **Data Minimization**: Only necessary data is collected
- **Configurable Storage**: Choose between local storage and memory-only
- **Anonymization**: Personal identifiers are not required

```typescript
// Privacy-preserving configuration
const analytics = new BehaviorAnalytics({
  privacyMode: true,           // Enable privacy mode
  sessionTimeout: 1800000,     // 30 minutes
  bufferSize: 50,              // Limit buffer size
});

const engine = new PredictionEngine({
  enableOnlinelearning: false, // Disable online learning
  maxTrainingData: 100,        // Limit training data
});
```

## Testing

```bash
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

MIT © NeuroAdapt Team 