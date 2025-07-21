'use client'

import { usePreferences } from '@/components/providers/preference-provider'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Download, Upload, RotateCcw } from 'lucide-react'

export function PreferencePanel() {
  const {
    sensoryPreferences,
    cognitivePreferences,
    updateSensoryPreference,
    updateCognitivePreference,
    isLoading,
    error,
  } = usePreferences()

  const exportPreferences = () => {
    const data = {
      sensory: sensoryPreferences,
      cognitive: cognitivePreferences,
      exportedAt: new Date().toISOString(),
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'neuroadapt-preferences.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importPreferences = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const data = JSON.parse(e.target?.result as string)
            if (data.sensory) {
              for (const [key, value] of Object.entries(data.sensory)) {
                await updateSensoryPreference(key as keyof typeof sensoryPreferences, value)
              }
            }
            if (data.cognitive) {
              for (const [key, value] of Object.entries(data.cognitive)) {
                await updateCognitivePreference(key as keyof typeof cognitivePreferences, value)
              }
            }
          } catch (error) {
            console.error('Failed to import preferences:', error)
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const resetToDefaults = async () => {
    // Reset sensory preferences
    await updateSensoryPreference('motionReduction', false)
    await updateSensoryPreference('highContrast', false)
    await updateSensoryPreference('colorVisionFilter', 'none')
    await updateSensoryPreference('fontSize', 1.0)
    await updateSensoryPreference('reducedFlashing', false)
    await updateSensoryPreference('darkMode', false)

    // Reset cognitive preferences
    await updateCognitivePreference('readingSpeed', 'medium')
    await updateCognitivePreference('explanationLevel', 'detailed')
    await updateCognitivePreference('processingPace', 'standard')
    await updateCognitivePreference('chunkSize', 5)
    await updateCognitivePreference('allowInterruptions', true)
    await updateCognitivePreference('preferVisualCues', false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading preferences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 border border-destructive rounded-lg bg-destructive/10 text-destructive">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Accessibility Preferences</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPreferences}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={importPreferences}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sensory Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Sensory Preferences</CardTitle>
            <CardDescription>
              Visual and auditory adaptations for comfort and accessibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="motion-reduction">Reduce Motion</Label>
                <Switch
                  id="motion-reduction"
                  checked={sensoryPreferences.motionReduction}
                  onCheckedChange={(checked) => updateSensoryPreference('motionReduction', checked)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Disables animations and smooth scrolling
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="high-contrast">High Contrast</Label>
                <Switch
                  id="high-contrast"
                  checked={sensoryPreferences.highContrast}
                  onCheckedChange={(checked) => updateSensoryPreference('highContrast', checked)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Increases contrast for better visibility
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <Switch
                  id="dark-mode"
                  checked={sensoryPreferences.darkMode}
                  onCheckedChange={(checked) => updateSensoryPreference('darkMode', checked)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Switches to dark color scheme
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="color-filter">Color Vision Filter</Label>
              <Select 
                value={sensoryPreferences.colorVisionFilter} 
                onValueChange={(value) => updateSensoryPreference('colorVisionFilter', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="protanopia">Protanopia (Red-blind)</SelectItem>
                  <SelectItem value="deuteranopia">Deuteranopia (Green-blind)</SelectItem>
                  <SelectItem value="tritanopia">Tritanopia (Blue-blind)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size: {Math.round(sensoryPreferences.fontSize * 100)}%</Label>
              <Slider
                id="font-size"
                min={0.75}
                max={2}
                step={0.125}
                value={[sensoryPreferences.fontSize]}
                onValueChange={([value]) => updateSensoryPreference('fontSize', value)}
                className="w-full"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="reduced-flashing">Reduce Flashing</Label>
                <Switch
                  id="reduced-flashing"
                  checked={sensoryPreferences.reducedFlashing}
                  onCheckedChange={(checked) => updateSensoryPreference('reducedFlashing', checked)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Reduces rapid visual changes and flashing
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cognitive Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Cognitive Preferences</CardTitle>
            <CardDescription>
              Processing and interaction adaptations for focus and comprehension
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="reading-speed">Reading Speed</Label>
              <Select 
                value={cognitivePreferences.readingSpeed} 
                onValueChange={(value) => updateCognitivePreference('readingSpeed', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">Slow</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="fast">Fast</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="explanation-level">Explanation Detail</Label>
              <Select 
                value={cognitivePreferences.explanationLevel} 
                onValueChange={(value) => updateCognitivePreference('explanationLevel', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="processing-pace">Processing Pace</Label>
              <Select 
                value={cognitivePreferences.processingPace} 
                onValueChange={(value) => updateCognitivePreference('processingPace', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relaxed">Relaxed</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="quick">Quick</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="chunk-size">Chunk Size: {cognitivePreferences.chunkSize} items</Label>
              <Slider
                id="chunk-size"
                min={1}
                max={10}
                step={1}
                value={[cognitivePreferences.chunkSize]}
                onValueChange={([value]) => updateCognitivePreference('chunkSize', value)}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                How many items to show at once
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-interruptions">Allow Interruptions</Label>
                <Switch
                  id="allow-interruptions"
                  checked={cognitivePreferences.allowInterruptions}
                  onCheckedChange={(checked) => updateCognitivePreference('allowInterruptions', checked)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Allow notifications and popups during tasks
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="visual-cues">Prefer Visual Cues</Label>
                <Switch
                  id="visual-cues"
                  checked={cognitivePreferences.preferVisualCues}
                  onCheckedChange={(checked) => updateCognitivePreference('preferVisualCues', checked)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Use visual indicators instead of text when possible
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}