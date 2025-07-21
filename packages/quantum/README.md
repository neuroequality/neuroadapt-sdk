# @neuroadapt/quantum

Accessible quantum visualization and Bloch sphere rendering for the NeuroAdapt SDK. This package provides educational quantum computing concepts with accessibility-first design.

## Features

- **Bloch Sphere Visualization**: Interactive 3D visualization of qubit states with accessibility support
- **Quantum Circuit Simulation**: Build and execute quantum circuits with common gates
- **Accessibility First**: Color-blind friendly palettes, screen reader support, and keyboard navigation
- **Educational Focus**: Designed for learning quantum concepts with clear visual feedback
- **WebGL Rendering**: Hardware-accelerated 3D graphics with Three.js

## Installation

```bash
npm install @neuroadapt/quantum
```

## Quick Start

### Bloch Sphere Visualization

```typescript
import { BlochSphereRenderer, createSuperpositionState } from '@neuroadapt/quantum';

// Create container element
const container = document.getElementById('bloch-sphere');

// Initialize renderer with accessibility options
const renderer = new BlochSphereRenderer({
  container,
  width: 600,
  height: 600,
  showAxes: true,
  showLabels: true,
  colorBlindFriendly: true,
  accessibleColors: true
}, {
  announceStateChanges: true,
  verboseDescriptions: true,
  colorBlindSupport: true,
  highContrast: false,
  reducedMotion: false,
  audioFeedback: false
});

// Update with quantum state
const superposition = createSuperpositionState();
renderer.updateState(superposition);
```

### Quantum Circuit Simulation

```typescript
import { QuantumCircuitSimulator, bellState } from '@neuroadapt/quantum';

// Create a 2-qubit circuit
const circuit = new QuantumCircuitSimulator(2);

// Add gates to create Bell state
circuit.addGate({ type: 'H', target: 0 });
circuit.addGate({ type: 'CNOT', target: 1, control: 0 });

// Add measurements
circuit.addMeasurement(0);
circuit.addMeasurement(1);

// Execute circuit
circuit.executeCircuit();

// Get results
const results = circuit.getMeasurementResults();
console.log('Measurement results:', results);

// Or use convenience function
const bellCircuit = bellState();
bellCircuit.executeCircuit();
```

## API Reference

### BlochSphereRenderer

Interactive 3D Bloch sphere visualization with accessibility support.

#### Constructor Options

```typescript
interface BlochSphereOptions {
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

interface AccessibilityOptions {
  announceStateChanges: boolean;
  verboseDescriptions: boolean;
  colorBlindSupport: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  audioFeedback: boolean;
}
```

#### Methods

- `updateState(qubitState: QubitState)`: Update the displayed quantum state
- `exportFrame(): string`: Export current frame as base64 PNG
- `resize(width: number, height: number)`: Resize the renderer
- `dispose()`: Clean up resources

#### Events

- `state-updated`: Emitted when quantum state changes
- `animation-frame`: Emitted during animations

### QuantumCircuitSimulator

Quantum circuit builder and simulator with educational focus.

#### Constructor

```typescript
const simulator = new QuantumCircuitSimulator(numQubits: number);
```

#### Methods

- `addGate(gate: QuantumGate)`: Add a quantum gate to the circuit
- `addMeasurement(qubit: number, basis?: 'computational' | 'x' | 'y' | 'z')`: Add measurement
- `executeCircuit()`: Execute the entire circuit
- `getQubitState(index: number): QubitState`: Get state of specific qubit
- `getAllStates(): QubitState[]`: Get all qubit states
- `getBlochVector(qubit: number): BlochVector`: Get Bloch sphere coordinates
- `reset()`: Reset circuit to initial state

#### Supported Gates

- **Pauli Gates**: X, Y, Z
- **Hadamard**: H
- **Phase Gates**: S, T
- **Rotation Gates**: RX, RY, RZ (with angle parameter)
- **Two-Qubit Gates**: CNOT

#### Events

- `gate-applied`: Emitted when a gate is applied
- `measurement-performed`: Emitted when measurement occurs
- `circuit-executed`: Emitted when circuit execution completes

## Accessibility Features

### Visual Accessibility

- **Color-blind friendly palettes**: Distinguishable colors for all users
- **High contrast mode**: Enhanced visibility for low vision users
- **Reduced motion**: Respects user's motion preferences
- **Scalable text**: Readable labels and annotations

### Screen Reader Support

- **ARIA labels**: Proper semantic markup for assistive technology
- **Live regions**: Real-time announcements of state changes
- **Descriptive text**: Verbose descriptions of quantum states

### Keyboard Navigation

- **Arrow keys**: Navigate around the Bloch sphere
- **Enter key**: Announce current state
- **Tab navigation**: Focus management for interactive elements

## Usage Examples

### Educational Quantum States

```typescript
import { 
  createGroundState, 
  createExcitedState, 
  createSuperpositionState,
  BlochSphereRenderer 
} from '@neuroadapt/quantum';

const renderer = new BlochSphereRenderer({ container });

// Demonstrate different quantum states
const states = [
  { name: '|0⟩ Ground State', state: createGroundState() },
  { name: '|1⟩ Excited State', state: createExcitedState() },
  { name: '|+⟩ Superposition', state: createSuperpositionState() }
];

let currentIndex = 0;
setInterval(() => {
  const { name, state } = states[currentIndex];
  renderer.updateState(state);
  console.log(`Now showing: ${name}`);
  currentIndex = (currentIndex + 1) % states.length;
}, 3000);
```

### Interactive Circuit Builder

```typescript
import { QuantumCircuitSimulator } from '@neuroadapt/quantum';

const circuit = new QuantumCircuitSimulator(3);

// Listen for events
circuit.on('gate-applied', (event) => {
  console.log(`Applied ${event.gate.type} gate to qubit ${event.gate.target}`);
});

circuit.on('measurement-performed', (event) => {
  console.log(`Measured qubit ${event.measurement.qubit}: ${event.measurement.result}`);
});

// Build quantum teleportation circuit
circuit.addGate({ type: 'H', target: 1 });
circuit.addGate({ type: 'CNOT', target: 2, control: 1 });
circuit.addGate({ type: 'CNOT', target: 1, control: 0 });
circuit.addGate({ type: 'H', target: 0 });

circuit.addMeasurement(0);
circuit.addMeasurement(1);

circuit.executeCircuit();
```

## Browser Compatibility

- **WebGL**: Required for 3D visualization
- **ES2020**: Modern JavaScript features
- **Three.js**: WebGL rendering library

## Performance Considerations

- **Hardware Acceleration**: Uses WebGL for optimal performance
- **Memory Management**: Automatic cleanup of 3D resources
- **Reduced Motion**: Disables animations for better performance
- **Scalable Rendering**: Adjustable quality settings

## Contributing

See the main NeuroAdapt SDK [contributing guide](../../CONTRIBUTING.md).

## License

MIT - See [LICENSE](../../LICENSE) file. 