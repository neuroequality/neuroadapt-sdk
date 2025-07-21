import { describe, it, expect, beforeEach, vi } from 'vitest';

import { LocalStoragePreferenceStorage, MemoryPreferenceStorage } from '../src/preferences/storage.js';
import type { Preferences } from '../src/preferences/schemas.js';

describe('Storage Adapters', () => {
  describe('MemoryPreferenceStorage', () => {
    let storage: MemoryPreferenceStorage;

    beforeEach(() => {
      storage = new MemoryPreferenceStorage();
    });

    it('should get null for non-existent keys', async () => {
      const result = await storage.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should store and retrieve preferences', async () => {
      const prefs: Preferences = {
        schemaVersion: '1.1.0',
        lastModified: '2024-01-01T00:00:00.000Z',
        sensory: {
          motionReduction: true,
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

      await storage.set('test', prefs);
      const retrieved = await storage.get('test');
      expect(retrieved).toEqual(prefs);
    });

    it('should list stored keys', async () => {
      await storage.set('key1', {} as Preferences);
      await storage.set('key2', {} as Preferences);

      const keys = await storage.list();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    it('should check existence of keys', async () => {
      expect(await storage.exists('nonexistent')).toBe(false);
      
      await storage.set('existing', {} as Preferences);
      expect(await storage.exists('existing')).toBe(true);
    });

    it('should remove keys', async () => {
      await storage.set('toRemove', {} as Preferences);
      expect(await storage.exists('toRemove')).toBe(true);

      await storage.remove('toRemove');
      expect(await storage.exists('toRemove')).toBe(false);
    });

    it('should clear all data', async () => {
      await storage.set('key1', {} as Preferences);
      await storage.set('key2', {} as Preferences);

      await storage.clear();
      
      expect(await storage.list()).toHaveLength(0);
      expect(await storage.exists('key1')).toBe(false);
      expect(await storage.exists('key2')).toBe(false);
    });
  });

  describe('LocalStoragePreferenceStorage', () => {
    let storage: LocalStoragePreferenceStorage;

    beforeEach(() => {
      // Mock localStorage
      const localStorageMock = {
        store: new Map<string, string>(),
        getItem: vi.fn((key: string) => localStorageMock.store.get(key) || null),
        setItem: vi.fn((key: string, value: string) => localStorageMock.store.set(key, value)),
        removeItem: vi.fn((key: string) => localStorageMock.store.delete(key)),
        clear: vi.fn(() => localStorageMock.store.clear()),
        get length() {
          return localStorageMock.store.size;
        },
        key: vi.fn((index: number) => {
          const keys = Array.from(localStorageMock.store.keys());
          return keys[index] || null;
        }),
      };

      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      storage = new LocalStoragePreferenceStorage();
    });

    it('should get null for non-existent keys', async () => {
      const result = await storage.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should handle malformed JSON gracefully', async () => {
      localStorage.setItem('neuroadapt:preferences:invalid', 'invalid json');
      
      const result = await storage.get('invalid');
      expect(result).toBeNull();
    });

    it('should store and retrieve preferences', async () => {
      const prefs: Preferences = {
        schemaVersion: '1.1.0',
        sensory: {
          motionReduction: true,
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

      await storage.set('test', prefs);
      const retrieved = await storage.get('test');
      expect(retrieved).toEqual(prefs);
    });

    it('should list stored keys', async () => {
      await storage.set('key1', {} as Preferences);
      await storage.set('key2', {} as Preferences);

      const keys = await storage.list();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    it('should handle list errors gracefully', async () => {
      // Mock localStorage to throw an error
      vi.spyOn(localStorage, 'key').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const keys = await storage.list();
      expect(keys).toEqual([]);
    });

    it('should check existence of keys', async () => {
      expect(await storage.exists('nonexistent')).toBe(false);
      
      await storage.set('existing', {} as Preferences);
      expect(await storage.exists('existing')).toBe(true);
    });

    it('should handle exists errors gracefully', async () => {
      // Mock localStorage to throw an error
      vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const exists = await storage.exists('test');
      expect(exists).toBe(false);
    });

    it('should remove keys', async () => {
      await storage.set('toRemove', {} as Preferences);
      expect(await storage.exists('toRemove')).toBe(true);

      await storage.remove('toRemove');
      expect(await storage.exists('toRemove')).toBe(false);
    });

    it('should handle remove errors gracefully', async () => {
      // Mock localStorage to throw an error
      vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw
      await expect(storage.remove('test')).resolves.toBeUndefined();
    });

    it('should clear all preferences', async () => {
      await storage.set('key1', {} as Preferences);
      await storage.set('key2', {} as Preferences);

      await storage.clear();
      
      const keys = await storage.list();
      expect(keys).toHaveLength(0);
    });

    it('should handle clear errors gracefully', async () => {
      await storage.set('key1', {} as Preferences);
      
      // Mock the list method to throw an error
      vi.spyOn(storage, 'list').mockResolvedValue(['key1']);
      vi.spyOn(storage, 'remove').mockImplementation(() => {
        throw new Error('Remove error');
      });

      // Should not throw
      await expect(storage.clear()).resolves.toBeUndefined();
    });

    it('should handle storage quota exceeded errors', async () => {
      // Mock localStorage to throw quota exceeded error
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      await expect(storage.set('test', {} as Preferences)).rejects.toThrow('Failed to save preferences');
    });

    it('should use custom prefix', () => {
      const customStorage = new LocalStoragePreferenceStorage('custom:');
      // This mainly tests the constructor works with custom prefix
      expect(customStorage).toBeInstanceOf(LocalStoragePreferenceStorage);
    });
  });
}); 