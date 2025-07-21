/**
 * Configuration options for AccessibleFocusRing
 */
export interface FocusRingOptions {
  color?: string;
  width?: string;
  offset?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  borderRadius?: string;
  duration?: string;
  targetElement?: HTMLElement;
  className?: string;
}

/**
 * Default focus ring configuration optimized for accessibility
 */
const DEFAULT_OPTIONS: Required<FocusRingOptions> = {
  color: '#005fcc',
  width: '3px',
  offset: '2px',
  style: 'solid',
  borderRadius: '3px',
  duration: '0.15s',
  targetElement: document.documentElement,
  className: 'neuro-focus-ring',
};

/**
 * AccessibleFocusRing provides consistent, high-visibility focus indicators
 * that meet WCAG accessibility requirements for neurodivergent users
 */
export class AccessibleFocusRing {
  private readonly options: Required<FocusRingOptions>;
  private styleElement: HTMLStyleElement | undefined;
  private isApplied = false;

  constructor(options: FocusRingOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Apply the accessible focus ring styles to the target element
   */
  apply(): void {
    if (this.isApplied) {
      return;
    }

    this.createStyleElement();
    this.isApplied = true;
  }

  /**
   * Remove the accessible focus ring styles
   */
  remove(): void {
    if (!this.isApplied) {
      return;
    }

    if (this.styleElement?.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
    this.styleElement = undefined;

    this.isApplied = false;
  }

  /**
   * Update the focus ring configuration
   */
  updateOptions(newOptions: Partial<FocusRingOptions>): void {
    Object.assign(this.options, newOptions);
    
    if (this.isApplied) {
      this.remove();
      this.apply();
    }
  }

  /**
   * Check if focus ring is currently applied
   */
  isActive(): boolean {
    return this.isApplied;
  }

  /**
   * Get current focus ring options
   */
  getOptions(): Readonly<Required<FocusRingOptions>> {
    return { ...this.options };
  }

  private createStyleElement(): void {
    this.styleElement = document.createElement('style');
    this.styleElement.id = `${this.options.className}-styles`;
    this.styleElement.textContent = this.generateCSS();
    document.head.appendChild(this.styleElement);
  }

  private generateCSS(): string {
    const { color, width, offset, style, borderRadius, duration, className } = this.options;

    return `
      /* Accessible Focus Ring Styles */
      .${className} *:focus {
        outline: ${width} ${style} ${color} !important;
        outline-offset: ${offset} !important;
        border-radius: ${borderRadius} !important;
        transition: outline ${duration} ease-in-out !important;
        box-shadow: 0 0 0 ${offset} ${color}40 !important;
      }

      /* Enhanced focus for interactive elements */
      .${className} button:focus,
      .${className} input:focus,
      .${className} textarea:focus,
      .${className} select:focus,
      .${className} a:focus,
      .${className} [tabindex]:focus {
        outline-width: ${width} !important;
        outline-style: ${style} !important;
        outline-color: ${color} !important;
        outline-offset: ${offset} !important;
        box-shadow: 
          0 0 0 ${offset} ${color}40,
          0 0 0 calc(${offset} + ${width}) ${color}20 !important;
      }

      /* Focus within for containers */
      .${className} [role="button"]:focus-within,
      .${className} [role="tab"]:focus-within,
      .${className} [role="menuitem"]:focus-within {
        outline: ${width} ${style} ${color} !important;
        outline-offset: ${offset} !important;
      }

      /* Skip link focus enhancement */
      .${className} .skip-link:focus {
        position: absolute !important;
        top: 10px !important;
        left: 10px !important;
        z-index: 9999 !important;
        padding: 8px 16px !important;
        background: ${color} !important;
        color: white !important;
        text-decoration: none !important;
        border-radius: ${borderRadius} !important;
        font-weight: bold !important;
      }

      /* High contrast mode compatibility */
      @media (prefers-contrast: high) {
        .${className} *:focus {
          outline-width: calc(${width} + 1px) !important;
          outline-color: ButtonText !important;
        }
      }

      /* Reduced motion compatibility */
      @media (prefers-reduced-motion: reduce) {
        .${className} *:focus {
          transition: none !important;
        }
      }

      /* Dark mode compatibility */
      @media (prefers-color-scheme: dark) {
        .${className} *:focus {
          outline-color: #66b3ff !important;
        }
      }

      /* Remove default focus for elements with our enhanced focus */
      .${className} *:focus:not(:focus-visible) {
        outline: none !important;
      }

      /* Ensure focus-visible works properly */
      .${className} *:focus-visible {
        outline: ${width} ${style} ${color} !important;
        outline-offset: ${offset} !important;
      }
    `;
  }

  /**
   * Create a focus ring with high contrast settings
   */
  static createHighContrast(options: FocusRingOptions = {}): AccessibleFocusRing {
    return new AccessibleFocusRing({
      color: '#ffff00',
      width: '4px',
      offset: '3px',
      style: 'solid',
      ...options,
    });
  }

  /**
   * Create a focus ring optimized for dark themes
   */
  static createDarkTheme(options: FocusRingOptions = {}): AccessibleFocusRing {
    return new AccessibleFocusRing({
      color: '#66b3ff',
      width: '3px',
      offset: '2px',
      style: 'solid',
      ...options,
    });
  }

  /**
   * Create a focus ring for users who prefer reduced motion
   */
  static createReducedMotion(options: FocusRingOptions = {}): AccessibleFocusRing {
    return new AccessibleFocusRing({
      duration: '0s',
      ...options,
    });
  }
} 