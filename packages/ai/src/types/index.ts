export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: 'stop' | 'length' | 'content_filter' | 'tool_calls';
  metadata?: Record<string, unknown>;
}

export interface AIStreamChunk {
  delta: string;
  done: boolean;
  usage?: AIResponse['usage'];
}

export interface AIAdapterConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface AIAdapter {
  readonly name: string;
  readonly models: string[];
  
  complete(messages: AIMessage[], options?: AICompletionOptions): Promise<AIResponse>;
  stream?(messages: AIMessage[], options?: AICompletionOptions): AsyncIterable<AIStreamChunk>;
  getModel(): string;
  setModel(model: string): void;
  isAvailable(): Promise<boolean>;
}

export interface AICompletionOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
  stop?: string[];
  abortSignal?: AbortSignal;
}

export interface PredictableAIConfig {
  tone: 'calm-supportive' | 'encouraging' | 'neutral' | 'clinical' | 'friendly';
  explanationLevel: 'simple' | 'moderate' | 'detailed' | 'technical';
  pacing: 'slow' | 'normal' | 'quick';
  consistencyLevel: 'low' | 'moderate' | 'high';
  useAnalogies: boolean;
  allowUndo: boolean;
  maxUndoSteps: number;
}

export interface UndoState {
  step: number;
  prompt: string;
  response: AIResponse;
  timestamp: number;
}

export interface PredictableAIEvents {
  'response:start': { prompt: string };
  'response:chunk': { chunk: AIStreamChunk };
  'response:complete': { response: AIResponse };
  'response:error': { error: Error };
  'undo:performed': { step: number; state: UndoState };
  'config:changed': { config: Partial<PredictableAIConfig> };
}