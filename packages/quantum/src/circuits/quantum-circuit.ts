import { EventEmitter } from 'eventemitter3';
import type { 
  QuantumCircuit, 
  QuantumGate, 
  QubitState, 
  Complex,
  BlochVector,
  Measurement,
  QuantumVisualizationEvents 
} from '../types/index.js';

export class QuantumCircuitSimulator extends EventEmitter<QuantumVisualizationEvents> {
  private qubits: QubitState[] = [];
  private circuit: QuantumCircuit;
  private executionStep = 0;
  private measurementResults: Map<number, 0 | 1> = new Map();

  constructor(numQubits: number) {
    super();
    
    this.circuit = {
      qubits: numQubits,
      gates: [],
      measurements: []
    };

    // Initialize all qubits to |0⟩ state
    this.initializeQubits();
  }

  private initializeQubits(): void {
    this.qubits = Array(this.circuit.qubits).fill(null).map(() => ({
      alpha: { real: 1, imaginary: 0 }, // |0⟩ state
      beta: { real: 0, imaginary: 0 }
    }));
  }

  addGate(gate: Omit<QuantumGate, 'matrix'>): void {
    const gateWithMatrix: QuantumGate = {
      ...gate,
      matrix: this.getGateMatrix(gate.type, gate.angle)
    };

    this.circuit.gates.push(gateWithMatrix);
  }

  private getGateMatrix(type: QuantumGate['type'], angle?: number): Complex[][] {
    const cos = (a: number) => Math.cos(a);
    const sin = (a: number) => Math.sin(a);
    const zero: Complex = { real: 0, imaginary: 0 };
    const one: Complex = { real: 1, imaginary: 0 };
    const minusOne: Complex = { real: -1, imaginary: 0 };
    const i: Complex = { real: 0, imaginary: 1 };
    const minusI: Complex = { real: 0, imaginary: -1 };

    switch (type) {
      case 'X': // Pauli-X (NOT gate)
        return [
          [zero, one],
          [one, zero]
        ];

      case 'Y': // Pauli-Y
        return [
          [zero, minusI],
          [i, zero]
        ];

      case 'Z': // Pauli-Z
        return [
          [one, zero],
          [zero, minusOne]
        ];

      case 'H': // Hadamard
        const invSqrt2 = { real: 1 / Math.sqrt(2), imaginary: 0 };
        return [
          [invSqrt2, invSqrt2],
          [invSqrt2, { real: -1 / Math.sqrt(2), imaginary: 0 }]
        ];

      case 'S': // Phase gate
        return [
          [one, zero],
          [zero, i]
        ];

      case 'T': // π/8 gate
        return [
          [one, zero],
          [zero, { real: cos(Math.PI / 4), imaginary: sin(Math.PI / 4) }]
        ];

      case 'RX': // Rotation around X-axis
        if (angle === undefined) throw new Error('RX gate requires angle parameter');
        return [
          [{ real: cos(angle / 2), imaginary: 0 }, { real: 0, imaginary: -sin(angle / 2) }],
          [{ real: 0, imaginary: -sin(angle / 2) }, { real: cos(angle / 2), imaginary: 0 }]
        ];

      case 'RY': // Rotation around Y-axis
        if (angle === undefined) throw new Error('RY gate requires angle parameter');
        return [
          [{ real: cos(angle / 2), imaginary: 0 }, { real: -sin(angle / 2), imaginary: 0 }],
          [{ real: sin(angle / 2), imaginary: 0 }, { real: cos(angle / 2), imaginary: 0 }]
        ];

      case 'RZ': // Rotation around Z-axis
        if (angle === undefined) throw new Error('RZ gate requires angle parameter');
        return [
          [{ real: cos(angle / 2), imaginary: -sin(angle / 2) }, zero],
          [zero, { real: cos(angle / 2), imaginary: sin(angle / 2) }]
        ];

      default:
        throw new Error(`Unsupported gate type: ${type}`);
    }
  }

  executeCircuit(): void {
    const originalStates = this.qubits.map(q => ({ ...q }));

    for (const gate of this.circuit.gates) {
      this.applyGate(gate);
      this.executionStep++;
    }

    // Perform measurements
    for (const measurement of this.circuit.measurements) {
      this.performMeasurement(measurement);
    }

    this.emit('circuit-executed', {
      circuit: this.circuit,
      finalStates: this.qubits
    });
  }

  private applyGate(gate: QuantumGate): void {
    if (!gate.matrix) return;

    const beforeQubit = this.qubits[gate.target];
    if (!beforeQubit) {
      throw new Error(`Qubit at index ${gate.target} is undefined`);
    }

    const beforeState: QubitState = { 
      alpha: { real: beforeQubit.alpha.real, imaginary: beforeQubit.alpha.imaginary }, 
      beta: { real: beforeQubit.beta.real, imaginary: beforeQubit.beta.imaginary } 
    };

    if (gate.type === 'CNOT' && gate.control !== undefined) {
      this.applyCNOTGate(gate.control, gate.target);
    } else {
      this.applySingleQubitGate(gate.target, gate.matrix);
    }

    const afterQubit = this.qubits[gate.target];
    if (!afterQubit) {
      throw new Error(`Qubit at index ${gate.target} is undefined after gate application`);
    }
    
    this.emit('gate-applied', {
      gate,
      beforeState,
      afterState: afterQubit
    });
  }

  private applySingleQubitGate(qubit: number, matrix: Complex[][]): void {
    if (qubit >= this.qubits.length) {
      throw new Error(`Qubit index ${qubit} out of range`);
    }

    const state = this.qubits[qubit];
    if (!state) {
      throw new Error(`Qubit state at index ${qubit} is undefined`);
    }

    const [alpha, beta] = [state.alpha, state.beta];

    // Matrix multiplication: |ψ'⟩ = U|ψ⟩
    const newAlpha = this.complexAdd(
      this.complexMultiply(matrix[0]?.[0] ?? { real: 0, imaginary: 0 }, alpha),
      this.complexMultiply(matrix[0]?.[1] ?? { real: 0, imaginary: 0 }, beta)
    );

    const newBeta = this.complexAdd(
      this.complexMultiply(matrix[1]?.[0] ?? { real: 0, imaginary: 0 }, alpha),
      this.complexMultiply(matrix[1]?.[1] ?? { real: 0, imaginary: 0 }, beta)
    );

    this.qubits[qubit] = { alpha: newAlpha, beta: newBeta };
  }

  private applyCNOTGate(control: number, target: number): void {
    // CNOT gate: |00⟩ → |00⟩, |01⟩ → |01⟩, |10⟩ → |11⟩, |11⟩ → |10⟩
    // Simplified implementation for demonstration
    const controlState = this.qubits[control];
    const targetState = this.qubits[target];

    if (!controlState || !targetState) {
      throw new Error(`Invalid qubit indices for CNOT gate: control=${control}, target=${target}`);
    }

    // If control qubit is in |1⟩ state (beta component dominant), flip target
    const controlProbabilityOne = this.getStateProbability(controlState, 1);
    
    if (controlProbabilityOne > 0.5) {
      // Apply X gate to target
      const xMatrix = this.getGateMatrix('X');
      this.applySingleQubitGate(target, xMatrix);
    }
  }

  private performMeasurement(measurement: Measurement): void {
    const qubit = this.qubits[measurement.qubit];
    if (!qubit) {
      throw new Error(`Qubit at index ${measurement.qubit} is undefined`);
    }

    const probability = this.getStateProbability(qubit, 1);
    
    // Simulate measurement collapse
    const result = Math.random() < probability ? 1 : 0;
    measurement.result = result;
    this.measurementResults.set(measurement.qubit, result);

    // Collapse the state
    if (result === 0) {
      this.qubits[measurement.qubit] = {
        alpha: { real: 1, imaginary: 0 },
        beta: { real: 0, imaginary: 0 }
      };
    } else {
      this.qubits[measurement.qubit] = {
        alpha: { real: 0, imaginary: 0 },
        beta: { real: 1, imaginary: 0 }
      };
    }

    this.emit('measurement-performed', { measurement, probability });
  }

  private getStateProbability(state: QubitState, outcome: 0 | 1): number {
    if (outcome === 0) {
      // Probability of measuring |0⟩
      return state.alpha.real ** 2 + state.alpha.imaginary ** 2;
    } else {
      // Probability of measuring |1⟩
      return state.beta.real ** 2 + state.beta.imaginary ** 2;
    }
  }

  private complexAdd(a: Complex, b: Complex): Complex {
    return {
      real: a.real + b.real,
      imaginary: a.imaginary + b.imaginary
    };
  }

  private complexMultiply(a: Complex, b: Complex): Complex {
    return {
      real: a.real * b.real - a.imaginary * b.imaginary,
      imaginary: a.real * b.imaginary + a.imaginary * b.real
    };
  }

  getQubitState(index: number): QubitState {
    if (index >= this.qubits.length) {
      throw new Error(`Qubit index ${index} out of range`);
    }
    return { ...this.qubits[index] };
  }

  getAllStates(): QubitState[] {
    return this.qubits.map(q => ({ ...q }));
  }

  getBlochVector(qubit: number): BlochVector {
    const state = this.getQubitState(qubit);
    
    // Convert quantum state to Bloch sphere coordinates
    const x = 2 * (state.alpha.real * state.beta.real + state.alpha.imaginary * state.beta.imaginary);
    const y = 2 * (state.alpha.imaginary * state.beta.real - state.alpha.real * state.beta.imaginary);
    const z = state.alpha.real ** 2 + state.alpha.imaginary ** 2 - state.beta.real ** 2 - state.beta.imaginary ** 2;
    
    return { x, y, z };
  }

  addMeasurement(qubit: number, basis: Measurement['basis'] = 'computational'): void {
    this.circuit.measurements.push({ qubit, basis });
  }

  reset(): void {
    this.circuit.gates = [];
    this.circuit.measurements = [];
    this.measurementResults.clear();
    this.executionStep = 0;
    this.initializeQubits();
  }

  getCircuit(): QuantumCircuit {
    return { ...this.circuit };
  }

  getMeasurementResults(): Map<number, 0 | 1> {
    return new Map(this.measurementResults);
  }
} 