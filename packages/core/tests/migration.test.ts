import { describe, it, expect } from 'vitest';

import { MigrationRegistry, defaultMigrationRegistry } from '../src/preferences/migration.js';
import { SCHEMA_VERSION } from '../src/preferences/schemas.js';

describe('Migration System', () => {
  describe('MigrationRegistry', () => {
    it('should register and apply migrations', async () => {
      const registry = new MigrationRegistry();

      registry.registerMigration('1.0.0', (prefs) => ({
        ...(prefs as object),
        newField: 'added-in-1.0.1',
      }));

      const result = await registry.migrate({
        schemaVersion: '1.0.0',
        oldField: 'value',
      });

      expect(result).toHaveProperty('newField', 'added-in-1.0.1');
      expect(result.schemaVersion).toBe(SCHEMA_VERSION);
    });

    it('should handle missing preferences gracefully', async () => {
      const registry = new MigrationRegistry();
      const result = await registry.migrate(null);

      expect(result.schemaVersion).toBe(SCHEMA_VERSION);
      expect(result.sensory).toBeDefined();
      expect(result.cognitive).toBeDefined();
      expect(result.ai).toBeDefined();
      expect(result.vr).toBeDefined();
    });

    it('should handle preferences without version', async () => {
      const registry = new MigrationRegistry();
      const result = await registry.migrate({
        sensory: { motionReduction: true },
      });

      expect(result.schemaVersion).toBe(SCHEMA_VERSION);
      expect(result.sensory.motionReduction).toBe(true);
    });

    it('should return current preferences unchanged if already current version', async () => {
      const registry = new MigrationRegistry();
      const currentPrefs = {
        schemaVersion: SCHEMA_VERSION,
        sensory: { motionReduction: true },
        cognitive: { readingSpeed: 'fast' as const },
        ai: { tone: 'calm-supportive' as const },
        vr: { comfortRadius: 2.0 },
      };

      const result = await registry.migrate(currentPrefs);

      expect(result.schemaVersion).toBe(SCHEMA_VERSION);
      expect(result.sensory.motionReduction).toBe(true);
      expect(result.cognitive.readingSpeed).toBe('fast');
    });
  });

  describe('Default Migration Registry', () => {
    it('should migrate from 1.0.0 to current version', async () => {
      const v1_0_0_prefs = {
        schemaVersion: '1.0.0',
        sensory: {
          motionReduction: true,
          highContrast: false,
          colorVisionFilter: 'none',
          fontSize: 1.2,
          reducedFlashing: true,
          darkMode: true,
        },
        cognitive: {
          readingSpeed: 'slow',
          explanationLevel: 'simple',
          processingPace: 'relaxed',
          chunkSize: 3,
          allowInterruptions: false,
          preferVisualCues: true,
        },
        ai: {
          tone: 'calm-supportive',
          responseLength: 'brief',
          useAnalogies: false,
          allowUndo: true,
        },
        // No VR section in 1.0.0
      };

      const migrated = await defaultMigrationRegistry.migrate(v1_0_0_prefs);

      // Should have current version
      expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);

      // Should preserve existing data
      expect(migrated.sensory.motionReduction).toBe(true);
      expect(migrated.cognitive.readingSpeed).toBe('slow');
      expect(migrated.ai.tone).toBe('calm-supportive');

      // Should add VR preferences with defaults
      expect(migrated.vr).toBeDefined();
      expect(migrated.vr.comfortRadius).toBe(1.5);
      expect(migrated.vr.safeSpaceEnabled).toBe(true);

      // Should add AI consistency level (from 1.0.1 migration)
      expect(migrated.ai.consistencyLevel).toBe('moderate');
    });

    it('should migrate from 1.0.1 to current version', async () => {
      const v1_0_1_prefs = {
        schemaVersion: '1.0.1',
        sensory: {
          motionReduction: false,
          highContrast: true,
          colorVisionFilter: 'protanopia',
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
          useAnalogies: true,
          allowUndo: true,
          // No consistencyLevel in 1.0.1
        },
        vr: {
          comfortRadius: 2.0,
          safeSpaceEnabled: true,
          locomotionType: 'teleport',
          personalSpace: 1.5,
          panicButtonEnabled: true,
        },
      };

      const migrated = await defaultMigrationRegistry.migrate(v1_0_1_prefs);

      // Should have current version
      expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);

      // Should preserve all existing data
      expect(migrated.sensory.colorVisionFilter).toBe('protanopia');
      expect(migrated.vr.comfortRadius).toBe(2.0);

      // Should add missing AI consistency level
      expect(migrated.ai.consistencyLevel).toBe('moderate');
    });

    it('should handle partial VR preferences in 1.0.0 migration', async () => {
      const v1_0_0_with_partial_vr = {
        schemaVersion: '1.0.0',
        sensory: { motionReduction: false },
        cognitive: { readingSpeed: 'medium' },
        ai: { tone: 'neutral' },
        vr: {
          comfortRadius: 3.0, // Custom value
          // Missing other VR fields
        },
      };

      const migrated = await defaultMigrationRegistry.migrate(v1_0_0_with_partial_vr);

      // Should preserve custom value
      expect(migrated.vr.comfortRadius).toBe(3.0);

      // Should fill in missing defaults
      expect(migrated.vr.safeSpaceEnabled).toBe(true);
      expect(migrated.vr.locomotionType).toBe('comfort');
      expect(migrated.vr.personalSpace).toBe(1.0);
      expect(migrated.vr.panicButtonEnabled).toBe(true);
    });

    it('should handle existing AI consistency level in 1.0.1 migration', async () => {
      const v1_0_1_with_consistency = {
        schemaVersion: '1.0.1',
        sensory: { motionReduction: false },
        cognitive: { readingSpeed: 'medium' },
        ai: {
          tone: 'neutral',
          consistencyLevel: 'high', // Already exists
        },
        vr: { comfortRadius: 1.5 },
      };

      const migrated = await defaultMigrationRegistry.migrate(v1_0_1_with_consistency);

      // Should preserve existing consistency level
      expect(migrated.ai.consistencyLevel).toBe('high');
    });
  });

  describe('Migration Path Resolution', () => {
    it('should handle unknown versions gracefully', async () => {
      const unknownVersion = {
        schemaVersion: '0.9.0', // Unknown version
        someField: 'value',
      };

      const migrated = await defaultMigrationRegistry.migrate(unknownVersion);

      // Should create valid preferences with defaults
      expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);
      expect(migrated.sensory).toBeDefined();
      expect(migrated.cognitive).toBeDefined();
      expect(migrated.ai).toBeDefined();
      expect(migrated.vr).toBeDefined();
    });

    it('should update lastModified timestamp during migration', async () => {
      const before = new Date();

      const oldPrefs = {
        schemaVersion: '1.0.0',
        lastModified: '2023-01-01T00:00:00.000Z', // Old timestamp
      };

      const migrated = await defaultMigrationRegistry.migrate(oldPrefs);

      const after = new Date();
      const modifiedTime = new Date(migrated.lastModified!);

      expect(modifiedTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(modifiedTime.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
}); 