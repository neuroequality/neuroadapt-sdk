export * from './types/index.js';
export { BlochSphereRenderer } from './renderer/bloch-sphere.js';
export * from './circuits/index.js';

// Quantum state utilities
export function createQubitState(alpha: { real: number; imaginary: number }, beta: { real: number; imaginary: number }) {
  return { alpha, beta };
}

export function createGroundState() {
  return createQubitState({ real: 1, imaginary: 0 }, { real: 0, imaginary: 0 });
}

export function createExcitedState() {
  return createQubitState({ real: 0, imaginary: 0 }, { real: 1, imaginary: 0 });
}

export function createSuperpositionState() {
  const norm = 1 / Math.sqrt(2);
  return createQubitState({ real: norm, imaginary: 0 }, { real: norm, imaginary: 0 });
}

export const VERSION = '1.1.0';