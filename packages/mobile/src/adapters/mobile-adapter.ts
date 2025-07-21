/**
 * Mobile Adapter - Platform-specific accessibility adaptations
 * @fileoverview Provides mobile platform-specific implementations for accessibility features
 */

import { Platform } from 'react-native';
import type { Preferences } from '@neuroadapt/core';

export interface MobilePlatform {
  name: 'ios' | 'android' | 'web' | 'windows' | 'macos';
  version: string;
  capabilities: PlatformCapabilities;
}

export interface PlatformCapabilities {
  screenReader: boolean;
  hapticFeedback: boolean;
  voiceControl: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  boldText: boolean;
  largeText: boolean;
  grayscale: boolean;
  invertColors: boolean;
  reduceTransparency: boolean;
  buttonShapes: boolean;
  onOffLabels: boolean;
  systemWideTextScaling: boolean;
  magnifier: boolean;
  speakSelection: boolean;
  speakScreen: boolean;
  guidedAccess: boolean;
  switchControl: boolean;
  assistiveTouch: boolean;
  liveRegions: boolean;
  semanticLabels: boolean;
  customActions: boolean;
}

export interface MobileAdaptation {
  type: 'visual' | 'motor' | 'cognitive' | 'sensory';
  feature: string;
  enabled: boolean;
  value?: any;
  platformSpecific: boolean;
  implementation: AdaptationImplementation;
}

export interface AdaptationImplementation {
  ios?: () => Promise<void>;
  android?: () => Promise<void>;
  web?: () => Promise<void>;
  universal?: () => Promise<void>;
}

/**
 * Mobile Platform Adapter
 */
export class MobileAdapter {
  private platform: MobilePlatform;
  private adaptations: Map<string, MobileAdaptation> = new Map();
  
  constructor() {
    this.platform = this.detectPlatform();
    this.initializeAdaptations();
  }

  /**
   * Get current platform information
   */
  getPlatform(): MobilePlatform {
    return this.platform;
  }

  /**
   * Check if a feature is supported on current platform
   */
  isFeatureSupported(feature: string): boolean {
    const adaptation = this.adaptations.get(feature);
    if (!adaptation) return false;

    if (!adaptation.platformSpecific) return true;

    const implementation = adaptation.implementation;
    return !!(
      (this.platform.name === 'ios' && implementation.ios) ||
      (this.platform.name === 'android' && implementation.android) ||
      (this.platform.name === 'web' && implementation.web) ||
      implementation.universal
    );
  }

  /**
   * Apply accessibility preferences to mobile platform
   */
  async applyPreferences(preferences: Preferences): Promise<void> {
    const applicableAdaptations = this.getApplicableAdaptations(preferences);
    
    for (const adaptation of applicableAdaptations) {
      try {
        await this.executeAdaptation(adaptation);
      } catch (error) {
        console.warn(`Failed to apply adaptation ${adaptation.feature}:`, error);
      }
    }
  }

  /**
   * Get platform-specific recommendations
   */
  getPlatformRecommendations(preferences: Preferences): {
    feature: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high';
    reason: string;
  }[] {
    const recommendations = [];

    // iOS specific recommendations
    if (this.platform.name === 'ios') {
      if (preferences.sensory?.motionReduction) {
        recommendations.push({
          feature: 'reduce_motion',
          recommendation: 'Enable Reduce Motion in iOS Settings > Accessibility > Motion',
          priority: 'high' as const,
          reason: 'Reduces animations system-wide for better comfort'
        });
      }

      if (preferences.sensory?.highContrast) {
        recommendations.push({
          feature: 'increase_contrast',
          recommendation: 'Enable Increase Contrast in iOS Settings > Accessibility > Display & Text Size',
          priority: 'high' as const,
          reason: 'Improves text readability and UI element distinction'
        });
      }

      if (preferences.motor?.targetSizeIncrease && preferences.motor.targetSizeIncrease > 1.2) {
        recommendations.push({
          feature: 'button_shapes',
          recommendation: 'Enable Button Shapes in iOS Settings > Accessibility > Display & Text Size',
          priority: 'medium' as const,
          reason: 'Makes buttons more visually distinct and easier to target'
        });
      }
    }

    // Android specific recommendations
    if (this.platform.name === 'android') {
      if (preferences.cognitive?.processingPace === 'relaxed') {
        recommendations.push({
          feature: 'remove_animations',
          recommendation: 'Disable animations in Android Developer Options',
          priority: 'medium' as const,
          reason: 'Reduces cognitive load by removing distracting animations'
        });
      }

      if (preferences.motor?.keyboardNavigation) {
        recommendations.push({
          feature: 'talkback_navigation',
          recommendation: 'Configure TalkBack gestures for navigation',
          priority: 'high' as const,
          reason: 'Enables keyboard-like navigation using gestures'
        });
      }

      if (preferences.sensory?.fontSize && preferences.sensory.fontSize > 18) {
        recommendations.push({
          feature: 'large_text',
          recommendation: 'Enable Large Text in Android Settings > Accessibility > Text and display',
          priority: 'high' as const,
          reason: 'Applies text scaling system-wide'
        });
      }
    }

    return recommendations;
  }

  /**
   * Test platform capabilities
   */
  async testCapabilities(): Promise<{
    feature: string;
    supported: boolean;
    tested: boolean;
    error?: string;
  }[]> {
    const results = [];
    
    for (const [feature, adaptation] of this.adaptations.entries()) {
      try {
        const supported = this.isFeatureSupported(feature);
        let tested = false;
        let error: string | undefined;

        if (supported) {
          try {
            // Test implementation exists and is callable
            await this.executeAdaptation(adaptation, true); // dry run
            tested = true;
          } catch (testError) {
            error = testError instanceof Error ? testError.message : 'Unknown error';
          }
        }

        results.push({
          feature,
          supported,
          tested,
          error
        });
      } catch (error) {
        results.push({
          feature,
          supported: false,
          tested: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Get accessibility information for current platform
   */
  async getAccessibilityInfo(): Promise<{
    screenReader: boolean;
    screenReaderType?: string;
    reduceMotion: boolean;
    highContrast: boolean;
    textScale: number;
    isDarkMode: boolean;
    isLandscape: boolean;
  }> {
    // This would integrate with platform-specific APIs
    // For now, returning mock data
    return {
      screenReader: false,
      screenReaderType: this.platform.name === 'ios' ? 'VoiceOver' : 'TalkBack',
      reduceMotion: false,
      highContrast: false,
      textScale: 1.0,
      isDarkMode: false,
      isLandscape: false
    };
  }

  // Private methods
  private detectPlatform(): MobilePlatform {
    const platformName = Platform.OS as 'ios' | 'android' | 'web' | 'windows' | 'macos';
    const version = Platform.Version?.toString() || '0';
    
    return {
      name: platformName,
      version,
      capabilities: this.getPlatformCapabilities(platformName, version)
    };
  }

  private getPlatformCapabilities(platform: string, version: string): PlatformCapabilities {
    const baseCapabilities: PlatformCapabilities = {
      screenReader: true,
      hapticFeedback: false,
      voiceControl: false,
      reduceMotion: false,
      highContrast: false,
      boldText: false,
      largeText: true,
      grayscale: false,
      invertColors: false,
      reduceTransparency: false,
      buttonShapes: false,
      onOffLabels: false,
      systemWideTextScaling: true,
      magnifier: false,
      speakSelection: false,
      speakScreen: false,
      guidedAccess: false,
      switchControl: false,
      assistiveTouch: false,
      liveRegions: true,
      semanticLabels: true,
      customActions: true
    };

    switch (platform) {
      case 'ios':
        return {
          ...baseCapabilities,
          hapticFeedback: true,
          voiceControl: parseFloat(version) >= 13,
          reduceMotion: true,
          highContrast: true,
          boldText: true,
          grayscale: true,
          invertColors: true,
          reduceTransparency: true,
          buttonShapes: true,
          onOffLabels: true,
          magnifier: true,
          speakSelection: true,
          speakScreen: true,
          guidedAccess: true,
          switchControl: true,
          assistiveTouch: true
        };

      case 'android':
        return {
          ...baseCapabilities,
          hapticFeedback: true,
          voiceControl: parseFloat(version) >= 11,
          reduceMotion: parseFloat(version) >= 10,
          highContrast: parseFloat(version) >= 8,
          boldText: parseFloat(version) >= 8,
          magnifier: parseFloat(version) >= 9
        };

      case 'web':
        return {
          ...baseCapabilities,
          screenReader: true, // Depends on browser and screen reader
          reduceMotion: true, // CSS media query support
          highContrast: true  // CSS media query support
        };

      default:
        return baseCapabilities;
    }
  }

  private initializeAdaptations(): void {
    // Visual adaptations
    this.adaptations.set('reduce_motion', {
      type: 'visual',
      feature: 'reduce_motion',
      enabled: false,
      platformSpecific: true,
      implementation: {
        ios: this.applyReduceMotionIOS,
        android: this.applyReduceMotionAndroid,
        web: this.applyReduceMotionWeb,
        universal: this.applyReduceMotionUniversal
      }
    });

    this.adaptations.set('high_contrast', {
      type: 'visual',
      feature: 'high_contrast',
      enabled: false,
      platformSpecific: true,
      implementation: {
        ios: this.applyHighContrastIOS,
        android: this.applyHighContrastAndroid,
        web: this.applyHighContrastWeb,
        universal: this.applyHighContrastUniversal
      }
    });

    this.adaptations.set('large_text', {
      type: 'visual',
      feature: 'large_text',
      enabled: false,
      platformSpecific: false,
      implementation: {
        universal: this.applyLargeTextUniversal
      }
    });

    // Motor adaptations
    this.adaptations.set('larger_targets', {
      type: 'motor',
      feature: 'larger_targets',
      enabled: false,
      platformSpecific: false,
      implementation: {
        universal: this.applyLargerTargetsUniversal
      }
    });

    this.adaptations.set('haptic_feedback', {
      type: 'motor',
      feature: 'haptic_feedback',
      enabled: false,
      platformSpecific: true,
      implementation: {
        ios: this.applyHapticFeedbackIOS,
        android: this.applyHapticFeedbackAndroid
      }
    });

    // Cognitive adaptations
    this.adaptations.set('simplified_interface', {
      type: 'cognitive',
      feature: 'simplified_interface',
      enabled: false,
      platformSpecific: false,
      implementation: {
        universal: this.applySimplifiedInterfaceUniversal
      }
    });

    // Sensory adaptations
    this.adaptations.set('sound_enhancement', {
      type: 'sensory',
      feature: 'sound_enhancement',
      enabled: false,
      platformSpecific: true,
      implementation: {
        ios: this.applySoundEnhancementIOS,
        android: this.applySoundEnhancementAndroid,
        universal: this.applySoundEnhancementUniversal
      }
    });
  }

  private getApplicableAdaptations(preferences: Preferences): MobileAdaptation[] {
    const applicable: MobileAdaptation[] = [];

    // Check visual preferences
    if (preferences.sensory?.motionReduction) {
      const adaptation = this.adaptations.get('reduce_motion');
      if (adaptation && this.isFeatureSupported('reduce_motion')) {
        applicable.push({ ...adaptation, enabled: true });
      }
    }

    if (preferences.sensory?.highContrast) {
      const adaptation = this.adaptations.get('high_contrast');
      if (adaptation && this.isFeatureSupported('high_contrast')) {
        applicable.push({ ...adaptation, enabled: true });
      }
    }

    if (preferences.sensory?.fontSize && preferences.sensory.fontSize > 16) {
      const adaptation = this.adaptations.get('large_text');
      if (adaptation && this.isFeatureSupported('large_text')) {
        applicable.push({ 
          ...adaptation, 
          enabled: true, 
          value: preferences.sensory.fontSize 
        });
      }
    }

    // Check motor preferences
    if (preferences.motor?.targetSizeIncrease && preferences.motor.targetSizeIncrease > 1.0) {
      const adaptation = this.adaptations.get('larger_targets');
      if (adaptation && this.isFeatureSupported('larger_targets')) {
        applicable.push({ 
          ...adaptation, 
          enabled: true, 
          value: preferences.motor.targetSizeIncrease 
        });
      }
    }

    // Check cognitive preferences
    if (preferences.cognitive?.processingPace === 'relaxed') {
      const adaptation = this.adaptations.get('simplified_interface');
      if (adaptation && this.isFeatureSupported('simplified_interface')) {
        applicable.push({ ...adaptation, enabled: true });
      }
    }

    // Check audio preferences
    if (preferences.audio?.enableAudio) {
      const adaptation = this.adaptations.get('sound_enhancement');
      if (adaptation && this.isFeatureSupported('sound_enhancement')) {
        applicable.push({ 
          ...adaptation, 
          enabled: true, 
          value: preferences.audio.volume 
        });
      }
    }

    return applicable;
  }

  private async executeAdaptation(adaptation: MobileAdaptation, dryRun: boolean = false): Promise<void> {
    if (dryRun) {
      // Just check if implementation exists
      const implementation = adaptation.implementation;
      const hasImplementation = !!(
        (this.platform.name === 'ios' && implementation.ios) ||
        (this.platform.name === 'android' && implementation.android) ||
        (this.platform.name === 'web' && implementation.web) ||
        implementation.universal
      );
      
      if (!hasImplementation) {
        throw new Error(`No implementation for ${adaptation.feature} on ${this.platform.name}`);
      }
      return;
    }

    const implementation = adaptation.implementation;
    
    // Execute platform-specific implementation
    switch (this.platform.name) {
      case 'ios':
        if (implementation.ios) {
          await implementation.ios.call(this);
        } else if (implementation.universal) {
          await implementation.universal.call(this);
        }
        break;
      
      case 'android':
        if (implementation.android) {
          await implementation.android.call(this);
        } else if (implementation.universal) {
          await implementation.universal.call(this);
        }
        break;
      
      case 'web':
        if (implementation.web) {
          await implementation.web.call(this);
        } else if (implementation.universal) {
          await implementation.universal.call(this);
        }
        break;
      
      default:
        if (implementation.universal) {
          await implementation.universal.call(this);
        }
        break;
    }
  }

  // Platform-specific implementation methods
  private async applyReduceMotionIOS(): Promise<void> {
    // iOS-specific reduce motion implementation
    console.log('Applying iOS reduce motion settings');
  }

  private async applyReduceMotionAndroid(): Promise<void> {
    // Android-specific reduce motion implementation
    console.log('Applying Android reduce motion settings');
  }

  private async applyReduceMotionWeb(): Promise<void> {
    // Web-specific reduce motion implementation
    console.log('Applying web reduce motion settings');
  }

  private async applyReduceMotionUniversal(): Promise<void> {
    // Universal reduce motion implementation
    console.log('Applying universal reduce motion settings');
  }

  private async applyHighContrastIOS(): Promise<void> {
    console.log('Applying iOS high contrast settings');
  }

  private async applyHighContrastAndroid(): Promise<void> {
    console.log('Applying Android high contrast settings');
  }

  private async applyHighContrastWeb(): Promise<void> {
    console.log('Applying web high contrast settings');
  }

  private async applyHighContrastUniversal(): Promise<void> {
    console.log('Applying universal high contrast settings');
  }

  private async applyLargeTextUniversal(): Promise<void> {
    console.log('Applying universal large text settings');
  }

  private async applyLargerTargetsUniversal(): Promise<void> {
    console.log('Applying universal larger targets settings');
  }

  private async applyHapticFeedbackIOS(): Promise<void> {
    console.log('Applying iOS haptic feedback settings');
  }

  private async applyHapticFeedbackAndroid(): Promise<void> {
    console.log('Applying Android haptic feedback settings');
  }

  private async applySimplifiedInterfaceUniversal(): Promise<void> {
    console.log('Applying universal simplified interface settings');
  }

  private async applySoundEnhancementIOS(): Promise<void> {
    console.log('Applying iOS sound enhancement settings');
  }

  private async applySoundEnhancementAndroid(): Promise<void> {
    console.log('Applying Android sound enhancement settings');
  }

  private async applySoundEnhancementUniversal(): Promise<void> {
    console.log('Applying universal sound enhancement settings');
  }
}

export default MobileAdapter; 