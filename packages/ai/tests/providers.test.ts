import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseAIProvider, ClaudeProvider, OpenAIProvider, OllamaProvider } from '../src/providers/index.js';
import type { AIRequest } from '../src/providers/base-provider.js';

// Mock implementations for testing
class MockProvider extends BaseAIProvider {
  getProviderName(): string {
    return 'MockProvider';
  }

  getCapabilities() {
    return {
      textGeneration: true,
      textAnalysis: true,
      codeGeneration: false,
      reasoning: true,
      streaming: false,
      functionCalling: false,
      vision: false,
    };
  }

  getAvailableModels(): string[] {
    return ['mock-model-1', 'mock-model-2'];
  }

  async generate(request: AIRequest) {
    return {
      content: `Mock response for: ${request.prompt}`,
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
      finishReason: 'stop' as const,
    };
  }

  async* generateStream(request: AIRequest) {
    yield {
      id: 'chunk-1',
      type: 'token' as const,
      content: 'Mock ',
      timestamp: Date.now(),
    };
    
    yield {
      id: 'chunk-2',
      type: 'token' as const,
      content: 'stream ',
      timestamp: Date.now(),
    };
    
    yield {
      id: 'done',
      type: 'done' as const,
      content: 'Mock stream response',
      timestamp: Date.now(),
    };
  }

  async analyzeAccessibility() {
    return [
      {
        type: 'sensory' as const,
        target: 'motionReduction',
        action: 'enable' as const,
        reasoning: 'Mock accessibility analysis',
        confidence: 'high' as const,
        priority: 'medium' as const,
        estimatedImpact: 0.7,
      },
    ];
  }

  async simplifyContent(content: string) {
    return `Simplified: ${content}`;
  }
}

describe('BaseAIProvider', () => {
  let provider: MockProvider;

  beforeEach(() => {
    provider = new MockProvider({ apiKey: 'test-key' });
  });

  describe('constructor', () => {
    it('should initialize with config', () => {
      expect(provider.getProviderName()).toBe('MockProvider');
      expect(provider.getStatus().isConfigured).toBe(true);
    });

    it('should detect missing configuration', () => {
      const unconfiguredProvider = new MockProvider({});
      expect(unconfiguredProvider.getStatus().isConfigured).toBe(false);
    });
  });

  describe('getCapabilities', () => {
    it('should return provider capabilities', () => {
      const capabilities = provider.getCapabilities();
      
      expect(capabilities.textGeneration).toBe(true);
      expect(capabilities.reasoning).toBe(true);
      expect(capabilities.streaming).toBe(false);
    });
  });

  describe('generate', () => {
    it('should generate text response', async () => {
      const request: AIRequest = {
        prompt: 'Test prompt',
        maxTokens: 100,
        temperature: 0.7,
      };

      const response = await provider.generate(request);
      
      expect(response.content).toContain('Test prompt');
      expect(response.usage?.totalTokens).toBe(30);
      expect(response.finishReason).toBe('stop');
    });

    it('should validate request parameters', async () => {
      const invalidRequest: AIRequest = {
        prompt: '', // Empty prompt
        maxTokens: -1, // Invalid maxTokens
      };

      await expect(provider.generate(invalidRequest)).rejects.toThrow('Prompt is required');
    });

    it('should validate temperature range', async () => {
      const invalidRequest: AIRequest = {
        prompt: 'Test',
        temperature: 3, // Invalid temperature
      };

      await expect(provider.generate(invalidRequest)).rejects.toThrow('temperature must be between 0 and 2');
    });
  });

  describe('generateStream', () => {
    it('should generate streaming response', async () => {
      const request: AIRequest = {
        prompt: 'Test streaming',
      };

      const chunks = [];
      for await (const chunk of provider.generateStream(request)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[chunks.length - 1].type).toBe('done');
    });
  });

  describe('analyzeAccessibility', () => {
    it('should analyze content for accessibility', async () => {
      const suggestions = await provider.analyzeAccessibility(
        'Test content',
        { motionReduction: false }
      );

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions[0].type).toBe('sensory');
      expect(suggestions[0].confidence).toMatch(/^(low|medium|high|very_high)$/);
    });
  });

  describe('simplifyContent', () => {
    it('should simplify content', async () => {
      const simplified = await provider.simplifyContent(
        'Complex content here',
        'simple'
      );

      expect(simplified).toContain('Complex content here');
      expect(simplified).toContain('Simplified:');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      provider.updateConfig({ apiKey: 'new-key' });
      // Since config is protected, we can't directly test it
      // but we can verify it doesn't throw
      expect(provider.getStatus().isConfigured).toBe(true);
    });
  });

  describe('supportsCapability', () => {
    it('should check capability support', () => {
      expect(provider.supportsCapability('textGeneration')).toBe(true);
      expect(provider.supportsCapability('streaming')).toBe(false);
      expect(provider.supportsCapability('vision')).toBe(false);
    });
  });

  describe('estimateCost', () => {
    it('should estimate request cost', () => {
      const request: AIRequest = {
        prompt: 'Test prompt for cost estimation',
        maxTokens: 100,
      };

      const cost = provider.estimateCost(request);
      expect(cost).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getRateLimitInfo', () => {
    it('should return rate limit information', () => {
      const info = provider.getRateLimitInfo();
      expect(info).toHaveProperty('remaining');
      expect(info).toHaveProperty('reset');
    });
  });
});

describe('ClaudeProvider', () => {
  let provider: ClaudeProvider;

  beforeEach(() => {
    provider = new ClaudeProvider({
      apiKey: 'test-key',
      model: 'claude-3-haiku-20240307',
    });
  });

  describe('constructor', () => {
    it('should initialize Claude provider', () => {
      expect(provider.getProviderName()).toBe('Claude/Anthropic');
      expect(provider.getCapabilities().reasoning).toBe(true);
      expect(provider.getCapabilities().functionCalling).toBe(false);
    });
  });

  describe('getAvailableModels', () => {
    it('should return Claude models', () => {
      const models = provider.getAvailableModels();
      expect(models).toContain('claude-3-opus-20240229');
      expect(models).toContain('claude-3-sonnet-20240229');
      expect(models).toContain('claude-3-haiku-20240307');
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost for Claude models', () => {
      const request: AIRequest = {
        prompt: 'Test prompt',
        maxTokens: 1000,
      };

      const cost = provider.estimateCost(request);
      expect(cost).toBeGreaterThan(0);
    });
  });
});

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    provider = new OpenAIProvider({
      apiKey: 'test-key',
      model: 'gpt-3.5-turbo',
    });
  });

  describe('constructor', () => {
    it('should initialize OpenAI provider', () => {
      expect(provider.getProviderName()).toBe('OpenAI');
      expect(provider.getCapabilities().functionCalling).toBe(true);
      expect(provider.getCapabilities().vision).toBe(false);
    });
  });

  describe('getAvailableModels', () => {
    it('should return OpenAI models', () => {
      const models = provider.getAvailableModels();
      expect(models).toContain('gpt-4-turbo-preview');
      expect(models).toContain('gpt-3.5-turbo');
      expect(models).toContain('gpt-4-vision-preview');
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost for OpenAI models', () => {
      const request: AIRequest = {
        prompt: 'Test prompt',
        maxTokens: 1000,
      };

      const cost = provider.estimateCost(request);
      expect(cost).toBeGreaterThan(0);
    });
  });
});

describe('OllamaProvider', () => {
  let provider: OllamaProvider;

  beforeEach(() => {
    provider = new OllamaProvider({
      model: 'llama2',
      host: 'http://localhost:11434',
    });
  });

  describe('constructor', () => {
    it('should initialize Ollama provider', () => {
      expect(provider.getProviderName()).toBe('Ollama');
      expect(provider.getCapabilities().textGeneration).toBe(true);
      expect(provider.getCapabilities().functionCalling).toBe(false);
    });
  });

  describe('getAvailableModels', () => {
    it('should return Ollama models', () => {
      const models = provider.getAvailableModels();
      expect(models).toContain('llama2');
      expect(models).toContain('mistral');
      expect(models).toContain('codellama');
    });
  });

  describe('estimateCost', () => {
    it('should return zero cost for local models', () => {
      const request: AIRequest = {
        prompt: 'Test prompt',
        maxTokens: 1000,
      };

      const cost = provider.estimateCost(request);
      expect(cost).toBe(0);
    });
  });

  describe('isConfigValid', () => {
    it('should validate config without API key requirement', () => {
      const localProvider = new OllamaProvider({
        host: 'http://localhost:11434',
      });
      
      expect(localProvider.getStatus().isConfigured).toBe(true);
    });
  });
}); 