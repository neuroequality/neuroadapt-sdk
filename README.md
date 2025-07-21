# NeuroAdapt SDK v1.1.0

🧠 **Build accessible applications across AI, VR, and quantum systems for neurodivergent users**

The NeuroAdapt SDK is a comprehensive TypeScript toolkit that provides adaptive interfaces, cognitive load management, predictable AI responses, and accessibility features designed specifically for neurodivergent users.

## ✨ Features

- 🎨 **Sensory Adaptations** - Motion reduction, high contrast, color filtering, font scaling
- 🧠 **Cognitive Load Management** - Intelligent pacing, content chunking, overload detection
- 🤖 **Predictable AI** - Consistent tone, explanation levels, undo functionality
- 🥽 **VR Safe Spaces** - Comfort zones, proximity monitoring, escape triggers *(coming soon)*
- ⚛️ **Quantum Visualization** - Accessible quantum state rendering *(coming soon)*
- 🔒 **Local-First Privacy** - No telemetry, complete user control

## 📦 Packages

| Package | Description | Status |
|---------|-------------|--------|
| [`@neuroadapt/core`](./packages/core) | Preferences, sensory/cognitive adaptations | ✅ Ready |
| [`@neuroadapt/ai`](./packages/ai) | AI adapters and PredictableAI interface | ✅ Ready |
| [`@neuroadapt/vr`](./packages/vr) | WebXR safe spaces and comfort zones | 🚧 Coming Soon |
| [`@neuroadapt/quantum`](./packages/quantum) | Accessible quantum visualization | 🚧 Coming Soon |
| [`@neuroadapt/testing`](./packages/testing) | Test utilities and accessibility testing | 🚧 Coming Soon |
| [`@neuroadapt/cli`](./packages/cli) | Scaffolding and development tools | 🚧 Coming Soon |

## 🚀 Quick Start

### Installation

```bash
npm install @neuroadapt/core @neuroadapt/ai
# or
pnpm add @neuroadapt/core @neuroadapt/ai
# or
yarn add @neuroadapt/core @neuroadapt/ai
```

### Basic Usage

```typescript
import { PreferenceStore, VisualAdapter } from '@neuroadapt/core';
import { PredictableAI, OpenAIAdapter } from '@neuroadapt/ai';

// 1. Initialize preferences
const store = new PreferenceStore();
await store.initialize();

// 2. Apply visual adaptations
const adapter = new VisualAdapter(store.getSensoryPreferences(), {
  autoApply: true
});

// 3. Setup predictable AI
const aiAdapter = new OpenAIAdapter({
  apiKey: process.env.OPENAI_API_KEY
});

const ai = new PredictableAI(aiAdapter, {
  tone: 'calm-supportive',
  explanationLevel: 'simple',
  consistencyLevel: 'high'
});

// 4. Generate adaptive responses
const response = await ai.complete('Explain this concept simply');
```

### React Integration

```tsx
import { usePreferences, useSensoryFocus } from '@neuroadapt/core';

function MyComponent() {
  const { 
    sensoryPreferences, 
    updateSensoryPreference 
  } = usePreferences();

  const { isActive, toggle } = useSensoryFocus(sensoryPreferences);

  return (
    <div>
      <button onClick={() => updateSensoryPreference('darkMode', !sensoryPreferences.darkMode)}>
        Toggle Dark Mode
      </button>
      <button onClick={toggle}>
        {isActive ? 'Disable' : 'Enable'} Focus Mode
      </button>
    </div>
  );
}
```

## 🎯 Core Concepts

### Sensory Preferences
Adapt visual and auditory elements for comfort:
- **Motion Reduction** - Disable animations and smooth scrolling
- **High Contrast** - Increase visual contrast for better readability
- **Color Filtering** - Support for color blindness (protanopia, deuteranopia, tritanopia)
- **Font Scaling** - Adjustable text size (75% - 200%)
- **Flash Reduction** - Prevent rapid visual changes

### Cognitive Preferences
Manage cognitive load and processing:
- **Reading Speed** - Slow, medium, fast pacing
- **Explanation Level** - Simple, moderate, detailed, technical
- **Processing Pace** - Relaxed, standard, quick
- **Chunk Size** - How many items to show at once
- **Interruption Tolerance** - Allow/block notifications during tasks

### AI Adaptations
Predictable AI responses that adapt to user needs:
- **Tone Control** - Calm-supportive, encouraging, neutral, clinical, friendly
- **Consistency Levels** - Low, moderate, high repeatability
- **Undo Functionality** - Reverse AI interactions with full history
- **Cognitive Sync** - AI behavior adapts to cognitive preferences

## 🛠️ Development

### Prerequisites
- Node.js 18+
- pnpm 8+

### Setup
```bash
git clone https://github.com/neuroadapt/neuroadapt-sdk
cd neuroadapt-sdk
pnpm install
```

### Build
```bash
pnpm build
```

### Test
```bash
pnpm test
```

### Development Server
```bash
pnpm dev
```

## 📚 Documentation

- **[Live Demo & Documentation](./apps/launchpad)** - Interactive examples and API documentation
- **[Core Package](./packages/core/README.md)** - Preferences and adaptations
- **[AI Package](./packages/ai/README.md)** - Predictable AI interface
- **[Migration Guide](./docs/migration.md)** - Upgrading between versions

## 🧪 Testing

The SDK includes comprehensive testing utilities:

```typescript
import { PreferenceStore, MemoryPreferenceStorage } from '@neuroadapt/core';

test('respects motion reduction preference', () => {
  const store = new PreferenceStore({
    storage: new MemoryPreferenceStorage()
  });
  
  store.updatePreferences({
    sensory: { motionReduction: true }
  });
  
  expect(document.documentElement).toHaveClass('neuro-motion-reduced');
});
```

## 🌐 Browser Support

- Chrome 91+
- Firefox 90+
- Safari 14+
- Edge 91+

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Core Principles
1. **Accessibility First** - Every feature must be accessible
2. **Local-First Privacy** - No external telemetry or tracking
3. **Progressive Enhancement** - Features should enhance, not replace
4. **User Agency** - Users maintain full control over their experience

## 🔗 Links

- [GitHub Repository](https://github.com/neuroadapt/neuroadapt-sdk)
- [NPM Packages](https://www.npmjs.com/search?q=%40neuroadapt)
- [Documentation Site](https://neuroadapt.dev)
- [Discord Community](https://discord.gg/neuroadapt)

## 📊 Bundle Size

| Package | Size (gzipped) |
|---------|----------------|
| @neuroadapt/core | ~8kb |
| @neuroadapt/ai | ~5kb |

## ⚠️ Important Notes

- **Privacy**: All preferences are stored locally. No data is sent to external servers.
- **Performance**: Adaptations are applied efficiently with minimal DOM manipulation.
- **Compatibility**: Works with any frontend framework (React, Vue, Angular, vanilla JS).
- **Standards**: Follows WCAG 2.1 AA accessibility guidelines.

---

**Built with ❤️ for the neurodivergent community**