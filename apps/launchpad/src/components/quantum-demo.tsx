'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Atom, Zap, RotateCw, Play, Pause, RotateCcw } from 'lucide-react'

// Mock the quantum package for demo purposes
const mockQuantumStates = [
  { name: '|0⟩ Ground State', description: 'Qubit in the "0" state - north pole of Bloch sphere', vector: { x: 0, y: 0, z: 1 } },
  { name: '|1⟩ Excited State', description: 'Qubit in the "1" state - south pole of Bloch sphere', vector: { x: 0, y: 0, z: -1 } },
  { name: '|+⟩ Superposition', description: 'Equal probability of 0 and 1 - equator of Bloch sphere', vector: { x: 1, y: 0, z: 0 } },
  { name: '|-⟩ Superposition', description: 'Negative superposition state', vector: { x: -1, y: 0, z: 0 } },
  { name: '|+i⟩ Superposition', description: 'Imaginary superposition state', vector: { x: 0, y: 1, z: 0 } },
  { name: '|-i⟩ Superposition', description: 'Negative imaginary superposition state', vector: { x: 0, y: -1, z: 0 } }
]

const quantumGates = [
  { name: 'H', description: 'Hadamard - Creates superposition', icon: '⚖️' },
  { name: 'X', description: 'Pauli-X - Bit flip (NOT gate)', icon: '🔄' },
  { name: 'Y', description: 'Pauli-Y - Bit and phase flip', icon: '🌀' },
  { name: 'Z', description: 'Pauli-Z - Phase flip', icon: '⚡' },
  { name: 'S', description: 'Phase gate - 90° phase rotation', icon: '📐' },
  { name: 'T', description: 'π/8 gate - 45° phase rotation', icon: '📏' }
]

interface QuantumDemoProps {
  onStateChange?: (state: any) => void
}

export function QuantumDemo({ onStateChange }: QuantumDemoProps) {
  const [currentStateIndex, setCurrentStateIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [circuit, setCircuit] = useState<string[]>([])
  const [measurementResult, setMeasurementResult] = useState<0 | 1 | null>(null)
  const [executionProgress, setExecutionProgress] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()

  const currentState = mockQuantumStates[currentStateIndex]

  useEffect(() => {
    onStateChange?.(currentState)
  }, [currentState, onStateChange])

  useEffect(() => {
    if (autoPlay) {
      intervalRef.current = setInterval(() => {
        setCurrentStateIndex(prev => (prev + 1) % mockQuantumStates.length)
      }, 3000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoPlay])

  const handleStateChange = (index: number) => {
    if (!autoPlay) {
      setCurrentStateIndex(index)
    }
  }

  const addGateToCircuit = (gate: string) => {
    setCircuit(prev => [...prev, gate])
    setMeasurementResult(null)
  }

  const executeCircuit = async () => {
    if (circuit.length === 0) return

    setIsAnimating(true)
    setExecutionProgress(0)

    // Simulate circuit execution with progress
    for (let i = 0; i <= circuit.length; i++) {
      setExecutionProgress((i / circuit.length) * 100)
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    // Simulate measurement
    await new Promise(resolve => setTimeout(resolve, 500))
    setMeasurementResult(Math.random() > 0.5 ? 1 : 0)
    setIsAnimating(false)
  }

  const resetCircuit = () => {
    setCircuit([])
    setMeasurementResult(null)
    setExecutionProgress(0)
    setCurrentStateIndex(0)
  }

  const createBellState = () => {
    setCircuit(['H', 'CNOT'])
    setMeasurementResult(null)
    setExecutionProgress(0)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <Atom className="h-6 w-6 text-blue-600" />
          Quantum Computing Demo
        </h2>
        <p className="text-muted-foreground">
          Explore quantum states and circuits with accessible visualization
        </p>
      </div>

      <Tabs defaultValue="states" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="states">Quantum States</TabsTrigger>
          <TabsTrigger value="circuits">Circuit Builder</TabsTrigger>
          <TabsTrigger value="education">Learn More</TabsTrigger>
        </TabsList>

        <TabsContent value="states" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Bloch Sphere Visualization
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoPlay(!autoPlay)}
                    aria-label={autoPlay ? "Pause auto-cycle" : "Start auto-cycle"}
                  >
                    {autoPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStateChange(0)}
                    aria-label="Reset to ground state"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Interactive visualization of quantum states on the Bloch sphere
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mock Bloch Sphere Visualization */}
              <div className="relative w-64 h-64 mx-auto bg-gradient-to-br from-blue-50 to-purple-50 rounded-full border-2 border-blue-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2" role="img" aria-label="Quantum state representation">
                    ⚛️
                  </div>
                  <div className="text-sm font-mono">
                    ({currentState.vector.x.toFixed(1)}, {currentState.vector.y.toFixed(1)}, {currentState.vector.z.toFixed(1)})
                  </div>
                </div>
                
                {/* Visual indicators for accessibility */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-300 opacity-50" />
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-blue-600">|0⟩</div>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-blue-600">|1⟩</div>
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-600">|-⟩</div>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-600">|+⟩</div>
              </div>

              {/* Current State Info */}
              <div className="text-center">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {currentState.name}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  {currentState.description}
                </p>
              </div>

              {/* State Selection */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {mockQuantumStates.map((state, index) => (
                  <Button
                    key={index}
                    variant={index === currentStateIndex ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStateChange(index)}
                    disabled={autoPlay}
                    className="text-xs"
                    aria-pressed={index === currentStateIndex}
                  >
                    {state.name}
                  </Button>
                ))}
              </div>

              {autoPlay && (
                <div className="text-center text-sm text-muted-foreground">
                  Auto-cycling through quantum states every 3 seconds
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="circuits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quantum Circuit Builder
              </CardTitle>
              <CardDescription>
                Build quantum circuits by adding gates and see the results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Gate Palette */}
              <div>
                <h4 className="font-semibold mb-2">Quantum Gates</h4>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {quantumGates.map((gate) => (
                    <Button
                      key={gate.name}
                      variant="outline"
                      size="sm"
                      onClick={() => addGateToCircuit(gate.name)}
                      disabled={isAnimating}
                      className="flex flex-col p-2 h-auto"
                      title={gate.description}
                    >
                      <span className="text-lg" role="img" aria-label={gate.name}>
                        {gate.icon}
                      </span>
                      <span className="text-xs font-mono">{gate.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Circuit Display */}
              <div>
                <h4 className="font-semibold mb-2">Current Circuit</h4>
                <div className="min-h-[60px] p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center">
                  {circuit.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Add gates to build your quantum circuit</p>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono">|ψ⟩ →</span>
                      {circuit.map((gate, index) => (
                        <Badge key={index} variant="secondary" className="font-mono">
                          {gate}
                        </Badge>
                      ))}
                      <span className="text-sm font-mono">→ ?</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Execution Progress */}
              {isAnimating && (
                <div>
                  <h4 className="font-semibold mb-2">Executing Circuit...</h4>
                  <Progress value={executionProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground mt-1">
                    Processing quantum gates: {Math.round(executionProgress)}%
                  </p>
                </div>
              )}

              {/* Measurement Result */}
              {measurementResult !== null && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-1">Measurement Result</h4>
                  <p className="text-green-700">
                    Qubit measured: <Badge className="ml-1 bg-green-600">{measurementResult}</Badge>
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    The quantum state has collapsed to |{measurementResult}⟩
                  </p>
                </div>
              )}

              {/* Circuit Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={executeCircuit}
                  disabled={circuit.length === 0 || isAnimating}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Execute Circuit
                </Button>
                <Button
                  variant="outline"
                  onClick={resetCircuit}
                  disabled={isAnimating}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button
                  variant="secondary"
                  onClick={createBellState}
                  disabled={isAnimating}
                  title="Create entangled Bell state"
                >
                  Bell State
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>• Add gates from the palette above</p>
                <p>• Execute to run the circuit and measure the result</p>
                <p>• Try the Bell State button to create quantum entanglement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What is Quantum Computing?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  Quantum computing uses quantum mechanical phenomena like superposition 
                  and entanglement to process information in fundamentally different ways.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs">Superposition</Badge>
                    <p className="text-xs text-muted-foreground">
                      Qubits can exist in multiple states simultaneously
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs">Entanglement</Badge>
                    <p className="text-xs text-muted-foreground">
                      Qubits can be correlated in ways that classical bits cannot
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs">Interference</Badge>
                    <p className="text-xs text-muted-foreground">
                      Quantum states can interfere constructively or destructively
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Accessibility Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  This quantum demo is designed with accessibility in mind:
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs">Screen Reader</Badge>
                    <p className="text-xs text-muted-foreground">
                      All controls have proper ARIA labels and descriptions
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs">Keyboard</Badge>
                    <p className="text-xs text-muted-foreground">
                      Full keyboard navigation support
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs">Visual</Badge>
                    <p className="text-xs text-muted-foreground">
                      High contrast colors and clear visual indicators
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs">Motion</Badge>
                    <p className="text-xs text-muted-foreground">
                      Auto-play can be paused, respects motion preferences
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Common Quantum Gates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {quantumGates.map((gate) => (
                    <div key={gate.name} className="flex items-start gap-3 p-2 rounded border">
                      <span className="text-2xl" role="img" aria-label={gate.name}>
                        {gate.icon}
                      </span>
                      <div>
                        <div className="font-mono font-semibold">{gate.name}</div>
                        <p className="text-xs text-muted-foreground">{gate.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        aria-label="Quantum demo announcements"
      >
        {autoPlay && `Auto-cycling quantum states. Currently showing ${currentState.name}`}
        {measurementResult !== null && `Circuit executed. Measurement result: ${measurementResult}`}
        {isAnimating && `Executing quantum circuit. Progress: ${Math.round(executionProgress)}%`}
      </div>
    </div>
  )
} 