import { EventEmitter } from 'eventemitter3';
import type { 
  SafeZone, 
  Vector3D, 
  ProximityEvent, 
  SafeSpaceEvents, 
  VRPreferences 
} from '../types/index.js';

export class SafeZoneManager extends EventEmitter<SafeSpaceEvents> {
  private zones = new Map<string, SafeZone>();
  private currentPosition: Vector3D = { x: 0, y: 0, z: 0 };
  private preferences: VRPreferences;
  private proximityCheckInterval: number | null = null;
  private lastWarnings = new Set<string>();

  constructor(preferences: VRPreferences) {
    super();
    this.preferences = preferences;
    this.startProximityMonitoring();
  }

  createSafeZone(config: Omit<SafeZone, 'id'>): SafeZone {
    const id = this.generateZoneId();
    const zone: SafeZone = {
      id,
      ...config
    };

    this.zones.set(id, zone);
    this.emit('safe-zone-created', zone);
    
    return zone;
  }

  removeSafeZone(id: string): boolean {
    const removed = this.zones.delete(id);
    if (removed) {
      this.emit('safe-zone-removed', { id });
      this.lastWarnings.delete(id);
    }
    return removed;
  }

  updateUserPosition(position: Vector3D): void {
    this.currentPosition = position;
    this.checkProximity();
  }

  createComfortZone(center: Vector3D = this.currentPosition, radius?: number): SafeZone {
    const comfortRadius = radius || this.preferences.comfortRadius;
    
    return this.createSafeZone({
      center,
      radius: comfortRadius,
      shape: 'sphere',
      isActive: true,
      visualIndicator: true,
      hapticFeedback: true
    });
  }

  createPersonalSpace(center: Vector3D = this.currentPosition): SafeZone {
    return this.createSafeZone({
      center,
      radius: this.preferences.personalSpace,
      shape: 'sphere',
      isActive: true,
      visualIndicator: false,
      hapticFeedback: true
    });
  }

  activatePanicMode(): void {
    if (!this.preferences.panicButtonEnabled) return;

    // Create immediate safe zone around user
    const panicZone = this.createSafeZone({
      center: this.currentPosition,
      radius: 2.0, // 2 meter radius
      shape: 'sphere',
      isActive: true,
      visualIndicator: true,
      hapticFeedback: true
    });

    this.emit('panic-activated', {
      timestamp: Date.now(),
      position: this.currentPosition
    });

    // Auto-remove panic zone after 30 seconds
    setTimeout(() => {
      this.removeSafeZone(panicZone.id);
    }, 30000);
  }

  private startProximityMonitoring(): void {
    // Check proximity every 100ms for responsive feedback
    this.proximityCheckInterval = window.setInterval(() => {
      this.checkProximity();
    }, 100);
  }

  private checkProximity(): void {
    for (const zone of this.zones.values()) {
      if (!zone.isActive) continue;

      const distance = this.calculateDistance(this.currentPosition, zone);
      const isInside = distance <= zone.radius;
      const isWarningZone = distance <= zone.radius * 1.2; // 20% buffer for warnings

      const wasWarning = this.lastWarnings.has(zone.id);

      if (isInside) {
        if (!wasWarning) {
          const event: ProximityEvent = {
            type: 'enter',
            zone,
            distance,
            timestamp: Date.now()
          };
          this.emit('zone-entered', event);
        }
        this.lastWarnings.add(zone.id);
      } else if (isWarningZone) {
        if (!wasWarning) {
          const event: ProximityEvent = {
            type: 'warning',
            zone,
            distance,
            timestamp: Date.now()
          };
          this.emit('proximity-warning', event);
        }
        this.lastWarnings.add(zone.id);
      } else {
        if (wasWarning) {
          const event: ProximityEvent = {
            type: 'exit',
            zone,
            distance,
            timestamp: Date.now()
          };
          this.emit('zone-exited', event);
          this.lastWarnings.delete(zone.id);
        }
      }
    }
  }

  private calculateDistance(pos1: Vector3D, zone: SafeZone): number {
    const dx = pos1.x - zone.center.x;
    const dy = pos1.y - zone.center.y;
    const dz = pos1.z - zone.center.z;

    switch (zone.shape) {
      case 'sphere':
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      case 'cylinder':
        // Distance from cylinder axis (Y-axis)
        const radialDistance = Math.sqrt(dx * dx + dz * dz);
        const heightDiff = Math.abs(dy);
        
        if (zone.dimensions) {
          if (heightDiff > zone.dimensions.y / 2) {
            return Math.max(radialDistance, heightDiff - zone.dimensions.y / 2);
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

  private generateZoneId(): string {
    return `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getZones(): SafeZone[] {
    return Array.from(this.zones.values());
  }

  getZone(id: string): SafeZone | undefined {
    return this.zones.get(id);
  }

  updateZone(id: string, updates: Partial<SafeZone>): boolean {
    const zone = this.zones.get(id);
    if (!zone) return false;

    Object.assign(zone, updates);
    return true;
  }

  updatePreferences(preferences: VRPreferences): void {
    this.preferences = preferences;
  }

  getCurrentPosition(): Vector3D {
    return { ...this.currentPosition };
  }

  dispose(): void {
    if (this.proximityCheckInterval) {
      clearInterval(this.proximityCheckInterval);
      this.proximityCheckInterval = null;
    }
    
    this.zones.clear();
    this.lastWarnings.clear();
    this.removeAllListeners();
  }
}