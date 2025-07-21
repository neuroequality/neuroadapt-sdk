import { EventEmitter } from 'eventemitter3';

import type { SensoryPreferences } from '../preferences/schemas.js';

/**
 * Events emitted by VisualAdapter
 */
export interface VisualAdapterEvents {
  'adaptation-applied': (type: string, details: Record<string, unknown>) => void;
  'adaptation-removed': (type: string) => void;
  'error': (error: Error) => void;
}

/**
 * Configuration options for VisualAdapter
 */
export interface VisualAdapterOptions {
  targetElement?: HTMLElement;
  autoApply?: boolean;
  prefix?: string;
}

/**
 * Color vision filter types for accessibility
 */
export type ColorVisionFilter = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

/**
 * Visual adaptation types that can be applied
 */
export interface VisualAdaptations {
  motionReduction: boolean;
  highContrast: boolean;
  colorVisionFilter: ColorVisionFilter;
  fontSize: number;
  reducedFlashing: boolean;
  darkMode: boolean;
}

/**
 * CSS filter values for different types of color blindness
 */
const COLOR_VISION_FILTERS: Record<ColorVisionFilter, string> = {
  none: 'none',
  // Protanopia (red-blind) - reduce red channel
  protanopia: 'sepia(1) saturate(0.8) hue-rotate(-20deg) contrast(1.2)',
  // Deuteranopia (green-blind) - adjust green channel
  deuteranopia: 'sepia(0.6) saturate(0.9) hue-rotate(40deg) contrast(1.1)',
  // Tritanopia (blue-blind) - reduce blue channel
  tritanopia: 'sepia(0.8) saturate(1.2) hue-rotate(180deg) contrast(1.3)',
};

/**
 * High contrast theme CSS variables
 */
const HIGH_CONTRAST_THEME = `
  :root[data-theme="neuro-high-contrast"] {
    --neuro-bg-primary: #000000;
    --neuro-bg-secondary: #1a1a1a;
    --neuro-text-primary: #ffffff;
    --neuro-text-secondary: #cccccc;
    --neuro-border: #ffffff;
    --neuro-focus: #ffff00;
    --neuro-link: #00ffff;
    --neuro-link-visited: #ff00ff;
    --neuro-button-bg: #333333;
    --neuro-button-text: #ffffff;
    --neuro-input-bg: #1a1a1a;
    --neuro-input-border: #ffffff;
  }

  [data-theme="neuro-high-contrast"] {
    background-color: var(--neuro-bg-primary) !important;
    color: var(--neuro-text-primary) !important;
    border-color: var(--neuro-border) !important;
  }

  [data-theme="neuro-high-contrast"] * {
    background-color: inherit !important;
    color: inherit !important;
  }

  [data-theme="neuro-high-contrast"] a {
    color: var(--neuro-link) !important;
  }

  [data-theme="neuro-high-contrast"] a:visited {
    color: var(--neuro-link-visited) !important;
  }

  [data-theme="neuro-high-contrast"] button,
  [data-theme="neuro-high-contrast"] input[type="button"],
  [data-theme="neuro-high-contrast"] input[type="submit"] {
    background-color: var(--neuro-button-bg) !important;
    color: var(--neuro-button-text) !important;
    border: 2px solid var(--neuro-border) !important;
  }

  [data-theme="neuro-high-contrast"] input,
  [data-theme="neuro-high-contrast"] textarea,
  [data-theme="neuro-high-contrast"] select {
    background-color: var(--neuro-input-bg) !important;
    color: var(--neuro-text-primary) !important;
    border: 2px solid var(--neuro-input-border) !important;
  }

  [data-theme="neuro-high-contrast"] :focus {
    outline: 3px solid var(--neuro-focus) !important;
    outline-offset: 2px !important;
  }
`;

/**
 * Motion reduction CSS for users sensitive to animations
 */
const MOTION_REDUCTION_CSS = `
  .neuro-motion-reduced *,
  .neuro-motion-reduced *::before,
  .neuro-motion-reduced *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transform: none !important;
  }

  .neuro-motion-reduced * {
    scroll-behavior: auto !important;
  }
`;

/**
 * Anti-flashing CSS to prevent rapid visual changes
 */
const ANTI_FLASHING_CSS = `
  .neuro-anti-flash * {
    animation-duration: 1s !important;
    transition-duration: 0.3s !important;
  }

  .neuro-anti-flash *:hover,
  .neuro-anti-flash *:focus {
    transition-duration: 0.15s !important;
  }
`;

/**
 * VisualAdapter applies real-time visual adaptations to the DOM
 * based on user sensory preferences
 */
export class VisualAdapter extends EventEmitter<VisualAdapterEvents> {
  private readonly targetElement: HTMLElement;
  private readonly prefix: string;
  private readonly appliedAdaptations = new Set<string>();
  private styleElement?: HTMLStyleElement;
  private currentAdaptations: Partial<VisualAdaptations> = {};

  constructor(
    preferences: SensoryPreferences,
    options: VisualAdapterOptions = {}
  ) {
    super();
    
    this.targetElement = options.targetElement || document.documentElement;
    this.prefix = options.prefix || 'neuro';
    
    this.initializeStyleElement();
    
    if (options.autoApply !== false) {
      this.applyAdaptations(preferences);
    }
  }

  /**
   * Apply visual adaptations based on sensory preferences
   */
  applyAdaptations(preferences: SensoryPreferences): void {
    try {
      this.currentAdaptations = { ...preferences };

      // Apply motion reduction
      if (preferences.motionReduction) {
        this.applyMotionReduction();
      } else {
        this.removeMotionReduction();
      }

      // Apply high contrast theme
      if (preferences.highContrast) {
        this.applyHighContrast();
      } else {
        this.removeHighContrast();
      }

      // Apply color vision filter
      this.applyColorVisionFilter(preferences.colorVisionFilter);

      // Apply font size scaling
      this.applyFontSizeScaling(preferences.fontSize);

      // Apply reduced flashing
      if (preferences.reducedFlashing) {
        this.applyReducedFlashing();
      } else {
        this.removeReducedFlashing();
      }

      // Apply dark mode
      if (preferences.darkMode) {
        this.applyDarkMode();
      } else {
        this.removeDarkMode();
      }

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.emit('error', errorObj);
    }
  }

  /**
   * Remove all applied visual adaptations
   */
  disable(): void {
    try {
      this.removeMotionReduction();
      this.removeHighContrast();
      this.removeColorVisionFilter();
      this.removeFontSizeScaling();
      this.removeReducedFlashing();
      this.removeDarkMode();
      
      // Remove style element
      if (this.styleElement?.parentNode) {
        this.styleElement.parentNode.removeChild(this.styleElement);
      }
      
      this.appliedAdaptations.clear();
      this.currentAdaptations = {};
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.emit('error', errorObj);
    }
  }

  /**
   * Get currently applied adaptations
   */
  getCurrentAdaptations(): Readonly<Partial<VisualAdaptations>> {
    return { ...this.currentAdaptations };
  }

  /**
   * Check if a specific adaptation is currently applied
   */
  isAdaptationApplied(adaptation: keyof VisualAdaptations): boolean {
    return this.appliedAdaptations.has(adaptation);
  }

  private initializeStyleElement(): void {
    this.styleElement = document.createElement('style');
    this.styleElement.id = `${this.prefix}-visual-adaptations`;
    this.styleElement.textContent = HIGH_CONTRAST_THEME + MOTION_REDUCTION_CSS + ANTI_FLASHING_CSS;
    document.head.appendChild(this.styleElement);
  }

  private applyMotionReduction(): void {
    this.targetElement.classList.add(`${this.prefix}-motion-reduced`);
    this.appliedAdaptations.add('motionReduction');
    this.emit('adaptation-applied', 'motionReduction', { enabled: true });
  }

  private removeMotionReduction(): void {
    this.targetElement.classList.remove(`${this.prefix}-motion-reduced`);
    this.appliedAdaptations.delete('motionReduction');
    this.emit('adaptation-removed', 'motionReduction');
  }

  private applyHighContrast(): void {
    this.targetElement.setAttribute('data-theme', `${this.prefix}-high-contrast`);
    this.appliedAdaptations.add('highContrast');
    this.emit('adaptation-applied', 'highContrast', { theme: `${this.prefix}-high-contrast` });
  }

  private removeHighContrast(): void {
    this.targetElement.removeAttribute('data-theme');
    this.appliedAdaptations.delete('highContrast');
    this.emit('adaptation-removed', 'highContrast');
  }

  private applyColorVisionFilter(filter: ColorVisionFilter): void {
    if (filter === 'none') {
      this.removeColorVisionFilter();
      return;
    }
    
    const filterValue = COLOR_VISION_FILTERS[filter];
    this.targetElement.style.filter = filterValue;
    this.appliedAdaptations.add('colorVisionFilter');
    this.emit('adaptation-applied', 'colorVisionFilter', { filter, value: filterValue });
  }

  private removeColorVisionFilter(): void {
    this.targetElement.style.removeProperty('filter');
    this.appliedAdaptations.delete('colorVisionFilter');
    this.emit('adaptation-removed', 'colorVisionFilter');
  }

  private applyFontSizeScaling(scale: number): void {
    const percentage = Math.round(scale * 100);
    this.targetElement.style.fontSize = `${percentage}%`;
    this.appliedAdaptations.add('fontSize');
    this.emit('adaptation-applied', 'fontSize', { scale, percentage });
  }

  private removeFontSizeScaling(): void {
    this.targetElement.style.removeProperty('font-size');
    this.appliedAdaptations.delete('fontSize');
    this.emit('adaptation-removed', 'fontSize');
  }

  private applyReducedFlashing(): void {
    this.targetElement.classList.add(`${this.prefix}-anti-flash`);
    this.appliedAdaptations.add('reducedFlashing');
    this.emit('adaptation-applied', 'reducedFlashing', { enabled: true });
  }

  private removeReducedFlashing(): void {
    this.targetElement.classList.remove(`${this.prefix}-anti-flash`);
    this.appliedAdaptations.delete('reducedFlashing');
    this.emit('adaptation-removed', 'reducedFlashing');
  }

  private applyDarkMode(): void {
    this.targetElement.classList.add(`${this.prefix}-dark-mode`);
    this.appliedAdaptations.add('darkMode');
    this.emit('adaptation-applied', 'darkMode', { enabled: true });
  }

  private removeDarkMode(): void {
    this.targetElement.classList.remove(`${this.prefix}-dark-mode`);
    this.appliedAdaptations.delete('darkMode');
    this.emit('adaptation-removed', 'darkMode');
  }
} 