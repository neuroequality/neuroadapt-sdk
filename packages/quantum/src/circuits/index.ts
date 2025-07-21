import { QuantumCircuitSimulator } from './quantum-circuit.js';

export { QuantumCircuitSimulator };

// Re-export convenience functions for circuit building
export function createCircuit(numQubits: number) {
  return new QuantumCircuitSimulator(numQubits);
}

export function bellState() {
  const circuit = new QuantumCircuitSimulator(2);
  circuit.addGate({ type: 'H', target: 0 });
  circuit.addGate({ type: 'CNOT', target: 1, control: 0 });
  return circuit;
}

export function ghzState(numQubits: number) {
  const circuit = new QuantumCircuitSimulator(numQubits);
  circuit.addGate({ type: 'H', target: 0 });
  for (let i = 1; i < numQubits; i++) {
    circuit.addGate({ type: 'CNOT', target: i, control: 0 });
  }
  return circuit;
} 