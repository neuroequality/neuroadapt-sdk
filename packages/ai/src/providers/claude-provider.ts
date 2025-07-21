import { BaseAIProvider } from './base-provider.js';
import type { 
  AIRequest, 
  AIResponse, 
  ModelCapabilities, 
  StreamChunk, 
  AdaptationSuggestion,
  AIProviderConfig 
} from '../types/common.js';

/**
 * Anthropic Claude provider configuration
 */
export interface ClaudeConfig extends AIProviderConfig {
  model?: 'claude-3-opus-20240229' | 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307';
  anthropicVersion?: string;
}

/**
 * Claude API response structure
 */
interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: Array<{ type: 'text'; text: string }>;
  id: string;
  model: string;
  role: 'assistant';
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  stop_sequence?: string;
  type: 'message';
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Claude provider for Anthropic's Claude models
 */
export class ClaudeProvider extends BaseAIProvider {
  private anthropic: any; // Will be imported dynamically
  private model: string;

  constructor(config: ClaudeConfig) {
    super(config);
    this.model = config.model || 'claude-3-sonnet-20240229';
    this.initializeClient();
  }

  getProviderName(): string {
    return 'Claude/Anthropic';
  }

  getCapabilities(): ModelCapabilities {
    return {
      textGeneration: true,
      textAnalysis: true,
      codeGeneration: true,
      reasoning: true,
      streaming: true,
      functionCalling: false, // Claude doesn't support function calling yet
      vision: this.model.includes('claude-3'), // Vision available in Claude 3
    };
  }

  getAvailableModels(): string[] {
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229', 
      'claude-3-haiku-20240307',
    ];
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    this.validateRequest(request);

    if (!this.anthropic) {
      throw new Error('Claude client not initialized. Make sure anthropic package is installed.');
    }

    try {
      const messages: ClaudeMessage[] = [
        { role: 'user', content: request.prompt }
      ];

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
        messages,
        ...(request.system && { system: request.system }),
      });

      return this.mapResponse(response);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async* generateStream(request: AIRequest): AsyncGenerator<StreamChunk, void, unknown> {
    this.validateRequest(request);

    if (!this.anthropic) {
      throw new Error('Claude client not initialized');
    }

    try {
      const messages: ClaudeMessage[] = [
        { role: 'user', content: request.prompt }
      ];

      const stream = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
        messages,
        stream: true,
        ...(request.system && { system: request.system }),
      });

      let content = '';
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
          content += chunk.delta.text;
          
          const streamChunk: StreamChunk = {
            id: chunk.index?.toString() || Date.now().toString(),
            type: 'token',
            content: chunk.delta.text,
            timestamp: Date.now(),
          };

          yield streamChunk;
          this.emit('stream-chunk', streamChunk);
        } else if (chunk.type === 'message_stop') {
          const doneChunk: StreamChunk = {
            id: 'done',
            type: 'done',
            content: content,
            timestamp: Date.now(),
          };
          
          yield doneChunk;
          this.emit('stream-complete', content);
        }
      }
    } catch (error) {
      const errorChunk: StreamChunk = {
        id: 'error',
        type: 'error',
        content: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      };
      
      yield errorChunk;
      this.emit('stream-error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async analyzeAccessibility(
    content: string,
    currentPreferences: Record<string, unknown>,
    context?: Record<string, unknown>
  ): Promise<AdaptationSuggestion[]> {
    const prompt = `${this.createAccessibilityPrompt(content, currentPreferences)}

Additional context: ${context ? JSON.stringify(context) : 'None'}

Please analyze the content and provide specific, actionable accessibility recommendations for neurodivergent users. Focus on:

1. Visual adaptations (motion reduction, contrast, font size)
2. Cognitive load management (content chunking, simplification)
3. Navigation and interaction improvements
4. Content structure optimization

Format your response as a structured analysis with specific recommendations, confidence levels, and estimated impact.`;

    const response = await this.generate({
      prompt,
      system: 'You are an accessibility expert specializing in neurodivergent user needs. Provide practical, specific recommendations.',
      maxTokens: 1500,
      temperature: 0.3,
    });

    return this.parseAdaptationSuggestions(response.content);
  }

  async simplifyContent(
    content: string,
    targetLevel: 'simple' | 'intermediate' | 'advanced',
    context?: Record<string, unknown>
  ): Promise<string> {
    const prompt = `${this.createSimplificationPrompt(content, targetLevel)}

${context ? `Additional context: ${JSON.stringify(context)}` : ''}

Guidelines for ${targetLevel} level:
- Simple: 5th-8th grade reading level, short sentences, common words
- Intermediate: 9th-12th grade reading level, moderate complexity
- Advanced: College level, but still clear and well-structured

Important: Preserve all factual information and key concepts while making the language more accessible.`;

    const response = await this.generate({
      prompt,
      system: 'You are an expert at making content accessible while preserving information accuracy and completeness.',
      maxTokens: Math.max(2000, Math.ceil(content.length * 1.5)),
      temperature: 0.2,
    });

    return response.content;
  }

  // Private methods

  private async initializeClient(): Promise<void> {
    try {
      // Dynamic import to handle optional dependency
      const { Anthropic } = await import('anthropic');
      
      if (!this.config.apiKey) {
        throw new Error('Claude API key is required');
      }

      this.anthropic = new Anthropic({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseURL,
      });

      this.status.isAvailable = true;
    } catch (error) {
      console.warn('Claude provider not available:', error);
      this.status.isAvailable = false;
      this.status.lastError = 'anthropic package not installed or API key missing';
    }
  }

  private mapResponse(claudeResponse: ClaudeResponse): AIResponse {
    const content = claudeResponse.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    return {
      content,
      usage: {
        promptTokens: claudeResponse.usage.input_tokens,
        completionTokens: claudeResponse.usage.output_tokens,
        totalTokens: claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens,
      },
      finishReason: this.mapStopReason(claudeResponse.stop_reason),
      metadata: {
        model: claudeResponse.model,
        id: claudeResponse.id,
      },
    };
  }

  private mapStopReason(stopReason: string): AIResponse['finishReason'] {
    switch (stopReason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return 'stop';
    }
  }

  protected parseAdaptationSuggestions(response: string): AdaptationSuggestion[] {
    const suggestions: AdaptationSuggestion[] = [];
    
    // Enhanced parsing for Claude's structured responses
    const sections = response.split('\n').filter(line => line.trim());
    
    for (const line of sections) {
      const lowercaseLine = line.toLowerCase();
      
      // Motion and animation suggestions
      if (lowercaseLine.includes('motion') || lowercaseLine.includes('animation') || lowercaseLine.includes('autoplay')) {
        suggestions.push({
          type: 'sensory',
          target: 'motionReduction',
          action: 'enable',
          reasoning: line.trim(),
          confidence: 'high',
          priority: 'high',
          estimatedImpact: 0.8,
        });
      }
      
      // Contrast and color suggestions
      if (lowercaseLine.includes('contrast') || lowercaseLine.includes('color') || lowercaseLine.includes('visibility')) {
        suggestions.push({
          type: 'sensory',
          target: 'highContrast',
          action: 'enable',
          reasoning: line.trim(),
          confidence: 'high',
          priority: 'medium',
          estimatedImpact: 0.7,
        });
      }
      
      // Font size suggestions
      if (lowercaseLine.includes('font') || lowercaseLine.includes('text size') || lowercaseLine.includes('readability')) {
        suggestions.push({
          type: 'sensory',
          target: 'fontSize',
          action: 'adjust',
          value: 1.2,
          reasoning: line.trim(),
          confidence: 'medium',
          priority: 'medium',
          estimatedImpact: 0.6,
        });
      }
      
      // Cognitive load suggestions
      if (lowercaseLine.includes('chunk') || lowercaseLine.includes('break') || lowercaseLine.includes('section')) {
        suggestions.push({
          type: 'cognitive',
          target: 'chunkSize',
          action: 'adjust',
          value: 2,
          reasoning: line.trim(),
          confidence: 'high',
          priority: 'high',
          estimatedImpact: 0.9,
        });
      }
      
      // Content structure suggestions
      if (lowercaseLine.includes('heading') || lowercaseLine.includes('structure') || lowercaseLine.includes('organize')) {
        suggestions.push({
          type: 'content',
          target: 'structure',
          action: 'adjust',
          reasoning: line.trim(),
          confidence: 'high',
          priority: 'medium',
          estimatedImpact: 0.7,
        });
      }
    }
    
    // Remove duplicates based on type and target
    const uniqueSuggestions = suggestions.filter((suggestion, index, array) => 
      array.findIndex(s => s.type === suggestion.type && s.target === suggestion.target) === index
    );
    
    return uniqueSuggestions;
  }

  estimateCost(request: AIRequest): number {
    // Claude pricing (approximate, as of 2024)
    const inputTokens = Math.ceil(request.prompt.length / 4);
    const outputTokens = request.maxTokens || 1000;
    
    let inputCost, outputCost;
    
    switch (this.model) {
      case 'claude-3-opus-20240229':
        inputCost = inputTokens * 0.000015; // $15 per 1M tokens
        outputCost = outputTokens * 0.000075; // $75 per 1M tokens
        break;
      case 'claude-3-sonnet-20240229':
        inputCost = inputTokens * 0.000003; // $3 per 1M tokens
        outputCost = outputTokens * 0.000015; // $15 per 1M tokens
        break;
      case 'claude-3-haiku-20240307':
        inputCost = inputTokens * 0.00000025; // $0.25 per 1M tokens
        outputCost = outputTokens * 0.00000125; // $1.25 per 1M tokens
        break;
      default:
        return super.estimateCost(request);
    }
    
    return inputCost + outputCost;
  }
} 