import { EventEmitter } from 'eventemitter3';
import type { CognitivePreferences } from '@neuroadapt/core';
import type {
  AIAdapter,
  AIMessage,
  AIResponse,
  AIStreamChunk,
  PredictableAIConfig,
  PredictableAIEvents,
  UndoState,
  AICompletionOptions,
} from '../types/index.js';

export class PredictableAI extends EventEmitter<PredictableAIEvents> {
  private adapter: AIAdapter;
  private config: PredictableAIConfig;
  private undoHistory: UndoState[] = [];
  private currentStep = 0;
  private cache = new Map<string, AIResponse>();

  constructor(adapter: AIAdapter, config: Partial<PredictableAIConfig> = {}) {
    super();
    this.adapter = adapter;
    this.config = this.mergeDefaultConfig(config);
  }

  async complete(prompt: string, options: AICompletionOptions = {}): Promise<AIResponse> {
    this.emit('response:start', { prompt });

    try {
      const messages = this.prepareMessages(prompt);
      const cacheKey = this.getCacheKey(messages);

      // Check cache for consistent responses
      if (this.config.consistencyLevel === 'high' && this.cache.has(cacheKey)) {
        const cachedResponse = this.cache.get(cacheKey)!;
        this.emit('response:complete', { response: cachedResponse });
        return cachedResponse;
      }

      const completionOptions = this.enhanceOptions(options);
      const response = await this.adapter.complete(messages, completionOptions);
      
      // Cache the response
      if (this.config.consistencyLevel !== 'low') {
        this.cache.set(cacheKey, response);
      }

      // Store in undo history
      if (this.config.allowUndo) {
        this.addToUndoHistory(prompt, response);
      }

      // Apply pacing if needed
      await this.applyPacing();

      this.emit('response:complete', { response });
      return response;
    } catch (error) {
      this.emit('response:error', { error: error as Error });
      throw error;
    }
  }

  async *stream(prompt: string, options: AICompletionOptions = {}): AsyncIterable<AIStreamChunk> {
    if (!this.adapter.stream) {
      throw new Error(`${this.adapter.name} adapter does not support streaming`);
    }

    this.emit('response:start', { prompt });

    try {
      const messages = this.prepareMessages(prompt);
      const completionOptions = this.enhanceOptions(options);
      
      let fullResponse = '';
      const startTime = Date.now();

      for await (const chunk of this.adapter.stream(messages, completionOptions)) {
        fullResponse += chunk.delta;
        this.emit('response:chunk', { chunk });
        yield chunk;

        if (chunk.done) {
          const response: AIResponse = {
            content: fullResponse,
            usage: chunk.usage,
            finishReason: 'stop',
            metadata: {
              streamDuration: Date.now() - startTime,
            },
          };

          // Store in undo history
          if (this.config.allowUndo) {
            this.addToUndoHistory(prompt, response);
          }

          this.emit('response:complete', { response });
          break;
        }
      }
    } catch (error) {
      this.emit('response:error', { error: error as Error });
      throw error;
    }
  }

  updateConfig(newConfig: Partial<PredictableAIConfig>): void {
    const previousConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    
    // Clear cache if consistency level changed
    if (newConfig.consistencyLevel && newConfig.consistencyLevel !== previousConfig.consistencyLevel) {
      this.cache.clear();
    }

    this.emit('config:changed', { config: newConfig });
  }

  updateFromCognitivePreferences(preferences: CognitivePreferences): void {
    const configUpdate: Partial<PredictableAIConfig> = {};

    // Map reading speed to pacing
    if (preferences.readingSpeed !== undefined) {
      const pacingMap = {
        slow: 'slow' as const,
        medium: 'normal' as const,
        fast: 'quick' as const,
      };
      configUpdate.pacing = pacingMap[preferences.readingSpeed];
    }

    // Map explanation level
    if (preferences.explanationLevel !== undefined) {
      const explanationMap = {
        simple: 'simple' as const,
        moderate: 'moderate' as const,
        detailed: 'detailed' as const,
      };
      configUpdate.explanationLevel = explanationMap[preferences.explanationLevel];
    }

    // Map processing pace to consistency
    if (preferences.processingPace !== undefined) {
      const consistencyMap = {
        relaxed: 'high' as const,
        standard: 'moderate' as const,
        quick: 'low' as const,
      };
      configUpdate.consistencyLevel = consistencyMap[preferences.processingPace];
    }

    this.updateConfig(configUpdate);
  }

  undo(): UndoState | null {
    if (!this.config.allowUndo || this.undoHistory.length === 0) {
      return null;
    }

    if (this.currentStep > 0) {
      this.currentStep--;
      const state = this.undoHistory[this.currentStep];
      this.emit('undo:performed', { step: this.currentStep, state });
      return state;
    }

    return null;
  }

  redo(): UndoState | null {
    if (!this.config.allowUndo || this.currentStep >= this.undoHistory.length - 1) {
      return null;
    }

    this.currentStep++;
    const state = this.undoHistory[this.currentStep];
    this.emit('undo:performed', { step: this.currentStep, state });
    return state;
  }

  canUndo(): boolean {
    return this.config.allowUndo && this.currentStep > 0;
  }

  canRedo(): boolean {
    return this.config.allowUndo && this.currentStep < this.undoHistory.length - 1;
  }

  getUndoHistory(): UndoState[] {
    return [...this.undoHistory];
  }

  clearUndoHistory(): void {
    this.undoHistory = [];
    this.currentStep = 0;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getConfig(): PredictableAIConfig {
    return { ...this.config };
  }

  private prepareMessages(prompt: string): AIMessage[] {
    const systemPrompt = this.createSystemPrompt();
    const messages: AIMessage[] = [];

    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
        timestamp: Date.now(),
      });
    }

    messages.push({
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    });

    return messages;
  }

  private createSystemPrompt(): string {
    const prompts: string[] = [];

    // Tone guidance
    const toneInstructions = {
      'calm-supportive': 'Respond in a calm, supportive manner. Use gentle language and provide reassurance.',
      'encouraging': 'Be encouraging and positive. Focus on possibilities and strengths.',
      'neutral': 'Maintain a neutral, professional tone. Be clear and objective.',
      'clinical': 'Use precise, clinical language. Be factual and methodical.',
      'friendly': 'Be warm and friendly. Use conversational language while remaining helpful.',
    };
    prompts.push(toneInstructions[this.config.tone]);

    // Explanation level guidance
    const explanationInstructions = {
      simple: 'Use simple language and basic concepts. Avoid jargon and complex terms.',
      moderate: 'Provide balanced explanations with some detail. Use accessible language.',
      detailed: 'Give comprehensive explanations with examples and context.',
      technical: 'Use precise technical language and detailed explanations.',
    };
    prompts.push(explanationInstructions[this.config.explanationLevel]);

    // Analogy guidance
    if (this.config.useAnalogies) {
      prompts.push('When helpful, use analogies and real-world examples to clarify concepts.');
    }

    // Pacing guidance
    const pacingInstructions = {
      slow: 'Take time to explain each step. Break down complex ideas into smaller parts.',
      normal: 'Provide clear explanations at a steady pace.',
      quick: 'Be concise and direct. Focus on key points.',
    };
    prompts.push(pacingInstructions[this.config.pacing]);

    return prompts.join(' ');
  }

  private enhanceOptions(options: AICompletionOptions): AICompletionOptions {
    const enhanced = { ...options };

    // Set consistent temperature based on consistency level
    if (enhanced.temperature === undefined) {
      const temperatureMap = {
        low: 0.8,
        moderate: 0.5,
        high: 0.2,
      };
      enhanced.temperature = temperatureMap[this.config.consistencyLevel];
    }

    return enhanced;
  }

  private addToUndoHistory(prompt: string, response: AIResponse): void {
    const state: UndoState = {
      step: this.currentStep + 1,
      prompt,
      response,
      timestamp: Date.now(),
    };

    // Remove any redo steps when adding new state
    if (this.currentStep < this.undoHistory.length - 1) {
      this.undoHistory = this.undoHistory.slice(0, this.currentStep + 1);
    }

    this.undoHistory.push(state);
    this.currentStep = this.undoHistory.length - 1;

    // Limit undo history size
    if (this.undoHistory.length > this.config.maxUndoSteps) {
      this.undoHistory.shift();
      this.currentStep--;
    }
  }

  private getCacheKey(messages: AIMessage[]): string {
    const content = messages.map(m => `${m.role}:${m.content}`).join('|');
    const configKey = `${this.config.tone}:${this.config.explanationLevel}:${this.config.pacing}`;
    return `${this.adapter.name}:${this.adapter.getModel()}:${configKey}:${content}`;
  }

  private async applyPacing(): Promise<void> {
    if (this.config.pacing === 'slow') {
      await new Promise(resolve => setTimeout(resolve, 500));
    } else if (this.config.pacing === 'normal') {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    // No delay for quick pacing
  }

  private mergeDefaultConfig(config: Partial<PredictableAIConfig>): PredictableAIConfig {
    return {
      tone: 'neutral',
      explanationLevel: 'moderate',
      pacing: 'normal',
      consistencyLevel: 'moderate',
      useAnalogies: true,
      allowUndo: true,
      maxUndoSteps: 10,
      ...config,
    };
  }
}