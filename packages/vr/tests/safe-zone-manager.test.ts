import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SafeZoneManager } from '../src/safe-spaces/safe-zone-manager.js';
import type { VRPreferences, Vector3D, SafeZone } from '../src/types/index.js';

describe('SafeZoneManager', () => {
  let manager: SafeZoneManager;
  let mockPreferences: VRPreferences;

  beforeEach(() => {
    mockPreferences = {
      comfortRadius: 1.5,
      safeSpaceEnabled: true,
      locomotionType: 'teleport',
      personalSpace: 0.8,
      panicButtonEnabled: true,
      snapTurning: true,
      tunnelVision: false,
      floorGrid: true
    };

    manager = new SafeZoneManager(mockPreferences);
  });

  afterEach(() => {
    manager.dispose();
  });

  describe('Zone Creation', () => {
    it('should create a safe zone with generated ID', () => {
      const zone = manager.createSafeZone({
        center: { x: 0, y: 0, z: 0 },
        radius: 1.0,
        shape: 'sphere',
        isActive: true,
        visualIndicator: true,
        hapticFeedback: false
      });

      expect(zone.id).toBeDefined();
      expect(zone.center).toEqual({ x: 0, y: 0, z: 0 });
      expect(zone.radius).toBe(1.0);
      expect(zone.shape).toBe('sphere');
    });

    it('should emit safe-zone-created event', () => {
      const createdSpy = vi.fn();
      manager.on('safe-zone-created', createdSpy);

      const zone = manager.createSafeZone({
        center: { x: 1, y: 1, z: 1 },
        radius: 2.0,
        shape: 'cylinder',
        isActive: true,
        visualIndicator: false,
        hapticFeedback: true
      });

      expect(createdSpy).toHaveBeenCalledOnce();
      expect(createdSpy).toHaveBeenCalledWith(zone);
    });

    it('should create comfort zone with preferences', () => {
      const center: Vector3D = { x: 1, y: 0, z: 1 };
      const zone = manager.createComfortZone(center);

      expect(zone.center).toEqual(center);
      expect(zone.radius).toBe(mockPreferences.comfortRadius);
      expect(zone.shape).toBe('sphere');
      expect(zone.isActive).toBe(true);
    });

    it('should create personal space zone', () => {
      const center: Vector3D = { x: 2, y: 1, z: 2 };
      const zone = manager.createPersonalSpace(center);

      expect(zone.center).toEqual(center);
      expect(zone.radius).toBe(mockPreferences.personalSpace);
      expect(zone.shape).toBe('sphere');
      expect(zone.visualIndicator).toBe(false);
      expect(zone.hapticFeedback).toBe(true);
    });
  });

  describe('Zone Management', () => {
    it('should remove safe zone and emit event', () => {
      const zone = manager.createSafeZone({
        center: { x: 0, y: 0, z: 0 },
        radius: 1.0,
        shape: 'sphere',
        isActive: true,
        visualIndicator: true,
        hapticFeedback: false
      });

      const removedSpy = vi.fn();
      manager.on('safe-zone-removed', removedSpy);

      const removed = manager.removeSafeZone(zone.id);

      expect(removed).toBe(true);
      expect(removedSpy).toHaveBeenCalledWith({ id: zone.id });
      expect(manager.getZone(zone.id)).toBeUndefined();
    });

    it('should return false when removing non-existent zone', () => {
      const removed = manager.removeSafeZone('non-existent-id');
      expect(removed).toBe(false);
    });

    it('should update zone properties', () => {
      const zone = manager.createSafeZone({
        center: { x: 0, y: 0, z: 0 },
        radius: 1.0,
        shape: 'sphere',
        isActive: true,
        visualIndicator: true,
        hapticFeedback: false
      });

      const updated = manager.updateZone(zone.id, { radius: 2.0, isActive: false });
      expect(updated).toBe(true);

      const updatedZone = manager.getZone(zone.id);
      expect(updatedZone?.radius).toBe(2.0);
      expect(updatedZone?.isActive).toBe(false);
    });
  });

  describe('Proximity Detection', () => {
    let zone: SafeZone;

    beforeEach(() => {
      zone = manager.createSafeZone({
        center: { x: 0, y: 0, z: 0 },
        radius: 1.0,
        shape: 'sphere',
        isActive: true,
        visualIndicator: true,
        hapticFeedback: true
      });
    });

    it('should emit zone-entered event when entering zone', async () => {
      const enteredSpy = vi.fn();
      manager.on('zone-entered', enteredSpy);

      manager.updateUserPosition({ x: 0.5, y: 0, z: 0 });

      // Wait for proximity check
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(enteredSpy).toHaveBeenCalled();
      const eventData = enteredSpy.mock.calls[0][0];
      expect(eventData.type).toBe('enter');
      expect(eventData.zone.id).toBe(zone.id);
    });

    it('should emit proximity-warning event when approaching zone', async () => {
      const warningSpy = vi.fn();
      manager.on('proximity-warning', warningSpy);

      // Position just outside warning zone (radius * 1.2)
      manager.updateUserPosition({ x: 1.1, y: 0, z: 0 });

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(warningSpy).toHaveBeenCalled();
      const eventData = warningSpy.mock.calls[0][0];
      expect(eventData.type).toBe('warning');
    });

    it('should emit zone-exited event when leaving zone', async () => {
      const exitedSpy = vi.fn();
      manager.on('zone-exited', exitedSpy);

      // Enter zone first
      manager.updateUserPosition({ x: 0.5, y: 0, z: 0 });
      await new Promise(resolve => setTimeout(resolve, 150));

      // Exit zone
      manager.updateUserPosition({ x: 2.0, y: 0, z: 0 });
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(exitedSpy).toHaveBeenCalled();
      const eventData = exitedSpy.mock.calls[0][0];
      expect(eventData.type).toBe('exit');
    });

    it('should calculate distance correctly for different shapes', () => {
      const sphereZone = manager.createSafeZone({
        center: { x: 0, y: 0, z: 0 },
        radius: 1.0,
        shape: 'sphere',
        isActive: true,
        visualIndicator: true,
        hapticFeedback: false
      });

      const boxZone = manager.createSafeZone({
        center: { x: 5, y: 0, z: 0 },
        radius: 1.0,
        shape: 'box',
        dimensions: { x: 2, y: 2, z: 2 },
        isActive: true,
        visualIndicator: true,
        hapticFeedback: false
      });

      // Test positions relative to zones
      manager.updateUserPosition({ x: 0.5, y: 0, z: 0 }); // Inside sphere
      manager.updateUserPosition({ x: 5, y: 0, z: 0 }); // Inside box
    });
  });

  describe('Panic Mode', () => {
    it('should create panic zone when activated', () => {
      const panicSpy = vi.fn();
      manager.on('panic-activated', panicSpy);

      manager.updateUserPosition({ x: 1, y: 1, z: 1 });
      manager.activatePanicMode();

      expect(panicSpy).toHaveBeenCalled();
      const eventData = panicSpy.mock.calls[0][0];
      expect(eventData.position).toEqual({ x: 1, y: 1, z: 1 });
      expect(eventData.timestamp).toBeTypeOf('number');

      const zones = manager.getZones();
      const panicZone = zones.find(zone => zone.radius === 2.0);
      expect(panicZone).toBeDefined();
    });

    it('should not activate panic mode when disabled in preferences', () => {
      const disabledPreferences = { ...mockPreferences, panicButtonEnabled: false };
      const disabledManager = new SafeZoneManager(disabledPreferences);

      const panicSpy = vi.fn();
      disabledManager.on('panic-activated', panicSpy);

      disabledManager.activatePanicMode();

      expect(panicSpy).not.toHaveBeenCalled();

      disabledManager.dispose();
    });
  });

  describe('Preferences Updates', () => {
    it('should update preferences', () => {
      const newPreferences: VRPreferences = {
        ...mockPreferences,
        comfortRadius: 2.5,
        personalSpace: 1.2
      };

      manager.updatePreferences(newPreferences);

      const comfortZone = manager.createComfortZone();
      expect(comfortZone.radius).toBe(2.5);

      const personalZone = manager.createPersonalSpace();
      expect(personalZone.radius).toBe(1.2);
    });
  });

  describe('Position Tracking', () => {
    it('should track current position', () => {
      const position: Vector3D = { x: 3, y: 2, z: 1 };
      manager.updateUserPosition(position);

      const currentPosition = manager.getCurrentPosition();
      expect(currentPosition).toEqual(position);
    });
  });

  describe('Zone Queries', () => {
    it('should return all zones', () => {
      const zone1 = manager.createSafeZone({
        center: { x: 0, y: 0, z: 0 },
        radius: 1.0,
        shape: 'sphere',
        isActive: true,
        visualIndicator: true,
        hapticFeedback: false
      });

      const zone2 = manager.createSafeZone({
        center: { x: 5, y: 0, z: 0 },
        radius: 2.0,
        shape: 'cylinder',
        isActive: true,
        visualIndicator: false,
        hapticFeedback: true
      });

      const zones = manager.getZones();
      expect(zones).toHaveLength(2);
      expect(zones.map(z => z.id)).toContain(zone1.id);
      expect(zones.map(z => z.id)).toContain(zone2.id);
    });

    it('should return specific zone by ID', () => {
      const createdZone = manager.createSafeZone({
        center: { x: 0, y: 0, z: 0 },
        radius: 1.0,
        shape: 'sphere',
        isActive: true,
        visualIndicator: true,
        hapticFeedback: false
      });

      const retrievedZone = manager.getZone(createdZone.id);
      expect(retrievedZone).toEqual(createdZone);
    });
  });

  describe('Disposal', () => {
    it('should clean up resources on disposal', () => {
      const zone = manager.createSafeZone({
        center: { x: 0, y: 0, z: 0 },
        radius: 1.0,
        shape: 'sphere',
        isActive: true,
        visualIndicator: true,
        hapticFeedback: false
      });

      manager.dispose();

      expect(manager.getZones()).toHaveLength(0);
      expect(manager.getZone(zone.id)).toBeUndefined();
    });
  });
}); 