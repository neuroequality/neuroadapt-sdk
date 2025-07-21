/**
 * Enterprise SSO Integration - Single Sign-On for accessibility preferences
 * @fileoverview Provides enterprise SSO integration with accessibility preference synchronization
 */

import { EventEmitter } from 'eventemitter3';
import type { Preferences } from '@neuroadapt/core';

export interface SSOProvider {
  name: string;
  type: 'saml' | 'oauth2' | 'oidc' | 'ldap' | 'active_directory';
  config: SSOProviderConfig;
  enabled: boolean;
}

export interface SSOProviderConfig {
  clientId?: string;
  clientSecret?: string;
  issuer?: string;
  authorizationURL?: string;
  tokenURL?: string;
  userInfoURL?: string;
  jwksURI?: string;
  redirectURI: string;
  scopes: string[];
  customClaims?: Record<string, string>;
  accessibilityClaimMapping?: AccessibilityClaimMapping;
}

export interface AccessibilityClaimMapping {
  preferencesClaim: string;
  roleClaim: string;
  departmentClaim: string;
  accessibilityNeedsClaim: string;
  accommodationsClaim: string;
}

export interface SSOUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  department?: string;
  accessibilityNeeds?: string[];
  accommodations?: string[];
  preferences?: Preferences;
  metadata?: Record<string, any>;
}

export interface SSOSession {
  sessionId: string;
  userId: string;
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: Date;
  scope: string[];
  provider: string;
}

export interface EnterprisePreferenceSync {
  enabled: boolean;
  bidirectional: boolean;
  syncInterval: number;
  conflictResolution: 'local' | 'remote' | 'merge' | 'ask_user';
  encryptionEnabled: boolean;
}

/**
 * Enterprise SSO Integration Manager
 */
export class SSOManager extends EventEmitter {
  private providers: Map<string, SSOProvider> = new Map();
  private activeSessions: Map<string, SSOSession> = new Map();
  private preferenceSync: EnterprisePreferenceSync;
  
  constructor(
    private config: {
      defaultProvider?: string;
      sessionTimeout: number;
      refreshThreshold: number;
      encryptionKey?: string;
      auditLogging: boolean;
    } = {
      sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
      refreshThreshold: 5 * 60 * 1000, // 5 minutes
      auditLogging: true
    }
  ) {
    super();
    
    this.preferenceSync = {
      enabled: true,
      bidirectional: false,
      syncInterval: 5 * 60 * 1000, // 5 minutes
      conflictResolution: 'merge',
      encryptionEnabled: true
    };
    
    this.initializeDefaultProviders();
    this.startSessionMonitoring();
  }

  /**
   * Add SSO provider configuration
   */
  addProvider(provider: SSOProvider): void {
    this.providers.set(provider.name, provider);
    this.emit('provider_added', provider);
    
    if (this.config.auditLogging) {
      this.logAuditEvent('provider_added', { providerName: provider.name, type: provider.type });
    }
  }

  /**
   * Remove SSO provider
   */
  removeProvider(providerName: string): void {
    const provider = this.providers.get(providerName);
    if (provider) {
      this.providers.delete(providerName);
      this.emit('provider_removed', provider);
      
      if (this.config.auditLogging) {
        this.logAuditEvent('provider_removed', { providerName });
      }
    }
  }

  /**
   * Initiate SSO authentication flow
   */
  async authenticate(providerName?: string): Promise<{ authUrl: string; state: string }> {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found or not enabled`);
    }

    const state = this.generateState();
    const authUrl = this.buildAuthorizationUrl(provider, state);

    this.emit('auth_initiated', { provider: provider.name, state });
    
    if (this.config.auditLogging) {
      this.logAuditEvent('auth_initiated', { providerName: provider.name });
    }

    return { authUrl, state };
  }

  /**
   * Handle SSO callback and complete authentication
   */
  async handleCallback(
    providerName: string, 
    authorizationCode: string, 
    state: string
  ): Promise<SSOSession> {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    // Validate state parameter
    if (!this.validateState(state)) {
      throw new Error('Invalid state parameter');
    }

    try {
      // Exchange authorization code for tokens
      const tokens = await this.exchangeCodeForTokens(provider, authorizationCode);
      
      // Get user information
      const userInfo = await this.getUserInfo(provider, tokens.access_token);
      
      // Map user information to SSOUser
      const user = this.mapUserInfo(provider, userInfo);
      
      // Create session
      const session: SSOSession = {
        sessionId: this.generateSessionId(),
        userId: user.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        idToken: tokens.id_token,
        expiresAt: new Date(Date.now() + (tokens.expires_in * 1000)),
        scope: tokens.scope?.split(' ') || [],
        provider: provider.name
      };

      this.activeSessions.set(session.sessionId, session);

      // Sync accessibility preferences if enabled
      if (this.preferenceSync.enabled && user.preferences) {
        await this.syncAccessibilityPreferences(user, session);
      }

      this.emit('auth_completed', { user, session });
      
      if (this.config.auditLogging) {
        this.logAuditEvent('auth_completed', { 
          userId: user.id, 
          provider: provider.name,
          sessionId: session.sessionId 
        });
      }

      return session;

    } catch (error) {
      this.emit('auth_error', { provider: provider.name, error });
      
      if (this.config.auditLogging) {
        this.logAuditEvent('auth_error', { 
          providerName: provider.name, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(sessionId: string): Promise<SSOSession> {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.refreshToken) {
      throw new Error('Session not found or refresh token not available');
    }

    const provider = this.getProvider(session.provider);
    if (!provider) {
      throw new Error(`Provider ${session.provider} not found`);
    }

    try {
      const tokens = await this.refreshAccessToken(provider, session.refreshToken);
      
      // Update session
      session.accessToken = tokens.access_token;
      session.expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));
      if (tokens.refresh_token) {
        session.refreshToken = tokens.refresh_token;
      }

      this.activeSessions.set(sessionId, session);
      this.emit('token_refreshed', session);

      return session;

    } catch (error) {
      this.emit('token_refresh_error', { sessionId, error });
      throw error;
    }
  }

  /**
   * Sign out user and cleanup session
   */
  async signOut(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return;
    }

    const provider = this.getProvider(session.provider);
    
    try {
      // Revoke tokens if supported
      if (provider && provider.config.tokenURL) {
        await this.revokeTokens(provider, session);
      }

      // Clear session
      this.activeSessions.delete(sessionId);
      this.emit('signed_out', { sessionId, userId: session.userId });
      
      if (this.config.auditLogging) {
        this.logAuditEvent('signed_out', { sessionId, userId: session.userId });
      }

    } catch (error) {
      this.emit('signout_error', { sessionId, error });
      throw error;
    }
  }

  /**
   * Get current user session
   */
  getSession(sessionId: string): SSOSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Validate session and check if token needs refresh
   */
  async validateSession(sessionId: string): Promise<{ valid: boolean; needsRefresh: boolean }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return { valid: false, needsRefresh: false };
    }

    const now = new Date();
    const timeUntilExpiry = session.expiresAt.getTime() - now.getTime();
    
    if (timeUntilExpiry <= 0) {
      // Token has expired
      return { valid: false, needsRefresh: true };
    }

    if (timeUntilExpiry <= this.config.refreshThreshold) {
      // Token needs refresh
      return { valid: true, needsRefresh: true };
    }

    return { valid: true, needsRefresh: false };
  }

  /**
   * Sync accessibility preferences with enterprise directory
   */
  async syncAccessibilityPreferences(
    user: SSOUser, 
    session: SSOSession, 
    direction: 'push' | 'pull' | 'bidirectional' = 'pull'
  ): Promise<void> {
    if (!this.preferenceSync.enabled) {
      return;
    }

    try {
      const provider = this.getProvider(session.provider);
      if (!provider?.config.accessibilityClaimMapping) {
        return;
      }

      if (direction === 'pull' || direction === 'bidirectional') {
        // Fetch latest preferences from enterprise directory
        const remotePreferences = await this.fetchRemotePreferences(provider, session);
        if (remotePreferences) {
          const mergedPreferences = this.mergePreferences(user.preferences, remotePreferences);
          user.preferences = mergedPreferences;
          this.emit('preferences_synced', { userId: user.id, direction: 'pull' });
        }
      }

      if (direction === 'push' || direction === 'bidirectional') {
        // Push local preferences to enterprise directory
        if (user.preferences) {
          await this.pushRemotePreferences(provider, session, user.preferences);
          this.emit('preferences_synced', { userId: user.id, direction: 'push' });
        }
      }

    } catch (error) {
      this.emit('preference_sync_error', { userId: user.id, error });
    }
  }

  /**
   * Configure preference synchronization
   */
  configurePreferenceSync(config: Partial<EnterprisePreferenceSync>): void {
    this.preferenceSync = { ...this.preferenceSync, ...config };
    this.emit('preference_sync_configured', this.preferenceSync);
  }

  /**
   * Get analytics data for enterprise dashboard
   */
  getAnalytics(): {
    totalSessions: number;
    activeSessions: number;
    authenticationsByProvider: Record<string, number>;
    preferencesSynced: number;
    averageSessionDuration: number;
  } {
    const activeSessions = this.activeSessions.size;
    const authenticationsByProvider: Record<string, number> = {};
    
    // Simulate analytics data
    for (const provider of this.providers.keys()) {
      authenticationsByProvider[provider] = Math.floor(Math.random() * 100);
    }

    return {
      totalSessions: activeSessions * 10, // Simulated
      activeSessions,
      authenticationsByProvider,
      preferencesSynced: Math.floor(Math.random() * 50),
      averageSessionDuration: 2.5 * 60 * 60 * 1000 // 2.5 hours in ms
    };
  }

  // Private helper methods
  private initializeDefaultProviders(): void {
    // Add common enterprise providers
    this.addProvider({
      name: 'azure_ad',
      type: 'oidc',
      config: {
        redirectURI: '/auth/callback/azure',
        scopes: ['openid', 'profile', 'email', 'accessibility_preferences'],
        customClaims: {
          'accessibility_needs': 'extension_AccessibilityNeeds',
          'accommodations': 'extension_Accommodations'
        }
      },
      enabled: false
    });

    this.addProvider({
      name: 'okta',
      type: 'oidc',
      config: {
        redirectURI: '/auth/callback/okta',
        scopes: ['openid', 'profile', 'email'],
        accessibilityClaimMapping: {
          preferencesClaim: 'accessibility_preferences',
          roleClaim: 'role',
          departmentClaim: 'department',
          accessibilityNeedsClaim: 'accessibility_needs',
          accommodationsClaim: 'accommodations'
        }
      },
      enabled: false
    });
  }

  private startSessionMonitoring(): void {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 1000); // Check every minute
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.expiresAt <= now) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      this.activeSessions.delete(sessionId);
      this.emit('session_expired', { sessionId });
    }
  }

  private getProvider(providerName?: string): SSOProvider | undefined {
    const name = providerName || this.config.defaultProvider;
    if (!name) {
      // Return first enabled provider
      for (const provider of this.providers.values()) {
        if (provider.enabled) {
          return provider;
        }
      }
      return undefined;
    }
    
    const provider = this.providers.get(name);
    return provider?.enabled ? provider : undefined;
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateSessionId(): string {
    return 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  private buildAuthorizationUrl(provider: SSOProvider, state: string): string {
    const params = new URLSearchParams({
      client_id: provider.config.clientId || '',
      response_type: 'code',
      scope: provider.config.scopes.join(' '),
      redirect_uri: provider.config.redirectURI,
      state
    });

    return `${provider.config.authorizationURL}?${params.toString()}`;
  }

  private validateState(state: string): boolean {
    // In a real implementation, you would validate against stored state
    return state.length > 10;
  }

  private async exchangeCodeForTokens(provider: SSOProvider, code: string): Promise<any> {
    // Simulate token exchange
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      access_token: 'access_token_' + Math.random().toString(36),
      refresh_token: 'refresh_token_' + Math.random().toString(36),
      id_token: 'id_token_' + Math.random().toString(36),
      expires_in: 3600,
      scope: provider.config.scopes.join(' ')
    };
  }

  private async getUserInfo(provider: SSOProvider, accessToken: string): Promise<any> {
    // Simulate user info retrieval
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return {
      sub: 'user_' + Math.random().toString(36).substring(2, 10),
      email: 'user@example.com',
      name: 'Enterprise User',
      role: ['user', 'accessibility_user'],
      department: 'Engineering',
      accessibility_needs: ['screen_reader', 'high_contrast'],
      accommodations: ['extended_time', 'reduced_motion']
    };
  }

  private mapUserInfo(provider: SSOProvider, userInfo: any): SSOUser {
    const mapping = provider.config.accessibilityClaimMapping;
    
    return {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      roles: Array.isArray(userInfo.role) ? userInfo.role : [userInfo.role].filter(Boolean),
      department: userInfo.department,
      accessibilityNeeds: userInfo.accessibility_needs || [],
      accommodations: userInfo.accommodations || [],
      preferences: this.parseAccessibilityPreferences(userInfo, mapping),
      metadata: userInfo
    };
  }

  private parseAccessibilityPreferences(userInfo: any, mapping?: AccessibilityClaimMapping): Preferences | undefined {
    if (!mapping || !userInfo[mapping.preferencesClaim]) {
      return undefined;
    }

    // Parse accessibility preferences from enterprise claims
    try {
      const prefsData = typeof userInfo[mapping.preferencesClaim] === 'string' 
        ? JSON.parse(userInfo[mapping.preferencesClaim])
        : userInfo[mapping.preferencesClaim];

      // Convert to standard Preferences format
      return {
        visual: {
          motionReduction: prefsData.motion_reduction || false,
          highContrast: prefsData.high_contrast || false,
          colorVisionFilter: prefsData.color_vision_filter || 'none',
          fontSize: prefsData.font_size || 16,
          reducedFlashing: prefsData.reduced_flashing || false,
          darkMode: prefsData.dark_mode || false
        },
        cognitive: {
          readingSpeed: prefsData.reading_speed || 'medium',
          explanationLevel: prefsData.explanation_level || 'detailed',
          processingPace: prefsData.processing_pace || 'standard',
          chunkSize: prefsData.chunk_size || 5,
          allowInterruptions: prefsData.allow_interruptions !== false,
          preferVisualCues: prefsData.prefer_visual_cues || false
        },
        motor: {
          keyboardNavigation: prefsData.keyboard_navigation || false,
          mouseAlternatives: prefsData.mouse_alternatives || false,
          gestureSimplification: prefsData.gesture_simplification || false,
          targetSizeIncrease: prefsData.target_size_increase || 1.0,
          dwellTime: prefsData.dwell_time || 1000,
          stickyKeys: prefsData.sticky_keys || false
        },
        audio: {
          enableAudio: prefsData.enable_audio !== false,
          volume: prefsData.volume || 0.8,
          enableCaptions: prefsData.enable_captions || false,
          audioDescription: prefsData.audio_description || false,
          reducedAudio: prefsData.reduced_audio || false
        },
        version: '1.1.0',
        lastUpdated: new Date(),
        metadata: {
          source: 'enterprise_sso',
          provider: 'enterprise'
        }
      };
    } catch (error) {
      return undefined;
    }
  }

  private async refreshAccessToken(provider: SSOProvider, refreshToken: string): Promise<any> {
    // Simulate token refresh
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      access_token: 'new_access_token_' + Math.random().toString(36),
      expires_in: 3600
    };
  }

  private async revokeTokens(provider: SSOProvider, session: SSOSession): Promise<void> {
    // Simulate token revocation
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  private async fetchRemotePreferences(provider: SSOProvider, session: SSOSession): Promise<Preferences | undefined> {
    // Simulate fetching preferences from enterprise directory
    await new Promise(resolve => setTimeout(resolve, 100));
    return undefined; // Would return actual preferences in real implementation
  }

  private async pushRemotePreferences(provider: SSOProvider, session: SSOSession, preferences: Preferences): Promise<void> {
    // Simulate pushing preferences to enterprise directory
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private mergePreferences(local?: Preferences, remote?: Preferences): Preferences | undefined {
    if (!local && !remote) return undefined;
    if (!local) return remote;
    if (!remote) return local;

    // Implement preference merging logic based on conflict resolution strategy
    switch (this.preferenceSync.conflictResolution) {
      case 'local':
        return local;
      case 'remote':
        return remote;
      case 'merge':
        return {
          ...remote,
          ...local,
          lastUpdated: new Date(),
          metadata: {
            ...remote.metadata,
            ...local.metadata,
            mergedFrom: 'enterprise_sync'
          }
        };
      default:
        return local;
    }
  }

  private logAuditEvent(event: string, data: any): void {
    const auditLog = {
      timestamp: new Date().toISOString(),
      event,
      data,
      source: 'sso_manager'
    };
    
    // In a real implementation, this would send to an audit logging service
    console.log('[AUDIT]', JSON.stringify(auditLog));
  }
}

export default SSOManager; 