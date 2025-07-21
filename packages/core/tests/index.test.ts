import { describe, it, expect } from 'vitest';

import { VERSION } from '../src/index.js';
import * as NeuroAdaptCore from '../src/index.js';

describe('Index Exports', () => {
  it('should export VERSION constant', () => {
    expect(VERSION).toBe('1.1.0');
  });

  it('should export all core preferences functionality', () => {
    expect(NeuroAdaptCore).toHaveProperty('PreferenceStore');
    expect(NeuroAdaptCore).toHaveProperty('LocalStoragePreferenceStorage');
    expect(NeuroAdaptCore).toHaveProperty('MemoryPreferenceStorage');
    expect(NeuroAdaptCore).toHaveProperty('PreferencesSchema');
    expect(NeuroAdaptCore).toHaveProperty('MigrationRegistry');
    expect(NeuroAdaptCore).toHaveProperty('defaultMigrationRegistry');
  });

  it('should have working exports', () => {
    const { PreferenceStore, MemoryPreferenceStorage } = NeuroAdaptCore;
    
    const storage = new MemoryPreferenceStorage();
    const store = new PreferenceStore({ storage });
    
    expect(store).toBeInstanceOf(PreferenceStore);
    expect(storage).toBeInstanceOf(MemoryPreferenceStorage);
  });
}); 