import { BaseAIAdapter } from './base-adapter.js';
import type { AIMessage, AIResponse, AICompletionOptions, AIStreamChunk, AIAdapterConfig } from '../types/index.js';

export interface OpenAIAdapterConfig extends AIAdapterConfig {
  organization?: string;
}

export class OpenAIAdapter extends BaseAIAdapter {
  private openai: any; // Will be dynamically imported

  constructor(config: OpenAIAdapterConfig) {
    super(config);
    this.initializeOpenAI();
  }

  get name(): string {
    return 'OpenAI';
  }

  get models(): string[] {
    return [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4-turbo-preview',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
    ];
  }

  protected getDefaultModel(): string {
    return 'gpt-4-turbo-preview';
  }

  async complete(messages: AIMessage[], options: AICompletionOptions = {}): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Make sure to install the openai package.');
    }

    return this.retry(async () => {
      const controller = this.createAbortController(options.abortSignal, this.config.timeout);

      const response = await this.openai.chat.completions.create({
        model: this.currentModel,
        messages: this.formatMessages(messages),
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        top_p: options.topP,
        stop: options.stop,
        stream: false,
      }, {
        signal: controller.signal,
      });

      return {
        content: response.choices[0]?.message?.content || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        finishReason: response.choices[0]?.finish_reason as AIResponse['finishReason'],
        metadata: {
          model: response.model,
          created: response.created,
        },
      };
    });
  }

  async *stream(messages: AIMessage[], options: AICompletionOptions = {}): AsyncIterable<AIStreamChunk> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Make sure to install the openai package.');
    }

    const controller = this.createAbortController(options.abortSignal, this.config.timeout);

    const stream = await this.openai.chat.completions.create({
      model: this.currentModel,
      messages: this.formatMessages(messages),
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      top_p: options.topP,
      stop: options.stop,
      stream: true,
    }, {
      signal: controller.signal,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      const done = chunk.choices[0]?.finish_reason !== null;

      yield {
        delta,
        done,
        usage: chunk.usage ? {
          promptTokens: chunk.usage.prompt_tokens || 0,
          completionTokens: chunk.usage.completion_tokens || 0,
          totalTokens: chunk.usage.total_tokens || 0,
        } : undefined,
      };

      if (done) break;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.openai) {
        return false;
      }
      await this.openai.models.list();
      return true;
    } catch (error) {
      return false;
    }
  }

  private async initializeOpenAI(): Promise<void> {
    try {
      const { default: OpenAI } = await import('openai');
      this.openai = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseURL,
        organization: (this.config as OpenAIAdapterConfig).organization,
      });
    } catch (error) {
      console.warn('OpenAI package not found. Install it to use OpenAI adapter.');
    }
  }
}