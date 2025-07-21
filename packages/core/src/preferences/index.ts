// Core preference management exports
export { PreferenceStore } from './store.js';
export type { PreferenceStoreConfig, PreferenceStoreEvents } from './store.js';

// Schema and validation exports
export {
  PreferencesSchema,
  PreferencesUpdateSchema,
  SensoryPreferencesSchema,
  CognitivePreferencesSchema,
  AIPreferencesSchema,
  VRPreferencesSchema,
  SCHEMA_VERSION,
} from './schemas.js';
export type {
  Preferences,
  PreferencesUpdate,
  SensoryPreferences,
  CognitivePreferences,
  AIPreferences,
  VRPreferences,
  ValidationError,
} from './schemas.js';

// Storage implementations
export { LocalStoragePreferenceStorage, MemoryPreferenceStorage } from './storage.js';
export type { PreferenceStorage } from './storage.js';

// Migration system
export { MigrationRegistry, defaultMigrationRegistry } from './migration.js';
export type { MigrationFunction } from './migration.js';