/**
 * Enterprise Package - SSO, Analytics, and Deployment Tools
 * @fileoverview Export enterprise features for large-scale accessibility management
 */

// SSO Integration
export { SSOManager } from './sso-integration';
export type {
  SSOProvider,
  SSOProviderConfig,
  AccessibilityClaimMapping,
  SSOUser,
  SSOSession,
  EnterprisePreferenceSync
} from './sso-integration';

// Analytics Dashboard
export { AnalyticsDashboard } from './analytics-dashboard';
export type {
  AccessibilityMetrics,
  UsageMetrics,
  ComplianceMetrics,
  PerformanceMetrics,
  DashboardWidget,
  WidgetConfig,
  DashboardReport,
  ReportSection,
  AlertRule
} from './analytics-dashboard';

// Deployment Tools
export { DeploymentManager } from './deployment-tools';
export type {
  DeploymentEnvironment,
  ScalingConfig,
  SecurityConfig,
  ComplianceRequirement,
  ConfigurationTemplate,
  DeploymentPlan,
  HealthCheck,
  NotificationConfig,
  MonitoringConfig
} from './deployment-tools'; 