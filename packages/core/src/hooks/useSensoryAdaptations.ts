import { useEffect, useRef, useState, useCallback } from 'react';

import { VisualAdapter, AccessibleFocusRing } from '../sensory/index.js';
import type { SensoryPreferences } from '../preferences/schemas.js';
import type { VisualAdapterOptions } from '../sensory/visual-adapter.js';

export interface SensoryHookOptions {
  targetElement?: HTMLElement;
  autoApply?: boolean;
  prefix?: string;
  focusRingEnabled?: boolean;
}

export interface SensoryHookState {
  isLoading: boolean;
  error: string | null;
  appliedAdaptations: Set<string>;
}

/**
 * React hook for managing sensory adaptations in components
 * 
 * @param preferences - Sensory preferences object
 * @param options - Configuration options
 * @returns Hook state and control functions
 */
export function useSensoryAdaptations(
  preferences: SensoryPreferences,
  options: SensoryHookOptions = {}
) {
  const [state, setState] = useState<SensoryHookState>({
    isLoading: true,
    error: null,
    appliedAdaptations: new Set(),
  });

  const visualAdapterRef = useRef<VisualAdapter | null>(null);
  const focusRingRef = useRef<AccessibleFocusRing | null>(null);

  // Initialize adapters
  useEffect(() => {
    try {
      setState((prev: SensoryHookState) => ({ ...prev, isLoading: true, error: null }));

      // Initialize Visual Adapter
      const visualOptions: VisualAdapterOptions = {
        ...(options.targetElement && { targetElement: options.targetElement }),
        autoApply: options.autoApply ?? true,
        ...(options.prefix && { prefix: options.prefix }),
      };

      visualAdapterRef.current = new VisualAdapter(preferences, visualOptions);

      // Initialize Focus Ring if enabled
      if (options.focusRingEnabled !== false) {
        focusRingRef.current = new AccessibleFocusRing();
        focusRingRef.current.apply();
      }

      setState((prev: SensoryHookState) => ({ 
        ...prev, 
        isLoading: false,
        appliedAdaptations: new Set(visualAdapterRef.current?.getCurrentAdaptations() 
          ? Object.keys(visualAdapterRef.current.getCurrentAdaptations()) 
          : []
        ),
      }));
    } catch (error) {
      setState((prev: SensoryHookState) => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize sensory adaptations' 
      }));
    }
  }, [options.targetElement, options.autoApply, options.prefix, options.focusRingEnabled]);

  // Update adaptations when preferences change
  useEffect(() => {
    if (!visualAdapterRef.current) return;

    try {
      visualAdapterRef.current.applyAdaptations(preferences);
      
      const currentAdaptations = visualAdapterRef.current.getCurrentAdaptations();
      setState(prev => ({ 
        ...prev, 
        appliedAdaptations: new Set(Object.keys(currentAdaptations)),
        error: null,
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to apply adaptations'
      }));
    }
  }, [preferences]);

  // Manual apply function
  const applyAdaptations = useCallback((newPreferences: SensoryPreferences) => {
    if (!visualAdapterRef.current) return;

    try {
      visualAdapterRef.current.applyAdaptations(newPreferences);
      
      const currentAdaptations = visualAdapterRef.current.getCurrentAdaptations();
      setState(prev => ({ 
        ...prev, 
        appliedAdaptations: new Set(Object.keys(currentAdaptations)),
        error: null,
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to apply adaptations'
      }));
    }
  }, []);

  // Disable all adaptations
  const disableAdaptations = useCallback(() => {
    if (!visualAdapterRef.current) return;

    try {
      visualAdapterRef.current.disable();
      setState(prev => ({ 
        ...prev, 
        appliedAdaptations: new Set(),
        error: null,
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to disable adaptations'
      }));
    }
  }, []);

  // Check if specific adaptation is applied
  const isAdaptationApplied = useCallback((adaptation: string): boolean => {
    return visualAdapterRef.current?.isAdaptationApplied(adaptation) ?? false;
  }, [state.appliedAdaptations]);

  // Get current adaptations
  const getCurrentAdaptations = useCallback(() => {
    return visualAdapterRef.current?.getCurrentAdaptations() ?? {};
  }, [state.appliedAdaptations]);

  // Update focus ring options
  const updateFocusRing = useCallback((focusOptions: any) => {
    if (!focusRingRef.current) return;

    try {
      focusRingRef.current.updateOptions(focusOptions);
      setState(prev => ({ ...prev, error: null }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to update focus ring'
      }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (visualAdapterRef.current) {
        visualAdapterRef.current.disable();
      }
      if (focusRingRef.current) {
        focusRingRef.current.remove();
      }
    };
  }, []);

  return {
    // State
    ...state,
    
    // Control functions
    applyAdaptations,
    disableAdaptations,
    isAdaptationApplied,
    getCurrentAdaptations,
    updateFocusRing,
    
    // Adapter refs (for advanced usage)
    visualAdapter: visualAdapterRef.current,
    focusRing: focusRingRef.current,
  };
} 