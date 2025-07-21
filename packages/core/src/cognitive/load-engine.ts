import { EventEmitter } from 'eventemitter3';

import type { CognitivePreferences } from '../preferences/schemas.js';

/**
 * Cognitive load tiers based on calculated scores
 */
export type CognitiveTier = 'low' | 'moderate' | 'high';

/**
 * Adaptation strategies for different cognitive load situations
 */
export type AdaptationStrategy = 'chunk' | 'offerBreak' | 'simplifyLanguage';

/**
 * Events emitted by CognitiveLoadEngine
 */
export interface CognitiveLoadEvents {
  'load-score': (data: { score: number; tier: CognitiveTier; context?: string }) => void;
  'strategy-suggested': (strategy: AdaptationStrategy, context: string) => void;
  'adaptation-applied': (strategy: AdaptationStrategy, result: string) => void;
}

/**
 * Text metrics for cognitive load calculation
 */
export interface TextMetrics {
  wordCount: number;
  sentenceCount: number;
  averageWordsPerSentence: number;
  complexWords: number;
  readingTimeEstimate: number;
  fleschScore: number;
  denseSections: string[];
}

/**
 * Configuration for cognitive load analysis
 */
export interface CognitiveLoadConfig {
  preferences: CognitivePreferences;
  sessionMemory?: boolean;
  adaptationThreshold?: number;
}

/**
 * Adaptation strategy function type
 */
export type StrategyFunction = (text: string, context?: string) => string;

/**
 * Session memory for avoiding repeated explanations
 */
interface SessionMemory {
  explanations: Set<string>;
  adaptations: Map<string, string>;
  timestamp: number;
}

/**
 * CognitiveLoadEngine analyzes text and user interactions to detect
 * cognitive overload and suggest appropriate adaptations
 */
export class CognitiveLoadEngine extends EventEmitter<CognitiveLoadEvents> {
  private readonly preferences: CognitivePreferences;
  private readonly sessionMemory: SessionMemory;
  private readonly strategies = new Map<AdaptationStrategy, StrategyFunction>();
  private readonly memoryEnabled: boolean;
  private readonly adaptationThreshold: number;

  constructor(config: CognitiveLoadConfig) {
    super();
    
    this.preferences = config.preferences;
    this.memoryEnabled = config.sessionMemory ?? true;
    this.adaptationThreshold = config.adaptationThreshold ?? 70;
    
    this.sessionMemory = {
      explanations: new Set(),
      adaptations: new Map(),
      timestamp: Date.now(),
    };

    this.initializeStrategies();
  }

  /**
   * Analyze text and calculate cognitive load score
   */
  analyzeText(text: string, context?: string): TextMetrics {
    const metrics = this.calculateTextMetrics(text);
    const score = this.calculateCognitiveScore(metrics);
    const tier = this.getCognitiveTier(score);

    this.emit('load-score', { score, tier, ...(context && { context }) });

    // Suggest adaptation if score exceeds threshold
    if (score >= this.adaptationThreshold) {
      this.suggestAdaptation(text, score, context);
    }

    return metrics;
  }

  /**
   * Estimate reading time for given text based on user preferences
   */
  readingTimeEstimate(text: string): number {
    const wordCount = this.countWords(text);
    const baseWPM = this.getReadingSpeed();
    
    // Adjust for complexity
    const complexityFactor = this.getComplexityFactor(text);
    const adjustedWPM = baseWPM / complexityFactor;
    
    return Math.ceil(wordCount / adjustedWPM);
  }

  /**
   * Identify dense sections that may cause cognitive overload
   */
  denseSections(text: string): string[] {
    const sentences = this.splitIntoSentences(text);
    const denseSections: string[] = [];

    for (const sentence of sentences) {
      if (this.isDenseSentence(sentence)) {
        denseSections.push(sentence.trim());
      }
    }

    return denseSections;
  }

  /**
   * Apply adaptation strategy to text
   */
  applyStrategy(strategy: AdaptationStrategy, text: string, context?: string): string {
    const strategyFn = this.strategies.get(strategy);
    if (!strategyFn) {
      throw new Error(`Unknown adaptation strategy: ${strategy}`);
    }

    // Check session memory to avoid repetition
    const memoryKey = `${strategy}:${text.substring(0, 100)}`;
    if (this.memoryEnabled && this.sessionMemory.adaptations.has(memoryKey)) {
      return this.sessionMemory.adaptations.get(memoryKey)!;
    }

    const result = strategyFn(text, context);
    
    // Store in session memory
    if (this.memoryEnabled) {
      this.sessionMemory.adaptations.set(memoryKey, result);
    }

    this.emit('adaptation-applied', strategy, result);
    return result;
  }

  /**
   * Register a custom adaptation strategy
   */
  registerStrategy(name: AdaptationStrategy, fn: StrategyFunction): void {
    this.strategies.set(name, fn);
  }

  /**
   * Clear session memory
   */
  clearMemory(): void {
    this.sessionMemory.explanations.clear();
    this.sessionMemory.adaptations.clear();
    this.sessionMemory.timestamp = Date.now();
  }

  /**
   * Get current cognitive load tier based on score
   */
  getCognitiveTier(score: number): CognitiveTier {
    if (score < 40) return 'low';
    if (score < 70) return 'moderate';
    return 'high';
  }

  private calculateTextMetrics(text: string): TextMetrics {
    const words = this.countWords(text);
    const sentences = this.splitIntoSentences(text);
    const complexWords = this.countComplexWords(text);
    
    const metrics: TextMetrics = {
      wordCount: words,
      sentenceCount: sentences.length,
      averageWordsPerSentence: words / Math.max(sentences.length, 1),
      complexWords,
      readingTimeEstimate: this.readingTimeEstimate(text),
      fleschScore: this.calculateFleschScore(words, sentences.length, complexWords),
      denseSections: this.denseSections(text),
    };

    return metrics;
  }

  private calculateCognitiveScore(metrics: TextMetrics): number {
    let score = 0;

    // Factor in sentence complexity
    if (metrics.averageWordsPerSentence > 20) score += 25;
    else if (metrics.averageWordsPerSentence > 15) score += 15;
    else if (metrics.averageWordsPerSentence > 10) score += 5;

    // Factor in complex words
    const complexWordRatio = metrics.complexWords / metrics.wordCount;
    if (complexWordRatio > 0.3) score += 30;
    else if (complexWordRatio > 0.2) score += 20;
    else if (complexWordRatio > 0.1) score += 10;

    // Factor in reading level (inverse of Flesch score)
    if (metrics.fleschScore < 30) score += 25;
    else if (metrics.fleschScore < 50) score += 15;
    else if (metrics.fleschScore < 70) score += 10;

    // Factor in dense sections
    score += metrics.denseSections.length * 5;

    // Adjust based on user preferences
    score = this.adjustForPreferences(score);

    return Math.min(Math.max(score, 0), 100);
  }

  private adjustForPreferences(baseScore: number): number {
    let adjusted = baseScore;

    // Adjust for reading speed preference
    switch (this.preferences.readingSpeed) {
      case 'slow':
        adjusted *= 1.3;
        break;
      case 'fast':
        adjusted *= 0.7;
        break;
    }

    // Adjust for processing pace
    switch (this.preferences.processingPace) {
      case 'relaxed':
        adjusted *= 1.2;
        break;
      case 'quick':
        adjusted *= 0.8;
        break;
    }

    // Adjust for interruption tolerance
    if (!this.preferences.allowInterruptions) {
      adjusted *= 1.1;
    }

    return adjusted;
  }

  private suggestAdaptation(_text: string, score: number, context?: string): void {
    let strategy: AdaptationStrategy;

    if (score >= 85) {
      strategy = 'offerBreak';
    } else if (score >= 70) {
      strategy = 'simplifyLanguage';
    } else {
      strategy = 'chunk';
    }

    this.emit('strategy-suggested', strategy, context || 'high cognitive load detected');
  }

  private initializeStrategies(): void {
    // Chunking strategy
    this.strategies.set('chunk', (text: string) => {
      const sentences = this.splitIntoSentences(text);
      const chunkSize = this.preferences.chunkSize || 3;
      const chunks: string[] = [];

      for (let i = 0; i < sentences.length; i += chunkSize) {
        const chunk = sentences.slice(i, i + chunkSize).join(' ');
        chunks.push(chunk);
      }

      return chunks.join('\n\n[Continue when ready]\n\n');
    });

    // Break offering strategy
    this.strategies.set('offerBreak', (text: string) => {
      return `[BreakSuggestion] This content is quite dense. Would you like to take a break before continuing?\n\n${text}`;
    });

    // Language simplification strategy
    this.strategies.set('simplifyLanguage', (text: string) => {
      return text
        .replace(/\b(utilize|utilization)\b/gi, 'use')
        .replace(/\b(demonstrate|demonstrates)\b/gi, 'show')
        .replace(/\b(facilitate|facilitates)\b/gi, 'help')
        .replace(/\b(implement|implementation)\b/gi, 'put in place')
        .replace(/\b(methodology)\b/gi, 'method')
        .replace(/\b(subsequently)\b/gi, 'then')
        .replace(/\b(furthermore)\b/gi, 'also')
        .replace(/\b(nevertheless)\b/gi, 'however')
        + '\n\n[Simplified for easier reading]';
    });
  }

  private getReadingSpeed(): number {
    switch (this.preferences.readingSpeed) {
      case 'slow': return 150;
      case 'fast': return 300;
      default: return 200;
    }
  }

  private getComplexityFactor(text: string): number {
    const complexWords = this.countComplexWords(text);
    const totalWords = this.countWords(text);
    const ratio = complexWords / totalWords;
    
    return 1 + (ratio * 0.5); // Complexity can slow reading by up to 50%
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  }

  private countComplexWords(text: string): number {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    return words.filter(word => this.isComplexWord(word)).length;
  }

  private isComplexWord(word: string): boolean {
    // Words with 3+ syllables or technical terms
    return (
      this.countSyllables(word) >= 3 ||
      /^(implementation|functionality|configuration|optimization|methodology)/.test(word) ||
      word.length > 12
    );
  }

  private countSyllables(word: string): number {
    const vowels = word.match(/[aeiouy]+/gi);
    const silentE = /e$/i.test(word);
    const syllableCount = vowels ? vowels.length : 1;
    
    return silentE && syllableCount > 1 ? syllableCount - 1 : syllableCount;
  }

  private isDenseSentence(sentence: string): boolean {
    const words = this.countWords(sentence);
    const complexWords = this.countComplexWords(sentence);
    
    return (
      words > 25 ||
      complexWords / words > 0.3 ||
      sentence.split(',').length > 4
    );
  }

  private calculateFleschScore(words: number, sentences: number, complexWords: number): number {
    const avgSentenceLength = words / Math.max(sentences, 1);
    const avgSyllablesPerWord = (words + complexWords) / Math.max(words, 1);
    
    return 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  }
} 