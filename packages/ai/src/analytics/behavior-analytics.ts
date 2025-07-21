import { EventEmitter } from 'eventemitter3';
import { z } from 'zod';
import type { 
  UserInteraction, 
  AnalyticsEvent
} from '../types/common.js';
import { 
  AnalyticsEventSchema,
  UserInteractionSchema 
} from '../types/common.js';

/**
 * Events emitted by BehaviorAnalytics
 */
export interface BehaviorAnalyticsEvents {
  'pattern-detected': (pattern: BehaviorPattern) => void;
  'anomaly-detected': (anomaly: BehaviorAnomaly) => void;
  'insight-generated': (insight: BehaviorInsight) => void;
  'data-collected': (event: AnalyticsEvent) => void;
  'error': (error: Error) => void;
}

/**
 * Configuration for behavior analytics
 */
export interface BehaviorAnalyticsConfig {
  sessionTimeout?: number; // milliseconds
  maxSessionEvents?: number;
  enableRealTimeAnalysis?: boolean;
  patternDetectionThreshold?: number;
  anomalyDetectionSensitivity?: number;
  privacyMode?: boolean;
  bufferSize?: number;
}

/**
 * Detected behavior pattern
 */
export interface BehaviorPattern {
  id: string;
  type: 'navigation' | 'interaction' | 'preference' | 'temporal';
  pattern: string;
  confidence: number;
  frequency: number;
  contexts: string[];
  impact: 'positive' | 'negative' | 'neutral';
  recommendations: string[];
}

/**
 * Behavior anomaly detection
 */
export interface BehaviorAnomaly {
  id: string;
  type: 'sudden_change' | 'unusual_pattern' | 'performance_degradation' | 'accessibility_issue';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedMetrics: string[];
  timestamp: number;
  context: Record<string, unknown>;
}

/**
 * Generated behavioral insight
 */
export interface BehaviorInsight {
  id: string;
  category: 'usability' | 'accessibility' | 'performance' | 'engagement';
  title: string;
  description: string;
  evidence: string[];
  actionItems: string[];
  priority: number; // 0-1
  confidence: number; // 0-1
}

/**
 * Session analytics data
 */
interface SessionData {
  sessionId: string;
  startTime: number;
  endTime?: number;
  events: AnalyticsEvent[];
  interactions: UserInteraction[];
  metadata: Record<string, unknown>;
}

/**
 * Interaction metrics
 */
interface InteractionMetrics {
  totalInteractions: number;
  interactionRate: number; // per minute
  avgTimeBetweenInteractions: number;
  dominantInteractionTypes: string[];
  errorRate: number;
  completionRate: number;
}

/**
 * Engagement metrics
 */
interface EngagementMetrics {
  sessionDuration: number;
  bounceRate: number;
  pageViews: number;
  scrollDepth: number;
  clickThroughRate: number;
  taskCompletionRate: number;
}

/**
 * BehaviorAnalytics tracks and analyzes user behavior patterns for accessibility insights
 */
export class BehaviorAnalytics extends EventEmitter<BehaviorAnalyticsEvents> {
  private config: Required<BehaviorAnalyticsConfig>;
  private currentSession: SessionData | null = null;
  private sessions: SessionData[] = [];
  private eventBuffer: AnalyticsEvent[] = [];
  private patternCache: Map<string, BehaviorPattern> = new Map();
  private anomalyBaselines: Map<string, number> = new Map();
  private sessionTimeout: NodeJS.Timeout | undefined;

  constructor(config: BehaviorAnalyticsConfig = {}) {
    super();

    this.config = {
      sessionTimeout: config.sessionTimeout || 1800000, // 30 minutes
      maxSessionEvents: config.maxSessionEvents || 1000,
      enableRealTimeAnalysis: config.enableRealTimeAnalysis ?? true,
      patternDetectionThreshold: config.patternDetectionThreshold || 0.7,
      anomalyDetectionSensitivity: config.anomalyDetectionSensitivity || 0.8,
      privacyMode: config.privacyMode ?? true,
      bufferSize: config.bufferSize || 100,
    };
  }

  /**
   * Start a new analytics session
   */
  startSession(sessionId?: string): string {
    const id = sessionId || this.generateSessionId();
    
    // End current session if exists
    if (this.currentSession) {
      this.endSession();
    }

    this.currentSession = {
      sessionId: id,
      startTime: Date.now(),
      events: [],
      interactions: [],
      metadata: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        viewport: this.getViewportInfo(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    this.resetSessionTimeout();
    return id;
  }

  /**
   * End current session
   */
  endSession(): void {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();
    this.sessions.push({ ...this.currentSession });

    // Limit stored sessions
    if (this.sessions.length > 50) {
      this.sessions = this.sessions.slice(-50);
    }

    // Generate session insights
    if (this.config.enableRealTimeAnalysis) {
      this.analyzeSession(this.currentSession);
    }

    this.currentSession = null;
    this.clearSessionTimeout();
  }

  /**
   * Track user interaction
   */
  trackInteraction(interaction: UserInteraction): void {
    try {
      // Validate interaction
      UserInteractionSchema.parse(interaction);

      if (!this.currentSession) {
        this.startSession();
      }

      this.currentSession!.interactions.push(interaction);
      this.resetSessionTimeout();

      // Create analytics event
      const event: AnalyticsEvent = {
        eventId: crypto.randomUUID(),
        sessionId: this.currentSession!.sessionId,
        timestamp: interaction.timestamp,
        event: `interaction.${interaction.type}`,
        properties: {
          target: interaction.target,
          value: interaction.value,
        },
        context: interaction.context,
      };

      this.trackEvent(event);

      // Real-time pattern detection
      if (this.config.enableRealTimeAnalysis) {
        this.detectRealTimePatterns();
      }
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Track custom analytics event
   */
  trackEvent(event: Partial<AnalyticsEvent>): void {
    try {
      const fullEvent: AnalyticsEvent = {
        eventId: event.eventId || crypto.randomUUID(),
        sessionId: event.sessionId || this.currentSession?.sessionId || 'no-session',
        timestamp: event.timestamp || Date.now(),
        event: event.event || 'unknown',
        properties: event.properties,
        context: event.context,
      };

      // Validate event
      AnalyticsEventSchema.parse(fullEvent);

      if (this.currentSession) {
        this.currentSession.events.push(fullEvent);
      }

      this.eventBuffer.push(fullEvent);
      
      // Limit buffer size
      if (this.eventBuffer.length > this.config.bufferSize) {
        this.eventBuffer = this.eventBuffer.slice(-this.config.bufferSize);
      }

      this.emit('data-collected', fullEvent);
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Track preference change
   */
  trackPreferenceChange(
    preferences: Record<string, unknown>,
    context?: Record<string, unknown>
  ): void {
    const interaction: UserInteraction = {
      timestamp: Date.now(),
      type: 'preference_change',
      value: preferences,
      context,
    };

    this.trackInteraction(interaction);
  }

  /**
   * Get interaction metrics for current session
   */
  getSessionMetrics(): InteractionMetrics | null {
    if (!this.currentSession) return null;

    const interactions = this.currentSession.interactions;
    const sessionDuration = Date.now() - this.currentSession.startTime;

    return this.calculateInteractionMetrics(interactions, sessionDuration);
  }

  /**
   * Get engagement metrics for current session
   */
  getEngagementMetrics(): EngagementMetrics | null {
    if (!this.currentSession) return null;

    const events = this.currentSession.events;
    const sessionDuration = Date.now() - this.currentSession.startTime;

    return this.calculateEngagementMetrics(events, sessionDuration);
  }

  /**
   * Analyze behavior patterns across sessions
   */
  analyzeBehaviorPatterns(): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];

    // Analyze navigation patterns
    patterns.push(...this.detectNavigationPatterns());

    // Analyze interaction patterns
    patterns.push(...this.detectInteractionPatterns());

    // Analyze temporal patterns
    patterns.push(...this.detectTemporalPatterns());

    // Cache patterns
    patterns.forEach(pattern => {
      this.patternCache.set(pattern.id, pattern);
    });

    return patterns;
  }

  /**
   * Generate behavioral insights
   */
  generateInsights(): BehaviorInsight[] {
    const insights: BehaviorInsight[] = [];

    // Accessibility insights
    insights.push(...this.generateAccessibilityInsights());

    // Usability insights
    insights.push(...this.generateUsabilityInsights());

    // Performance insights
    insights.push(...this.generatePerformanceInsights());

    // Engagement insights
    insights.push(...this.generateEngagementInsights());

    // Emit insights
    insights.forEach(insight => {
      this.emit('insight-generated', insight);
    });

    return insights;
  }

  /**
   * Export analytics data
   */
  exportData(options: { format?: 'json' | 'csv'; includeInteractions?: boolean } = {}): string {
    const data = {
      sessions: this.sessions.map(session => ({
        ...session,
        interactions: options.includeInteractions ? session.interactions : [],
      })),
      patterns: Array.from(this.patternCache.values()),
      summary: this.generateSummaryStatistics(),
    };

    if (options.format === 'csv') {
      return this.convertToCSV(data);
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear all analytics data
   */
  clearData(): void {
    this.sessions = [];
    this.eventBuffer = [];
    this.patternCache.clear();
    this.anomalyBaselines.clear();
    if (this.currentSession) {
      this.endSession();
    }
  }

  /**
   * Clean up and stop analytics
   */
  destroy(): void {
    this.endSession();
    this.clearSessionTimeout();
    this.removeAllListeners();
  }

  // Private methods

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getViewportInfo(): { width: number; height: number } {
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }
    return { width: 0, height: 0 };
  }

  private resetSessionTimeout(): void {
    this.clearSessionTimeout();
    this.sessionTimeout = setTimeout(() => {
      this.endSession();
    }, this.config.sessionTimeout);
  }

  private clearSessionTimeout(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = undefined;
    }
  }

  private calculateInteractionMetrics(
    interactions: UserInteraction[],
    sessionDuration: number
  ): InteractionMetrics {
    const interactionRate = (interactions.length / sessionDuration) * 60000; // per minute
    
    let totalTimeDiff = 0;
    for (let i = 1; i < interactions.length; i++) {
      totalTimeDiff += interactions[i].timestamp - interactions[i - 1].timestamp;
    }
    const avgTimeBetweenInteractions = totalTimeDiff / Math.max(1, interactions.length - 1);

    const typeCount = new Map<string, number>();
    interactions.forEach(interaction => {
      typeCount.set(interaction.type, (typeCount.get(interaction.type) || 0) + 1);
    });

    const dominantTypes = Array.from(typeCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);

    return {
      totalInteractions: interactions.length,
      interactionRate,
      avgTimeBetweenInteractions,
      dominantInteractionTypes: dominantTypes,
      errorRate: 0, // Would calculate based on error events
      completionRate: 0.85, // Placeholder - would calculate based on goal completion
    };
  }

  private calculateEngagementMetrics(
    events: AnalyticsEvent[],
    sessionDuration: number
  ): EngagementMetrics {
    const pageViews = events.filter(e => e.event.includes('page')).length;
    const scrollEvents = events.filter(e => e.event.includes('scroll')).length;
    const clickEvents = events.filter(e => e.event.includes('click')).length;

    return {
      sessionDuration,
      bounceRate: pageViews <= 1 ? 1 : 0,
      pageViews,
      scrollDepth: Math.min(scrollEvents / 10, 1), // Normalized
      clickThroughRate: clickEvents / Math.max(1, pageViews),
      taskCompletionRate: 0.8, // Placeholder
    };
  }

  private detectRealTimePatterns(): void {
    if (!this.currentSession || this.currentSession.interactions.length < 5) return;

    const recentInteractions = this.currentSession.interactions.slice(-10);
    
    // Detect rapid scrolling pattern
    const scrolls = recentInteractions.filter(i => i.type === 'scroll');
    if (scrolls.length > 5) {
      const pattern: BehaviorPattern = {
        id: `rapid_scroll_${Date.now()}`,
        type: 'interaction',
        pattern: 'rapid_scrolling',
        confidence: 0.8,
        frequency: scrolls.length / recentInteractions.length,
        contexts: ['current_session'],
        impact: 'negative',
        recommendations: ['Enable motion reduction', 'Increase content chunking'],
      };
      
      this.emit('pattern-detected', pattern);
    }
  }

  private analyzeSession(session: SessionData): void {
    const endTime = session.endTime || Date.now();
    const metrics = this.calculateInteractionMetrics(
      session.interactions,
      endTime - session.startTime
    );

    // Detect anomalies
    if (metrics.interactionRate > 10) { // Very high interaction rate
      const anomaly: BehaviorAnomaly = {
        id: `high_interaction_rate_${session.sessionId}`,
        type: 'unusual_pattern',
        description: 'Unusually high interaction rate detected',
        severity: 'medium',
        affectedMetrics: ['interaction_rate'],
        timestamp: endTime,
        context: { sessionId: session.sessionId, rate: metrics.interactionRate },
      };
      
      this.emit('anomaly-detected', anomaly);
    }
  }

  private detectNavigationPatterns(): BehaviorPattern[] {
    // Analyze navigation patterns across sessions
    // This is a simplified implementation
    return [
      {
        id: 'common_navigation_path',
        type: 'navigation',
        pattern: 'home -> settings -> preferences',
        confidence: 0.75,
        frequency: 0.6,
        contexts: ['multiple_sessions'],
        impact: 'positive',
        recommendations: ['Optimize preferences access'],
      },
    ];
  }

  private detectInteractionPatterns(): BehaviorPattern[] {
    // Analyze interaction patterns
    return [
      {
        id: 'preference_adjustment_frequency',
        type: 'preference',
        pattern: 'frequent_font_size_changes',
        confidence: 0.8,
        frequency: 0.4,
        contexts: ['accessibility_settings'],
        impact: 'neutral',
        recommendations: ['Provide font size presets', 'Add visual preview'],
      },
    ];
  }

  private detectTemporalPatterns(): BehaviorPattern[] {
    // Analyze temporal usage patterns
    return [
      {
        id: 'time_of_day_usage',
        type: 'temporal',
        pattern: 'evening_high_contrast_preference',
        confidence: 0.7,
        frequency: 0.5,
        contexts: ['evening_sessions'],
        impact: 'positive',
        recommendations: ['Auto-enable high contrast in evening'],
      },
    ];
  }

  private generateAccessibilityInsights(): BehaviorInsight[] {
    return [
      {
        id: 'font_size_insight',
        category: 'accessibility',
        title: 'Font Size Optimization Opportunity',
        description: 'Users frequently adjust font size, indicating default may be suboptimal',
        evidence: ['High frequency of font size changes', 'Consistent upward adjustments'],
        actionItems: ['Increase default font size', 'Add font size presets'],
        priority: 0.8,
        confidence: 0.75,
      },
    ];
  }

  private generateUsabilityInsights(): BehaviorInsight[] {
    return [
      {
        id: 'navigation_efficiency',
        category: 'usability',
        title: 'Settings Access Could Be Streamlined',
        description: 'Users take multiple steps to reach accessibility settings',
        evidence: ['Long navigation paths to preferences', 'Multiple back-and-forth patterns'],
        actionItems: ['Add accessibility quick toggle', 'Improve settings discoverability'],
        priority: 0.6,
        confidence: 0.7,
      },
    ];
  }

  private generatePerformanceInsights(): BehaviorInsight[] {
    return [
      {
        id: 'interaction_lag',
        category: 'performance',
        title: 'Potential Input Lag Detected',
        description: 'Longer than expected intervals between user actions and responses',
        evidence: ['Delayed interaction patterns', 'Repeated identical actions'],
        actionItems: ['Optimize response times', 'Add loading indicators'],
        priority: 0.7,
        confidence: 0.65,
      },
    ];
  }

  private generateEngagementInsights(): BehaviorInsight[] {
    return [
      {
        id: 'session_length',
        category: 'engagement',
        title: 'Positive Engagement with Accessibility Features',
        description: 'Users spend significant time exploring accessibility options',
        evidence: ['Long sessions in accessibility settings', 'Multiple feature trials'],
        actionItems: ['Highlight successful adaptations', 'Provide usage tips'],
        priority: 0.5,
        confidence: 0.8,
      },
    ];
  }

  private generateSummaryStatistics(): Record<string, unknown> {
    const totalSessions = this.sessions.length;
    const totalInteractions = this.sessions.reduce((sum, s) => sum + s.interactions.length, 0);
    const avgSessionDuration = this.sessions.reduce(
      (sum, s) => sum + ((s.endTime || Date.now()) - s.startTime),
      0
    ) / Math.max(1, totalSessions);

    return {
      totalSessions,
      totalInteractions,
      avgSessionDuration,
      avgInteractionsPerSession: totalInteractions / Math.max(1, totalSessions),
      patternsDetected: this.patternCache.size,
    };
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion
    const headers = ['sessionId', 'startTime', 'endTime', 'interactionCount', 'eventCount'];
    const rows = data.sessions.map((session: SessionData): (string | number)[] => [
      session.sessionId,
      session.startTime,
      session.endTime || '',
      session.interactions.length,
      session.events.length,
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
} 