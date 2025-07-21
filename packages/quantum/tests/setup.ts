import { vi } from 'vitest';

// Mock Three.js for testing
vi.mock('three', () => ({
  Scene: vi.fn(() => ({
    add: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    background: null
  })),
  PerspectiveCamera: vi.fn(() => ({
    position: { set: vi.fn(), setFromSpherical: vi.fn() },
    aspect: 1,
    updateProjectionMatrix: vi.fn(),
    lookAt: vi.fn()
  })),
  WebGLRenderer: vi.fn(() => ({
    setSize: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
    domElement: {
      addEventListener: vi.fn(),
      setAttribute: vi.fn(),
      toDataURL: vi.fn(() => 'data:image/png;base64,mock')
    },
    shadowMap: { enabled: false, type: null }
  })),
  SphereGeometry: vi.fn(),
  MeshPhongMaterial: vi.fn(),
  Mesh: vi.fn(() => ({
    castShadow: false,
    receiveShadow: false
  })),
  AmbientLight: vi.fn(),
  DirectionalLight: vi.fn(() => ({
    position: { set: vi.fn() },
    castShadow: false
  })),
  ArrowHelper: vi.fn(() => ({
    position: { x: 0, y: 0, z: 0 }
  })),
  Group: vi.fn(() => ({
    add: vi.fn(),
    children: []
  })),
  Vector3: vi.fn((x = 0, y = 0, z = 0) => ({
    x, y, z,
    normalize: vi.fn(() => ({ x, y, z })),
    copy: vi.fn(),
    setFromSpherical: vi.fn()
  })),
  Color: vi.fn(),
  PlaneGeometry: vi.fn(),
  MeshBasicMaterial: vi.fn(),
  FontLoader: vi.fn(() => ({
    load: vi.fn()
  })),
  Spherical: vi.fn(() => ({
    setFromVector3: vi.fn(),
    theta: 0,
    phi: 0
  })),
  PCFSoftShadowMap: 1
}));

// Mock DOM APIs
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: vi.fn((cb) => setTimeout(cb, 16))
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: vi.fn()
});

// Mock DOM methods
global.document = {
  ...global.document,
  createElement: vi.fn(() => ({
    id: '',
    setAttribute: vi.fn(),
    style: {},
    textContent: '',
    appendChild: vi.fn(),
    removeChild: vi.fn()
  })),
  getElementById: vi.fn(),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
} as any; 