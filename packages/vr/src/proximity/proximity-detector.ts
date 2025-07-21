import { EventEmitter } from 'eventemitter3';
import type { 
  Vector3D, 
  SafeZone, 
  ProximityEvent, 
  VRControllerState, 
  SafeSpaceEvents 
} from '../types/index.js';

export interface ProximityDetectorOptions {
  updateInterval: number; // milliseconds
  warningThreshold: number; // meters
  criticalThreshold: number; // meters
  smoothingFactor: number; // 0-1, for position smoothing
  predictionTime: number; // seconds, for collision prediction
}

export class ProximityDetector extends EventEmitter<SafeSpaceEvents> {
  private options: ProximityDetectorOptions;
  private isActive = false;
  private updateInterval: number | null = null;
  private positionHistory: Array<{ position: Vector3D; timestamp: number }> = [];
  private velocitySmoothing: Vector3D = { x: 0, y: 0, z: 0 };
  private lastVelocity: Vector3D = { x: 0, y: 0, z: 0 };

  constructor(options: Partial<ProximityDetectorOptions> = {}) {
    super();
    
    this.options = {
      updateInterval: 16, // ~60fps
      warningThreshold: 0.5, // 50cm warning
      criticalThreshold: 0.2, // 20cm critical
      smoothingFactor: 0.8,
      predictionTime: 0.5, // 500ms prediction
      ...options
    };
  }

  start(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.updateInterval = window.setInterval(() => {
      this.update();
    }, this.options.updateInterval);
  }

  stop(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  updatePosition(position: Vector3D, controllers: VRControllerState[] = []): void {
    const timestamp = Date.now();
    
    // Add position to history
    this.positionHistory.push({ position: { ...position }, timestamp });
    
    // Limit history size for performance
    if (this.positionHistory.length > 30) {
      this.positionHistory.shift();
    }

    // Update velocity estimation
    this.updateVelocity();
    
    // Store for immediate use
    this.currentPosition = position;
    this.currentControllers = controllers;
  }

  private currentPosition: Vector3D = { x: 0, y: 0, z: 0 };
  private currentControllers: VRControllerState[] = [];

  private update(): void {
    // This method can be called for additional processing
    // Real-time proximity checking happens in checkProximity method
  }

  private updateVelocity(): void {
    if (this.positionHistory.length < 2) return;

    const latest = this.positionHistory[this.positionHistory.length - 1];
    const previous = this.positionHistory[this.positionHistory.length - 2];
    
    if (!latest || !previous) return;
    
    const deltaTime = (latest.timestamp - previous.timestamp) / 1000; // seconds
    
    if (deltaTime <= 0) return;

    const instantVelocity: Vector3D = {
      x: (latest.position.x - previous.position.x) / deltaTime,
      y: (latest.position.y - previous.position.y) / deltaTime,
      z: (latest.position.z - previous.position.z) / deltaTime
    };

    // Apply smoothing
    this.lastVelocity = {
      x: this.options.smoothingFactor * this.lastVelocity.x + (1 - this.options.smoothingFactor) * instantVelocity.x,
      y: this.options.smoothingFactor * this.lastVelocity.y + (1 - this.options.smoothingFactor) * instantVelocity.y,
      z: this.options.smoothingFactor * this.lastVelocity.z + (1 - this.options.smoothingFactor) * instantVelocity.z
    };
  }

  checkProximity(zones: SafeZone[]): ProximityEvent[] {
    const events: ProximityEvent[] = [];
    
    for (const zone of zones) {
      if (!zone.isActive) continue;

      // Check current position
      const currentDistance = this.calculateDistance(this.currentPosition, zone);
      const currentEvent = this.evaluateProximity(zone, currentDistance);
      
      if (currentEvent) {
        events.push(currentEvent);
      }

      // Predictive collision detection
      const predictedPosition = this.predictFuturePosition(this.options.predictionTime);
      const predictedDistance = this.calculateDistance(predictedPosition, zone);
      
      if (predictedDistance < zone.radius && currentDistance > zone.radius) {
        // Collision predicted
        const warningEvent: ProximityEvent = {
          type: 'warning',
          zone,
          distance: predictedDistance,
          timestamp: Date.now()
        };
        events.push(warningEvent);
      }

      // Check controllers
      for (const controller of this.currentControllers) {
        if (!controller.connected) continue;
        
        const controllerDistance = this.calculateDistance(controller.position, zone);
        const controllerEvent = this.evaluateProximity(zone, controllerDistance);
        
        if (controllerEvent) {
          events.push({
            ...controllerEvent,
            // Add controller ID to event data if needed
          });
        }
      }
    }

    return events;
  }

  private evaluateProximity(zone: SafeZone, distance: number): ProximityEvent | null {
    const timestamp = Date.now();

    if (distance <= zone.radius) {
      return {
        type: 'enter',
        zone,
        distance,
        timestamp
      };
    } else if (distance <= zone.radius + this.options.warningThreshold) {
      return {
        type: 'warning',
        zone,
        distance,
        timestamp
      };
    }

    return null;
  }

  private calculateDistance(position: Vector3D, zone: SafeZone): number {
    const dx = position.x - zone.center.x;
    const dy = position.y - zone.center.y;
    const dz = position.z - zone.center.z;

    switch (zone.shape) {
      case 'sphere':
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      case 'cylinder':
        const radialDistance = Math.sqrt(dx * dx + dz * dz);
        const heightDiff = Math.abs(dy);
        
        if (zone.dimensions) {
          const halfHeight = zone.dimensions.y / 2;
          if (heightDiff > halfHeight) {
            return Math.sqrt(radialDistance * radialDistance + (heightDiff - halfHeight) ** 2);
          }
        }
        return radialDistance;
      
      case 'box':
        if (!zone.dimensions) return Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        const halfWidth = zone.dimensions.x / 2;
        const halfHeight = zone.dimensions.y / 2;
        const halfDepth = zone.dimensions.z / 2;
        
        const distX = Math.max(0, Math.abs(dx) - halfWidth);
        const distY = Math.max(0, Math.abs(dy) - halfHeight);
        const distZ = Math.max(0, Math.abs(dz) - halfDepth);
        
        return Math.sqrt(distX * distX + distY * distY + distZ * distZ);
      
      default:
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
  }

  private predictFuturePosition(timeAhead: number): Vector3D {
    return {
      x: this.currentPosition.x + this.lastVelocity.x * timeAhead,
      y: this.currentPosition.y + this.lastVelocity.y * timeAhead,
      z: this.currentPosition.z + this.lastVelocity.z * timeAhead
    };
  }

  getVelocity(): Vector3D {
    return { ...this.lastVelocity };
  }

  getSpeed(): number {
    const vel = this.lastVelocity;
    return Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
  }

  isMoving(threshold = 0.1): boolean {
    return this.getSpeed() > threshold;
  }

  getPositionHistory(): Array<{ position: Vector3D; timestamp: number }> {
    return [...this.positionHistory];
  }

  dispose(): void {
    this.stop();
    this.positionHistory = [];
    this.removeAllListeners();
  }
} 