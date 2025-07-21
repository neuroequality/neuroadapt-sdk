import { EventEmitter } from 'eventemitter3';
import { z } from 'zod';
import type { 
  UserInteraction, 
  PredictionResult, 
  AdaptationSuggestion, 
  ModelState, 
  FeatureVector, 
  TrainingData,
  ModelMetrics,
  ConfidenceLevel 
} from '../types/common.js';

/**
 * Events emitted by PredictionEngine
 */
export interface PredictionEngineEvents {
  'prediction': (result: PredictionResult) => void;
  'adaptation-suggested': (suggestion: AdaptationSuggestion) => void;
  'model-updated': (state: ModelState) => void;
  'training-complete': (metrics: ModelMetrics) => void;
  'error': (error: Error) => void;
}

/**
 * Configuration for prediction engine
 */
export interface PredictionEngineConfig {
  modelPath?: string;
  autoTrain?: boolean;
  trainingInterval?: number; // milliseconds
  minSamplesForTraining?: number;
  maxTrainingData?: number;
  learningRate?: number;
  featureEngineering?: boolean;
  enableOnlinelearning?: boolean;
}

/**
 * Feature extraction configuration
 */
interface FeatureConfig {
  temporal: boolean;
  interaction: boolean;
  preference: boolean;
  context: boolean;
  aggregation: boolean;
}

/**
 * Simple linear model for preference prediction
 */
class LinearModel {
  private weights: Map<string, number> = new Map();
  private bias = 0;
  private learningRate: number;

  constructor(learningRate = 0.01) {
    this.learningRate = learningRate;
  }

  predict(features: Record<string, number>): number {
    let prediction = this.bias;
    for (const [feature, value] of Object.entries(features)) {
      const weight = this.weights.get(feature) || 0;
      prediction += weight * value;
    }
    return Math.max(0, Math.min(1, prediction)); // Sigmoid-like clipping
  }

  train(samples: TrainingData[]): void {
    for (const sample of samples) {
      const prediction = this.predict(sample.input.features);
      const target = typeof sample.output === 'number' ? sample.output : 0;
      const error = target - prediction;
      const weight = sample.weight || 1;

      // Update bias
      this.bias += this.learningRate * error * weight;

      // Update weights
      for (const [feature, value] of Object.entries(sample.input.features)) {
        const currentWeight = this.weights.get(feature) || 0;
        this.weights.set(feature, currentWeight + this.learningRate * error * value * weight);
      }
    }
  }

  getWeights(): Record<string, number> {
    return Object.fromEntries(this.weights);
  }

  setWeights(weights: Record<string, number>): void {
    this.weights = new Map(Object.entries(weights));
  }
}

/**
 * PredictionEngine provides AI-powered adaptive learning for user preferences
 */
export class PredictionEngine extends EventEmitter<PredictionEngineEvents> {
  private config: Required<PredictionEngineConfig>;
  private model: LinearModel;
  private trainingData: TrainingData[] = [];
  private interactions: UserInteraction[] = [];
  private featureConfig: FeatureConfig;
  private modelState: ModelState;
  private trainingTimer: NodeJS.Timeout | undefined;

  constructor(config: PredictionEngineConfig = {}) {
    super();
    
    this.config = {
      modelPath: config.modelPath || 'neuroadapt-model.json',
      autoTrain: config.autoTrain ?? true,
      trainingInterval: config.trainingInterval || 300000, // 5 minutes
      minSamplesForTraining: config.minSamplesForTraining || 10,
      maxTrainingData: config.maxTrainingData || 1000,
      learningRate: config.learningRate || 0.01,
      featureEngineering: config.featureEngineering ?? true,
      enableOnlinelearning: config.enableOnlinelearning ?? true,
    };

    this.model = new LinearModel(this.config.learningRate);
    this.featureConfig = {
      temporal: true,
      interaction: true,
      preference: true,
      context: true,
      aggregation: true,
    };

    this.modelState = {
      version: '1.0.0',
      trainingData: 0,
      lastUpdated: Date.now(),
      features: this.getFeatureNames(),
    };

    if (this.config.autoTrain) {
      this.startAutoTraining();
    }
  }

  /**
   * Record user interaction for learning
   */
  recordInteraction(interaction: UserInteraction): void {
    try {
      this.interactions.push(interaction);
      
      // Keep only recent interactions
      const maxInteractions = this.config.maxTrainingData * 2;
      if (this.interactions.length > maxInteractions) {
        this.interactions = this.interactions.slice(-maxInteractions);
      }

      // Extract features and potentially create training data
      if (this.config.enableOnlinelearning) {
        this.processInteractionForLearning(interaction);
      }
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Predict preference adjustment based on current context
   */
  async predictPreference(
    currentPreferences: Record<string, unknown>, 
    context: Record<string, unknown> = {}
  ): Promise<PredictionResult<Record<string, unknown>>> {
    try {
      const features = this.extractFeatures(currentPreferences, context);
      const prediction = this.model.predict(features.features);
      
      const confidence = this.calculateConfidence(prediction, features);
      const suggestions = this.generateAdaptationSuggestions(currentPreferences, prediction, confidence);

      const result: PredictionResult<Record<string, unknown>> = {
        prediction: suggestions,
        confidence: confidence.level,
        score: confidence.score,
        reasoning: this.generateReasoning(features, prediction),
        metadata: {
          featureCount: Object.keys(features.features).length,
          modelVersion: this.modelState.version,
          trainingDataSize: this.modelState.trainingData,
        },
      };

      this.emit('prediction', result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', err);
      throw err;
    }
  }

  /**
   * Suggest adaptations based on current behavior
   */
  async suggestAdaptations(
    currentState: Record<string, unknown>,
    recentInteractions?: UserInteraction[]
  ): Promise<AdaptationSuggestion[]> {
    try {
      const interactions = recentInteractions || this.interactions.slice(-50);
      const features = this.extractBehaviorFeatures(interactions, currentState);
      
      const suggestions: AdaptationSuggestion[] = [];
      
      // Analyze interaction patterns
      if (this.detectMotionSensitivity(interactions)) {
        suggestions.push({
          type: 'sensory',
          target: 'motionReduction',
          action: 'enable',
          reasoning: 'Detected potential motion sensitivity from interaction patterns',
          confidence: 'medium',
          priority: 'medium',
          estimatedImpact: 0.7,
        });
      }

      if (this.detectCognitiveLoad(interactions)) {
        suggestions.push({
          type: 'cognitive',
          target: 'chunkSize',
          action: 'adjust',
          value: 2,
          reasoning: 'Detected signs of cognitive overload, reducing content chunk size',
          confidence: 'high',
          priority: 'high',
          estimatedImpact: 0.8,
        });
      }

      // Emit suggestions
      suggestions.forEach(suggestion => {
        this.emit('adaptation-suggested', suggestion);
      });

      return suggestions;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', err);
      throw err;
    }
  }

  /**
   * Add training data with feedback
   */
  addTrainingData(input: FeatureVector, output: unknown, feedback?: number): void {
    try {
      const trainingPoint: TrainingData = {
        input,
        output,
        ...(feedback !== undefined && { feedback }),
        weight: feedback ? Math.abs(feedback) : 1,
      };

      this.trainingData.push(trainingPoint);

      // Limit training data size
      if (this.trainingData.length > this.config.maxTrainingData) {
        this.trainingData = this.trainingData.slice(-this.config.maxTrainingData);
      }

      // Trigger training if enough data
      if (this.trainingData.length >= this.config.minSamplesForTraining) {
        this.trainModel();
      }
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Train the model with current data
   */
  trainModel(): void {
    try {
      if (this.trainingData.length < this.config.minSamplesForTraining) {
        return;
      }

      const startTime = Date.now();
      this.model.train(this.trainingData);

      // Update model state
      this.modelState = {
        ...this.modelState,
        trainingData: this.trainingData.length,
        lastUpdated: Date.now(),
        accuracy: this.evaluateModel(),
        hyperparameters: {
          learningRate: this.config.learningRate,
          trainingDataSize: this.trainingData.length,
        },
      };

      const metrics: ModelMetrics = {
        accuracy: this.modelState.accuracy || 0,
        precision: 0.85, // Placeholder - would be calculated in real implementation
        recall: 0.80,
        f1Score: 0.82,
        sampleSize: this.trainingData.length,
        lastEvaluated: Date.now(),
      };

      this.emit('model-updated', this.modelState);
      this.emit('training-complete', metrics);
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get current model state
   */
  getModelState(): ModelState {
    return { ...this.modelState };
  }

  /**
   * Clear training data and reset model
   */
  reset(): void {
    this.trainingData = [];
    this.interactions = [];
    this.model = new LinearModel(this.config.learningRate);
    this.modelState = {
      version: '1.0.0',
      trainingData: 0,
      lastUpdated: Date.now(),
      features: this.getFeatureNames(),
    };
  }

  /**
   * Stop auto-training
   */
  destroy(): void {
    if (this.trainingTimer) {
      clearInterval(this.trainingTimer);
      this.trainingTimer = undefined;
    }
    this.removeAllListeners();
  }

  // Private methods

  private startAutoTraining(): void {
    this.trainingTimer = setInterval(() => {
      if (this.trainingData.length >= this.config.minSamplesForTraining) {
        this.trainModel();
      }
    }, this.config.trainingInterval);
  }

  private extractFeatures(preferences: Record<string, unknown>, context: Record<string, unknown>): FeatureVector {
    const features: Record<string, number> = {};

    if (this.featureConfig.preference) {
      // Preference-based features
      features.motionReduction = preferences.motionReduction ? 1 : 0;
      features.highContrast = preferences.highContrast ? 1 : 0;
      features.fontSize = typeof preferences.fontSize === 'number' ? preferences.fontSize : 1;
      features.chunkSize = typeof preferences.chunkSize === 'number' ? preferences.chunkSize : 3;
    }

    if (this.featureConfig.context) {
      // Context-based features
      features.timeOfDay = new Date().getHours() / 24;
      features.viewport_width = typeof context.viewportWidth === 'number' ? context.viewportWidth / 1920 : 0.5;
      features.viewport_height = typeof context.viewportHeight === 'number' ? context.viewportHeight / 1080 : 0.5;
    }

    if (this.featureConfig.interaction) {
      // Recent interaction features
      const recentInteractions = this.interactions.slice(-10);
      features.interaction_frequency = recentInteractions.length / 10;
      features.click_ratio = recentInteractions.filter(i => i.type === 'click').length / Math.max(1, recentInteractions.length);
      features.scroll_ratio = recentInteractions.filter(i => i.type === 'scroll').length / Math.max(1, recentInteractions.length);
    }

    return {
      features,
      timestamp: Date.now(),
      metadata: { source: 'prediction-engine' },
    };
  }

  private extractBehaviorFeatures(interactions: UserInteraction[], state: Record<string, unknown>): FeatureVector {
    const features: Record<string, number> = {};
    
    if (interactions.length === 0) {
      return { features, timestamp: Date.now() };
    }

    // Temporal patterns
    const timeSpan = interactions[interactions.length - 1].timestamp - interactions[0].timestamp;
    features.session_duration = Math.min(timeSpan / (1000 * 60 * 60), 4); // Max 4 hours normalized
    features.interaction_rate = interactions.length / Math.max(timeSpan / 1000, 1);

    // Interaction type distribution
    const clickCount = interactions.filter(i => i.type === 'click').length;
    const scrollCount = interactions.filter(i => i.type === 'scroll').length;
    const focusCount = interactions.filter(i => i.type === 'focus').length;
    
    features.click_frequency = clickCount / interactions.length;
    features.scroll_frequency = scrollCount / interactions.length;
    features.focus_frequency = focusCount / interactions.length;

    return { features, timestamp: Date.now() };
  }

  private processInteractionForLearning(interaction: UserInteraction): void {
    // This would analyze the interaction and potentially create training data
    // For now, we'll focus on preference changes as positive signals
    if (interaction.type === 'preference_change' && interaction.value) {
      const features = this.extractFeatures(interaction.value as Record<string, unknown>, {});
      this.addTrainingData(features, interaction.value, 1); // Positive feedback
    }
  }

  private calculateConfidence(prediction: number, features: FeatureVector): { level: ConfidenceLevel; score: number } {
    // Simple confidence calculation based on feature count and model certainty
    const featureCount = Object.keys(features.features).length;
    const featureConfidence = Math.min(featureCount / 10, 1);
    const predictionConfidence = Math.abs(prediction - 0.5) * 2; // Distance from uncertainty
    
    const score = (featureConfidence + predictionConfidence) / 2;
    
    let level: ConfidenceLevel;
    if (score >= 0.8) level = 'very_high';
    else if (score >= 0.6) level = 'high';
    else if (score >= 0.4) level = 'medium';
    else level = 'low';

    return { level, score };
  }

  private generateAdaptationSuggestions(
    currentPreferences: Record<string, unknown>,
    prediction: number,
    confidence: { level: ConfidenceLevel; score: number }
  ): Record<string, unknown> {
    const suggestions: Record<string, unknown> = { ...currentPreferences };

    // Apply predictions based on confidence
    if (confidence.score > 0.6) {
      if (prediction > 0.7 && !currentPreferences.motionReduction) {
        suggestions.motionReduction = true;
      }
      if (prediction > 0.8 && typeof currentPreferences.fontSize === 'number' && currentPreferences.fontSize < 1.2) {
        suggestions.fontSize = Math.min((currentPreferences.fontSize as number) + 0.1, 1.5);
      }
    }

    return suggestions;
  }

  private generateReasoning(features: FeatureVector, prediction: number): string {
    const keyFeatures = Object.entries(features.features)
      .filter(([_, value]) => value > 0.5)
      .map(([key, _]) => key)
      .slice(0, 3);

    return `Prediction based on ${keyFeatures.join(', ')} with confidence score ${prediction.toFixed(2)}`;
  }

  private detectMotionSensitivity(interactions: UserInteraction[]): boolean {
    // Simple heuristic: rapid scrolling or many focus changes might indicate motion sensitivity
    const scrolls = interactions.filter(i => i.type === 'scroll');
    const focuses = interactions.filter(i => i.type === 'focus' || i.type === 'blur');
    
    return scrolls.length > interactions.length * 0.4 || focuses.length > interactions.length * 0.3;
  }

  private detectCognitiveLoad(interactions: UserInteraction[]): boolean {
    // Heuristic: Long pauses between interactions might indicate cognitive load
    let longPauses = 0;
    for (let i = 1; i < interactions.length; i++) {
      const timeDiff = interactions[i].timestamp - interactions[i - 1].timestamp;
      if (timeDiff > 5000) { // 5 second pause
        longPauses++;
      }
    }
    
    return longPauses > interactions.length * 0.2;
  }

  private evaluateModel(): number {
    // Simple accuracy calculation on recent training data
    if (this.trainingData.length < 5) return 0;

    const testData = this.trainingData.slice(-Math.min(10, this.trainingData.length));
    let correct = 0;

    for (const sample of testData) {
      const prediction = this.model.predict(sample.input.features);
      const target = typeof sample.output === 'number' ? sample.output : 0;
      if (Math.abs(prediction - target) < 0.3) { // Within 30% tolerance
        correct++;
      }
    }

    return correct / testData.length;
  }

  private getFeatureNames(): string[] {
    return [
      'motionReduction',
      'highContrast', 
      'fontSize',
      'chunkSize',
      'timeOfDay',
      'viewport_width',
      'viewport_height',
      'interaction_frequency',
      'click_ratio',
      'scroll_ratio',
    ];
  }
} 