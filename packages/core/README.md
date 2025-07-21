# @neuroadapt/core

Core sensory, cognitive, and preference management for the NeuroAdapt SDK.

## Overview

The `@neuroadapt/core` package provides a robust preference management system designed specifically for neurodivergent accessibility needs. It includes:

- **Type-safe preference schemas** with validation
- **Event-driven preference store** with persistence
- **Migration system** for schema version changes
- **Local-first storage** with privacy-respecting architecture
- **React hooks** for seamless integration

## Installation

```bash
npm install @neuroadapt/core
```

## Quick Start

```typescript
import { PreferenceStore, LocalStoragePreferenceStorage } from '@neuroadapt/core';

// Create a preference store with localStorage persistence
const store = new PreferenceStore({
  storage: new LocalStoragePreferenceStorage(),
  autoSave: true,
});

// Initialize and load existing preferences
await store.initialize();

// Update preferences with validation
await store.updatePreferences({
  sensory: {
    motionReduction: true,
    fontSize: 1.2,
    highContrast: true,
  },
  cognitive: {
    readingSpeed: 'slow',
    explanationLevel: 'simple',
  },
});

// Listen for changes
store.on('change', (diff, previousState) => {
  console.log('Preferences updated:', diff);
});

// Get current preferences
const preferences = store.getPreferences();
console.log('Current font size:', preferences.sensory.fontSize);
```

## Preference Schema

The preference system is organized into four main categories:

### Sensory Preferences

Controls for sensory adaptations:

```typescript
interface SensoryPreferences {
  motionReduction: boolean;        // Reduce animations and motion
  highContrast: boolean;           // High contrast theme
  colorVisionFilter: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  fontSize: number;                // Font scale (0.5 - 3.0)
  reducedFlashing: boolean;        // Reduce flashing content
  darkMode: boolean;               // Dark mode preference
}
```

### Cognitive Preferences

Settings for cognitive load management:

```typescript
interface CognitivePreferences {
  readingSpeed: 'slow' | 'medium' | 'fast';
  explanationLevel: 'simple' | 'detailed' | 'expert';
  processingPace: 'relaxed' | 'standard' | 'quick';
  chunkSize: number;               // Information chunk size (1-10)
  allowInterruptions: boolean;     // Allow interruptions during tasks
  preferVisualCues: boolean;       // Prefer visual over text cues
}
```

### AI Preferences

Configuration for AI interactions:

```typescript
interface AIPreferences {
  tone: 'calm-supportive' | 'neutral' | 'enthusiastic' | 'professional';
  responseLength: 'brief' | 'standard' | 'detailed';
  consistencyLevel: 'adaptive' | 'moderate' | 'high';
  useAnalogies: boolean;           // Use analogies in explanations
  allowUndo: boolean;              // Allow undoing AI actions
}
```

### VR Preferences

Settings for virtual reality experiences:

```typescript
interface VRPreferences {
  comfortRadius: number;           // Personal space radius (0.5-5.0)
  safeSpaceEnabled: boolean;       // Enable safe space overlay
  locomotionType: 'teleport' | 'smooth' | 'comfort';
  personalSpace: number;           // Personal space boundary (0.5-3.0)
  panicButtonEnabled: boolean;     // Enable panic button for quick exit
}
```

## Advanced Usage

### Custom Storage Adapter

```typescript
import { PreferenceStorage } from '@neuroadapt/core';

class CustomStorage implements PreferenceStorage {
  async get(key: string): Promise<Preferences | null> {
    // Custom storage implementation
  }
  
  async set(key: string, preferences: Preferences): Promise<void> {
    // Custom storage implementation
  }
  
  // ... implement other methods
}

const store = new PreferenceStore({
  storage: new CustomStorage(),
});
```

### Migration System

Handle schema version changes with custom migrations:

```typescript
import { MigrationRegistry } from '@neuroadapt/core';

const customRegistry = new MigrationRegistry();

// Register a migration from version 1.0.0
customRegistry.registerMigration('1.0.0', (oldPrefs) => {
  // Transform old preference structure
  return {
    ...oldPrefs,
    newField: 'defaultValue',
  };
});

const store = new PreferenceStore({
  migrationRegistry: customRegistry,
});
```

### React Integration

```typescript
import { usePreferences, useSensoryFocus } from '@neuroadapt/core';

function PreferenceControls({ store }) {
  const { preferences, updatePreferences, isLoading } = usePreferences(store);
  const { toggleMotionReduction, setFontSize } = useSensoryFocus(store);

  if (isLoading) return <div>Loading preferences...</div>;

  return (
    <div>
      <button onClick={toggleMotionReduction}>
        {preferences.sensory.motionReduction ? 'Disable' : 'Enable'} Motion Reduction
      </button>
      
      <input
        type="range"
        min={0.5}
        max={3.0}
        step={0.1}
        value={preferences.sensory.fontSize}
        onChange={(e) => setFontSize(parseFloat(e.target.value))}
      />
    </div>
  );
}
```

### Event Handling

```typescript
// Listen for preference changes
store.on('change', (diff, previousState) => {
  console.log('Changed preferences:', diff);
  console.log('Previous state:', previousState);
});

// Listen for validation errors
store.on('invalid', (errors) => {
  errors.forEach(error => {
    console.error(`Validation error at ${error.path.join('.')}: ${error.message}`);
  });
});

// Listen for storage events
store.on('saved', (preferences) => {
  console.log('Preferences saved successfully');
});

store.on('error', (error) => {
  console.error('Store error:', error);
});
```

### Import/Export

```typescript
// Export preferences as JSON
const json = store.export();
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);

// Import preferences from JSON
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  const text = await file.text();
  await store.import(text);
};
```

## Testing

The package includes comprehensive test utilities:

```typescript
import { MemoryPreferenceStorage } from '@neuroadapt/core';

// Use in-memory storage for testing
const testStore = new PreferenceStore({
  storage: new MemoryPreferenceStorage(),
  autoSave: false,
});
```

## Validation and Error Handling

All preference updates are validated using Zod schemas:

```typescript
try {
  await store.updatePreferences({
    sensory: {
      fontSize: 5.0, // Invalid: exceeds maximum of 3.0
    },
  });
} catch (error) {
  console.error('Validation failed:', error.message);
  // State remains unchanged
}
```

## Privacy and Security

- **Local-first**: All preferences stored locally by default
- **No telemetry**: No automatic data collection or transmission
- **Validation**: Input validation prevents injection attacks
- **Immutable updates**: State changes are atomic and validated

## API Reference

### PreferenceStore

Main class for managing preferences.

#### Constructor

```typescript
new PreferenceStore(config?: PreferenceStoreConfig)
```

#### Methods

- `initialize(): Promise<void>` - Load preferences from storage
- `updatePreferences(updates: PreferencesUpdate): Promise<void>` - Update preferences
- `getPreferences(): Preferences` - Get current preferences
- `save(): Promise<void>` - Manually save to storage
- `reset(): Promise<void>` - Reset to defaults
- `export(): string` - Export as JSON
- `import(json: string): Promise<void>` - Import from JSON

#### Events

- `change` - Emitted when preferences change
- `invalid` - Emitted on validation errors
- `loaded` - Emitted when preferences loaded from storage
- `saved` - Emitted when preferences saved to storage
- `error` - Emitted on storage or other errors

## License

MIT 