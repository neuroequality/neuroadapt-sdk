import { useEffect, useRef, useState, useCallback } from 'react';

import { CognitiveLoadEngine } from '../cognitive/index.js';
import type { CognitivePreferences } from '../preferences/schemas.js';
import type { CognitiveTier, AdaptationStrategy, TextMetrics } from '../cognitive/index.js';

export interface CognitiveLoadHookOptions {
  sessionMemory?: boolean;
  adaptationThreshold?: number;
  autoAnalyze?: boolean;
}

export interface CognitiveLoadHookState {
  isLoading: boolean;
  error: string | null;
  currentScore: number;
  currentTier: CognitiveTier;
  lastMetrics: TextMetrics | null;
  suggestedStrategies: AdaptationStrategy[];
}

/**
 * React hook for cognitive load analysis and management
 * 
 * @param preferences - Cognitive preferences object
 * @param options - Configuration options
 * @returns Hook state and analysis functions
 */
export function useCognitiveLoad(
  preferences: CognitivePreferences,
  options: CognitiveLoadHookOptions = {}
) {
  const [state, setState] = useState<CognitiveLoadHookState>({
    isLoading: true,
    error: null,
    currentScore: 0,
    currentTier: 'low',
    lastMetrics: null,
    suggestedStrategies: [],
  });

  const engineRef = useRef<CognitiveLoadEngine | null>(null);
  const eventListenersRef = useRef<Array<() => void>>([]);

  // Initialize engine
  useEffect(() => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      engineRef.current = new CognitiveLoadEngine({
        preferences,
        sessionMemory: options.sessionMemory ?? true,
        adaptationThreshold: options.adaptationThreshold ?? 70,
      });

      // Set up event listeners
      const cleanup: Array<() => void> = [];

      const onLoadScore = (data: { score: number; tier: CognitiveTier; context?: string }) => {
        setState(prev => ({
          ...prev,
          currentScore: data.score,
          currentTier: data.tier,
        }));
      };

      const onStrategySuggested = (strategy: AdaptationStrategy, context: string) => {
        setState(prev => ({
          ...prev,
          suggestedStrategies: [...prev.suggestedStrategies, strategy],
        }));
      };

      engineRef.current.on('load-score', onLoadScore);
      engineRef.current.on('strategy-suggested', onStrategySuggested);

      cleanup.push(() => {
        engineRef.current?.off('load-score', onLoadScore);
        engineRef.current?.off('strategy-suggested', onStrategySuggested);
      });

      eventListenersRef.current = cleanup;

      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize cognitive load engine' 
      }));
    }
  }, [preferences, options.sessionMemory, options.adaptationThreshold]);

  // Analyze text content
  const analyzeText = useCallback((text: string, context?: string): TextMetrics | null => {
    if (!engineRef.current) return null;

    try {
      const metrics = engineRef.current.analyzeText(text, context);
      setState(prev => ({ 
        ...prev, 
        lastMetrics: metrics,
        error: null,
      }));
      return metrics;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to analyze text'
      }));
      return null;
    }
  }, []);

  // Apply adaptation strategy
  const applyStrategy = useCallback((strategy: AdaptationStrategy, text: string): string | null => {
    if (!engineRef.current) return null;

    try {
      const result = engineRef.current.applyStrategy(strategy, text);
      setState(prev => ({ ...prev, error: null }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to apply strategy'
      }));
      return null;
    }
  }, []);

  // Get reading time estimate
  const getReadingTimeEstimate = useCallback((text: string): number => {
    if (!engineRef.current) return 0;

    try {
      return engineRef.current.readingTimeEstimate(text);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to estimate reading time'
      }));
      return 0;
    }
  }, []);

  // Get dense sections
  const getDenseSections = useCallback((text: string): string[] => {
    if (!engineRef.current) return [];

    try {
      return engineRef.current.denseSections(text);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to identify dense sections'
      }));
      return [];
    }
  }, []);

  // Register custom strategy
  const registerStrategy = useCallback((strategy: AdaptationStrategy, handler: (text: string) => string) => {
    if (!engineRef.current) return;

    try {
      engineRef.current.registerStrategy(strategy, handler);
      setState(prev => ({ ...prev, error: null }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to register strategy'
      }));
    }
  }, []);

  // Clear adaptation memory
  const clearMemory = useCallback(() => {
    if (!engineRef.current) return;

    try {
      engineRef.current.clearMemory();
      setState(prev => ({ ...prev, error: null }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to clear memory'
      }));
    }
  }, []);

  // Clear suggested strategies
  const clearSuggestedStrategies = useCallback(() => {
    setState(prev => ({ ...prev, suggestedStrategies: [] }));
  }, []);

  // Get cognitive tier for score
  const getCognitiveTier = useCallback((score: number): CognitiveTier => {
    if (!engineRef.current) return 'low';
    return engineRef.current.getCognitiveTier(score);
  }, []);

  // Auto-analyze text content when it changes (if enabled)
  useEffect(() => {
    if (!options.autoAnalyze) return;

    // This would be used with text content from the component
    // Could be enhanced to automatically analyze visible text on the page
    
    return () => {
      // Cleanup if needed
    };
  }, [options.autoAnalyze]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      eventListenersRef.current.forEach(cleanup => cleanup());
    };
  }, []);

  return {
    // State
    ...state,
    
    // Analysis functions
    analyzeText,
    getReadingTimeEstimate,
    getDenseSections,
    getCognitiveTier,
    
    // Adaptation functions
    applyStrategy,
    registerStrategy,
    clearMemory,
    clearSuggestedStrategies,
    
    // Engine ref (for advanced usage)
    engine: engineRef.current,
  };
} 