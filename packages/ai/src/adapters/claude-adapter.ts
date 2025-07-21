import { BaseAIAdapter } from './base-adapter.js';
import type { AIMessage, AIResponse, AICompletionOptions, AIStreamChunk, AIAdapterConfig } from '../types/index.js';

export class ClaudeAdapter extends BaseAIAdapter {
  private anthropic: any; // Will be dynamically imported

  constructor(config: AIAdapterConfig) {
    super(config);
    this.initializeAnthropic();
  }

  get name(): string {
    return 'Claude';
  }

  get models(): string[] {
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ];
  }

  protected getDefaultModel(): string {
    return 'claude-3-5-sonnet-20241022';
  }

  async complete(messages: AIMessage[], options: AICompletionOptions = {}): Promise<AIResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic SDK not initialized. Make sure to install @anthropic-ai/sdk package.');
    }

    return this.retry(async () => {
      const { system, messages: formattedMessages } = this.formatClaudeMessages(messages);

      const response = await this.anthropic.messages.create({
        model: this.currentModel,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature,
        top_p: options.topP,
        stop_sequences: options.stop,
        system,
        messages: formattedMessages,
        stream: false,
      });

      return {
        content: response.content[0]?.text || '',
        usage: {
          promptTokens: response.usage?.input_tokens || 0,
          completionTokens: response.usage?.output_tokens || 0,
          totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
        },
        finishReason: response.stop_reason as AIResponse['finishReason'],
        metadata: {
          model: response.model,
          role: response.role,
        },
      };
    });
  }

  async *stream(messages: AIMessage[], options: AICompletionOptions = {}): AsyncIterable<AIStreamChunk> {
    if (!this.anthropic) {
      throw new Error('Anthropic SDK not initialized. Make sure to install @anthropic-ai/sdk package.');
    }

    const { system, messages: formattedMessages } = this.formatClaudeMessages(messages);

    const stream = await this.anthropic.messages.create({
      model: this.currentModel,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature,
      top_p: options.topP,
      stop_sequences: options.stop,
      system,
      messages: formattedMessages,
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        yield {
          delta: event.delta?.text || '',
          done: false,
        };
      } else if (event.type === 'message_stop') {
        yield {
          delta: '',
          done: true,
          usage: event.message?.usage ? {
            promptTokens: event.message.usage.input_tokens || 0,
            completionTokens: event.message.usage.output_tokens || 0,
            totalTokens: (event.message.usage.input_tokens || 0) + (event.message.usage.output_tokens || 0),
          } : undefined,
        };
        break;
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.anthropic) {
        return false;
      }
      // Simple test to check if the API key is valid
      await this.anthropic.messages.create({
        model: this.currentModel,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch (error) {
      // If it's an auth error but the SDK is working, return false
      // If it's a network error, also return false
      return false;
    }
  }

  private formatClaudeMessages(messages: AIMessage[]): { system?: string; messages: Array<{ role: string; content: string }> } {
    let system: string | undefined;
    const formattedMessages: Array<{ role: string; content: string }> = [];

    for (const message of messages) {
      if (message.role === 'system') {
        system = message.content;
      } else {
        formattedMessages.push({
          role: message.role,
          content: message.content,
        });
      }
    }

    return { system, messages: formattedMessages };
  }

  private async initializeAnthropic(): Promise<void> {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      this.anthropic = new Anthropic({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseURL,
      });
    } catch (error) {
      console.warn('Anthropic SDK not found. Install @anthropic-ai/sdk to use Claude adapter.');
    }
  }
}