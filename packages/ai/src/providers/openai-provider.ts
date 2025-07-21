import { BaseAIProvider } from './base-provider.js';
import type { 
  AIRequest, 
  AIResponse, 
  ModelCapabilities, 
  StreamChunk, 
  AdaptationSuggestion,
  AIProviderConfig 
} from './base-provider.js';

/**
 * OpenAI provider configuration
 */
export interface OpenAIConfig extends AIProviderConfig {
  model?: string;
  organization?: string;
}

/**
 * OpenAI API response structure
 */
interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: 'stop' | 'length' | 'function_call' | 'content_filter';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenAI provider for GPT models
 */
export class OpenAIProvider extends BaseAIProvider {
  private openai: any; // Will be imported dynamically
  private model: string;

  constructor(config: OpenAIConfig) {
    super(config);
    this.model = config.model || 'gpt-4-turbo-preview';
    this.initializeClient();
  }

  getProviderName(): string {
    return 'OpenAI';
  }

  getCapabilities(): ModelCapabilities {
    return {
      textGeneration: true,
      textAnalysis: true,
      codeGeneration: true,
      reasoning: true,
      streaming: true,
      functionCalling: this.model.includes('gpt-4') || this.model.includes('gpt-3.5-turbo'),
      vision: this.model.includes('vision') || this.model === 'gpt-4-turbo-preview',
    };
  }

  getAvailableModels(): string[] {
    return [
      'gpt-4-turbo-preview',
      'gpt-4',
      'gpt-4-vision-preview',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
    ];
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    this.validateRequest(request);

    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Make sure openai package is installed.');
    }

    try {
      const messages = [
        ...(request.system ? [{ role: 'system' as const, content: request.system }] : []),
        { role: 'user' as const, content: request.prompt },
      ];

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
        ...(request.functions && { functions: request.functions }),
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

    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const messages = [
        ...(request.system ? [{ role: 'system' as const, content: request.system }] : []),
        { role: 'user' as const, content: request.prompt },
      ];

      const stream = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
        stream: true,
        ...(request.functions && { functions: request.functions }),
      });

      let content = '';
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        
        if (delta?.content) {
          content += delta.content;
          
          const streamChunk: StreamChunk = {
            id: chunk.id,
            type: 'token',
            content: delta.content,
            timestamp: Date.now(),
          };

          yield streamChunk;
          this.emit('stream-chunk', streamChunk);
        } else if (chunk.choices[0]?.finish_reason) {
          const doneChunk: StreamChunk = {
            id: chunk.id,
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

Analyze the content and provide specific accessibility recommendations for neurodivergent users. Focus on practical, implementable suggestions for:

1. Visual adaptations (motion, contrast, font sizing)
2. Cognitive load management (content structure, complexity)
3. Navigation improvements
4. Interactive element accessibility

Provide specific, actionable recommendations with confidence levels and estimated impact scores.`;

    const response = await this.generate({
      prompt,
      system: 'You are an expert accessibility consultant specializing in neurodivergent user experience. Provide specific, actionable recommendations.',
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

Simplification guidelines for ${targetLevel} level:
- Simple: Elementary to middle school reading level (grades 3-8)
- Intermediate: High school reading level (grades 9-12)  
- Advanced: College level but clear and accessible

Key requirements:
- Preserve all factual information
- Maintain logical flow and structure
- Use appropriate vocabulary for target level
- Keep content engaging and informative`;

    const response = await this.generate({
      prompt,
      system: 'You are an expert content editor specializing in making complex information accessible while preserving accuracy and completeness.',
      maxTokens: Math.max(2000, Math.ceil(content.length * 1.5)),
      temperature: 0.2,
    });

    return response.content;
  }

  // Private methods

  private async initializeClient(): Promise<void> {
    try {
      // Dynamic import to handle optional dependency
      const { OpenAI } = await import('openai');
      
      if (!this.config.apiKey) {
        throw new Error('OpenAI API key is required');
      }

      this.openai = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseURL,
        organization: (this.config as OpenAIConfig).organization,
      });

      this.status.isAvailable = true;
    } catch (error) {
      console.warn('OpenAI provider not available:', error);
      this.status.isAvailable = false;
      this.status.lastError = 'openai package not installed or API key missing';
    }
  }

  private mapResponse(openaiResponse: OpenAIResponse): AIResponse {
    const choice = openaiResponse.choices[0];
    
    return {
      content: choice.message.content,
      usage: {
        promptTokens: openaiResponse.usage.prompt_tokens,
        completionTokens: openaiResponse.usage.completion_tokens,
        totalTokens: openaiResponse.usage.total_tokens,
      },
      finishReason: choice.finish_reason,
      metadata: {
        model: openaiResponse.model,
        id: openaiResponse.id,
        created: openaiResponse.created,
      },
    };
  }

  protected parseAdaptationSuggestions(response: string): AdaptationSuggestion[] {
    const suggestions: AdaptationSuggestion[] = [];
    
    // Enhanced parsing for OpenAI's responses
    const lines = response.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const lowercaseLine = line.toLowerCase();
      
      // Motion and animation suggestions
      if (lowercaseLine.includes('motion') || lowercaseLine.includes('animation') || 
          lowercaseLine.includes('reduce movement') || lowercaseLine.includes('autoplay')) {
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
      
      // Contrast and visibility suggestions
      if (lowercaseLine.includes('contrast') || lowercaseLine.includes('visibility') || 
          lowercaseLine.includes('color') || lowercaseLine.includes('dark mode')) {
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
      
      // Font and text size suggestions
      if (lowercaseLine.includes('font') || lowercaseLine.includes('text size') || 
          lowercaseLine.includes('readability') || lowercaseLine.includes('larger text')) {
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
      
      // Cognitive load and content structure suggestions
      if (lowercaseLine.includes('chunk') || lowercaseLine.includes('break up') || 
          lowercaseLine.includes('section') || lowercaseLine.includes('simplify')) {
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
      
      // Content structure and organization suggestions
      if (lowercaseLine.includes('heading') || lowercaseLine.includes('structure') || 
          lowercaseLine.includes('organize') || lowercaseLine.includes('navigation')) {
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
    
    // Remove duplicates and return unique suggestions
    const uniqueSuggestions = suggestions.filter((suggestion, index, array) => 
      array.findIndex(s => s.type === suggestion.type && s.target === suggestion.target) === index
    );
    
    return uniqueSuggestions;
  }

  estimateCost(request: AIRequest): number {
    // OpenAI pricing (approximate, as of 2024)
    const inputTokens = Math.ceil(request.prompt.length / 4);
    const outputTokens = request.maxTokens || 1000;
    
    let inputCost, outputCost;
    
    switch (this.model) {
      case 'gpt-4-turbo-preview':
      case 'gpt-4':
        inputCost = inputTokens * 0.00003; // $30 per 1M tokens
        outputCost = outputTokens * 0.00006; // $60 per 1M tokens
        break;
      case 'gpt-4-vision-preview':
        inputCost = inputTokens * 0.00001; // $10 per 1M tokens
        outputCost = outputTokens * 0.00003; // $30 per 1M tokens
        break;
      case 'gpt-3.5-turbo':
      case 'gpt-3.5-turbo-16k':
        inputCost = inputTokens * 0.0000005; // $0.50 per 1M tokens
        outputCost = outputTokens * 0.0000015; // $1.50 per 1M tokens
        break;
      default:
        return super.estimateCost(request);
    }
    
    return inputCost + outputCost;
  }
} 