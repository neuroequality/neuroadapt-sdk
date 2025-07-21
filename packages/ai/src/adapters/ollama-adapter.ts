import { BaseAIAdapter } from './base-adapter.js';
import type { AIMessage, AIResponse, AICompletionOptions, AIStreamChunk, AIAdapterConfig } from '../types/index.js';

export interface OllamaAdapterConfig extends AIAdapterConfig {
  baseURL?: string;
}

export class OllamaAdapter extends BaseAIAdapter {
  private baseURL: string;

  constructor(config: OllamaAdapterConfig) {
    super(config);
    this.baseURL = config.baseURL || 'http://localhost:11434';
  }

  get name(): string {
    return 'Ollama';
  }

  get models(): string[] {
    return [
      'deepseek-r1:32b',
      'llama3.2:3b',
      'llama3.2:1b',
      'phi3:mini',
      'mistral:7b',
      'codellama:7b',
      'gemma2:2b',
    ];
  }

  protected getDefaultModel(): string {
    return 'deepseek-r1:32b';
  }

  async complete(messages: AIMessage[], options: AICompletionOptions = {}): Promise<AIResponse> {
    return this.retry(async () => {
      const controller = this.createAbortController(options.abortSignal, this.config.timeout);

      const response = await fetch(`${this.baseURL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.currentModel,
          messages: this.formatMessages(messages),
          stream: false,
          options: {
            temperature: options.temperature,
            top_p: options.topP,
            stop: options.stop,
            num_predict: options.maxTokens,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        content: data.message?.content || '',
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        finishReason: data.done ? 'stop' : 'length',
        metadata: {
          model: data.model,
          created_at: data.created_at,
          total_duration: data.total_duration,
          load_duration: data.load_duration,
          prompt_eval_duration: data.prompt_eval_duration,
          eval_duration: data.eval_duration,
        },
      };
    });
  }

  async *stream(messages: AIMessage[], options: AICompletionOptions = {}): AsyncIterable<AIStreamChunk> {
    const controller = this.createAbortController(options.abortSignal, this.config.timeout);

    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.currentModel,
        messages: this.formatMessages(messages),
        stream: true,
        options: {
          temperature: options.temperature,
          top_p: options.topP,
          stop: options.stop,
          num_predict: options.maxTokens,
        },
      }),
      signal: controller.signal,
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

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const chunk = JSON.parse(line);
              const delta = chunk.message?.content || '';
              const isDone = chunk.done || false;

              yield {
                delta,
                done: isDone,
                usage: isDone ? {
                  promptTokens: chunk.prompt_eval_count || 0,
                  completionTokens: chunk.eval_count || 0,
                  totalTokens: (chunk.prompt_eval_count || 0) + (chunk.eval_count || 0),
                } : undefined,
              };

              if (isDone) return;
            } catch (parseError) {
              console.warn('Failed to parse Ollama chunk:', line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/tags`);
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      return data.models?.map((model: { name: string }) => model.name) || [];
    } catch (error) {
      console.warn('Failed to fetch available models from Ollama:', error);
      return this.models;
    }
  }

  async pullModel(model: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/api/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: model }),
    });

    if (!response.ok) {
      throw new Error(`Failed to pull model ${model}: ${response.statusText}`);
    }

    // Stream the pull progress
    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        console.log('Pull progress:', chunk);
      }
    } finally {
      reader.releaseLock();
    }
  }
}