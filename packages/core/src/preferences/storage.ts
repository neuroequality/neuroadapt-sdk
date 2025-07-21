import type { Preferences } from './schemas.js';

/**
 * Abstract storage interface for preferences persistence
 */
export interface PreferenceStorage {
  get(key: string): Promise<Preferences | null>;
  set(key: string, preferences: Preferences): Promise<void>;
  remove(key: string): Promise<void>;
  list(): Promise<string[]>;
  exists(key: string): Promise<boolean>;
}

/**
 * localStorage implementation of PreferenceStorage
 * Provides local-first, privacy-respecting storage
 */
export class LocalStoragePreferenceStorage implements PreferenceStorage {
  private readonly prefix: string;

  constructor(prefix = 'neuroadapt:preferences:') {
    this.prefix = prefix;
  }

  async get(key: string): Promise<Preferences | null> {
    try {
      const data = localStorage.getItem(this.getStorageKey(key));
      if (!data) {
        return null;
      }
      return JSON.parse(data) as Preferences;
    } catch (error) {
      console.warn(`Failed to get preferences for key "${key}":`, error);
      return null;
    }
  }

  async set(key: string, preferences: Preferences): Promise<void> {
    try {
      const serialized = JSON.stringify(preferences, null, 2);
      localStorage.setItem(this.getStorageKey(key), serialized);
    } catch (error) {
      throw new Error(`Failed to save preferences for key "${key}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.getStorageKey(key));
    } catch (error) {
      console.warn(`Failed to remove preferences for key "${key}":`, error);
    }
  }

  async list(): Promise<string[]> {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keys.push(key.substring(this.prefix.length));
        }
      }
      return keys;
    } catch (error) {
      console.warn('Failed to list preference keys:', error);
      return [];
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return localStorage.getItem(this.getStorageKey(key)) !== null;
    } catch (error) {
      console.warn(`Failed to check existence for key "${key}":`, error);
      return false;
    }
  }

  private getStorageKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Clear all preferences from storage (for testing/reset)
   */
  async clear(): Promise<void> {
    try {
      const keys = await this.list();
      for (const key of keys) {
        await this.remove(key);
      }
    } catch (error) {
      console.warn('Failed to clear preferences storage:', error);
    }
  }
}

/**
 * In-memory storage implementation for testing
 */
export class MemoryPreferenceStorage implements PreferenceStorage {
  private readonly storage = new Map<string, Preferences>();

  async get(key: string): Promise<Preferences | null> {
    return this.storage.get(key) ?? null;
  }

  async set(key: string, preferences: Preferences): Promise<void> {
    this.storage.set(key, preferences);
  }

  async remove(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async list(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }

  async exists(key: string): Promise<boolean> {
    return this.storage.has(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}