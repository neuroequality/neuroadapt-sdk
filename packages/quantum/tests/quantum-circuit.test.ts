import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuantumCircuitSimulator } from '../src/circuits/quantum-circuit.js';
import type { QubitState, QuantumGate } from '../src/types/index.js';

describe('QuantumCircuitSimulator', () => {
  let simulator: QuantumCircuitSimulator;

  beforeEach(() => {
    simulator = new QuantumCircuitSimulator(2);
  });

  describe('Initialization', () => {
    it('should initialize qubits in |0⟩ state', () => {
      const states = simulator.getAllStates();
      expect(states).toHaveLength(2);
      
      states.forEach(state => {
        expect(state.alpha.real).toBe(1);
        expect(state.alpha.imaginary).toBe(0);
        expect(state.beta.real).toBe(0);
        expect(state.beta.imaginary).toBe(0);
      });
    });

    it('should create circuit with correct number of qubits', () => {
      const circuit = simulator.getCircuit();
      expect(circuit.qubits).toBe(2);
      expect(circuit.gates).toHaveLength(0);
      expect(circuit.measurements).toHaveLength(0);
    });
  });

  describe('Gate Operations', () => {
    it('should add X gate to circuit', () => {
      simulator.addGate({ type: 'X', target: 0 });
      
      const circuit = simulator.getCircuit();
      expect(circuit.gates).toHaveLength(1);
      expect(circuit.gates[0].type).toBe('X');
      expect(circuit.gates[0].target).toBe(0);
      expect(circuit.gates[0].matrix).toBeDefined();
    });

    it('should apply Hadamard gate correctly', () => {
      simulator.addGate({ type: 'H', target: 0 });
      simulator.executeCircuit();
      
      const state = simulator.getQubitState(0);
      const invSqrt2 = 1 / Math.sqrt(2);
      
      expect(state.alpha.real).toBeCloseTo(invSqrt2, 5);
      expect(state.beta.real).toBeCloseTo(invSqrt2, 5);
    });

    it('should apply X gate correctly', () => {
      simulator.addGate({ type: 'X', target: 0 });
      simulator.executeCircuit();
      
      const state = simulator.getQubitState(0);
      
      expect(state.alpha.real).toBe(0);
      expect(state.alpha.imaginary).toBe(0);
      expect(state.beta.real).toBe(1);
      expect(state.beta.imaginary).toBe(0);
    });

    it('should apply rotation gates with correct angles', () => {
      const angle = Math.PI / 4;
      simulator.addGate({ type: 'RY', target: 0, angle });
      simulator.executeCircuit();
      
      const state = simulator.getQubitState(0);
      const expectedCos = Math.cos(angle / 2);
      const expectedSin = Math.sin(angle / 2);
      
      expect(state.alpha.real).toBeCloseTo(expectedCos, 5);
      expect(state.beta.real).toBeCloseTo(expectedSin, 5);
    });
  });

  describe('CNOT Gate', () => {
    it('should apply CNOT gate correctly', () => {
      // Set control qubit to |1⟩
      simulator.addGate({ type: 'X', target: 0 });
      simulator.addGate({ type: 'CNOT', target: 1, control: 0 });
      simulator.executeCircuit();
      
      const controlState = simulator.getQubitState(0);
      const targetState = simulator.getQubitState(1);
      
      // Control should be |1⟩
      expect(controlState.beta.real).toBe(1);
      // Target should be flipped to |1⟩
      expect(targetState.beta.real).toBe(1);
    });
  });

  describe('Measurements', () => {
    it('should add measurements to circuit', () => {
      simulator.addMeasurement(0, 'computational');
      
      const circuit = simulator.getCircuit();
      expect(circuit.measurements).toHaveLength(1);
      expect(circuit.measurements[0].qubit).toBe(0);
      expect(circuit.measurements[0].basis).toBe('computational');
    });

    it('should perform measurements and collapse states', () => {
      simulator.addMeasurement(0);
      simulator.executeCircuit();
      
      const results = simulator.getMeasurementResults();
      expect(results.has(0)).toBe(true);
      
      const result = results.get(0);
      expect(result).toMatch(/^[01]$/);
      
      const state = simulator.getQubitState(0);
      if (result === 0) {
        expect(state.alpha.real).toBe(1);
        expect(state.beta.real).toBe(0);
      } else {
        expect(state.alpha.real).toBe(0);
        expect(state.beta.real).toBe(1);
      }
    });
  });

  describe('Bloch Vector Conversion', () => {
    it('should convert |0⟩ state to correct Bloch vector', () => {
      const vector = simulator.getBlochVector(0);
      
      expect(vector.x).toBeCloseTo(0, 5);
      expect(vector.y).toBeCloseTo(0, 5);
      expect(vector.z).toBeCloseTo(1, 5);
    });

    it('should convert |1⟩ state to correct Bloch vector', () => {
      simulator.addGate({ type: 'X', target: 0 });
      simulator.executeCircuit();
      
      const vector = simulator.getBlochVector(0);
      
      expect(vector.x).toBeCloseTo(0, 5);
      expect(vector.y).toBeCloseTo(0, 5);
      expect(vector.z).toBeCloseTo(-1, 5);
    });

    it('should convert superposition state to correct Bloch vector', () => {
      simulator.addGate({ type: 'H', target: 0 });
      simulator.executeCircuit();
      
      const vector = simulator.getBlochVector(0);
      
      expect(vector.x).toBeCloseTo(1, 5);
      expect(vector.y).toBeCloseTo(0, 5);
      expect(vector.z).toBeCloseTo(0, 5);
    });
  });

  describe('Events', () => {
    it('should emit gate-applied events', () => {
      const gateAppliedSpy = vi.fn();
      simulator.on('gate-applied', gateAppliedSpy);
      
      simulator.addGate({ type: 'X', target: 0 });
      simulator.executeCircuit();
      
      expect(gateAppliedSpy).toHaveBeenCalledOnce();
      const eventData = gateAppliedSpy.mock.calls[0][0];
      expect(eventData.gate.type).toBe('X');
      expect(eventData.beforeState).toBeDefined();
      expect(eventData.afterState).toBeDefined();
    });

    it('should emit measurement-performed events', () => {
      const measurementSpy = vi.fn();
      simulator.on('measurement-performed', measurementSpy);
      
      simulator.addMeasurement(0);
      simulator.executeCircuit();
      
      expect(measurementSpy).toHaveBeenCalledOnce();
      const eventData = measurementSpy.mock.calls[0][0];
      expect(eventData.measurement).toBeDefined();
      expect(eventData.probability).toBeTypeOf('number');
    });

    it('should emit circuit-executed events', () => {
      const circuitExecutedSpy = vi.fn();
      simulator.on('circuit-executed', circuitExecutedSpy);
      
      simulator.addGate({ type: 'H', target: 0 });
      simulator.executeCircuit();
      
      expect(circuitExecutedSpy).toHaveBeenCalledOnce();
      const eventData = circuitExecutedSpy.mock.calls[0][0];
      expect(eventData.circuit).toBeDefined();
      expect(eventData.finalStates).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid qubit index', () => {
      expect(() => {
        simulator.getQubitState(5);
      }).toThrow('Qubit index 5 out of range');
    });

    it('should throw error for rotation gates without angle', () => {
      expect(() => {
        simulator.addGate({ type: 'RX', target: 0 });
      }).toThrow('RX gate requires angle parameter');
    });
  });

  describe('Circuit Reset', () => {
    it('should reset circuit to initial state', () => {
      simulator.addGate({ type: 'X', target: 0 });
      simulator.addMeasurement(0);
      simulator.executeCircuit();
      
      simulator.reset();
      
      const circuit = simulator.getCircuit();
      expect(circuit.gates).toHaveLength(0);
      expect(circuit.measurements).toHaveLength(0);
      
      const states = simulator.getAllStates();
      states.forEach(state => {
        expect(state.alpha.real).toBe(1);
        expect(state.beta.real).toBe(0);
      });
      
      expect(simulator.getMeasurementResults().size).toBe(0);
    });
  });
}); 