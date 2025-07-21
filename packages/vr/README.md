# @neuroadapt/vr

WebXR safe spaces and comfort zones for the NeuroAdapt SDK. This package provides VR safety features designed specifically for neurodiverse users.

## Features

- **Safe Zone Management**: Create and manage spatial safety boundaries
- **Proximity Detection**: Real-time collision prediction and warning system
- **Comfort Settings**: Configurable locomotion and interaction preferences
- **Panic Mode**: Emergency safe space activation
- **Accessibility First**: Designed for neurodiverse users with sensory sensitivities

## Installation

```bash
npm install @neuroadapt/vr
```

## Quick Start

### Basic Safe Zone Setup

```typescript
import { SafeZoneManager } from '@neuroadapt/vr';

// Configure VR preferences
const preferences = {
  comfortRadius: 1.5,
  safeSpaceEnabled: true,
  locomotionType: 'teleport',
  personalSpace: 0.8,
  panicButtonEnabled: true,
  snapTurning: true,
  tunnelVision: false,
  floorGrid: true
};

// Initialize manager
const safeZoneManager = new SafeZoneManager(preferences);

// Listen for proximity events
safeZoneManager.on('zone-entered', (event) => {
  console.log('Entered safe zone:', event.zone.id);
});

safeZoneManager.on('proximity-warning', (event) => {
  console.log('Approaching zone:', event.distance);
});

// Update user position (typically from VR tracking)
safeZoneManager.updateUserPosition({ x: 0, y: 1.6, z: 0 });
```

### Proximity Detection

```typescript
import { ProximityDetector } from '@neuroadapt/vr';

const detector = new ProximityDetector({
  updateInterval: 16, // 60fps
  warningThreshold: 0.5, // 50cm warning
  criticalThreshold: 0.2, // 20cm critical
  smoothingFactor: 0.8,
  predictionTime: 0.5 // 500ms prediction
});

detector.start();

// Update position with controllers
detector.updatePosition(
  { x: 0, y: 1.6, z: 0 }, // head position
  [
    { // left controller
      id: 'left',
      position: { x: -0.3, y: 1.2, z: -0.2 },
      rotation: { x: 0, y: 0, z: 0 },
      buttons: {},
      axes: [],
      connected: true
    }
  ]
);

// Check proximity to zones
const events = detector.checkProximity(safeZoneManager.getZones());
events.forEach(event => {
  console.log('Proximity event:', event.type, event.distance);
});
```

## API Reference

### SafeZoneManager

Main class for managing spatial safety boundaries in VR.

#### Constructor

```typescript
constructor(preferences: VRPreferences)
```

#### Methods

##### Zone Creation
- `createSafeZone(config: SafeZoneConfig): SafeZone`: Create a custom safe zone
- `createComfortZone(center?: Vector3D, radius?: number): SafeZone`: Create comfort zone
- `createPersonalSpace(center?: Vector3D): SafeZone`: Create personal space bubble

##### Zone Management
- `removeSafeZone(id: string): boolean`: Remove a safe zone
- `updateZone(id: string, updates: Partial<SafeZone>): boolean`: Update zone properties
- `getZones(): SafeZone[]`: Get all zones
- `getZone(id: string): SafeZone | undefined`: Get specific zone

##### Position Tracking
- `updateUserPosition(position: Vector3D): void`: Update user position
- `getCurrentPosition(): Vector3D`: Get current position

##### Emergency Features
- `activatePanicMode(): void`: Create emergency safe zone

##### Configuration
- `updatePreferences(preferences: VRPreferences): void`: Update user preferences

#### Events

- `zone-entered`: User entered a safe zone
- `zone-exited`: User exited a safe zone
- `proximity-warning`: User approaching zone boundary
- `panic-activated`: Emergency panic mode activated
- `safe-zone-created`: New safe zone created
- `safe-zone-removed`: Safe zone removed

### ProximityDetector

Advanced proximity detection with collision prediction.

#### Constructor Options

```typescript
interface ProximityDetectorOptions {
  updateInterval: number; // milliseconds between updates
  warningThreshold: number; // warning distance in meters
  criticalThreshold: number; // critical distance in meters
  smoothingFactor: number; // velocity smoothing (0-1)
  predictionTime: number; // collision prediction time in seconds
}
```

#### Methods

- `start(): void`: Start proximity monitoring
- `stop(): void`: Stop proximity monitoring
- `updatePosition(position: Vector3D, controllers?: VRControllerState[]): void`: Update tracking
- `checkProximity(zones: SafeZone[]): ProximityEvent[]`: Check proximity to zones
- `getVelocity(): Vector3D`: Get current velocity
- `getSpeed(): number`: Get current speed
- `isMoving(threshold?: number): boolean`: Check if user is moving
- `dispose(): void`: Clean up resources

## Types

### Core Types

```typescript
interface VRPreferences {
  comfortRadius: number;
  safeSpaceEnabled: boolean;
  locomotionType: 'teleport' | 'smooth' | 'comfort';
  personalSpace: number;
  panicButtonEnabled: boolean;
  snapTurning: boolean;
  tunnelVision: boolean;
  floorGrid: boolean;
}

interface SafeZone {
  id: string;
  center: Vector3D;
  radius: number;
  shape: 'sphere' | 'cylinder' | 'box';
  dimensions?: Vector3D;
  isActive: boolean;
  visualIndicator: boolean;
  hapticFeedback: boolean;
}

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

interface ProximityEvent {
  type: 'enter' | 'exit' | 'warning';
  zone: SafeZone;
  distance: number;
  timestamp: number;
}
```

## Usage Examples

### Custom Safe Zones

```typescript
// Create different shaped safe zones
const sphereZone = safeZoneManager.createSafeZone({
  center: { x: 0, y: 0, z: 0 },
  radius: 2.0,
  shape: 'sphere',
  isActive: true,
  visualIndicator: true,
  hapticFeedback: true
});

const boxZone = safeZoneManager.createSafeZone({
  center: { x: 5, y: 0, z: 0 },
  radius: 1.0, // Used for proximity calculations
  shape: 'box',
  dimensions: { x: 3, y: 2, z: 3 },
  isActive: true,
  visualIndicator: false,
  hapticFeedback: true
});

const cylinderZone = safeZoneManager.createSafeZone({
  center: { x: -3, y: 0, z: 2 },
  radius: 1.5,
  shape: 'cylinder',
  dimensions: { x: 0, y: 3, z: 0 }, // height = y dimension
  isActive: true,
  visualIndicator: true,
  hapticFeedback: false
});
```

### Comfort Settings Integration

```typescript
interface ComfortSettings {
  snapTurnAngle: number;
  movementSpeed: number;
  maxAcceleration: number;
  vignettingStrength: number;
  stabilizationLevel: number;
}

// Listen for comfort settings changes
safeZoneManager.on('comfort-settings-changed', (settings: ComfortSettings) => {
  // Apply settings to VR locomotion system
  vrLocomotion.setSnapTurnAngle(settings.snapTurnAngle);
  vrLocomotion.setMovementSpeed(settings.movementSpeed);
  vrRenderer.setVignettingStrength(settings.vignettingStrength);
});
```

### Emergency Response System

```typescript
// Set up panic button handling
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && event.ctrlKey) {
    safeZoneManager.activatePanicMode();
  }
});

// VR controller panic button
vrController.on('buttondown', (event) => {
  if (event.buttonIndex === 5) { // Menu button
    safeZoneManager.activatePanicMode();
  }
});

// Handle panic activation
safeZoneManager.on('panic-activated', (event) => {
  // Immediate response
  vrRenderer.enableTunnelVision(true);
  vrAudio.playCalming();
  vrHaptics.stopAll();
  
  // Gradual comfort restoration
  setTimeout(() => {
    vrRenderer.enableTunnelVision(false);
    vrAudio.fadeOut();
  }, 30000);
});
```

### Predictive Collision Detection

```typescript
const detector = new ProximityDetector({
  predictionTime: 1.0, // 1 second ahead
  warningThreshold: 1.0 // 1 meter warning
});

detector.on('collision-predicted', (event) => {
  // Show visual warning
  vrUI.showWarning('Obstacle detected ahead');
  
  // Provide haptic feedback
  vrHaptics.playWarning();
  
  // Suggest alternative path
  const safePath = pathfinding.findAlternative(
    event.currentPosition,
    event.targetPosition,
    safeZoneManager.getZones()
  );
  
  vrUI.showPath(safePath);
});
```

## Accessibility Features

### Sensory Accommodations

- **Haptic Feedback Control**: Configurable vibration intensity
- **Visual Indicators**: High contrast zone boundaries
- **Audio Cues**: Spatial audio warnings and confirmations
- **Reduced Motion**: Smooth locomotion with comfort settings

### Cognitive Support

- **Predictable Interactions**: Consistent zone behavior
- **Clear Feedback**: Immediate response to user actions
- **Emergency Features**: Quick escape mechanisms
- **Customizable Preferences**: Adaptable to individual needs

### Motor Accessibility

- **Teleport Locomotion**: Alternative to smooth movement
- **Snap Turning**: Discrete rotation for comfort
- **Large Interaction Zones**: Forgiving spatial boundaries
- **Gesture Alternatives**: Multiple input methods

## Integration with WebXR

```typescript
// WebXR session setup with safe zones
navigator.xr?.requestSession('immersive-vr').then(session => {
  session.addEventListener('inputsourceschange', (event) => {
    // Update controller states for proximity detection
    const controllers = event.session.inputSources.map(source => ({
      id: source.handedness || 'unknown',
      position: getControllerPosition(source),
      rotation: getControllerRotation(source),
      buttons: getButtonStates(source),
      axes: getAxesStates(source),
      connected: true
    }));
    
    detector.updatePosition(getHeadPosition(), controllers);
  });
});
```

## Performance Considerations

- **Efficient Collision Detection**: Optimized spatial algorithms
- **Configurable Update Rates**: Balance between accuracy and performance
- **Memory Management**: Automatic cleanup of inactive zones
- **Predictive Algorithms**: Minimal computational overhead

## Browser Support

- **WebXR**: Required for VR functionality
- **WebGL**: For visual zone rendering
- **Modern JavaScript**: ES2020+ features
- **Spatial Tracking**: 6DOF head and controller tracking

## Contributing

See the main NeuroAdapt SDK [contributing guide](../../CONTRIBUTING.md).

## License

MIT - See [LICENSE](../../LICENSE) file. 