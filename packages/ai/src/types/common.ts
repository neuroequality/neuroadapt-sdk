import { z } from 'zod';

/**
 * User interaction types for behavior tracking
 */
export const UserInteractionSchema = z.object({
  timestamp: z.number(),
  type: z.enum(['click', 'scroll', 'focus', 'blur', 'keypress', 'resize', 'preference_change']),
  target: z.string().optional(),
  value: z.unknown().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export type UserInteraction = z.infer<typeof UserInteractionSchema>;

/**
 * Prediction confidence levels
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high';

/**
 * AI model capabilities
 */
export interface ModelCapabilities {
  textGeneration: boolean;
  textAnalysis: boolean;
  codeGeneration: boolean;
  reasoning: boolean;
  streaming: boolean;
  functionCalling: boolean;
  vision: boolean;
}

/**
 * AI provider configuration
 */
export interface AIProviderConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  retries?: number;
}

/**
 * Prediction result with confidence scoring
 */
export interface PredictionResult<T = unknown> {
  prediction: T;
  confidence: ConfidenceLevel;
  score: number; // 0-1
  reasoning?: string;
  alternatives?: Array<{
    value: T;
    score: number;
    reasoning?: string;
  }>;
  metadata?: Record<string, unknown>;
}

/**
 * Adaptation suggestion from AI
 */
export interface AdaptationSuggestion {
  type: 'sensory' | 'cognitive' | 'preference' | 'content';
  target: string;
  action: 'enable' | 'disable' | 'adjust' | 'replace';
  value?: unknown;
  reasoning: string;
  confidence: ConfidenceLevel;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedImpact: number; // 0-1
}

/**
 * Learning model state
 */
export interface ModelState {
  version: string;
  trainingData: number; // Number of samples
  lastUpdated: number;
  accuracy?: number;
  features: string[];
  hyperparameters?: Record<string, unknown>;
}

/**
 * Streaming response chunk
 */
export interface StreamChunk {
  id: string;
  type: 'token' | 'function_call' | 'done' | 'error';
  content: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

/**
 * Analytics event for user behavior
 */
export const AnalyticsEventSchema = z.object({
  eventId: z.string().uuid(),
  userId: z.string().optional(),
  sessionId: z.string(),
  timestamp: z.number(),
  event: z.string(),
  properties: z.record(z.string(), z.unknown()).optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
  context: z.object({
    userAgent: z.string().optional(),
    viewport: z.object({
      width: z.number(),
      height: z.number(),
    }).optional(),
    url: z.string().optional(),
    referrer: z.string().optional(),
  }).optional(),
});

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

/**
 * Feature extraction result
 */
export interface FeatureVector {
  features: Record<string, number>;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

/**
 * Training data point
 */
export interface TrainingData {
  input: FeatureVector;
  output: unknown;
  feedback?: number; // -1 to 1
  weight?: number; // Importance weight
}

/**
 * Model performance metrics
 */
export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc?: number;
  confusionMatrix?: number[][];
  sampleSize: number;
  lastEvaluated: number;
} 