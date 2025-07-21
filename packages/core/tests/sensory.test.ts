import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { VisualAdapter, AccessibleFocusRing } from '../src/sensory/index.js';
import type { SensoryPreferences } from '../src/preferences/schemas.js';
import type { ColorVisionFilter } from '../src/sensory/visual-adapter.js';

describe('VisualAdapter', () => {
  let mockElement: HTMLElement;
  let preferences: SensoryPreferences;
  let mockStyle: any;

  beforeEach(() => {
    mockStyle = {
      removeProperty: vi.fn(),
      filter: '',
      fontSize: '',
    };

    mockElement = {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn().mockReturnValue(false),
      },
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      style: mockStyle,
    } as any;

    preferences = {
      motionReduction: false,
      highContrast: false,
      colorVisionFilter: 'none' as ColorVisionFilter,
      fontSize: 1.0,
      reducedFlashing: false,
      darkMode: false,
    };

    // Mock document methods
    global.document = {
      documentElement: mockElement,
      head: {
        appendChild: vi.fn(),
      },
      createElement: vi.fn().mockReturnValue({
        id: '',
        textContent: '',
        style: {},
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
      }),
    } as any;

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const adapter = new VisualAdapter(preferences, { autoApply: false });
      expect(adapter).toBeInstanceOf(VisualAdapter);
    });

    it('should use custom target element', () => {
      const adapter = new VisualAdapter(preferences, {
        targetElement: mockElement,
        autoApply: false,
      });
      expect(adapter).toBeInstanceOf(VisualAdapter);
    });
  });

  describe('motion reduction', () => {
    it('should apply motion reduction class', () => {
      const adapter = new VisualAdapter(preferences, {
        targetElement: mockElement,
        autoApply: false,
      });

      preferences.motionReduction = true;
      adapter.applyAdaptations(preferences);

      expect(mockElement.classList.add).toHaveBeenCalledWith('neuro-motion-reduced');
      expect(adapter.isAdaptationApplied('motionReduction')).toBe(true);
    });

    it('should remove motion reduction class', () => {
      const adapter = new VisualAdapter(preferences, {
        targetElement: mockElement,
        autoApply: false,
      });

      preferences.motionReduction = false;
      adapter.applyAdaptations(preferences);

      expect(mockElement.classList.remove).toHaveBeenCalledWith('neuro-motion-reduced');
      expect(adapter.isAdaptationApplied('motionReduction')).toBe(false);
    });

    it('should emit adaptation-applied event', () => {
      const adapter = new VisualAdapter(preferences, {
        targetElement: mockElement,
        autoApply: false,
      });

      const eventSpy = vi.fn();
      adapter.on('adaptation-applied', eventSpy);

      preferences.motionReduction = true;
      adapter.applyAdaptations(preferences);

      expect(eventSpy).toHaveBeenCalledWith('motionReduction', { enabled: true });
    });
  });

  describe('high contrast', () => {
    it('should apply high contrast theme', () => {
      const adapter = new VisualAdapter(preferences, {
        targetElement: mockElement,
        autoApply: false,
      });

      preferences.highContrast = true;
      adapter.applyAdaptations(preferences);

      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-theme', 'neuro-high-contrast');
      expect(adapter.isAdaptationApplied('highContrast')).toBe(true);
    });

    it('should remove high contrast theme', () => {
      const adapter = new VisualAdapter(preferences, {
        targetElement: mockElement,
        autoApply: false,
      });

      preferences.highContrast = false;
      adapter.applyAdaptations(preferences);

      expect(mockElement.removeAttribute).toHaveBeenCalledWith('data-theme');
      expect(adapter.isAdaptationApplied('highContrast')).toBe(false);
    });
  });

  describe('color vision filters', () => {
    it('should apply protanopia filter', () => {
      const adapter = new VisualAdapter(preferences, {
        targetElement: mockElement,
        autoApply: false,
      });

      preferences.colorVisionFilter = 'protanopia';
      adapter.applyAdaptations(preferences);

      expect(mockStyle.filter).toBe('sepia(1) saturate(0.8) hue-rotate(-20deg) contrast(1.2)');
      expect(adapter.isAdaptationApplied('colorVisionFilter')).toBe(true);
    });

    it('should remove filter when set to none', () => {
      const adapter = new VisualAdapter(preferences, {
        targetElement: mockElement,
        autoApply: false,
      });

      // Apply filter first
      preferences.colorVisionFilter = 'protanopia';
      adapter.applyAdaptations(preferences);
      expect(adapter.isAdaptationApplied('colorVisionFilter')).toBe(true);

      // Remove filter
      preferences.colorVisionFilter = 'none';
      adapter.applyAdaptations(preferences);
      expect(adapter.isAdaptationApplied('colorVisionFilter')).toBe(false);
    });
  });

  describe('font size scaling', () => {
    it('should apply font size scaling', () => {
      const adapter = new VisualAdapter(preferences, {
        targetElement: mockElement,
        autoApply: false,
      });

      preferences.fontSize = 1.2;
      adapter.applyAdaptations(preferences);

      expect(mockStyle.fontSize).toBe('120%');
      expect(adapter.isAdaptationApplied('fontSize')).toBe(true);
    });
  });

  describe('getCurrentAdaptations', () => {
    it('should return current adaptations', () => {
      const adapter = new VisualAdapter(preferences, {
        targetElement: mockElement,
        autoApply: false,
      });

      preferences.motionReduction = true;
      preferences.fontSize = 1.2;
      adapter.applyAdaptations(preferences);

      const current = adapter.getCurrentAdaptations();
      expect(current.motionReduction).toBe(true);
      expect(current.fontSize).toBe(1.2);
    });
  });
});

describe('AccessibleFocusRing', () => {
  let mockStyleElement: HTMLStyleElement;

  beforeEach(() => {
    mockStyleElement = {
      id: '',
      textContent: '',
      parentNode: {
        removeChild: vi.fn(),
      },
    } as any;

    global.document = {
      createElement: vi.fn().mockReturnValue(mockStyleElement),
      head: {
        appendChild: vi.fn(),
      },
    } as any;

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const focusRing = new AccessibleFocusRing();
      expect(focusRing).toBeInstanceOf(AccessibleFocusRing);
    });

    it('should merge custom options with defaults', () => {
      const focusRing = new AccessibleFocusRing({
        color: '#ff0000',
        width: '5px',
      });

      const options = focusRing.getOptions();
      expect(options.color).toBe('#ff0000');
      expect(options.width).toBe('5px');
      expect(options.offset).toBe('2px'); // Default value
    });
  });

  describe('apply', () => {
    it('should create and append style element', () => {
      const focusRing = new AccessibleFocusRing();
      focusRing.apply();

      expect(document.createElement).toHaveBeenCalledWith('style');
      expect(document.head.appendChild).toHaveBeenCalledWith(mockStyleElement);
      expect(focusRing.isActive()).toBe(true);
    });

    it('should not apply twice', () => {
      const focusRing = new AccessibleFocusRing();
      focusRing.apply();
      focusRing.apply();

      expect(document.createElement).toHaveBeenCalledTimes(1);
    });

    it('should generate CSS with correct options', () => {
      const focusRing = new AccessibleFocusRing({
        color: '#00ff00',
        width: '4px',
        className: 'custom-focus',
      });
      focusRing.apply();

      expect(mockStyleElement.textContent).toContain('#00ff00');
      expect(mockStyleElement.textContent).toContain('4px');
      expect(mockStyleElement.textContent).toContain('.custom-focus');
    });
  });

  describe('remove', () => {
    it('should remove style element', () => {
      const focusRing = new AccessibleFocusRing();
      focusRing.apply();
      focusRing.remove();

      expect(mockStyleElement.parentNode?.removeChild).toHaveBeenCalledWith(mockStyleElement);
      expect(focusRing.isActive()).toBe(false);
    });

    it('should not fail if not applied', () => {
      const focusRing = new AccessibleFocusRing();
      expect(() => focusRing.remove()).not.toThrow();
    });
  });

  describe('updateOptions', () => {
    it('should update options and reapply if active', () => {
      const focusRing = new AccessibleFocusRing();
      focusRing.apply();

      vi.clearAllMocks();

      focusRing.updateOptions({ color: '#ff0000' });

      expect(mockStyleElement.parentNode?.removeChild).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalled();
      expect(focusRing.getOptions().color).toBe('#ff0000');
    });

    it('should update options without reapplying if not active', () => {
      const focusRing = new AccessibleFocusRing();
      focusRing.updateOptions({ color: '#ff0000' });

      expect(document.createElement).not.toHaveBeenCalled();
      expect(focusRing.getOptions().color).toBe('#ff0000');
    });
  });

  describe('static factory methods', () => {
    it('should create high contrast focus ring', () => {
      const focusRing = AccessibleFocusRing.createHighContrast();
      const options = focusRing.getOptions();

      expect(options.color).toBe('#ffff00');
      expect(options.width).toBe('4px');
      expect(options.offset).toBe('3px');
    });

    it('should create dark theme focus ring', () => {
      const focusRing = AccessibleFocusRing.createDarkTheme();
      const options = focusRing.getOptions();

      expect(options.color).toBe('#66b3ff');
    });

    it('should create reduced motion focus ring', () => {
      const focusRing = AccessibleFocusRing.createReducedMotion();
      const options = focusRing.getOptions();

      expect(options.duration).toBe('0s');
    });

    it('should merge custom options with factory defaults', () => {
      const focusRing = AccessibleFocusRing.createHighContrast({
        width: '6px',
      });
      const options = focusRing.getOptions();

      expect(options.color).toBe('#ffff00'); // Factory default
      expect(options.width).toBe('6px'); // Custom override
    });
  });
}); 