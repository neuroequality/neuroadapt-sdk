import type { AIAdapter, AIAdapterConfig, AIMessage, AIResponse, AICompletionOptions, AIStreamChunk } from '../types/index.js';

export abstract class BaseAIAdapter implements AIAdapter {
  protected config: AIAdapterConfig;
  protected currentModel: string;

  constructor(config: AIAdapterConfig) {
    this.config = config;
    this.currentModel = config.model || this.getDefaultModel();
  }

  abstract get name(): string;
  abstract get models(): string[];
  protected abstract getDefaultModel(): string;

  abstract complete(messages: AIMessage[], options?: AICompletionOptions): Promise<AIResponse>;
  abstract stream?(messages: AIMessage[], options?: AICompletionOptions): AsyncIterable<AIStreamChunk>;
  abstract isAvailable(): Promise<boolean>;

  getModel(): string {
    return this.currentModel;
  }

  setModel(model: string): void {
    if (!this.models.includes(model)) {
      throw new Error(`Model ${model} is not supported by ${this.name}`);
    }
    this.currentModel = model;
  }

  protected async retry<T>(
    operation: () => Promise<T>,
    attempts = this.config.retryAttempts || 3,
    delay = this.config.retryDelay || 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === attempts) {
          throw lastError;
        }

        if (this.isRetryableError(error)) {
          await this.sleep(delay * Math.pow(2, attempt - 1));
        } else {
          throw lastError;
        }
      }
    }

    throw lastError!;
  }

  protected isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('timeout') ||
        message.includes('rate limit') ||
        message.includes('503') ||
        message.includes('502') ||
        message.includes('500')
      );
    }
    return false;
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected formatMessages(messages: AIMessage[]): unknown[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  protected createAbortController(signal?: AbortSignal, timeout?: number): AbortController {
    const controller = new AbortController();
    
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }
    
    if (timeout) {
      setTimeout(() => controller.abort(), timeout);
    }
    
    return controller;
  }
}