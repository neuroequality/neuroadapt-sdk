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
 * Ollama provider configuration
 */
export interface OllamaConfig extends AIProviderConfig {
  model?: string;
  host?: string;
  keepAlive?: string | number;
}

/**
 * Ollama API response structure
 */
interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

/**
 * Ollama provider for local AI models
 */
export class OllamaProvider extends BaseAIProvider {
  private model: string;
  private host: string;
  private keepAlive: string | number;

  constructor(config: OllamaConfig) {
    super(config);
    this.model = config.model || 'llama2';
    this.host = config.host || config.baseURL || 'http://localhost:11434';
    this.keepAlive = config.keepAlive || '5m';
    this.checkAvailability();
  }

  getProviderName(): string {
    return 'Ollama';
  }

  getCapabilities(): ModelCapabilities {
    return {
      textGeneration: true,
      textAnalysis: true,
      codeGeneration: this.model.includes('code') || this.model.includes('wizard'),
      reasoning: true,
      streaming: true,
      functionCalling: false, // Most Ollama models don't support function calling
      vision: this.model.includes('vision') || this.model.includes('llava'),
    };
  }

  getAvailableModels(): string[] {
    // Common Ollama models - in real implementation, this would query the API
    return [
      'llama2',
      'llama2:13b',
      'llama2:70b',
      'mistral',
      'mixtral',
      'codellama',
      'llava',
      'neural-chat',
      'starling-lm',
    ];
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    this.validateRequest(request);

    try {
      const prompt = this.buildPrompt(request);
      
      const response = await fetch(`${this.host}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: request.temperature || 0.7,
            num_predict: request.maxTokens || 1000,
          },
          keep_alive: this.keepAlive,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      return this.mapResponse(data);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async* generateStream(request: AIRequest): AsyncGenerator<StreamChunk, void, unknown> {
    this.validateRequest(request);

    try {
      const prompt = this.buildPrompt(request);
      
      const response = await fetch(`${this.host}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: true,
          options: {
            temperature: request.temperature || 0.7,
            num_predict: request.maxTokens || 1000,
          },
          keep_alive: this.keepAlive,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let content = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;

            try {
              const data: OllamaResponse = JSON.parse(line);
              
              if (data.response) {
                content += data.response;
                
                const streamChunk: StreamChunk = {
                  id: Date.now().toString(),
                  type: 'token',
                  content: data.response,
                  timestamp: Date.now(),
                  metadata: {
                    model: data.model,
                    eval_count: data.eval_count,
                  },
                };

                yield streamChunk;
                this.emit('stream-chunk', streamChunk);
              }

              if (data.done) {
                const doneChunk: StreamChunk = {
                  id: 'done',
                  type: 'done',
                  content: content,
                  timestamp: Date.now(),
                  metadata: {
                    total_duration: data.total_duration,
                    eval_count: data.eval_count,
                    eval_duration: data.eval_duration,
                  },
                };
                
                yield doneChunk;
                this.emit('stream-complete', content);
                return;
              }
            } catch (parseError) {
              console.warn('Failed to parse Ollama response line:', line);
            }
          }
        }
      } finally {
        reader.releaseLock();
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
    const prompt = `${this.buildAccessibilityAnalysisPrompt(content, currentPreferences, context)}

Please provide a detailed analysis with specific recommendations for improving accessibility for neurodivergent users.`;

    const response = await this.generate({
      prompt,
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
    const prompt = this.buildSimplificationPrompt(content, targetLevel, context);

    const response = await this.generate({
      prompt,
      maxTokens: Math.max(2000, Math.ceil(content.length * 1.5)),
      temperature: 0.2,
    });

    return response.content;
  }

  // Override to check Ollama availability
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.host}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        this.status.isAvailable = true;
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      this.status.isAvailable = false;
      this.status.lastError = error instanceof Error ? error.message : String(error);
      return false;
    }
  }

  // Private methods

  private buildPrompt(request: AIRequest): string {
    if (request.system) {
      return `System: ${request.system}\n\nUser: ${request.prompt}\n\nAssistant:`;
    }
    return request.prompt;
  }

  private buildAccessibilityAnalysisPrompt(
    content: string,
    preferences: Record<string, unknown>,
    context?: Record<string, unknown>
  ): string {
    return `You are an accessibility expert. Analyze the following content for neurodivergent users and provide specific recommendations.

Current User Preferences:
${JSON.stringify(preferences, null, 2)}

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Content to Analyze:
${content}

Provide specific suggestions for:
1. Visual adaptations (motion reduction, contrast, font size)
2. Cognitive load management (content chunking, simplification)
3. Navigation improvements
4. Content structure optimization

Format your response with clear recommendations and reasoning.`;
  }

  private buildSimplificationPrompt(
    content: string,
    targetLevel: string,
    context?: Record<string, unknown>
  ): string {
    return `You are an expert content editor. Simplify the following content for a ${targetLevel} reading level while preserving all important information.

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Guidelines:
- Use shorter, clearer sentences
- Replace complex words with simpler alternatives
- Break up long paragraphs
- Maintain factual accuracy
- Keep the content engaging

Original Content:
${content}

Simplified Content:`;
  }

  private mapResponse(ollamaResponse: OllamaResponse): AIResponse {
    return {
      content: ollamaResponse.response,
      usage: {
        promptTokens: ollamaResponse.prompt_eval_count || 0,
        completionTokens: ollamaResponse.eval_count || 0,
        totalTokens: (ollamaResponse.prompt_eval_count || 0) + (ollamaResponse.eval_count || 0),
      },
      finishReason: ollamaResponse.done ? 'stop' : 'length',
      metadata: {
        model: ollamaResponse.model,
        created_at: ollamaResponse.created_at,
        total_duration: ollamaResponse.total_duration,
        eval_duration: ollamaResponse.eval_duration,
      },
    };
  }

  protected parseAdaptationSuggestions(response: string): AdaptationSuggestion[] {
    const suggestions: AdaptationSuggestion[] = [];
    
    // Parse Ollama responses which tend to be more conversational
    const lines = response.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const lowercaseLine = line.toLowerCase();
      
      // Look for motion-related suggestions
      if (lowercaseLine.includes('motion') || lowercaseLine.includes('animation') || 
          lowercaseLine.includes('movement') || lowercaseLine.includes('autoplay')) {
        suggestions.push({
          type: 'sensory',
          target: 'motionReduction',
          action: 'enable',
          reasoning: line.trim(),
          confidence: 'medium',
          priority: 'high',
          estimatedImpact: 0.7,
        });
      }
      
      // Look for contrast suggestions
      if (lowercaseLine.includes('contrast') || lowercaseLine.includes('dark') || 
          lowercaseLine.includes('light') || lowercaseLine.includes('color')) {
        suggestions.push({
          type: 'sensory',
          target: 'highContrast',
          action: 'enable',
          reasoning: line.trim(),
          confidence: 'medium',
          priority: 'medium',
          estimatedImpact: 0.6,
        });
      }
      
      // Look for text size suggestions
      if (lowercaseLine.includes('font') || lowercaseLine.includes('text') || 
          lowercaseLine.includes('size') || lowercaseLine.includes('larger')) {
        suggestions.push({
          type: 'sensory',
          target: 'fontSize',
          action: 'adjust',
          value: 1.15,
          reasoning: line.trim(),
          confidence: 'medium',
          priority: 'medium',
          estimatedImpact: 0.5,
        });
      }
      
      // Look for content structure suggestions
      if (lowercaseLine.includes('chunk') || lowercaseLine.includes('break') || 
          lowercaseLine.includes('section') || lowercaseLine.includes('paragraph')) {
        suggestions.push({
          type: 'cognitive',
          target: 'chunkSize',
          action: 'adjust',
          value: 2,
          reasoning: line.trim(),
          confidence: 'high',
          priority: 'high',
          estimatedImpact: 0.8,
        });
      }
    }
    
    // Remove duplicates
    const uniqueSuggestions = suggestions.filter((suggestion, index, array) => 
      array.findIndex(s => s.type === suggestion.type && s.target === suggestion.target) === index
    );
    
    return uniqueSuggestions;
  }

  estimateCost(request: AIRequest): number {
    // Ollama is free for local usage
    return 0;
  }

  protected isConfigValid(): boolean {
    // Ollama doesn't require API key, just host availability
    return !!this.host;
  }
} 