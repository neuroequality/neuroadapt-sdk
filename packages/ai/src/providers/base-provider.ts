import { EventEmitter } from 'eventemitter3';
import type { 
  AIProviderConfig, 
  ModelCapabilities, 
  StreamChunk, 
  AdaptationSuggestion 
} from '../types/common.js';

/**
 * Events emitted by AI providers
 */
export interface AIProviderEvents {
  'stream-chunk': (chunk: StreamChunk) => void;
  'stream-complete': (result: string) => void;
  'stream-error': (error: Error) => void;
  'rate-limit': (retryAfter: number) => void;
  'error': (error: Error) => void;
}

/**
 * Request parameters for AI providers
 */
export interface AIRequest {
  prompt: string;
  system?: string;
  context?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  functions?: AIFunction[];
}

/**
 * AI function definition for function calling
 */
export interface AIFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

/**
 * AI response structure
 */
export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  functionCall?: {
    name: string;
    arguments: Record<string, unknown>;
  };
  finishReason: 'stop' | 'length' | 'function_call' | 'content_filter';
  metadata?: Record<string, unknown>;
}

/**
 * Provider status information
 */
export interface ProviderStatus {
  isAvailable: boolean;
  isConfigured: boolean;
  lastError?: string;
  rateLimitRemaining?: number;
  rateLimitReset?: number;
}

/**
 * Abstract base class for AI providers
 */
export abstract class BaseAIProvider extends EventEmitter<AIProviderEvents> {
  protected config: AIProviderConfig;
  protected capabilities: ModelCapabilities;
  protected status: ProviderStatus;

  constructor(config: AIProviderConfig) {
    super();
    this.config = { ...config };
    this.capabilities = this.getCapabilities();
    this.status = {
      isAvailable: false,
      isConfigured: this.isConfigValid(),
    };
  }

  /**
   * Get provider capabilities
   */
  abstract getCapabilities(): ModelCapabilities;

  /**
   * Get provider name
   */
  abstract getProviderName(): string;

  /**
   * Get available models
   */
  abstract getAvailableModels(): string[];

  /**
   * Generate text completion
   */
  abstract generate(request: AIRequest): Promise<AIResponse>;

  /**
   * Generate streaming text completion
   */
  abstract generateStream(request: AIRequest): AsyncGenerator<StreamChunk, void, unknown>;

  /**
   * Analyze content for accessibility adaptations
   */
  abstract analyzeAccessibility(
    content: string,
    currentPreferences: Record<string, unknown>,
    context?: Record<string, unknown>
  ): Promise<AdaptationSuggestion[]>;

  /**
   * Simplify content for cognitive accessibility
   */
  abstract simplifyContent(
    content: string,
    targetLevel: 'simple' | 'intermediate' | 'advanced',
    context?: Record<string, unknown>
  ): Promise<string>;

  /**
   * Update provider configuration
   */
  updateConfig(newConfig: Partial<AIProviderConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.status.isConfigured = this.isConfigValid();
    this.checkAvailability();
  }

  /**
   * Get current provider status
   */
  getStatus(): ProviderStatus {
    return { ...this.status };
  }

  /**
   * Test provider availability
   */
  async testConnection(): Promise<boolean> {
    try {
      const testRequest: AIRequest = {
        prompt: 'Hello',
        maxTokens: 5,
      };
      
      await this.generate(testRequest);
      this.status.isAvailable = true;
      return true;
    } catch (error) {
      this.status.isAvailable = false;
      this.status.lastError = error instanceof Error ? error.message : String(error);
      return false;
    }
  }

  /**
   * Get estimated cost for request
   */
  estimateCost(request: AIRequest): number {
    // Base implementation - providers should override with actual pricing
    const estimatedTokens = Math.ceil(request.prompt.length / 4) + (request.maxTokens || 100);
    return estimatedTokens * 0.00001; // $0.00001 per token as base estimate
  }

  /**
   * Check if provider supports a specific capability
   */
  supportsCapability(capability: keyof ModelCapabilities): boolean {
    return this.capabilities[capability];
  }

  /**
   * Get rate limit information
   */
  getRateLimitInfo(): { remaining?: number; reset?: number } {
    return {
      remaining: this.status.rateLimitRemaining,
      reset: this.status.rateLimitReset,
    };
  }

  // Protected methods for subclasses

  /**
   * Validate provider configuration
   */
  protected isConfigValid(): boolean {
    return !!(this.config.apiKey || this.config.baseURL);
  }

  /**
   * Check provider availability
   */
  protected async checkAvailability(): Promise<void> {
    if (this.status.isConfigured) {
      await this.testConnection();
    }
  }

  /**
   * Handle rate limiting
   */
  protected handleRateLimit(retryAfter: number): void {
    this.status.rateLimitReset = Date.now() + (retryAfter * 1000);
    this.status.rateLimitRemaining = 0;
    this.emit('rate-limit', retryAfter);
  }

  /**
   * Update rate limit status
   */
  protected updateRateLimit(remaining: number, reset: number): void {
    this.status.rateLimitRemaining = remaining;
    this.status.rateLimitReset = reset;
  }

  /**
   * Create standard error response
   */
  protected createErrorResponse(error: Error): never {
    this.status.lastError = error.message;
    this.emit('error', error);
    throw error;
  }

  /**
   * Validate request parameters
   */
  protected validateRequest(request: AIRequest): void {
    if (!request.prompt) {
      throw new Error('Prompt is required');
    }

    if (request.maxTokens && request.maxTokens <= 0) {
      throw new Error('maxTokens must be positive');
    }

    if (request.temperature && (request.temperature < 0 || request.temperature > 2)) {
      throw new Error('temperature must be between 0 and 2');
    }

    if (request.stream && !this.capabilities.streaming) {
      throw new Error('Streaming not supported by this provider');
    }

    if (request.functions && !this.capabilities.functionCalling) {
      throw new Error('Function calling not supported by this provider');
    }
  }

  /**
   * Create accessibility analysis prompt
   */
  protected createAccessibilityPrompt(
    content: string,
    currentPreferences: Record<string, unknown>
  ): string {
    return `Analyze this content for accessibility improvements for neurodivergent users.

Current user preferences: ${JSON.stringify(currentPreferences, null, 2)}

Content to analyze:
${content}

Provide specific suggestions for:
1. Sensory adaptations (motion, contrast, visual)
2. Cognitive load reduction (chunking, simplification)
3. Navigation improvements
4. Content structure optimizations

Format your response as actionable recommendations with confidence scores.`;
  }

  /**
   * Create content simplification prompt
   */
  protected createSimplificationPrompt(
    content: string,
    targetLevel: string
  ): string {
    return `Simplify this content for a ${targetLevel} reading level while preserving all important information.

Guidelines:
- Use shorter sentences
- Replace complex words with simpler alternatives
- Break up long paragraphs
- Add clear headings and structure
- Maintain factual accuracy

Original content:
${content}

Simplified version:`;
  }

  /**
   * Parse adaptation suggestions from AI response
   */
  protected parseAdaptationSuggestions(response: string): AdaptationSuggestion[] {
    // Basic parsing - providers can override for better parsing
    const suggestions: AdaptationSuggestion[] = [];
    
    // This is a simplified parser - real implementation would be more sophisticated
    const lines = response.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      if (line.includes('motion') || line.includes('animation')) {
        suggestions.push({
          type: 'sensory',
          target: 'motionReduction',
          action: 'enable',
          reasoning: line,
          confidence: 'medium',
          priority: 'medium',
          estimatedImpact: 0.6,
        });
      }
      
      if (line.includes('contrast') || line.includes('color')) {
        suggestions.push({
          type: 'sensory',
          target: 'highContrast',
          action: 'enable',
          reasoning: line,
          confidence: 'medium',
          priority: 'medium',
          estimatedImpact: 0.7,
        });
      }
      
      if (line.includes('chunk') || line.includes('break')) {
        suggestions.push({
          type: 'cognitive',
          target: 'chunkSize',
          action: 'adjust',
          value: 2,
          reasoning: line,
          confidence: 'high',
          priority: 'high',
          estimatedImpact: 0.8,
        });
      }
    }
    
    return suggestions;
  }
} 