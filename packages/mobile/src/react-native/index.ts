/**
 * React Native Components and Hooks
 * @fileoverview Export React Native specific accessibility features
 */

export { 
  MobileAccessibilityProvider, 
  useMobileAccessibility, 
  useScreenReader, 
  useHapticFeedback, 
  useDeviceContext 
} from './accessibility-provider';

export type {
  MobileAccessibilityState,
  MobileAccessibilityActions,
  MobileAccessibilityProviderProps
} from './accessibility-provider'; 