import { EventEmitter } from 'eventemitter3';
import * as THREE from 'three';
import type { 
  QubitState, 
  BlochVector, 
  BlochSphereOptions, 
  QuantumVisualizationEvents,
  AccessibilityOptions 
} from '../types/index.js';

export class BlochSphereRenderer extends EventEmitter<QuantumVisualizationEvents> {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private sphere: THREE.Mesh;
  private stateVector: THREE.ArrowHelper;
  private axes: THREE.Group;
  private labels: THREE.Group;
  private animationId: number | null = null;
  private container: HTMLElement;
  private options: Required<BlochSphereOptions>;
  private accessibilityOptions: AccessibilityOptions;

  constructor(options: BlochSphereOptions, accessibilityOptions: Partial<AccessibilityOptions> = {}) {
    super();
    
    this.container = options.container;
    this.options = {
      width: 400,
      height: 400,
      showAxes: true,
      showLabels: true,
      colorBlindFriendly: false,
      highContrast: false,
      animationSpeed: 1.0,
      accessibleColors: true,
      ...options
    };
    
    this.accessibilityOptions = {
      announceStateChanges: true,
      verboseDescriptions: false,
      colorBlindSupport: false,
      highContrast: false,
      reducedMotion: false,
      audioFeedback: false,
      ...accessibilityOptions
    };

    this.initializeScene();
    this.createBlochSphere();
    this.createAxes();
    this.createLabels();
    this.setupControls();
    this.render();
  }

  private initializeScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(
      this.accessibilityOptions.highContrast ? 0x000000 : 0xf5f5f5
    );

    this.camera = new THREE.PerspectiveCamera(
      75,
      this.options.width / this.options.height,
      0.1,
      1000
    );
    this.camera.position.set(3, 3, 3);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: !this.accessibilityOptions.reducedMotion,
      alpha: true 
    });
    this.renderer.setSize(this.options.width, this.options.height);
    this.renderer.shadowMap.enabled = !this.accessibilityOptions.reducedMotion;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
    
    // Add ARIA labels for accessibility
    this.renderer.domElement.setAttribute('role', 'img');
    this.renderer.domElement.setAttribute('aria-label', 'Bloch sphere quantum state visualization');
    this.renderer.domElement.setAttribute('tabindex', '0');
  }

  private createBlochSphere(): void {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: this.getAccessibleColor('sphere'),
      transparent: true,
      opacity: 0.3,
      wireframe: this.accessibilityOptions.highContrast
    });

    this.sphere = new THREE.Mesh(geometry, material);
    this.sphere.castShadow = true;
    this.sphere.receiveShadow = true;
    this.scene.add(this.sphere);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
  }

  private createAxes(): void {
    if (!this.options.showAxes) return;

    this.axes = new THREE.Group();

    // X axis (red)
    const xAxis = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      1.5,
      this.getAccessibleColor('x-axis'),
      0.2,
      0.1
    );
    this.axes.add(xAxis);

    // Y axis (green)
    const yAxis = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      1.5,
      this.getAccessibleColor('y-axis'),
      0.2,
      0.1
    );
    this.axes.add(yAxis);

    // Z axis (blue)
    const zAxis = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 0),
      1.5,
      this.getAccessibleColor('z-axis'),
      0.2,
      0.1
    );
    this.axes.add(zAxis);

    this.scene.add(this.axes);
  }

  private createLabels(): void {
    if (!this.options.showLabels) return;

    this.labels = new THREE.Group();

    // Add text labels for accessibility
    const loader = new THREE.FontLoader();
    
    // For now, use simple geometry for labels
    const createLabel = (text: string, position: THREE.Vector3, color: number) => {
      const geometry = new THREE.PlaneGeometry(0.3, 0.2);
      const material = new THREE.MeshBasicMaterial({ 
        color, 
        transparent: true,
        opacity: this.accessibilityOptions.highContrast ? 1.0 : 0.8
      });
      const label = new THREE.Mesh(geometry, material);
      label.position.copy(position);
      label.lookAt(this.camera.position);
      return label;
    };

    // State labels
    const labelData = [
      { text: '|0⟩', position: new THREE.Vector3(0, 0, 1.8), color: this.getAccessibleColor('label') },
      { text: '|1⟩', position: new THREE.Vector3(0, 0, -1.8), color: this.getAccessibleColor('label') },
      { text: '|+⟩', position: new THREE.Vector3(1.8, 0, 0), color: this.getAccessibleColor('label') },
      { text: '|-⟩', position: new THREE.Vector3(-1.8, 0, 0), color: this.getAccessibleColor('label') },
      { text: '|+i⟩', position: new THREE.Vector3(0, 1.8, 0), color: this.getAccessibleColor('label') },
      { text: '|-i⟩', position: new THREE.Vector3(0, -1.8, 0), color: this.getAccessibleColor('label') }
    ];

    labelData.forEach(({ text, position, color }) => {
      const label = createLabel(text, position, color);
      this.labels.add(label);
    });

    this.scene.add(this.labels);
  }

  private setupControls(): void {
    // Add keyboard controls for accessibility
    this.renderer.domElement.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'ArrowLeft':
          this.camera.position.x -= 0.1;
          break;
        case 'ArrowRight':
          this.camera.position.x += 0.1;
          break;
        case 'ArrowUp':
          this.camera.position.y += 0.1;
          break;
        case 'ArrowDown':
          this.camera.position.y -= 0.1;
          break;
        case 'Enter':
          this.announceCurrentState();
          break;
      }
      this.camera.lookAt(0, 0, 0);
      event.preventDefault();
    });

    // Mouse/touch controls
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    this.renderer.domElement.addEventListener('mousedown', (event) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    this.renderer.domElement.addEventListener('mousemove', (event) => {
      if (!isMouseDown || this.accessibilityOptions.reducedMotion) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      const spherical = new THREE.Spherical();
      spherical.setFromVector3(this.camera.position);
      spherical.theta -= deltaX * 0.01;
      spherical.phi += deltaY * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

      this.camera.position.setFromSpherical(spherical);
      this.camera.lookAt(0, 0, 0);

      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    this.renderer.domElement.addEventListener('mouseup', () => {
      isMouseDown = false;
    });
  }

  updateState(qubitState: QubitState): void {
    const vector = this.stateToBlochVector(qubitState);
    this.updateBlochVector(vector);
    
    if (this.accessibilityOptions.announceStateChanges) {
      this.announceStateChange(vector);
    }
    
    this.emit('state-updated', { qubit: 0, state: qubitState, vector });
  }

  private updateBlochVector(vector: BlochVector): void {
    // Remove existing state vector
    if (this.stateVector) {
      this.scene.remove(this.stateVector);
    }

    // Create new state vector
    const direction = new THREE.Vector3(vector.x, vector.y, vector.z).normalize();
    const length = Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
    
    this.stateVector = new THREE.ArrowHelper(
      direction,
      new THREE.Vector3(0, 0, 0),
      length,
      this.getAccessibleColor('state-vector'),
      0.3,
      0.2
    );

    this.scene.add(this.stateVector);
  }

  private stateToBlochVector(state: QubitState): BlochVector {
    const { alpha, beta } = state;
    
    // Convert complex amplitudes to Bloch vector coordinates
    const x = 2 * (alpha.real * beta.real + alpha.imaginary * beta.imaginary);
    const y = 2 * (alpha.imaginary * beta.real - alpha.real * beta.imaginary);
    const z = alpha.real ** 2 + alpha.imaginary ** 2 - beta.real ** 2 - beta.imaginary ** 2;
    
    return { x, y, z };
  }

  private getAccessibleColor(element: string): number {
    if (this.accessibilityOptions.colorBlindSupport) {
      // Color-blind friendly palette
      const colorBlindPalette = {
        'sphere': 0x4575b4,
        'x-axis': 0xe41a1c,
        'y-axis': 0x4daf4a,
        'z-axis': 0x377eb8,
        'state-vector': 0xff7f00,
        'label': 0x000000
      };
      return colorBlindPalette[element as keyof typeof colorBlindPalette] || 0x666666;
    }

    if (this.accessibilityOptions.highContrast) {
      const highContrastPalette = {
        'sphere': 0x000000,
        'x-axis': 0xffffff,
        'y-axis': 0xffffff,
        'z-axis': 0xffffff,
        'state-vector': 0xffff00,
        'label': 0xffffff
      };
      return highContrastPalette[element as keyof typeof highContrastPalette] || 0xffffff;
    }

    // Default colors
    const defaultPalette = {
      'sphere': 0x87ceeb,
      'x-axis': 0xff0000,
      'y-axis': 0x00ff00,
      'z-axis': 0x0000ff,
      'state-vector': 0xff6b35,
      'label': 0x333333
    };
    return defaultPalette[element as keyof typeof defaultPalette] || 0x666666;
  }

  private announceStateChange(vector: BlochVector): void {
    const magnitude = Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
    const description = `Quantum state updated. Bloch vector at coordinates: X ${vector.x.toFixed(2)}, Y ${vector.y.toFixed(2)}, Z ${vector.z.toFixed(2)}. Magnitude: ${magnitude.toFixed(2)}`;
    
    // Use ARIA live region for announcements
    this.announceToScreenReader(description);
  }

  private announceCurrentState(): void {
    if (!this.stateVector) return;
    
    const position = this.stateVector.position;
    const description = `Current quantum state: Bloch vector pointing to X ${position.x.toFixed(2)}, Y ${position.y.toFixed(2)}, Z ${position.z.toFixed(2)}`;
    this.announceToScreenReader(description);
  }

  private announceToScreenReader(message: string): void {
    // Create or update ARIA live region
    let liveRegion = document.getElementById('bloch-sphere-announcements');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'bloch-sphere-announcements';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }
    
    liveRegion.textContent = message;
  }

  exportFrame(): string {
    return this.renderer.domElement.toDataURL('image/png');
  }

  resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private render(): void {
    const animate = () => {
      if (!this.accessibilityOptions.reducedMotion) {
        this.animationId = requestAnimationFrame(animate);
      }
      
      // Rotate labels to always face camera
      if (this.labels) {
        this.labels.children.forEach(label => {
          label.lookAt(this.camera.position);
        });
      }
      
      this.renderer.render(this.scene, this.camera);
    };
    
    animate();
  }

  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.scene.clear();
    this.renderer.dispose();
    
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    
    // Clean up ARIA live region
    const liveRegion = document.getElementById('bloch-sphere-announcements');
    if (liveRegion) {
      document.body.removeChild(liveRegion);
    }
  }
}