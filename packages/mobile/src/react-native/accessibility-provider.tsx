/**
 * React Native Accessibility Provider - Mobile-specific accessibility features
 * @fileoverview Provides mobile accessibility context and adaptations for React Native apps
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  AccessibilityInfo, 
  Dimensions, 
  Platform, 
  StatusBar,
  useColorScheme 
} from 'react-native';
import type { Preferences } from '@neuroadapt/core';

export interface MobileAccessibilityState {
  screenReader: {
    enabled: boolean;
    type: 'voiceover' | 'talkback' | 'other' | null;
  };
  reduceMotion: boolean;
  reduceTransparency: boolean;
  boldText: boolean;
  largeText: boolean;
  highContrast: boolean;
  colorScheme: 'light' | 'dark' | null;
  deviceOrientation: 'portrait' | 'landscape';
  screenSize: 'small' | 'medium' | 'large' | 'xlarge';
  hapticFeedback: boolean;
  voiceControl: boolean;
  grayscale: boolean;
}

export interface MobileAccessibilityActions {
  updatePreferences: (preferences: Partial<Preferences>) => void;
  announceForAccessibility: (message: string) => void;
  setFocusToElement: (elementRef: any) => void;
  triggerHapticFeedback: (type: 'light' | 'medium' | 'heavy' | 'selection') => void;
  adjustFontSize: (scale: number) => void;
  toggleHighContrast: () => void;
  toggleReduceMotion: () => void;
}

interface MobileAccessibilityContextType {
  state: MobileAccessibilityState;
  actions: MobileAccessibilityActions;
  preferences: Preferences | null;
  isLoading: boolean;
}

const MobileAccessibilityContext = createContext<MobileAccessibilityContextType | null>(null);

export interface MobileAccessibilityProviderProps {
  children: ReactNode;
  initialPreferences?: Preferences;
  onPreferencesChange?: (preferences: Preferences) => void;
  hapticEnabled?: boolean;
  announcements?: boolean;
}

/**
 * Mobile Accessibility Provider Component
 */
export const MobileAccessibilityProvider: React.FC<MobileAccessibilityProviderProps> = ({
  children,
  initialPreferences,
  onPreferencesChange,
  hapticEnabled = true,
  announcements = true
}) => {
  const [state, setState] = useState<MobileAccessibilityState>({
    screenReader: {
      enabled: false,
      type: null
    },
    reduceMotion: false,
    reduceTransparency: false,
    boldText: false,
    largeText: false,
    highContrast: false,
    colorScheme: useColorScheme(),
    deviceOrientation: 'portrait',
    screenSize: 'medium',
    hapticFeedback: hapticEnabled,
    voiceControl: false,
    grayscale: false
  });

  const [preferences, setPreferences] = useState<Preferences | null>(initialPreferences || null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize accessibility state
  useEffect(() => {
    const initializeAccessibilityState = async () => {
      try {
        // Check screen reader status
        const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
        const screenReaderType = Platform.OS === 'ios' ? 'voiceover' : 'talkback';

        // Check reduce motion
        const reduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled?.() || false;

        // Check other accessibility features (iOS specific)
        let reduceTransparency = false;
        let boldText = false;
        let grayscale = false;

        if (Platform.OS === 'ios') {
          reduceTransparency = await AccessibilityInfo.isReduceTransparencyEnabled?.() || false;
          boldText = await AccessibilityInfo.isBoldTextEnabled?.() || false;
          grayscale = await AccessibilityInfo.isGrayscaleEnabled?.() || false;
        }

        // Get screen dimensions for size classification
        const { width, height } = Dimensions.get('window');
        const screenSize = classifyScreenSize(width, height);
        const deviceOrientation = width > height ? 'landscape' : 'portrait';

        setState(prevState => ({
          ...prevState,
          screenReader: {
            enabled: screenReaderEnabled,
            type: screenReaderEnabled ? screenReaderType : null
          },
          reduceMotion: reduceMotionEnabled,
          reduceTransparency,
          boldText,
          grayscale,
          deviceOrientation,
          screenSize
        }));

        setIsLoading(false);
      } catch (error) {
        console.warn('Error initializing accessibility state:', error);
        setIsLoading(false);
      }
    };

    initializeAccessibilityState();

    // Listen for accessibility changes
    const screenReaderListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled: boolean) => {
        setState(prevState => ({
          ...prevState,
          screenReader: {
            enabled,
            type: enabled ? (Platform.OS === 'ios' ? 'voiceover' : 'talkback') : null
          }
        }));
      }
    );

    const reduceMotionListener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled: boolean) => {
        setState(prevState => ({
          ...prevState,
          reduceMotion: enabled
        }));
      }
    );

    // Listen for orientation changes
    const dimensionsListener = Dimensions.addEventListener('change', ({ window }) => {
      const newOrientation = window.width > window.height ? 'landscape' : 'portrait';
      const newScreenSize = classifyScreenSize(window.width, window.height);
      
      setState(prevState => ({
        ...prevState,
        deviceOrientation: newOrientation,
        screenSize: newScreenSize
      }));
    });

    return () => {
      screenReaderListener?.remove();
      reduceMotionListener?.remove();
      dimensionsListener?.remove();
    };
  }, []);

  // Actions
  const actions: MobileAccessibilityActions = {
    updatePreferences: (newPreferences: Partial<Preferences>) => {
      const updatedPreferences = {
        ...preferences,
        ...newPreferences,
        lastUpdated: new Date()
      } as Preferences;
      
      setPreferences(updatedPreferences);
      onPreferencesChange?.(updatedPreferences);
    },

    announceForAccessibility: (message: string) => {
      if (announcements && state.screenReader.enabled) {
        AccessibilityInfo.announceForAccessibility(message);
      }
    },

    setFocusToElement: (elementRef: any) => {
      if (elementRef && elementRef.current) {
        AccessibilityInfo.setAccessibilityFocus(elementRef.current);
      }
    },

    triggerHapticFeedback: (type: 'light' | 'medium' | 'heavy' | 'selection') => {
      if (!hapticEnabled || !state.hapticFeedback) return;

      // Import haptic feedback dynamically to avoid errors on platforms that don't support it
      import('react-native')
        .then(({ Haptics }) => {
          if (Haptics) {
            switch (type) {
              case 'light':
                Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle?.Light);
                break;
              case 'medium':
                Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle?.Medium);
                break;
              case 'heavy':
                Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle?.Heavy);
                break;
              case 'selection':
                Haptics.selectionAsync?.();
                break;
            }
          }
        })
        .catch(() => {
          // Haptics not available, silently fail
        });
    },

    adjustFontSize: (scale: number) => {
      actions.updatePreferences({
        sensory: {
          ...preferences?.sensory,
          fontSize: Math.max(12, Math.min(32, (preferences?.sensory?.fontSize || 16) * scale))
        }
      });
    },

    toggleHighContrast: () => {
      actions.updatePreferences({
        sensory: {
          ...preferences?.sensory,
          highContrast: !preferences?.sensory?.highContrast
        }
      });
      
      setState(prevState => ({
        ...prevState,
        highContrast: !prevState.highContrast
      }));
    },

    toggleReduceMotion: () => {
      actions.updatePreferences({
        sensory: {
          ...preferences?.sensory,
          motionReduction: !preferences?.sensory?.motionReduction
        }
      });
    }
  };

  const contextValue: MobileAccessibilityContextType = {
    state,
    actions,
    preferences,
    isLoading
  };

  return (
    <MobileAccessibilityContext.Provider value={contextValue}>
      {children}
    </MobileAccessibilityContext.Provider>
  );
};

/**
 * Hook to use mobile accessibility context
 */
export const useMobileAccessibility = (): MobileAccessibilityContextType => {
  const context = useContext(MobileAccessibilityContext);
  if (!context) {
    throw new Error('useMobileAccessibility must be used within a MobileAccessibilityProvider');
  }
  return context;
};

/**
 * Hook for screen reader specific functionality
 */
export const useScreenReader = () => {
  const { state, actions } = useMobileAccessibility();
  
  return {
    isEnabled: state.screenReader.enabled,
    type: state.screenReader.type,
    announce: actions.announceForAccessibility,
    setFocus: actions.setFocusToElement
  };
};

/**
 * Hook for haptic feedback
 */
export const useHapticFeedback = () => {
  const { state, actions } = useMobileAccessibility();
  
  return {
    isEnabled: state.hapticFeedback,
    trigger: actions.triggerHapticFeedback
  };
};

/**
 * Hook for device orientation and screen size
 */
export const useDeviceContext = () => {
  const { state } = useMobileAccessibility();
  
  return {
    orientation: state.deviceOrientation,
    screenSize: state.screenSize,
    isLandscape: state.deviceOrientation === 'landscape',
    isPortrait: state.deviceOrientation === 'portrait',
    isSmallScreen: state.screenSize === 'small',
    isMediumScreen: state.screenSize === 'medium',
    isLargeScreen: state.screenSize === 'large' || state.screenSize === 'xlarge'
  };
};

// Helper functions
const classifyScreenSize = (width: number, height: number): 'small' | 'medium' | 'large' | 'xlarge' => {
  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);
  
  // Based on common mobile screen sizes
  if (maxDimension < 568) return 'small';      // iPhone 4s and smaller
  if (maxDimension < 667) return 'medium';     // iPhone 6/7/8
  if (maxDimension < 896) return 'large';      // iPhone X/11 Pro
  return 'xlarge';                             // iPhone 11 Pro Max and larger
};

export default MobileAccessibilityProvider; 