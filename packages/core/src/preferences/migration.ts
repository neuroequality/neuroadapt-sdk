import type { Preferences } from './schemas.js';
import { SCHEMA_VERSION } from './schemas.js';

/**
 * Migration function type
 */
export type MigrationFunction = (preferences: unknown) => Promise<unknown> | unknown;

/**
 * Migration registry for handling schema version changes
 */
export class MigrationRegistry {
  private readonly migrations = new Map<string, MigrationFunction>();

  /**
   * Register a migration from one version to another
   */
  registerMigration(fromVersion: string, migration: MigrationFunction): void {
    this.migrations.set(fromVersion, migration);
  }

  /**
   * Apply migrations to bring preferences to current schema version
   */
  async migrate(preferences: unknown): Promise<Preferences> {
    // If no preferences or invalid structure, return defaults
    if (!preferences || typeof preferences !== 'object' || preferences === null) {
      return this.getDefaultPreferences();
    }

    const prefs = preferences as Record<string, unknown>;
    let currentVersion = prefs.schemaVersion as string;

    // If no version specified, assume oldest version that needs migration
    if (!currentVersion) {
      currentVersion = '1.0.0';
    }

    // If already current version, return as-is (but validate structure)
    if (currentVersion === SCHEMA_VERSION) {
      return this.ensureValidStructure(prefs as Preferences);
    }

    // Apply migrations in sequence
    let migratedPrefs = prefs;
    const migrationPath = this.getMigrationPath(currentVersion, SCHEMA_VERSION);

    for (const version of migrationPath) {
      const migration = this.migrations.get(version);
      if (migration) {
        migratedPrefs = await migration(migratedPrefs) as Record<string, unknown>;
      }
    }

    // Update to current version and ensure valid structure
    const result = migratedPrefs as Preferences;
    result.schemaVersion = SCHEMA_VERSION;
    result.lastModified = new Date().toISOString();

    return this.ensureValidStructure(result);
  }

  /**
   * Get the migration path from source to target version
   */
  private getMigrationPath(fromVersion: string, toVersion: string): string[] {
    // For now, simple implementation - in production, this would handle
    // complex version ordering and dependency resolution
    const versions = ['1.0.0', '1.0.1', '1.1.0'];
    const fromIndex = versions.indexOf(fromVersion);
    const toIndex = versions.indexOf(toVersion);

    if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
      return [];
    }

    return versions.slice(fromIndex, toIndex);
  }

  /**
   * Ensure preferences have valid structure with defaults for missing fields
   */
  private ensureValidStructure(preferences: Preferences): Preferences {
    const defaults = this.getDefaultPreferences();
    
    return {
      ...preferences,
      schemaVersion: SCHEMA_VERSION,
      lastModified: new Date().toISOString(),
      sensory: {
        ...defaults.sensory,
        ...preferences.sensory,
      },
      cognitive: {
        ...defaults.cognitive,
        ...preferences.cognitive,
      },
      ai: {
        ...defaults.ai,
        ...preferences.ai,
      },
      vr: {
        ...defaults.vr,
        ...preferences.vr,
      },
    };
  }

  /**
   * Get default preferences for current schema version
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

// Default migration registry with built-in migrations
export const defaultMigrationRegistry = new MigrationRegistry();

// Register built-in migrations
defaultMigrationRegistry.registerMigration('1.0.0', (prefs: unknown) => {
  // Migration from 1.0.0 to 1.0.1: Add new VR preferences
  const p = prefs as Record<string, unknown>;
  return {
    ...p,
    vr: {
      comfortRadius: 1.5,
      safeSpaceEnabled: true,
      locomotionType: 'comfort',
      personalSpace: 1.0,
      panicButtonEnabled: true,
      ...((p.vr as Record<string, unknown>) || {}),
    },
  };
});

defaultMigrationRegistry.registerMigration('1.0.1', (prefs: unknown) => {
  // Migration from 1.0.1 to 1.1.0: Add AI consistency level
  const p = prefs as Record<string, unknown>;
  const ai = (p.ai as Record<string, unknown>) || {};
  return {
    ...p,
    ai: {
      ...ai,
      consistencyLevel: ai.consistencyLevel || 'moderate',
    },
  };
}); 