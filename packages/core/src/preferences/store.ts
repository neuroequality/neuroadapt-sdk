import { EventEmitter } from 'eventemitter3';
import { ZodError } from 'zod';

import {
  PreferencesSchema,
  PreferencesUpdateSchema,
  type Preferences,
  type PreferencesUpdate,
  type ValidationError,
  SCHEMA_VERSION,
} from './schemas.js';
import { type PreferenceStorage, LocalStoragePreferenceStorage } from './storage.js';
import { defaultMigrationRegistry, type MigrationRegistry } from './migration.js';

/**
 * Events emitted by PreferenceStore
 */
export interface PreferenceStoreEvents {
  change: (diff: Partial<Preferences>, previousState: Preferences) => void;
  invalid: (errors: ValidationError[]) => void;
  loaded: (preferences: Preferences) => void;
  saved: (preferences: Preferences) => void;
  error: (error: Error) => void;
}

/**
 * Configuration for PreferenceStore
 */
export interface PreferenceStoreConfig {
  storage?: PreferenceStorage;
  migrationRegistry?: MigrationRegistry;
  autoSave?: boolean;
  storageKey?: string;
}

/**
 * Main preference store with validation, events, and persistence
 */
export class PreferenceStore extends EventEmitter<PreferenceStoreEvents> {
  private readonly storage: PreferenceStorage;
  private readonly migrationRegistry: MigrationRegistry;
  private readonly autoSave: boolean;
  private readonly storageKey: string;
  private preferences: Preferences;
  private isInitialized = false;

  constructor(config: PreferenceStoreConfig = {}) {
    super();

    this.storage = config.storage || new LocalStoragePreferenceStorage();
    this.migrationRegistry = config.migrationRegistry || defaultMigrationRegistry;
    this.autoSave = config.autoSave ?? true;
    this.storageKey = config.storageKey || 'default';

    // Initialize with default preferences
    this.preferences = this.getDefaultPreferences();
  }

  /**
   * Initialize the store by loading preferences from storage
   */
  async initialize(): Promise<void> {
    try {
      const stored = await this.storage.get(this.storageKey);
      if (stored) {
        // Apply migrations if needed
        this.preferences = await this.migrationRegistry.migrate(stored);
        this.emit('loaded', this.preferences);
      }
      this.isInitialized = true;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.emit('error', errorObj);
      this.isInitialized = true; // Continue with defaults
    }
  }

  /**
   * Get current preferences
   */
  getPreferences(): Preferences {
    return structuredClone(this.preferences);
  }

  /**
   * Update preferences with validation
   */
  async updatePreferences(updates: PreferencesUpdate): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Validate the update
      const validatedUpdate = PreferencesUpdateSchema.parse(updates);

      // Create new preferences by merging
      const previousState = structuredClone(this.preferences);
      const newPreferences = this.mergePreferences(this.preferences, validatedUpdate);

      // Validate the complete result
      const validatedPreferences = PreferencesSchema.parse(newPreferences);

      // Update timestamp
      validatedPreferences.lastModified = new Date().toISOString();

      // Update internal state
      this.preferences = validatedPreferences;

      // Emit change event with only the changed fields
      this.emit('change', updates as Partial<Preferences>, previousState);

      // Auto-save if enabled
      if (this.autoSave) {
        await this.save();
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          path: err.path.map(String),
          message: err.message,
          code: err.code,
        }));
        this.emit('invalid', validationErrors);
        throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Save preferences to storage
   */
  async save(): Promise<void> {
    try {
      await this.storage.set(this.storageKey, this.preferences);
      this.emit('saved', this.preferences);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.emit('error', errorObj);
      throw errorObj;
    }
  }

  /**
   * Reset preferences to defaults
   */
  async reset(): Promise<void> {
    const previousState = structuredClone(this.preferences);
    this.preferences = this.getDefaultPreferences();

    this.emit('change', this.preferences, previousState);

    if (this.autoSave) {
      await this.save();
    }
  }

  /**
   * Export preferences as JSON
   */
  export(): string {
    return JSON.stringify(this.preferences, null, 2);
  }

  /**
   * Import preferences from JSON
   */
  async import(json: string): Promise<void> {
    try {
      const imported = JSON.parse(json);
      const migrated = await this.migrationRegistry.migrate(imported);
      const validated = PreferencesSchema.parse(migrated);

      const previousState = structuredClone(this.preferences);
      this.preferences = validated;

      this.emit('change', validated, previousState);

      if (this.autoSave) {
        await this.save();
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format');
      }
      if (error instanceof ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          path: err.path.map(String),
          message: err.message,
          code: err.code,
        }));
        this.emit('invalid', validationErrors);
        throw new Error(`Invalid preferences format: ${validationErrors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Get specific preference section
   */
  getSensoryPreferences() {
    return structuredClone(this.preferences.sensory);
  }

  getCognitivePreferences() {
    return structuredClone(this.preferences.cognitive);
  }

  getAIPreferences() {
    return structuredClone(this.preferences.ai);
  }

  getVRPreferences() {
    return structuredClone(this.preferences.vr);
  }

  /**
   * Check if store is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Deep merge preferences with updates
   */
  private mergePreferences(current: Preferences, updates: PreferencesUpdate): Preferences {
    return {
      ...current,
      ...updates,
      sensory: updates.sensory ? { ...current.sensory, ...updates.sensory } : current.sensory,
      cognitive: updates.cognitive ? { ...current.cognitive, ...updates.cognitive } : current.cognitive,
      ai: updates.ai ? { ...current.ai, ...updates.ai } : current.ai,
      vr: updates.vr ? { ...current.vr, ...updates.vr } : current.vr,
      metadata: updates.metadata ? { ...current.metadata, ...updates.metadata } : current.metadata,
    };
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(): Preferences {
    return {
      schemaVersion: SCHEMA_VERSION,
      lastModified: new Date().toISOString(),
      sensory: {
        motionReduction: false,
        highContrast: false,
        colorVisionFilter: 'none',
        fontSize: 1.0,
        reducedFlashing: false,
        darkMode: false,
      },
      cognitive: {
        readingSpeed: 'medium',
        explanationLevel: 'detailed',
        processingPace: 'standard',
        chunkSize: 5,
        allowInterruptions: true,
        preferVisualCues: false,
      },
      ai: {
        tone: 'neutral',
        responseLength: 'standard',
        consistencyLevel: 'moderate',
        useAnalogies: true,
        allowUndo: true,
      },
      vr: {
        comfortRadius: 1.5,
        safeSpaceEnabled: true,
        locomotionType: 'comfort',
        personalSpace: 1.0,
        panicButtonEnabled: true,
      },
    };
  }
}