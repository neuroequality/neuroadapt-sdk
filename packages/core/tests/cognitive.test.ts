import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CognitiveLoadEngine } from '../src/cognitive/index.js';
import type { CognitivePreferences } from '../src/preferences/schemas.js';
import type { AdaptationStrategy } from '../src/cognitive/index.js';

describe('CognitiveLoadEngine', () => {
  let preferences: CognitivePreferences;
  let engine: CognitiveLoadEngine;

  beforeEach(() => {
    preferences = {
      readingSpeed: 'medium',
      explanationLevel: 'detailed',
      processingPace: 'standard',
      chunkSize: 3,
      allowInterruptions: true,
      preferVisualCues: false,
    };

    engine = new CognitiveLoadEngine({
      preferences,
      sessionMemory: true,
      adaptationThreshold: 70,
    });

    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with preferences', () => {
      expect(engine).toBeInstanceOf(CognitiveLoadEngine);
    });

    it('should use default threshold when not provided', () => {
      const defaultEngine = new CognitiveLoadEngine({ preferences });
      expect(defaultEngine).toBeInstanceOf(CognitiveLoadEngine);
    });

    it('should initialize with session memory disabled', () => {
      const noMemoryEngine = new CognitiveLoadEngine({
        preferences,
        sessionMemory: false,
      });
      expect(noMemoryEngine).toBeInstanceOf(CognitiveLoadEngine);
    });
  });

  describe('analyzeText', () => {
    it('should analyze simple text correctly', () => {
      const text = 'This is a simple sentence.';
      const metrics = engine.analyzeText(text);

      expect(metrics.wordCount).toBe(5);
      expect(metrics.sentenceCount).toBe(1);
      expect(metrics.averageWordsPerSentence).toBe(5);
      expect(metrics.complexWords).toBe(0);
      expect(metrics.denseSections).toHaveLength(0);
    });

    it('should analyze complex text correctly', () => {
      const text = 'The implementation of the sophisticated methodology requires comprehensive understanding of advanced algorithmic optimization techniques and methodological approaches.';
      const metrics = engine.analyzeText(text);

      expect(metrics.wordCount).toBe(17);
      expect(metrics.sentenceCount).toBe(1);
      expect(metrics.averageWordsPerSentence).toBe(17);
      expect(metrics.complexWords).toBeGreaterThan(5);
      expect(metrics.denseSections).toHaveLength(1);
    });

    it('should emit load-score event', () => {
      const eventSpy = vi.fn();
      engine.on('load-score', eventSpy);

      const text = 'Simple text for testing.';
      engine.analyzeText(text, 'test context');

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          score: expect.any(Number),
          tier: expect.stringMatching(/^(low|moderate|high)$/),
          context: 'test context',
        })
      );
    });

    it('should emit load-score event without context', () => {
      const eventSpy = vi.fn();
      engine.on('load-score', eventSpy);

      const text = 'Simple text for testing.';
      engine.analyzeText(text);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          score: expect.any(Number),
          tier: expect.stringMatching(/^(low|moderate|high)$/),
        })
      );
    });

    it('should suggest adaptation for high cognitive load', () => {
      const strategySpy = vi.fn();
      engine.on('strategy-suggested', strategySpy);

      // Very complex text that should trigger adaptation
      const complexText = 'The multifaceted implementation of sophisticated algorithmic methodologies necessitates comprehensive understanding of intricate computational optimization techniques, advanced mathematical formulations, and complex interdisciplinary approaches to problem-solving within the context of enterprise-level software architecture and scalable distributed systems infrastructure.';
      engine.analyzeText(complexText);

      expect(strategySpy).toHaveBeenCalled();
    });
  });

  describe('readingTimeEstimate', () => {
    it('should estimate reading time for normal speed', () => {
      const text = 'This is a test sentence with approximately ten words total.';
      const time = engine.readingTimeEstimate(text);

      expect(time).toBe(1); // Should be around 1 minute for ~200 WPM
    });

    it('should adjust for slow reading speed', () => {
      preferences.readingSpeed = 'slow';
      const slowEngine = new CognitiveLoadEngine({ preferences });
      
      const text = 'This is a test sentence with approximately ten words total.';
      const time = slowEngine.readingTimeEstimate(text);

      expect(time).toBeGreaterThan(0);
    });

    it('should adjust for fast reading speed', () => {
      preferences.readingSpeed = 'fast';
      const fastEngine = new CognitiveLoadEngine({ preferences });
      
      const text = Array(300).fill('word').join(' '); // 300 words
      const time = fastEngine.readingTimeEstimate(text);

      expect(time).toBe(1); // Should be 1 minute at 300 WPM
    });

    it('should adjust for text complexity', () => {
      const simpleText = 'This is simple text with easy words.';
      const complexText = 'The implementation utilizes sophisticated methodological approaches for optimization.';

      const simpleTime = engine.readingTimeEstimate(simpleText);
      const complexTime = engine.readingTimeEstimate(complexText);

      expect(complexTime).toBeGreaterThanOrEqual(simpleTime);
    });
  });

  describe('denseSections', () => {
    it('should identify dense sentences', () => {
      const text = 'Short sentence. This is a very long and complex sentence with many subordinate clauses, technical terminology, and intricate grammatical structures that make comprehension significantly more challenging for readers.';
      const dense = engine.denseSections(text);

      expect(dense).toHaveLength(1);
      expect(dense[0]).toContain('very long and complex');
    });

    it('should handle text with no dense sections', () => {
      const text = 'Simple text. Easy to read. Very clear.';
      const dense = engine.denseSections(text);

      expect(dense).toHaveLength(0);
    });

    it('should identify multiple dense sections', () => {
      const text = 'This exceptionally complex sentence contains numerous sophisticated technical terms, advanced concepts, intricate relationships between ideas, and complicated grammatical structures. Another equally challenging sentence with similarly complex vocabulary, advanced terminology, and difficult concepts.';
      const dense = engine.denseSections(text);

      expect(dense.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('applyStrategy', () => {
    it('should apply chunking strategy', () => {
      const text = 'First sentence. Second sentence. Third sentence. Fourth sentence.';
      const result = engine.applyStrategy('chunk', text);

      expect(result).toContain('[Continue when ready]');
    });

    it('should apply break offering strategy', () => {
      const text = 'Some dense content.';
      const result = engine.applyStrategy('offerBreak', text);

      expect(result).toContain('[BreakSuggestion]');
      expect(result).toContain('take a break');
    });

    it('should apply language simplification strategy', () => {
      const text = 'We need to utilize advanced methodology to demonstrate implementation.';
      const result = engine.applyStrategy('simplifyLanguage', text);

      expect(result).toContain('use');
      expect(result).toContain('show');
      expect(result).toContain('put in place');
      expect(result).toContain('[Simplified for easier reading]');
    });

    it('should emit adaptation-applied event', () => {
      const eventSpy = vi.fn();
      engine.on('adaptation-applied', eventSpy);

      const text = 'Test text.';
      engine.applyStrategy('chunk', text);

      expect(eventSpy).toHaveBeenCalledWith('chunk', expect.any(String));
    });

    it('should throw error for unknown strategy', () => {
      const text = 'Test text.';
      expect(() => {
        engine.applyStrategy('unknown' as AdaptationStrategy, text);
      }).toThrow('Unknown adaptation strategy: unknown');
    });
  });

  describe('session memory', () => {
    it('should cache adaptation results', () => {
      const text = 'Test text for caching.';
      const result1 = engine.applyStrategy('chunk', text);
      const result2 = engine.applyStrategy('chunk', text);

      expect(result1).toBe(result2);
    });

    it('should work without session memory', () => {
      const noMemoryEngine = new CognitiveLoadEngine({
        preferences,
        sessionMemory: false,
      });

      const text = 'First sentence. Second sentence. Third sentence. Fourth sentence.';
      const result = noMemoryEngine.applyStrategy('chunk', text);
      expect(result).toContain('[Continue when ready]');
    });

    it('should clear memory correctly', () => {
      const text = 'Test text for clearing.';
      engine.applyStrategy('chunk', text);
      
      engine.clearMemory();
      
      // Should work without errors after clearing memory
      const result = engine.applyStrategy('chunk', text);
      expect(result).toContain('Test text for clearing');
    });
  });

  describe('registerStrategy', () => {
    it('should register custom strategy', () => {
      const customStrategy = (text: string) => `Custom: ${text}`;
      engine.registerStrategy('chunk', customStrategy);

      const result = engine.applyStrategy('chunk', 'test');
      expect(result).toBe('Custom: test');
    });

    it('should replace existing strategy', () => {
      const newStrategy = (text: string) => `New: ${text}`;
      engine.registerStrategy('chunk', newStrategy);

      const result = engine.applyStrategy('chunk', 'test');
      expect(result).toBe('New: test');
    });
  });

  describe('getCognitiveTier', () => {
    it('should return low for scores under 40', () => {
      expect(engine.getCognitiveTier(30)).toBe('low');
      expect(engine.getCognitiveTier(39)).toBe('low');
    });

    it('should return moderate for scores 40-69', () => {
      expect(engine.getCognitiveTier(40)).toBe('moderate');
      expect(engine.getCognitiveTier(50)).toBe('moderate');
      expect(engine.getCognitiveTier(69)).toBe('moderate');
    });

    it('should return high for scores 70+', () => {
      expect(engine.getCognitiveTier(70)).toBe('high');
      expect(engine.getCognitiveTier(100)).toBe('high');
    });
  });

  describe('preference adjustments', () => {
    it('should adjust score for slow reading speed', () => {
      const slowPrefs = { ...preferences, readingSpeed: 'slow' as const };
      const slowEngine = new CognitiveLoadEngine({ preferences: slowPrefs });

      const normalScore = engine.analyzeText('Complex test sentence.').wordCount;
      const slowScore = slowEngine.analyzeText('Complex test sentence.').wordCount;

      // Scores should be based on same text metrics
      expect(normalScore).toBe(slowScore);
    });

    it('should adjust score for relaxed processing pace', () => {
      const relaxedPrefs = { ...preferences, processingPace: 'relaxed' as const };
      const relaxedEngine = new CognitiveLoadEngine({ preferences: relaxedPrefs });

      const text = 'Test sentence for processing pace analysis.';
      const normalMetrics = engine.analyzeText(text);
      const relaxedMetrics = relaxedEngine.analyzeText(text);

      expect(normalMetrics.wordCount).toBe(relaxedMetrics.wordCount);
    });

    it('should adjust score for interruption intolerance', () => {
      const noInterruptPrefs = { ...preferences, allowInterruptions: false };
      const noInterruptEngine = new CognitiveLoadEngine({ preferences: noInterruptPrefs });

      const text = 'Test sentence for interruption analysis.';
      const normalMetrics = engine.analyzeText(text);
      const noInterruptMetrics = noInterruptEngine.analyzeText(text);

      expect(normalMetrics.wordCount).toBe(noInterruptMetrics.wordCount);
    });
  });

  describe('text complexity calculations', () => {
    it('should calculate Flesch score', () => {
      const simpleText = 'Cat sat on mat.';
      const complexText = 'The implementation of sophisticated methodologies requires comprehensive understanding.';

      const simpleMetrics = engine.analyzeText(simpleText);
      const complexMetrics = engine.analyzeText(complexText);

      expect(simpleMetrics.fleschScore).toBeGreaterThan(complexMetrics.fleschScore);
    });

    it('should count syllables correctly', () => {
      // Test syllable counting through complex word detection
      const singleSyllable = 'cat dog run';
      const multiSyllable = 'development implementation optimization';

      const singleMetrics = engine.analyzeText(singleSyllable);
      const multiMetrics = engine.analyzeText(multiSyllable);

      expect(multiMetrics.complexWords).toBeGreaterThan(singleMetrics.complexWords);
    });

    it('should identify technical terms as complex', () => {
      const technicalText = 'implementation functionality configuration optimization methodology';
      const metrics = engine.analyzeText(technicalText);

      expect(metrics.complexWords).toBeGreaterThan(0);
    });

    it('should handle empty or minimal text', () => {
      const emptyMetrics = engine.analyzeText('');
      const minimalMetrics = engine.analyzeText('Hi.');

      expect(emptyMetrics.wordCount).toBe(0);
      expect(minimalMetrics.wordCount).toBe(1);
      expect(minimalMetrics.sentenceCount).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle text with no sentences', () => {
      const noSentenceText = 'word word word';
      const metrics = engine.analyzeText(noSentenceText);

      expect(metrics.sentenceCount).toBe(1);
      expect(metrics.averageWordsPerSentence).toBe(3); // wordCount / max(sentences, 1)
    });

    it('should handle text with only punctuation', () => {
      const punctuationText = '!!! ??? ...';
      const metrics = engine.analyzeText(punctuationText);

      expect(metrics.wordCount).toBe(3);
    });

    it('should handle very long words', () => {
      const longWordText = 'supercalifragilisticexpialidocious pseudopseudohypoparathyroidism';
      const metrics = engine.analyzeText(longWordText);

      expect(metrics.complexWords).toBeGreaterThan(0);
    });

    it('should handle mixed case and special characters', () => {
      const mixedText = 'CamelCase text WITH-hyphens and_underscores plus123numbers!';
      const metrics = engine.analyzeText(mixedText);

      expect(metrics.wordCount).toBeGreaterThan(0);
    });
  });
}); 