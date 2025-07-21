import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PredictionEngine } from '../src/prediction/engine.js';
import type { PredictionEngineConfig } from '../src/prediction/engine.js';

describe('PredictionEngine', () => {
  let engine: PredictionEngine;
  let config: PredictionEngineConfig;

  beforeEach(() => {
    config = {
      autoTrain: false,
      minSamplesForTraining: 5,
      maxTrainingData: 100,
      learningRate: 0.01,
    };
    
    engine = new PredictionEngine(config);
  });

  afterEach(() => {
    engine.destroy();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const defaultEngine = new PredictionEngine();
      expect(defaultEngine).toBeInstanceOf(PredictionEngine);
      expect(defaultEngine.getModelState().version).toBe('1.0.0');
      defaultEngine.destroy();
    });

    it('should initialize with custom config', () => {
      expect(engine).toBeInstanceOf(PredictionEngine);
      expect(engine.getModelState().trainingData).toBe(0);
    });
  });

  describe('recordInteraction', () => {
    it('should record user interactions', () => {
      const interaction = {
        timestamp: Date.now(),
        type: 'click' as const,
        target: 'button',
        value: 'test',
      };

      expect(() => engine.recordInteraction(interaction)).not.toThrow();
    });

    it('should handle invalid interactions gracefully', () => {
      const invalidInteraction = {
        timestamp: Date.now(),
        type: 'invalid' as any,
      };

      // Should not throw but might emit error
      let errorEmitted = false;
      engine.on('error', () => { errorEmitted = true; });
      
      engine.recordInteraction(invalidInteraction);
      expect(errorEmitted).toBe(true);
    });
  });

  describe('predictPreference', () => {
    it('should predict preferences based on context', async () => {
      const currentPreferences = {
        motionReduction: false,
        highContrast: false,
        fontSize: 1,
      };

      const context = {
        timeOfDay: 20, // Evening
        viewportWidth: 1920,
        viewportHeight: 1080,
      };

      const result = await engine.predictPreference(currentPreferences, context);
      
      expect(result).toBeDefined();
      expect(result.prediction).toBeDefined();
      expect(result.confidence).toMatch(/^(low|medium|high|very_high)$/);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.reasoning).toBeTypeOf('string');
    });

    it('should handle empty preferences', async () => {
      const result = await engine.predictPreference({});
      
      expect(result).toBeDefined();
      expect(result.confidence).toMatch(/^(low|medium|high|very_high)$/);
    });
  });

  describe('suggestAdaptations', () => {
    it('should suggest adaptations based on behavior', async () => {
      const currentState = {
        sessionDuration: 300000, // 5 minutes
        interactionCount: 50,
      };

      const interactions = [
        {
          timestamp: Date.now() - 10000,
          type: 'scroll' as const,
        },
        {
          timestamp: Date.now() - 8000,
          type: 'scroll' as const,
        },
        {
          timestamp: Date.now() - 6000,
          type: 'focus' as const,
        },
        {
          timestamp: Date.now() - 4000,
          type: 'blur' as const,
        },
        {
          timestamp: Date.now() - 2000,
          type: 'scroll' as const,
        },
      ];

      const suggestions = await engine.suggestAdaptations(currentState, interactions);
      
      expect(Array.isArray(suggestions)).toBe(true);
      suggestions.forEach(suggestion => {
        expect(suggestion.type).toMatch(/^(sensory|cognitive|preference|content)$/);
        expect(suggestion.action).toMatch(/^(enable|disable|adjust|replace)$/);
        expect(suggestion.confidence).toMatch(/^(low|medium|high|very_high)$/);
        expect(suggestion.priority).toMatch(/^(low|medium|high|urgent)$/);
        expect(suggestion.estimatedImpact).toBeGreaterThanOrEqual(0);
        expect(suggestion.estimatedImpact).toBeLessThanOrEqual(1);
      });
    });

    it('should detect motion sensitivity patterns', async () => {
      const interactions = Array.from({ length: 10 }, (_, i) => ({
        timestamp: Date.now() - (i * 1000),
        type: 'scroll' as const,
      }));

      const suggestions = await engine.suggestAdaptations({}, interactions);
      
      const motionSuggestion = suggestions.find(s => s.target === 'motionReduction');
      expect(motionSuggestion).toBeDefined();
      expect(motionSuggestion?.action).toBe('enable');
    });

    it('should detect cognitive load patterns', async () => {
      const interactions = Array.from({ length: 5 }, (_, i) => ({
        timestamp: Date.now() - (i * 6000), // 6 second gaps
        type: 'click' as const,
      }));

      const suggestions = await engine.suggestAdaptations({}, interactions);
      
      const cognitiveLoadSuggestion = suggestions.find(s => s.target === 'chunkSize');
      expect(cognitiveLoadSuggestion).toBeDefined();
      expect(cognitiveLoadSuggestion?.action).toBe('adjust');
    });
  });

  describe('addTrainingData', () => {
    it('should add training data', () => {
      const features = {
        features: { motionReduction: 1, fontSize: 1.2 },
        timestamp: Date.now(),
      };

      expect(() => engine.addTrainingData(features, { adapted: true }, 1)).not.toThrow();
    });

    it('should handle training data without feedback', () => {
      const features = {
        features: { motionReduction: 0, fontSize: 1 },
        timestamp: Date.now(),
      };

      expect(() => engine.addTrainingData(features, { adapted: false })).not.toThrow();
    });
  });

  describe('trainModel', () => {
    it('should train model when enough data is available', () => {
      // Add enough training data
      for (let i = 0; i < 10; i++) {
        engine.addTrainingData({
          features: { motionReduction: i % 2, fontSize: 1 + (i * 0.1) },
          timestamp: Date.now(),
        }, { adapted: i % 2 === 1 }, i % 2);
      }

      expect(() => engine.trainModel()).not.toThrow();
      expect(engine.getModelState().trainingData).toBeGreaterThan(0);
    });

    it('should not train with insufficient data', () => {
      engine.addTrainingData({
        features: { motionReduction: 1 },
        timestamp: Date.now(),
      }, { adapted: true });

      const initialState = engine.getModelState();
      engine.trainModel();
      
      expect(engine.getModelState().trainingData).toBe(initialState.trainingData);
    });
  });

  describe('getModelState', () => {
    it('should return current model state', () => {
      const state = engine.getModelState();
      
      expect(state.version).toBe('1.0.0');
      expect(state.trainingData).toBe(0);
      expect(state.lastUpdated).toBeTypeOf('number');
      expect(Array.isArray(state.features)).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset model state', () => {
      // Add some data first
      engine.addTrainingData({
        features: { motionReduction: 1 },
        timestamp: Date.now(),
      }, { adapted: true });

      engine.reset();
      
      const state = engine.getModelState();
      expect(state.trainingData).toBe(0);
    });
  });

  describe('events', () => {
    it('should emit prediction events', async () => {
      let predictionEmitted = false;
      engine.on('prediction', () => { predictionEmitted = true; });

      await engine.predictPreference({ motionReduction: false });
      
      expect(predictionEmitted).toBe(true);
    });

    it('should emit adaptation suggested events', async () => {
      let adaptationEmitted = false;
      engine.on('adaptation-suggested', () => { adaptationEmitted = true; });

      const interactions = Array.from({ length: 10 }, () => ({
        timestamp: Date.now(),
        type: 'scroll' as const,
      }));

      await engine.suggestAdaptations({}, interactions);
      
      expect(adaptationEmitted).toBe(true);
    });

    it('should emit model updated events', () => {
      let modelUpdatedEmitted = false;
      engine.on('model-updated', () => { modelUpdatedEmitted = true; });

      // Add enough data to trigger training
      for (let i = 0; i < 10; i++) {
        engine.addTrainingData({
          features: { motionReduction: i % 2 },
          timestamp: Date.now(),
        }, { adapted: i % 2 === 1 });
      }

      expect(modelUpdatedEmitted).toBe(true);
    });
  });
}); 