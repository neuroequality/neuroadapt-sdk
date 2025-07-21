import type { 
  AIAdapter, 
  AIMessage, 
  AIResponse, 
  AIStreamChunk, 
  AICompletionOptions 
} from '@neuroadapt/ai';

export class MockAIAdapter implements AIAdapter {
  public readonly name = 'MockAI';
  public readonly models = ['mock-model-1', 'mock-model-2'];
  
  private currentModel = 'mock-model-1';
  private responses: string[] = [
    'This is a mock AI response for testing purposes.',
    'Here is another test response with different content.',
    'Mock AI provides consistent responses for testing.',
  ];
  private responseIndex = 0;
  private simulateError = false;
  private simulateDelay = 0;

  getModel(): string {
    return this.currentModel;
  }

  setModel(model: string): void {
    if (!this.models.includes(model)) {
      throw new Error(`Model ${model} is not supported by ${this.name}`);
    }
    this.currentModel = model;
  }

  async isAvailable(): Promise<boolean> {
    return !this.simulateError;
  }

  async complete(messages: AIMessage[], options: AICompletionOptions = {}): Promise<AIResponse> {
    if (this.simulateError) {
      throw new Error('Mock AI error for testing');
    }

    if (this.simulateDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.simulateDelay));
    }

    if (options.abortSignal?.aborted) {
      throw new Error('Request aborted');
    }

    const content = this.getNextResponse();
    const wordCount = content.split(' ').length;

    return {
      content,
      usage: {
        promptTokens: this.estimateTokens(messages),
        completionTokens: wordCount * 1.3, // Rough token estimation
        totalTokens: this.estimateTokens(messages) + wordCount * 1.3,
      },
      finishReason: 'stop',
      metadata: {
        model: this.currentModel,
        mockResponse: true,
        timestamp: Date.now(),
      },
    };
  }

  async *stream(messages: AIMessage[], options: AICompletionOptions = {}): AsyncIterable<AIStreamChunk> {
    if (this.simulateError) {
      throw new Error('Mock AI streaming error for testing');
    }

    if (options.abortSignal?.aborted) {
      throw new Error('Request aborted');
    }

    const content = this.getNextResponse();
    const words = content.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      if (options.abortSignal?.aborted) {
        throw new Error('Request aborted');
      }

      const delta = i === 0 ? words[i] : ` ${words[i]}`;
      const done = i === words.length - 1;

      yield {
        delta,
        done,
        usage: done ? {
          promptTokens: this.estimateTokens(messages),
          completionTokens: words.length * 1.3,
          totalTokens: this.estimateTokens(messages) + words.length * 1.3,
        } : undefined,
      };

      // Simulate streaming delay
      if (this.simulateDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.simulateDelay / words.length));
      }
    }
  }

  // Mock-specific methods for testing
  setResponses(responses: string[]): void {
    this.responses = responses;
    this.responseIndex = 0;
  }

  setSimulateError(error: boolean): void {
    this.simulateError = error;
  }

  setSimulateDelay(delay: number): void {
    this.simulateDelay = delay;
  }

  resetResponseIndex(): void {
    this.responseIndex = 0;
  }

  private getNextResponse(): string {
    const response = this.responses[this.responseIndex % this.responses.length];
    this.responseIndex++;
    return response;
  }

  private estimateTokens(messages: AIMessage[]): number {
    return messages.reduce((total, msg) => total + msg.content.split(' ').length * 1.3, 0);
  }
}

export class MockPreferenceStorage {
  private storage = new Map<string, unknown>();
  private simulateError = false;

  async get<T>(key: string): Promise<T | null> {
    if (this.simulateError) {
      throw new Error('Mock storage error');
    }
    return (this.storage.get(key) as T) || null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (this.simulateError) {
      throw new Error('Mock storage error');
    }
    this.storage.set(key, value);
  }

  async remove(key: string): Promise<void> {
    if (this.simulateError) {
      throw new Error('Mock storage error');
    }
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    if (this.simulateError) {
      throw new Error('Mock storage error');
    }
    this.storage.clear();
  }

  async keys(): Promise<string[]> {
    if (this.simulateError) {
      throw new Error('Mock storage error');
    }
    return Array.from(this.storage.keys());
  }

  // Mock-specific methods
  setSimulateError(error: boolean): void {
    this.simulateError = error;
  }

  getStorageState(): Map<string, unknown> {
    return new Map(this.storage);
  }
}

export function createMockProfile() {
  return {
    id: 'test-profile',
    name: 'Test Profile',
    sensory: {
      motionReduction: false,
      highContrast: false,
      colorVisionFilter: 'none' as const,
      fontSize: 1.0,
      reducedFlashing: false,
      darkMode: false,
    },
    cognitive: {
      readingSpeed: 'medium' as const,
      explanationLevel: 'detailed' as const,
      processingPace: 'standard' as const,
      chunkSize: 5,
      allowInterruptions: true,
      preferVisualCues: false,
    },
    ai: {
      tone: 'neutral' as const,
      responseLength: 'standard' as const,
      consistencyLevel: 'moderate' as const,
      useAnalogies: true,
      allowUndo: true,
    },
    vr: {
      comfortRadius: 1.5,
      safeSpaceEnabled: true,
      locomotionType: 'comfort' as const,
      personalSpace: 1.0,
      panicButtonEnabled: true,
    },
    metadata: {
      version: '1.1.0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  };
}