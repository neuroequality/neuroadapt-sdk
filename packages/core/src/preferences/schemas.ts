import { z } from 'zod';

// Schema version for migrations
export const SCHEMA_VERSION = '1.1.0';

// Core sensory preferences
export const SensoryPreferencesSchema = z.object({
  motionReduction: z.boolean().default(false),
  highContrast: z.boolean().default(false),
  colorVisionFilter: z.enum(['none', 'protanopia', 'deuteranopia', 'tritanopia']).default('none'),
  fontSize: z.number().min(0.5).max(3.0).default(1.0),
  reducedFlashing: z.boolean().default(false),
  darkMode: z.boolean().default(false),
});

// Cognitive load preferences
export const CognitivePreferencesSchema = z.object({
  readingSpeed: z.enum(['slow', 'medium', 'fast']).default('medium'),
  explanationLevel: z.enum(['simple', 'detailed', 'expert']).default('detailed'),
  processingPace: z.enum(['relaxed', 'standard', 'quick']).default('standard'),
  chunkSize: z.number().min(1).max(10).default(5),
  allowInterruptions: z.boolean().default(true),
  preferVisualCues: z.boolean().default(false),
});

// AI interaction preferences
export const AIPreferencesSchema = z.object({
  tone: z.enum(['calm-supportive', 'neutral', 'enthusiastic', 'professional']).default('neutral'),
  responseLength: z.enum(['brief', 'standard', 'detailed']).default('standard'),
  consistencyLevel: z.enum(['adaptive', 'moderate', 'high']).default('moderate'),
  useAnalogies: z.boolean().default(true),
  allowUndo: z.boolean().default(true),
});

// VR/AR preferences
export const VRPreferencesSchema = z.object({
  comfortRadius: z.number().min(0.5).max(5.0).default(1.5),
  safeSpaceEnabled: z.boolean().default(true),
  locomotionType: z.enum(['teleport', 'smooth', 'comfort']).default('comfort'),
  personalSpace: z.number().min(0.5).max(3.0).default(1.0),
  panicButtonEnabled: z.boolean().default(true),
});

// Complete preferences schema
export const PreferencesSchema = z.object({
  schemaVersion: z.string().default(SCHEMA_VERSION),
  userId: z.string().optional(),
  profileName: z.string().optional(),
  lastModified: z.string().datetime().optional(),
  sensory: SensoryPreferencesSchema,
  cognitive: CognitivePreferencesSchema,
  ai: AIPreferencesSchema,
  vr: VRPreferencesSchema,
  metadata: z.record(z.unknown()).optional(),
});

// Type exports
export type SensoryPreferences = z.infer<typeof SensoryPreferencesSchema>;
export type CognitivePreferences = z.infer<typeof CognitivePreferencesSchema>;
export type AIPreferences = z.infer<typeof AIPreferencesSchema>;
export type VRPreferences = z.infer<typeof VRPreferencesSchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;

// Partial update schema for safe mutations
export const PreferencesUpdateSchema = PreferencesSchema.partial().omit({
  schemaVersion: true,
  lastModified: true,
});

export type PreferencesUpdate = z.infer<typeof PreferencesUpdateSchema>;

// Validation error type
export interface ValidationError {
  path: string[];
  message: string;
  code: string;
} 