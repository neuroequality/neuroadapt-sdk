/**
 * Accessible Gestures - Customizable mobile gesture system
 * @fileoverview Provides accessible gesture recognition and customization for mobile apps
 */

import { Platform } from 'react-native';

export interface GestureConfig {
  type: GestureType;
  sensitivity: 'low' | 'medium' | 'high';
  requiresConfirmation: boolean;
  hapticFeedback: boolean;
  audioFeedback: boolean;
  timeoutMs: number;
  customization: GestureCustomization;
}

export type GestureType = 
  | 'tap' 
  | 'double_tap' 
  | 'long_press' 
  | 'swipe_left' 
  | 'swipe_right' 
  | 'swipe_up' 
  | 'swipe_down'
  | 'pinch' 
  | 'rotate' 
  | 'two_finger_tap'
  | 'three_finger_tap'
  | 'four_finger_tap'
  | 'shake';

export interface GestureCustomization {
  minimumDistance?: number;
  maximumDistance?: number;
  minimumVelocity?: number;
  maximumVelocity?: number;
  minimumDuration?: number;
  maximumDuration?: number;
  requiredFingers?: number;
  allowSimultaneous?: boolean;
}

export interface GestureEvent {
  type: GestureType;
  timestamp: number;
  duration: number;
  distance: number;
  velocity: number;
  fingerCount: number;
  location: { x: number; y: number };
  target?: any;
}

export interface GestureHandler {
  id: string;
  gesture: GestureType;
  callback: (event: GestureEvent) => void;
  enabled: boolean;
  config: GestureConfig;
}

export interface AccessibilityGestureMap {
  navigation: {
    next: GestureType;
    previous: GestureType;
    activate: GestureType;
    back: GestureType;
    home: GestureType;
  };
  content: {
    scrollUp: GestureType;
    scrollDown: GestureType;
    scrollLeft: GestureType;
    scrollRight: GestureType;
    zoom: GestureType;
    details: GestureType;
  };
  system: {
    menu: GestureType;
    settings: GestureType;
    help: GestureType;
    emergency: GestureType;
  };
}

/**
 * Accessible Gesture Manager
 */
export class AccessibleGestureManager {
  private handlers: Map<string, GestureHandler> = new Map();
  private gestureMap: AccessibilityGestureMap;
  private isEnabled: boolean = true;
  private debugMode: boolean = false;

  constructor(customGestureMap?: Partial<AccessibilityGestureMap>) {
    this.gestureMap = {
      navigation: {
        next: 'swipe_right',
        previous: 'swipe_left',
        activate: 'double_tap',
        back: 'swipe_down',
        home: 'three_finger_tap'
      },
      content: {
        scrollUp: 'swipe_up',
        scrollDown: 'swipe_down',
        scrollLeft: 'swipe_left',
        scrollRight: 'swipe_right',
        zoom: 'pinch',
        details: 'long_press'
      },
      system: {
        menu: 'two_finger_tap',
        settings: 'four_finger_tap',
        help: 'shake',
        emergency: 'long_press'
      },
      ...customGestureMap
    };

    this.initializeDefaultHandlers();
  }

  /**
   * Register a gesture handler
   */
  registerHandler(
    id: string,
    gestureType: GestureType,
    callback: (event: GestureEvent) => void,
    config?: Partial<GestureConfig>
  ): void {
    const defaultConfig: GestureConfig = {
      type: gestureType,
      sensitivity: 'medium',
      requiresConfirmation: false,
      hapticFeedback: true,
      audioFeedback: false,
      timeoutMs: 5000,
      customization: this.getDefaultCustomization(gestureType)
    };

    const handler: GestureHandler = {
      id,
      gesture: gestureType,
      callback,
      enabled: true,
      config: { ...defaultConfig, ...config }
    };

    this.handlers.set(id, handler);
  }

  /**
   * Unregister a gesture handler
   */
  unregisterHandler(id: string): void {
    this.handlers.delete(id);
  }

  /**
   * Enable or disable a gesture handler
   */
  setHandlerEnabled(id: string, enabled: boolean): void {
    const handler = this.handlers.get(id);
    if (handler) {
      handler.enabled = enabled;
    }
  }

  /**
   * Update gesture configuration
   */
  updateGestureConfig(id: string, config: Partial<GestureConfig>): void {
    const handler = this.handlers.get(id);
    if (handler) {
      handler.config = { ...handler.config, ...config };
    }
  }

  /**
   * Process gesture event
   */
  processGesture(event: GestureEvent): boolean {
    if (!this.isEnabled) return false;

    let handled = false;

    for (const handler of this.handlers.values()) {
      if (!handler.enabled || handler.gesture !== event.type) continue;

      if (this.validateGesture(event, handler.config)) {
        try {
          if (handler.config.hapticFeedback) {
            this.triggerHapticFeedback();
          }

          if (handler.config.audioFeedback) {
            this.triggerAudioFeedback(event.type);
          }

          if (handler.config.requiresConfirmation) {
            this.requestConfirmation(handler, event);
          } else {
            handler.callback(event);
          }

          handled = true;

          if (this.debugMode) {
            console.log(`Gesture handled: ${handler.id} (${event.type})`);
          }
        } catch (error) {
          console.error(`Error handling gesture ${handler.id}:`, error);
        }
      }
    }

    return handled;
  }

  /**
   * Get accessibility gesture for action
   */
  getGestureForAction(category: keyof AccessibilityGestureMap, action: string): GestureType | null {
    const categoryMap = this.gestureMap[category] as Record<string, GestureType>;
    return categoryMap[action] || null;
  }

  /**
   * Customize gesture mapping
   */
  customizeGestureMap(
    category: keyof AccessibilityGestureMap,
    action: string,
    gesture: GestureType
  ): void {
    (this.gestureMap[category] as Record<string, GestureType>)[action] = gesture;
  }

  /**
   * Get gesture statistics
   */
  getGestureStatistics(): {
    totalHandlers: number;
    enabledHandlers: number;
    gesturesByType: Record<GestureType, number>;
    recentActivity: GestureEvent[];
  } {
    const gesturesByType = {} as Record<GestureType, number>;
    let enabledCount = 0;

    for (const handler of this.handlers.values()) {
      if (handler.enabled) enabledCount++;
      gesturesByType[handler.gesture] = (gesturesByType[handler.gesture] || 0) + 1;
    }

    return {
      totalHandlers: this.handlers.size,
      enabledHandlers: enabledCount,
      gesturesByType,
      recentActivity: [] // Would track recent gestures in production
    };
  }

  /**
   * Enable/disable gesture system
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Create platform-specific gesture recognizer
   */
  createGestureRecognizer(gestureType: GestureType, config: GestureConfig): any {
    // This would return platform-specific gesture recognizer
    // For React Native, this would integrate with react-native-gesture-handler
    return {
      type: gestureType,
      config,
      platform: Platform.OS
    };
  }

  /**
   * Get recommended gestures for user needs
   */
  getRecommendedGestures(userNeeds: {
    hasMotorDifficulties: boolean;
    hasVisionImpairment: boolean;
    hasHearingImpairment: boolean;
    prefersSingleFinger: boolean;
  }): {
    recommended: GestureType[];
    discouraged: GestureType[];
    alternatives: Record<GestureType, GestureType[]>;
  } {
    const recommended: GestureType[] = [];
    const discouraged: GestureType[] = [];
    const alternatives: Record<GestureType, GestureType[]> = {};

    if (userNeeds.hasMotorDifficulties) {
      recommended.push('long_press', 'double_tap');
      discouraged.push('pinch', 'rotate', 'swipe_left', 'swipe_right');
      
      alternatives['pinch'] = ['double_tap', 'long_press'];
      alternatives['swipe_left'] = ['tap', 'double_tap'];
      alternatives['swipe_right'] = ['tap', 'double_tap'];
    }

    if (userNeeds.hasVisionImpairment) {
      recommended.push('double_tap', 'long_press', 'two_finger_tap');
      discouraged.push('swipe_up', 'swipe_down', 'pinch');
      
      alternatives['swipe_up'] = ['double_tap'];
      alternatives['swipe_down'] = ['long_press'];
    }

    if (userNeeds.prefersSingleFinger) {
      recommended.push('tap', 'double_tap', 'long_press', 'swipe_left', 'swipe_right');
      discouraged.push('two_finger_tap', 'three_finger_tap', 'four_finger_tap', 'pinch');
      
      alternatives['two_finger_tap'] = ['double_tap'];
      alternatives['three_finger_tap'] = ['long_press'];
      alternatives['pinch'] = ['double_tap'];
    }

    if (userNeeds.hasHearingImpairment) {
      // Prioritize haptic feedback gestures
      recommended.push('long_press', 'double_tap', 'shake');
    }

    return { recommended, discouraged, alternatives };
  }

  // Private methods
  private initializeDefaultHandlers(): void {
    // Register common accessibility gestures
    this.registerHandler('navigation_next', 'swipe_right', () => {
      console.log('Navigate to next element');
    });

    this.registerHandler('navigation_previous', 'swipe_left', () => {
      console.log('Navigate to previous element');
    });

    this.registerHandler('activate', 'double_tap', () => {
      console.log('Activate current element');
    });

    this.registerHandler('context_menu', 'long_press', () => {
      console.log('Show context menu');
    }, { requiresConfirmation: true });

    this.registerHandler('back', 'swipe_down', () => {
      console.log('Go back');
    });

    this.registerHandler('home', 'three_finger_tap', () => {
      console.log('Go to home');
    });
  }

  private getDefaultCustomization(gestureType: GestureType): GestureCustomization {
    switch (gestureType) {
      case 'tap':
        return {
          minimumDuration: 50,
          maximumDuration: 500,
          requiredFingers: 1,
          allowSimultaneous: false
        };

      case 'double_tap':
        return {
          minimumDuration: 50,
          maximumDuration: 300,
          requiredFingers: 1,
          allowSimultaneous: false
        };

      case 'long_press':
        return {
          minimumDuration: 800,
          maximumDuration: 5000,
          requiredFingers: 1,
          allowSimultaneous: false
        };

      case 'swipe_left':
      case 'swipe_right':
      case 'swipe_up':
      case 'swipe_down':
        return {
          minimumDistance: 50,
          minimumVelocity: 100,
          requiredFingers: 1,
          allowSimultaneous: false
        };

      case 'pinch':
        return {
          minimumDistance: 10,
          requiredFingers: 2,
          allowSimultaneous: false
        };

      case 'two_finger_tap':
        return {
          minimumDuration: 50,
          maximumDuration: 500,
          requiredFingers: 2,
          allowSimultaneous: false
        };

      case 'three_finger_tap':
        return {
          minimumDuration: 50,
          maximumDuration: 500,
          requiredFingers: 3,
          allowSimultaneous: false
        };

      case 'shake':
        return {
          minimumVelocity: 800,
          minimumDuration: 200,
          allowSimultaneous: false
        };

      default:
        return {
          allowSimultaneous: false
        };
    }
  }

  private validateGesture(event: GestureEvent, config: GestureConfig): boolean {
    const custom = config.customization;

    // Check duration
    if (custom.minimumDuration && event.duration < custom.minimumDuration) return false;
    if (custom.maximumDuration && event.duration > custom.maximumDuration) return false;

    // Check distance
    if (custom.minimumDistance && event.distance < custom.minimumDistance) return false;
    if (custom.maximumDistance && event.distance > custom.maximumDistance) return false;

    // Check velocity
    if (custom.minimumVelocity && event.velocity < custom.minimumVelocity) return false;
    if (custom.maximumVelocity && event.velocity > custom.maximumVelocity) return false;

    // Check finger count
    if (custom.requiredFingers && event.fingerCount !== custom.requiredFingers) return false;

    return true;
  }

  private triggerHapticFeedback(): void {
    // Platform-specific haptic feedback
    if (Platform.OS === 'ios') {
      // iOS haptic feedback
      import('react-native').then(({ Haptics }) => {
        Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle?.Light);
      }).catch(() => {});
    } else if (Platform.OS === 'android') {
      // Android haptic feedback
      import('react-native').then(({ Vibration }) => {
        Vibration.vibrate(50);
      }).catch(() => {});
    }
  }

  private triggerAudioFeedback(gestureType: GestureType): void {
    // Audio feedback for gestures
    console.log(`Audio feedback for ${gestureType}`);
    // Would play appropriate sound based on gesture type
  }

  private async requestConfirmation(handler: GestureHandler, event: GestureEvent): Promise<void> {
    // Request confirmation for sensitive gestures
    console.log(`Requesting confirmation for ${handler.id}`);
    
    // Simulate confirmation dialog
    setTimeout(() => {
      // If confirmed, execute the callback
      handler.callback(event);
    }, 1000);
  }
}

/**
 * React Hook for gesture management
 */
export const useAccessibleGestures = (gestureMap?: Partial<AccessibilityGestureMap>) => {
  const [gestureManager] = React.useState(() => new AccessibleGestureManager(gestureMap));

  const registerGesture = React.useCallback((
    id: string,
    gestureType: GestureType,
    callback: (event: GestureEvent) => void,
    config?: Partial<GestureConfig>
  ) => {
    gestureManager.registerHandler(id, gestureType, callback, config);
  }, [gestureManager]);

  const unregisterGesture = React.useCallback((id: string) => {
    gestureManager.unregisterHandler(id);
  }, [gestureManager]);

  const processGesture = React.useCallback((event: GestureEvent) => {
    return gestureManager.processGesture(event);
  }, [gestureManager]);

  const getGestureForAction = React.useCallback((
    category: keyof AccessibilityGestureMap,
    action: string
  ) => {
    return gestureManager.getGestureForAction(category, action);
  }, [gestureManager]);

  return {
    registerGesture,
    unregisterGesture,
    processGesture,
    getGestureForAction,
    gestureManager
  };
};

export default AccessibleGestureManager; 