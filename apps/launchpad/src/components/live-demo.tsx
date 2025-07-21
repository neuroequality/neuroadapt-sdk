'use client'

import { useState, useEffect } from 'react'
import { usePreferences } from '@/components/providers/preference-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Eye, Brain, Zap, CheckCircle } from 'lucide-react'

export function LiveDemo() {
  const { sensoryPreferences, cognitivePreferences } = usePreferences()
  const [activeDemo, setActiveDemo] = useState('sensory')
  const [animationState, setAnimationState] = useState(0)

  useEffect(() => {
    if (!sensoryPreferences.motionReduction) {
      const interval = setInterval(() => {
        setAnimationState(prev => (prev + 1) % 4)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [sensoryPreferences.motionReduction])

  const demoText = "This is a sample text that demonstrates how cognitive load adaptation works. When the text becomes too complex or dense, the NeuroAdapt SDK can automatically break it into smaller chunks, simplify language, or suggest breaks to prevent cognitive overload."

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Live SDK Demonstration</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          See how your preference changes affect the interface in real-time. 
          All adaptations happen locally and instantly.
        </p>
      </div>

      <Tabs value={activeDemo} onValueChange={setActiveDemo} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sensory">Sensory Adaptations</TabsTrigger>
          <TabsTrigger value="cognitive">Cognitive Load</TabsTrigger>
          <TabsTrigger value="ai">AI Interface</TabsTrigger>
        </TabsList>

        <TabsContent value="sensory" className="mt-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Visual Adaptations
                </CardTitle>
                <CardDescription>
                  Live preview of your sensory preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg" style={{
                  fontSize: `${sensoryPreferences.fontSize}em`,
                  filter: sensoryPreferences.highContrast ? 'contrast(1.5)' : 'none',
                  backgroundColor: sensoryPreferences.darkMode ? '#1a1a1a' : '#ffffff',
                  color: sensoryPreferences.darkMode ? '#ffffff' : '#000000',
                }}>
                  <h4 className="font-semibold mb-2">Sample Content</h4>
                  <p className="mb-2">
                    This text adapts to your visual preferences in real-time.
                  </p>
                  <div 
                    className={`w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded ${
                      sensoryPreferences.motionReduction ? '' : 'animate-pulse'
                    }`}
                    style={{
                      animationDuration: sensoryPreferences.motionReduction ? '0ms' : '2s'
                    }}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {sensoryPreferences.motionReduction && (
                    <Badge variant="secondary">Motion Reduced</Badge>
                  )}
                  {sensoryPreferences.highContrast && (
                    <Badge variant="secondary">High Contrast</Badge>
                  )}
                  {sensoryPreferences.darkMode && (
                    <Badge variant="secondary">Dark Mode</Badge>
                  )}
                  {sensoryPreferences.fontSize !== 1 && (
                    <Badge variant="secondary">
                      Font: {Math.round(sensoryPreferences.fontSize * 100)}%
                    </Badge>
                  )}
                  {sensoryPreferences.colorVisionFilter !== 'none' && (
                    <Badge variant="secondary">
                      Filter: {sensoryPreferences.colorVisionFilter}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Color Vision Simulation</CardTitle>
                <CardDescription>
                  How colors appear with different vision types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {['red', 'green', 'blue', 'yellow'].map((color) => (
                    <div
                      key={color}
                      className={`h-16 rounded-lg bg-${color}-500`}
                      style={{
                        filter: sensoryPreferences.colorVisionFilter === 'protanopia' 
                          ? 'sepia(1) saturate(0.8) hue-rotate(-20deg)'
                          : sensoryPreferences.colorVisionFilter === 'deuteranopia'
                          ? 'sepia(0.6) saturate(0.9) hue-rotate(40deg)'
                          : sensoryPreferences.colorVisionFilter === 'tritanopia'
                          ? 'sepia(0.8) saturate(1.2) hue-rotate(180deg)'
                          : 'none'
                      }}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Current filter: {sensoryPreferences.colorVisionFilter}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cognitive" className="mt-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Text Processing
                </CardTitle>
                <CardDescription>
                  Adaptive content presentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  {cognitivePreferences.chunkSize <= 3 ? (
                    <div className="space-y-4">
                      <p>This is a sample text that demonstrates how cognitive load adaptation works.</p>
                      <hr className="my-2" />
                      <p>When the text becomes too complex or dense, the NeuroAdapt SDK can automatically break it into smaller chunks.</p>
                      <hr className="my-2" />
                      <p>This helps prevent cognitive overload and improves comprehension.</p>
                    </div>
                  ) : (
                    <p>{demoText}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Reading Speed:</span>
                    <Badge variant="outline">{cognitivePreferences.readingSpeed}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Explanation Level:</span>
                    <Badge variant="outline">{cognitivePreferences.explanationLevel}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Chunk Size:</span>
                    <Badge variant="outline">{cognitivePreferences.chunkSize} items</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Processing Pace:</span>
                    <Badge variant="outline">{cognitivePreferences.processingPace}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Load Detection</CardTitle>
                <CardDescription>
                  Simulated cognitive load analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Current Load:</span>
                    <Badge variant={
                      cognitivePreferences.processingPace === 'relaxed' ? 'secondary' :
                      cognitivePreferences.processingPace === 'quick' ? 'destructive' :
                      'default'
                    }>
                      {cognitivePreferences.processingPace === 'relaxed' ? 'Low' :
                       cognitivePreferences.processingPace === 'quick' ? 'High' :
                       'Moderate'}
                    </Badge>
                  </div>
                  
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        cognitivePreferences.processingPace === 'relaxed' ? 'bg-green-500 w-1/4' :
                        cognitivePreferences.processingPace === 'quick' ? 'bg-red-500 w-3/4' :
                        'bg-yellow-500 w-1/2'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Suggested Adaptations:</h4>
                  <div className="space-y-1">
                    {cognitivePreferences.chunkSize <= 3 && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Content chunking enabled</span>
                      </div>
                    )}
                    {cognitivePreferences.explanationLevel === 'simple' && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Simplified language</span>
                      </div>
                    )}
                    {cognitivePreferences.processingPace === 'relaxed' && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Relaxed pacing</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Predictable AI Interface
              </CardTitle>
              <CardDescription>
                AI responses adapted to your cognitive preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Sample AI Response</h4>
                {cognitivePreferences.explanationLevel === 'simple' ? (
                  <p>
                    The NeuroAdapt SDK helps make apps more accessible. 
                    It changes how things look and work based on what you need.
                  </p>
                ) : cognitivePreferences.explanationLevel === 'detailed' ? (
                  <p>
                    The NeuroAdapt SDK is a comprehensive toolkit that provides adaptive interfaces 
                    for neurodivergent users. It includes sensory adaptations like motion reduction 
                    and high contrast, cognitive load management with content chunking, and AI 
                    interfaces that provide consistent, tone-aware responses with configurable 
                    explanation levels and undo functionality.
                  </p>
                ) : (
                  <p>
                    The NeuroAdapt SDK provides adaptive interfaces for neurodivergent users, 
                    including sensory adaptations, cognitive load management, and predictable AI responses.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Response Style:</span>
                  <p className="text-muted-foreground">
                    {cognitivePreferences.explanationLevel === 'simple' ? 'Simple and clear' :
                     cognitivePreferences.explanationLevel === 'detailed' ? 'Comprehensive and thorough' :
                     'Balanced and informative'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Pacing:</span>
                  <p className="text-muted-foreground">
                    {cognitivePreferences.processingPace === 'relaxed' ? 'Slow and careful' :
                     cognitivePreferences.processingPace === 'quick' ? 'Fast and efficient' :
                     'Standard timing'}
                  </p>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                Try AI Demo (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}