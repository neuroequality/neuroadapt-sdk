/**
 * NeuroAdapt AI Package - Adaptive AI for accessibility and neurodivergent support
 * @fileoverview Main entry point for AI-powered accessibility features
 */

// Core AI functionality
export * from './adapters';
export * from './predictable';
export * from './types';

// Advanced AI features (Slice 7)
export * from './advanced';

// Enterprise features (Slice 8)
export * from './enterprise';

// Version
export const VERSION = '1.1.0';

// Convenience exports for common use cases
export { PredictionEngine } from './prediction/engine.js';
export { BehaviorAnalytics } from './analytics/behavior-analytics.js';
export { ContentAdapter } from './streaming/content-adapter.js';
export { BaseAIProvider } from './providers/base-provider.js';
export { ClaudeProvider } from './providers/claude-provider.js';
export { OpenAIProvider } from './providers/openai-provider.js';
export { OllamaProvider } from './providers/ollama-provider.js';