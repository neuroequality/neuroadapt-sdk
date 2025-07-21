export * from './utils/mock-adapters.js';
export { AccessibilityTester, createAccessibilityTests } from './playwright/accessibility.js';

// WCAG Validation exports
export {
  WCAGValidator,
  validateNeuroAdaptComponent,
  validateAccessibilityWorkflow,
  createAccessibilityReport,
  type WCAGValidationResult,
  type WCAGViolation,
  type WCAGPass,
  type WCAGIncomplete,
  type WCAGNode,
  type WCAGSummary
} from './accessibility/wcag-validator.js';

// E2E Testing exports
export {
  NeuroAdaptTestRunner,
  createNeuroAdaptTest,
  createAccessibilityTestSuite,
  type NeuroAdaptTestOptions
} from './e2e/neuroadapt-test-runner.js';

export const VERSION = '1.1.0';