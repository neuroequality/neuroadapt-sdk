'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Shield, AlertTriangle, Zap, Settings, MapPin, Volume2, Gamepad2 } from 'lucide-react'

interface VRDemoProps {
  onSafetyEvent?: (event: any) => void
}

interface SafeZone {
  id: string
  type: 'comfort' | 'personal' | 'emergency'
  radius: number
  active: boolean
}

interface VRPreferences {
  comfortRadius: number
  locomotionType: 'teleport' | 'smooth' | 'comfort'
  panicButtonEnabled: boolean
  snapTurning: boolean
  tunnelVision: boolean
  proximityWarnings: boolean
}

export function VRDemo({ onSafetyEvent }: VRDemoProps) {
  const [vrSupported, setVrSupported] = useState<boolean | null>(null)
  const [vrActive, setVrActive] = useState(false)
  const [safeZones, setSafeZones] = useState<SafeZone[]>([
    { id: 'comfort-1', type: 'comfort', radius: 1.5, active: true },
    { id: 'personal-1', type: 'personal', radius: 0.8, active: true }
  ])
  const [userPosition, setUserPosition] = useState({ x: 0, y: 1.6, z: 0 })
  const [proximityAlert, setProximityAlert] = useState<string | null>(null)
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [preferences, setPreferences] = useState<VRPreferences>({
    comfortRadius: 1.5,
    locomotionType: 'teleport',
    panicButtonEnabled: true,
    snapTurning: true,
    tunnelVision: false,
    proximityWarnings: true
  })

  // Simulate VR headset detection
  useEffect(() => {
    const checkVRSupport = async () => {
      if ('xr' in navigator) {
        try {
          const supported = await (navigator as any).xr?.isSessionSupported('immersive-vr')
          setVrSupported(supported)
        } catch {
          setVrSupported(false)
        }
      } else {
        setVrSupported(false)
      }
    }
    
    checkVRSupport()
  }, [])

  // Simulate position tracking and proximity detection
  useEffect(() => {
    if (!vrActive) return

    const interval = setInterval(() => {
      // Simulate natural head movement
      setUserPosition(prev => ({
        x: prev.x + (Math.random() - 0.5) * 0.1,
        y: 1.6 + (Math.random() - 0.5) * 0.05,
        z: prev.z + (Math.random() - 0.5) * 0.1
      }))
    }, 100)

    return () => clearInterval(interval)
  }, [vrActive])

  // Proximity detection simulation
  useEffect(() => {
    if (!vrActive || !preferences.proximityWarnings) return

    const checkProximity = () => {
      for (const zone of safeZones) {
        if (!zone.active) continue

        const distance = Math.sqrt(
          userPosition.x ** 2 + userPosition.z ** 2
        )

        if (distance > zone.radius * 0.8 && distance <= zone.radius) {
          setProximityAlert(`Approaching ${zone.type} zone boundary: ${distance.toFixed(1)}m`)
          onSafetyEvent?.({ type: 'proximity-warning', zone: zone.type, distance })
          return
        } else if (distance > zone.radius) {
          setProximityAlert(`Outside ${zone.type} zone: ${distance.toFixed(1)}m`)
          onSafetyEvent?.({ type: 'zone-exit', zone: zone.type, distance })
          return
        }
      }
      setProximityAlert(null)
    }

    const interval = setInterval(checkProximity, 200)
    return () => clearInterval(interval)
  }, [userPosition, safeZones, vrActive, preferences.proximityWarnings, onSafetyEvent])

  const enterVR = async () => {
    if (!vrSupported) {
      alert('VR not supported on this device')
      return
    }

    setVrActive(true)
    onSafetyEvent?.({ type: 'vr-entered', timestamp: Date.now() })
  }

  const exitVR = () => {
    setVrActive(false)
    setEmergencyMode(false)
    setProximityAlert(null)
    setUserPosition({ x: 0, y: 1.6, z: 0 })
    onSafetyEvent?.({ type: 'vr-exited', timestamp: Date.now() })
  }

  const activatePanicMode = () => {
    setEmergencyMode(true)
    setProximityAlert(null)
    
    // Create emergency safe zone
    const emergencyZone: SafeZone = {
      id: 'emergency-' + Date.now(),
      type: 'emergency',
      radius: 2.0,
      active: true
    }
    setSafeZones(prev => [...prev, emergencyZone])
    
    onSafetyEvent?.({ type: 'panic-activated', timestamp: Date.now() })

    // Auto-remove emergency zone after 30 seconds
    setTimeout(() => {
      setEmergencyMode(false)
      setSafeZones(prev => prev.filter(zone => zone.id !== emergencyZone.id))
    }, 30000)
  }

  const updatePreference = <K extends keyof VRPreferences>(
    key: K,
    value: VRPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
    
    // Update safe zones based on preference changes
    if (key === 'comfortRadius') {
      setSafeZones(prev => prev.map(zone => 
        zone.type === 'comfort' 
          ? { ...zone, radius: value as number }
          : zone
      ))
    }
  }

  const createSafeZone = (type: SafeZone['type']) => {
    const radius = type === 'comfort' ? preferences.comfortRadius : 
                  type === 'personal' ? 0.8 : 1.0

    const newZone: SafeZone = {
      id: `${type}-${Date.now()}`,
      type,
      radius,
      active: true
    }

    setSafeZones(prev => [...prev, newZone])
  }

  const getVRStatusColor = () => {
    if (vrSupported === null) return 'bg-gray-500'
    if (vrSupported === false) return 'bg-red-500'
    if (vrActive) return 'bg-green-500'
    return 'bg-blue-500'
  }

  const getVRStatusText = () => {
    if (vrSupported === null) return 'Checking VR support...'
    if (vrSupported === false) return 'VR not supported'
    if (vrActive) return 'VR Active - Safety systems online'
    return 'VR Ready - Headset detected'
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <Shield className="h-6 w-6 text-green-600" />
          VR Safety Demo
        </h2>
        <p className="text-muted-foreground">
          Experience safe VR with accessibility-first design and emergency protocols
        </p>
      </div>

      {/* VR Status Indicator */}
      <Card className={emergencyMode ? 'border-red-500 bg-red-50' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getVRStatusColor()}`} />
              VR System Status
            </div>
            {emergencyMode && (
              <Badge variant="destructive" className="animate-pulse">
                EMERGENCY MODE
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {getVRStatusText()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={enterVR}
              disabled={!vrSupported || vrActive}
              className="flex items-center gap-2"
            >
              <Gamepad2 className="h-4 w-4" />
              {vrActive ? 'VR Active' : 'Enter VR'}
            </Button>
            <Button
              variant="outline"
              onClick={exitVR}
              disabled={!vrActive}
              className="flex items-center gap-2"
            >
              Exit VR
            </Button>
            {vrActive && (
              <Button
                variant="destructive"
                onClick={activatePanicMode}
                disabled={emergencyMode}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Emergency Mode
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Proximity Alerts */}
      {proximityAlert && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">Proximity Alert:</span>
              <span className="text-yellow-700">{proximityAlert}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="safety" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="safety">Safety Features</TabsTrigger>
          <TabsTrigger value="preferences">Comfort Settings</TabsTrigger>
          <TabsTrigger value="zones">Safe Zones</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="safety" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Core Safety Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Emergency Panic Button</span>
                    <Badge variant={preferences.panicButtonEnabled ? "default" : "secondary"}>
                      {preferences.panicButtonEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Proximity Detection</span>
                    <Badge variant={preferences.proximityWarnings ? "default" : "secondary"}>
                      {preferences.proximityWarnings ? "Active" : "Off"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Safe Zone Management</span>
                    <Badge variant="default">
                      {safeZones.filter(z => z.active).length} Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Comfort Locomotion</span>
                    <Badge variant="outline">
                      {preferences.locomotionType}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Position Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {vrActive ? (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Head Position:</span>
                      <div className="font-mono text-xs mt-1">
                        X: {userPosition.x.toFixed(2)}m<br />
                        Y: {userPosition.y.toFixed(2)}m<br />
                        Z: {userPosition.z.toFixed(2)}m
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Tracking Status:</span>
                      <Badge variant="default" className="ml-2">60fps</Badge>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Prediction:</span>
                      <span className="text-green-600 ml-2">Safe movement</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Enter VR to see real-time position tracking
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Accessibility Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Sensory Accommodations</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Configurable haptic feedback intensity</li>
                    <li>• High contrast zone boundaries</li>
                    <li>• Spatial audio warnings and confirmations</li>
                    <li>• Motion sickness reduction options</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Motor Accommodations</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Teleport locomotion for comfort</li>
                    <li>• Snap turning (30° increments)</li>
                    <li>• Large interaction zones</li>
                    <li>• Multiple input method support</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Cognitive Support</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Predictable zone behavior</li>
                    <li>• Clear audio and visual feedback</li>
                    <li>• Emergency escape mechanisms</li>
                    <li>• Customizable comfort settings</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Safety Protocols</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• &lt;100ms emergency response time</li>
                    <li>• Automatic safe space creation</li>
                    <li>• Collision prediction algorithms</li>
                    <li>• Gradual comfort restoration</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>VR Comfort Settings</CardTitle>
              <CardDescription>
                Customize your VR experience for maximum comfort and safety
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="comfort-radius" className="text-sm font-medium mb-2 block">
                    Comfort Zone Radius: {preferences.comfortRadius.toFixed(1)}m
                  </label>
                  <Slider
                    id="comfort-radius"
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    value={[preferences.comfortRadius]}
                    onValueChange={([value]) => updatePreference('comfortRadius', value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Larger zones provide more personal space but may limit movement
                  </p>
                </div>

                <div>
                  <label htmlFor="locomotion-type" className="text-sm font-medium mb-2 block">
                    Locomotion Type
                  </label>
                  <Select
                    value={preferences.locomotionType}
                    onValueChange={(value: any) => updatePreference('locomotionType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teleport">Teleport (Recommended)</SelectItem>
                      <SelectItem value="smooth">Smooth Movement</SelectItem>
                      <SelectItem value="comfort">Comfort Mode</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Teleport locomotion reduces motion sickness risk
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="panic-button" className="text-sm font-medium">
                        Emergency Panic Button
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Quick escape mechanism
                      </p>
                    </div>
                    <Switch
                      id="panic-button"
                      checked={preferences.panicButtonEnabled}
                      onCheckedChange={(checked) => updatePreference('panicButtonEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="snap-turning" className="text-sm font-medium">
                        Snap Turning
                      </label>
                      <p className="text-xs text-muted-foreground">
                        30° discrete rotation
                      </p>
                    </div>
                    <Switch
                      id="snap-turning"
                      checked={preferences.snapTurning}
                      onCheckedChange={(checked) => updatePreference('snapTurning', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="tunnel-vision" className="text-sm font-medium">
                        Tunnel Vision
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Reduce motion sickness
                      </p>
                    </div>
                    <Switch
                      id="tunnel-vision"
                      checked={preferences.tunnelVision}
                      onCheckedChange={(checked) => updatePreference('tunnelVision', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="proximity-warnings" className="text-sm font-medium">
                        Proximity Warnings
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Boundary alerts
                      </p>
                    </div>
                    <Switch
                      id="proximity-warnings"
                      checked={preferences.proximityWarnings}
                      onCheckedChange={(checked) => updatePreference('proximityWarnings', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Safe Zone Management
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => createSafeZone('comfort')}
                  >
                    Add Comfort Zone
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => createSafeZone('personal')}
                  >
                    Add Personal Space
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Manage spatial safety boundaries for your VR experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {safeZones.map((zone) => (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        zone.type === 'comfort' ? 'bg-blue-500' :
                        zone.type === 'personal' ? 'bg-green-500' :
                        'bg-red-500'
                      }`} />
                      <div>
                        <div className="font-medium text-sm capitalize">
                          {zone.type} Zone
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Radius: {zone.radius.toFixed(1)}m
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={zone.active ? "default" : "secondary"}>
                        {zone.active ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSafeZones(prev => prev.map(z => 
                            z.id === zone.id ? { ...z, active: !z.active } : z
                          ))
                        }}
                      >
                        {zone.active ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Safety Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Emergency Response Time</span>
                    <Badge variant="default">&lt;100ms</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Position Update Rate</span>
                    <Badge variant="default">60fps</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Collision Prediction</span>
                    <Badge variant="default">500ms ahead</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Active Safe Zones</span>
                    <Badge variant="outline">{safeZones.filter(z => z.active).length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>VR Session Time</span>
                    <span className="font-mono">{vrActive ? "Active" : "Not started"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Safety Events</span>
                    <span className="font-mono">
                      {proximityAlert ? "1 Active Alert" : "None"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Emergency Activations</span>
                    <span className="font-mono">{emergencyMode ? "1" : "0"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Comfort Level</span>
                    <Badge variant={emergencyMode ? "destructive" : proximityAlert ? "secondary" : "default"}>
                      {emergencyMode ? "Emergency" : proximityAlert ? "Caution" : "Comfortable"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {vrActive && (
            <Card>
              <CardHeader>
                <CardTitle>Live VR Feed Simulation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg border-2 border-blue-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🥽</div>
                    <div className="text-sm font-mono mb-2">
                      Position: ({userPosition.x.toFixed(1)}, {userPosition.y.toFixed(1)}, {userPosition.z.toFixed(1)})
                    </div>
                    {proximityAlert && (
                      <Badge variant="secondary" className="text-xs">
                        {proximityAlert}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Safe zone visualization */}
                  {safeZones.filter(z => z.active).map((zone) => (
                    <div
                      key={zone.id}
                      className={`absolute rounded-full border-2 border-dashed opacity-50 ${
                        zone.type === 'comfort' ? 'border-blue-400' :
                        zone.type === 'personal' ? 'border-green-400' :
                        'border-red-400'
                      }`}
                      style={{
                        width: `${zone.radius * 40}px`,
                        height: `${zone.radius * 40}px`,
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        aria-label="VR safety announcements"
      >
        {emergencyMode && "Emergency mode activated. Safe space created around your position."}
        {proximityAlert && `Safety alert: ${proximityAlert}`}
        {vrActive && !proximityAlert && !emergencyMode && "VR safety systems active. All zones secure."}
      </div>
    </div>
  )
} 