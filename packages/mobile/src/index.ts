/**
 * NeuroAdapt Mobile Package - Mobile accessibility features for React Native and cross-platform apps
 * @fileoverview Main entry point for mobile accessibility features
 */

// React Native Provider and Hooks
export { 
  MobileAccessibilityProvider, 
  useMobileAccessibility, 
  useScreenReader, 
  useHapticFeedback, 
  useDeviceContext 
} from './react-native/accessibility-provider';

export type {
  MobileAccessibilityState,
  MobileAccessibilityActions,
  MobileAccessibilityProviderProps
} from './react-native/accessibility-provider';

// Mobile Adapters
export { MobileAdapter } from './adapters/mobile-adapter';
export type {
  MobilePlatform,
  PlatformCapabilities,
  MobileAdaptation,
  AdaptationImplementation
} from './adapters/mobile-adapter';

// Gesture System
export { 
  AccessibleGestureManager, 
  useAccessibleGestures 
} from './gestures/accessible-gestures';

export type {
  GestureConfig,
  GestureType,
  GestureCustomization,
  GestureEvent,
  GestureHandler,
  AccessibilityGestureMap
} from './gestures/accessible-gestures';

// Cross-platform Testing
export * from './testing'; 