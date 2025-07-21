import { vi } from 'vitest';

// Mock window APIs for VR testing
Object.defineProperty(window, 'setInterval', {
  writable: true,
  value: vi.fn((callback, delay) => {
    return setTimeout(callback, delay);
  })
});

Object.defineProperty(window, 'clearInterval', {
  writable: true,
  value: vi.fn()
});

// Mock WebXR APIs
Object.defineProperty(navigator, 'xr', {
  writable: true,
  value: {
    isSessionSupported: vi.fn(() => Promise.resolve(true)),
    requestSession: vi.fn(() => Promise.resolve({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      end: vi.fn(() => Promise.resolve())
    }))
  }
});

// Mock performance.now for timestamp generation
Object.defineProperty(performance, 'now', {
  writable: true,
  value: vi.fn(() => Date.now())
});

// Mock Math.random for deterministic testing
const originalRandom = Math.random;
let mockRandomValue = 0.5;

export const setMockRandom = (value: number) => {
  mockRandomValue = value;
};

export const resetMockRandom = () => {
  Math.random = originalRandom;
};

Math.random = vi.fn(() => mockRandomValue); 