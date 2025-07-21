'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PreferencePanel } from '@/components/preference-panel'
import { LiveDemo } from '@/components/live-demo'
import { CodeExamples } from '@/components/code-examples'
import { QuantumDemo } from '@/components/quantum-demo'
import { VRDemo } from '@/components/vr-demo'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [safetyEvents, setSafetyEvents] = useState<any[]>([])

  const handleSafetyEvent = (event: any) => {
    setSafetyEvents(prev => [...prev.slice(-9), { ...event, timestamp: Date.now() }])
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              NeuroAdapt SDK
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Build accessible applications across AI, VR, and quantum systems for neurodivergent users.
              Experience adaptive interfaces that learn and respond to individual needs.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="demo">Live Demo</TabsTrigger>
              <TabsTrigger value="quantum">Quantum</TabsTrigger>
              <TabsTrigger value="vr">VR Safety</TabsTrigger>
              <TabsTrigger value="examples">Code</TabsTrigger>
              <TabsTrigger value="preferences">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-8">
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <FeatureCard
                  title="Sensory Adaptations"
                  description="Motion reduction, high contrast, color filtering, and font scaling for visual accessibility."
                  icon="👁️"
                />
                <FeatureCard
                  title="Cognitive Load Management"
                  description="Intelligent pacing, content chunking, and overload detection to support focus and comprehension."
                  icon="🧠"
                />
                <FeatureCard
                  title="Predictable AI"
                  description="Consistent, tone-aware AI responses with undo functionality and explanation levels."
                  icon="🤖"
                />
                <FeatureCard
                  title="VR Safe Spaces"
                  description="Comfort zones, proximity monitoring, and escape triggers for inclusive virtual experiences."
                  icon="🥽"
                />
                <FeatureCard
                  title="Quantum Visualization"
                  description="Accessible quantum state rendering with color-blind friendly representations."
                  icon="⚛️"
                />
                <FeatureCard
                  title="Local-First Privacy"
                  description="All preferences stored locally. No telemetry, no tracking, complete user control."
                  icon="🔒"
                />
              </div>

              {/* Safety Events Log */}
              {safetyEvents.length > 0 && (
                <div className="mt-8 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Recent Safety Events</h3>
                  <div className="space-y-1 text-sm">
                    {safetyEvents.slice(-3).map((event, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{event.type}</span>
                        <span className="text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="demo" className="mt-8">
              <LiveDemo />
            </TabsContent>

            <TabsContent value="quantum" className="mt-8">
              <QuantumDemo onStateChange={(state) => console.log('Quantum state:', state)} />
            </TabsContent>

            <TabsContent value="vr" className="mt-8">
              <VRDemo onSafetyEvent={handleSafetyEvent} />
            </TabsContent>

            <TabsContent value="examples" className="mt-8">
              <CodeExamples />
            </TabsContent>

            <TabsContent value="preferences" className="mt-8">
              <PreferencePanel />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow">
      <div className="text-3xl mb-4" role="img" aria-label={title}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}