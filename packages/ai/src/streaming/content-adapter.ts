import { EventEmitter } from 'eventemitter3';
import type { 
  StreamChunk, 
  AdaptationSuggestion,
  UserInteraction 
} from '../types/common.js';

/**
 * Events emitted by ContentAdapter
 */
export interface ContentAdapterEvents {
  'content-processed': (result: ProcessedContent) => void;
  'adaptation-suggested': (suggestion: AdaptationSuggestion) => void;
  'chunk-processed': (chunk: ProcessedChunk) => void;
  'processing-complete': (summary: ProcessingSummary) => void;
  'error': (error: Error) => void;
}

/**
 * Configuration for content adaptation
 */
export interface ContentAdapterConfig {
  chunkSize?: number;
  processingDelay?: number;
  enableRealTimeAnalysis?: boolean;
  adaptationThreshold?: number;
  maxConcurrentChunks?: number;
  retryAttempts?: number;
}

/**
 * Processed content result
 */
export interface ProcessedContent {
  id: string;
  originalContent: string;
  adaptedContent: string;
  adaptations: string[];
  confidence: number;
  processingTime: number;
  metadata?: Record<string, unknown>;
}

/**
 * Processed chunk information
 */
export interface ProcessedChunk {
  id: string;
  chunkIndex: number;
  content: string;
  adaptations: string[];
  confidence: number;
  timestamp: number;
}

/**
 * Processing summary
 */
export interface ProcessingSummary {
  totalChunks: number;
  processedChunks: number;
  failedChunks: number;
  totalAdaptations: number;
  averageConfidence: number;
  totalProcessingTime: number;
  suggestedImprovements: string[];
}

/**
 * Content processing queue item
 */
interface QueueItem {
  id: string;
  content: string;
  preferences: Record<string, unknown>;
  context?: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

/**
 * ContentAdapter provides real-time content adaptation and streaming processing
 */
export class ContentAdapter extends EventEmitter<ContentAdapterEvents> {
  private config: Required<ContentAdapterConfig>;
  private processingQueue: QueueItem[] = [];
  private activeProcessing: Map<string, Promise<void>> = new Map();
  private adaptationCache: Map<string, ProcessedContent> = new Map();
  private processingStats: ProcessingSummary;

  constructor(config: ContentAdapterConfig = {}) {
    super();
    
    this.config = {
      chunkSize: config.chunkSize || 500, // characters
      processingDelay: config.processingDelay || 100, // ms
      enableRealTimeAnalysis: config.enableRealTimeAnalysis ?? true,
      adaptationThreshold: config.adaptationThreshold || 0.7,
      maxConcurrentChunks: config.maxConcurrentChunks || 3,
      retryAttempts: config.retryAttempts || 2,
    };

    this.processingStats = this.createEmptyStats();
    this.startProcessingLoop();
  }

  /**
   * Process content with user preferences
   */
  async processContent(
    content: string,
    preferences: Record<string, unknown>,
    context?: Record<string, unknown>
  ): Promise<ProcessedContent> {
    const startTime = Date.now();
    const contentId = this.generateContentId(content);

    // Check cache first
    const cached = this.adaptationCache.get(contentId);
    if (cached) {
      return cached;
    }

    try {
      const adaptedContent = await this.adaptContent(content, preferences, context);
      const adaptations = this.detectAppliedAdaptations(content, adaptedContent, preferences);
      
      const result: ProcessedContent = {
        id: contentId,
        originalContent: content,
        adaptedContent,
        adaptations,
        confidence: this.calculateConfidence(adaptations, preferences),
        processingTime: Date.now() - startTime,
        metadata: {
          preferences,
          context,
          timestamp: Date.now(),
        },
      };

      // Cache result
      this.adaptationCache.set(contentId, result);
      
      // Limit cache size
      if (this.adaptationCache.size > 100) {
        const firstKey = this.adaptationCache.keys().next().value;
        this.adaptationCache.delete(firstKey);
      }

      this.emit('content-processed', result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', err);
      throw err;
    }
  }

  /**
   * Process streaming content chunks
   */
  async processStreamChunks(
    chunks: AsyncGenerator<StreamChunk, void, unknown>,
    preferences: Record<string, unknown>,
    context?: Record<string, unknown>
  ): Promise<void> {
    let buffer = '';
    let chunkIndex = 0;
    const startTime = Date.now();

    try {
      for await (const chunk of chunks) {
        if (chunk.type === 'token') {
          buffer += chunk.content;
          
          // Process complete sentences or chunks
          if (this.shouldProcessBuffer(buffer)) {
            const processedChunk = await this.processChunk(
              buffer,
              chunkIndex++,
              preferences,
              context
            );
            
            this.emit('chunk-processed', processedChunk);
            buffer = '';
          }
        } else if (chunk.type === 'done') {
          // Process remaining buffer
          if (buffer.trim()) {
            const processedChunk = await this.processChunk(
              buffer,
              chunkIndex++,
              preferences,
              context
            );
            
            this.emit('chunk-processed', processedChunk);
          }
          
          // Emit completion summary
          const summary: ProcessingSummary = {
            ...this.processingStats,
            totalProcessingTime: Date.now() - startTime,
          };
          
          this.emit('processing-complete', summary);
          break;
        } else if (chunk.type === 'error') {
          throw new Error(`Stream error: ${chunk.content}`);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', err);
      throw err;
    }
  }

  /**
   * Add content to processing queue
   */
  queueContent(
    content: string,
    preferences: Record<string, unknown>,
    context?: Record<string, unknown>
  ): string {
    const id = this.generateContentId(content);
    
    const queueItem: QueueItem = {
      id,
      content,
      preferences,
      context,
      timestamp: Date.now(),
      retries: 0,
    };

    this.processingQueue.push(queueItem);
    return id;
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): ProcessingSummary {
    return { ...this.processingStats };
  }

  /**
   * Clear adaptation cache
   */
  clearCache(): void {
    this.adaptationCache.clear();
  }

  /**
   * Get cache information
   */
  getCacheInfo(): { size: number; keys: string[] } {
    return {
      size: this.adaptationCache.size,
      keys: Array.from(this.adaptationCache.keys()),
    };
  }

  /**
   * Stop processing and clean up
   */
  destroy(): void {
    this.processingQueue = [];
    this.activeProcessing.clear();
    this.adaptationCache.clear();
    this.removeAllListeners();
  }

  // Private methods

  private generateContentId(content: string): string {
    // Simple hash function for content ID
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `content_${Math.abs(hash)}_${Date.now()}`;
  }

  private async adaptContent(
    content: string,
    preferences: Record<string, unknown>,
    context?: Record<string, unknown>
  ): Promise<string> {
    let adaptedContent = content;

    // Apply various adaptations based on preferences
    if (preferences.highContrast) {
      adaptedContent = this.applyHighContrastAdaptation(adaptedContent);
    }

    if (preferences.motionReduction) {
      adaptedContent = this.applyMotionReductionAdaptation(adaptedContent);
    }

    if (typeof preferences.fontSize === 'number' && preferences.fontSize !== 1) {
      adaptedContent = this.applyFontSizeAdaptation(adaptedContent, preferences.fontSize);
    }

    if (typeof preferences.chunkSize === 'number' && preferences.chunkSize < 4) {
      adaptedContent = await this.applyContentChunking(adaptedContent, preferences.chunkSize);
    }

    if (preferences.simplifyLanguage) {
      adaptedContent = await this.applyLanguageSimplification(adaptedContent);
    }

    return adaptedContent;
  }

  private applyHighContrastAdaptation(content: string): string {
    // Add high contrast markers for styling
    return content.replace(
      /<(p|div|span|h[1-6])([^>]*)>/gi,
      '<$1$2 data-high-contrast="true">'
    );
  }

  private applyMotionReductionAdaptation(content: string): string {
    // Remove or disable animations and auto-playing content
    return content
      .replace(/autoplay/gi, 'data-autoplay-disabled')
      .replace(/animation-/gi, 'data-animation-disabled-')
      .replace(/<video([^>]*)\s+autoplay/gi, '<video$1 data-motion-reduced');
  }

  private applyFontSizeAdaptation(content: string, fontSize: number): string {
    const percentageSize = Math.round(fontSize * 100);
    return content.replace(
      /<(p|div|span|h[1-6])([^>]*)>/gi,
      `<$1$2 style="font-size: ${percentageSize}%">`
    );
  }

  private async applyContentChunking(content: string, chunkSize: number): Promise<string> {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const chunks: string[] = [];
    
    for (let i = 0; i < sentences.length; i += chunkSize) {
      const chunk = sentences.slice(i, i + chunkSize).join('. ');
      chunks.push(`<div class="content-chunk">${chunk}</div>`);
    }
    
    return chunks.join('\n<div class="chunk-break"></div>\n');
  }

  private async applyLanguageSimplification(content: string): Promise<string> {
    // Simplified language processing - in real implementation, this would use AI
    return content
      .replace(/utilize/gi, 'use')
      .replace(/demonstrate/gi, 'show')
      .replace(/accomplish/gi, 'do')
      .replace(/nevertheless/gi, 'but')
      .replace(/consequently/gi, 'so');
  }

  private detectAppliedAdaptations(
    original: string,
    adapted: string,
    preferences: Record<string, unknown>
  ): string[] {
    const adaptations: string[] = [];
    
    if (adapted.includes('data-high-contrast')) {
      adaptations.push('High contrast styling applied');
    }
    
    if (adapted.includes('data-motion-reduced')) {
      adaptations.push('Motion reduction applied');
    }
    
    if (adapted.includes('font-size:')) {
      adaptations.push('Font size adjustment applied');
    }
    
    if (adapted.includes('content-chunk')) {
      adaptations.push('Content chunking applied');
    }
    
    if (original !== adapted && adaptations.length === 0) {
      adaptations.push('Language simplification applied');
    }
    
    return adaptations;
  }

  private calculateConfidence(
    adaptations: string[],
    preferences: Record<string, unknown>
  ): number {
    // Simple confidence calculation based on applied adaptations
    const maxPossibleAdaptations = Object.keys(preferences).length;
    const appliedAdaptations = adaptations.length;
    
    return Math.min(appliedAdaptations / Math.max(maxPossibleAdaptations, 1), 1);
  }

  private shouldProcessBuffer(buffer: string): boolean {
    // Process buffer when it reaches chunk size or contains complete sentences
    return buffer.length >= this.config.chunkSize || 
           /[.!?]\s/.test(buffer) ||
           buffer.includes('\n\n');
  }

  private async processChunk(
    content: string,
    chunkIndex: number,
    preferences: Record<string, unknown>,
    context?: Record<string, unknown>
  ): Promise<ProcessedChunk> {
    const adaptedContent = await this.adaptContent(content, preferences, context);
    const adaptations = this.detectAppliedAdaptations(content, adaptedContent, preferences);
    
    this.processingStats.processedChunks++;
    this.processingStats.totalAdaptations += adaptations.length;
    
    return {
      id: `chunk_${chunkIndex}`,
      chunkIndex,
      content: adaptedContent,
      adaptations,
      confidence: this.calculateConfidence(adaptations, preferences),
      timestamp: Date.now(),
    };
  }

  private startProcessingLoop(): void {
    setInterval(() => {
      this.processQueue();
    }, this.config.processingDelay);
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue.length === 0 || 
        this.activeProcessing.size >= this.config.maxConcurrentChunks) {
      return;
    }

    const item = this.processingQueue.shift();
    if (!item) return;

    const processingPromise = this.processQueueItem(item);
    this.activeProcessing.set(item.id, processingPromise);

    try {
      await processingPromise;
    } finally {
      this.activeProcessing.delete(item.id);
    }
  }

  private async processQueueItem(item: QueueItem): Promise<void> {
    try {
      const result = await this.processContent(item.content, item.preferences, item.context);
      this.processingStats.totalChunks++;
    } catch (error) {
      this.processingStats.failedChunks++;
      
      if (item.retries < this.config.retryAttempts) {
        item.retries++;
        this.processingQueue.push(item);
      } else {
        this.emit('error', error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  private createEmptyStats(): ProcessingSummary {
    return {
      totalChunks: 0,
      processedChunks: 0,
      failedChunks: 0,
      totalAdaptations: 0,
      averageConfidence: 0,
      totalProcessingTime: 0,
      suggestedImprovements: [],
    };
  }
} 