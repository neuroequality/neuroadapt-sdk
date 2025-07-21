export interface VRPreferences {
  comfortRadius: number;
  safeSpaceEnabled: boolean;
  locomotionType: 'teleport' | 'smooth' | 'comfort';
  personalSpace: number;
  panicButtonEnabled: boolean;
  snapTurning: boolean;
  tunnelVision: boolean;
  floorGrid: boolean;
}

export interface SafeZone {
  id: string;
  center: Vector3D;
  radius: number;
  shape: 'sphere' | 'cylinder' | 'box';
  dimensions?: Vector3D;
  isActive: boolean;
  visualIndicator: boolean;
  hapticFeedback: boolean;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface ProximityEvent {
  type: 'enter' | 'exit' | 'warning';
  zone: SafeZone;
  distance: number;
  timestamp: number;
}

export interface VRControllerState {
  id: string;
  position: Vector3D;
  rotation: Vector3D;
  buttons: Record<string, boolean>;
  axes: number[];
  connected: boolean;
}

export interface ComfortSettings {
  snapTurnAngle: number;
  movementSpeed: number;
  maxAcceleration: number;
  vignettingStrength: number;
  stabilizationLevel: number;
}

export interface SafeSpaceEvents {
  'zone-entered': ProximityEvent;
  'zone-exited': ProximityEvent;
  'proximity-warning': ProximityEvent;
  'panic-activated': { timestamp: number; position: Vector3D };
  'safe-zone-created': SafeZone;
  'safe-zone-removed': { id: string };
  'comfort-settings-changed': ComfortSettings;
}

export interface WebXRCapabilities {
  isSupported: boolean;
  hasPositionalTracking: boolean;
  hasHandTracking: boolean;
  hasEyeTracking: boolean;
  maxRenderWidth: number;
  maxRenderHeight: number;
  supportedFrameRates: number[];
}