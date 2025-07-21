export interface QubitState {
  alpha: Complex;
  beta: Complex;
}

export interface Complex {
  real: number;
  imaginary: number;
}

export interface BlochVector {
  x: number;
  y: number;
  z: number;
}

export interface QuantumCircuit {
  qubits: number;
  gates: QuantumGate[];
  measurements: Measurement[];
}

export interface QuantumGate {
  type: GateType;
  target: number;
  control?: number;
  angle?: number;
  matrix?: Complex[][];
}

export type GateType = 
  | 'X' | 'Y' | 'Z'           // Pauli gates
  | 'H'                       // Hadamard
  | 'CNOT'                    // Controlled NOT
  | 'RX' | 'RY' | 'RZ'        // Rotation gates
  | 'S' | 'T'                 // Phase gates
  | 'SWAP'                    // SWAP gate
  | 'CUSTOM';                 // Custom matrix

export interface Measurement {
  qubit: number;
  basis: 'computational' | 'x' | 'y' | 'z';
  result?: 0 | 1;
}

export interface BlochSphereOptions {
  container: HTMLElement;
  width?: number;
  height?: number;
  showAxes?: boolean;
  showLabels?: boolean;
  colorBlindFriendly?: boolean;
  highContrast?: boolean;
  animationSpeed?: number;
  accessibleColors?: boolean;
}

export interface QuantumVisualizationEvents {
  'state-updated': { qubit: number; state: QubitState; vector: BlochVector };
  'gate-applied': { gate: QuantumGate; beforeState: QubitState; afterState: QubitState };
  'measurement-performed': { measurement: Measurement; probability: number };
  'circuit-executed': { circuit: QuantumCircuit; finalStates: QubitState[] };
  'animation-frame': { frame: number; totalFrames: number };
}

export interface AccessibilityOptions {
  announceStateChanges: boolean;
  verboseDescriptions: boolean;
  colorBlindSupport: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  audioFeedback: boolean;
}