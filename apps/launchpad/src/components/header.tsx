'use client'

import { useState } from 'react'
import { usePreferences } from '@/components/providers/preference-provider'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Settings, Moon, Sun, Contrast, MousePointer } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Header() {
  const { sensoryPreferences, updateSensoryPreference } = usePreferences()
  const [showQuickSettings, setShowQuickSettings] = useState(false)

  const toggleDarkMode = async () => {
    await updateSensoryPreference('darkMode', !sensoryPreferences.darkMode)
  }

  const toggleHighContrast = async () => {
    await updateSensoryPreference('highContrast', !sensoryPreferences.highContrast)
  }

  const toggleMotionReduction = async () => {
    await updateSensoryPreference('motionReduction', !sensoryPreferences.motionReduction)
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <div className="text-2xl font-bold text-primary">
            NeuroAdapt
          </div>
          <span className="text-sm text-muted-foreground">v1.1.0</span>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <a 
            href="#overview" 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Overview
          </a>
          <a 
            href="#features" 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Features
          </a>
          <a 
            href="#docs" 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Documentation
          </a>
          <a 
            href="https://github.com/neuroadapt/neuroadapt-sdk" 
            className="text-sm font-medium hover:text-primary transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          {/* Quick accessibility toggles */}
          <div className="hidden lg:flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              aria-label={`Toggle ${sensoryPreferences.darkMode ? 'light' : 'dark'} mode`}
              className={cn(
                sensoryPreferences.darkMode && "bg-muted"
              )}
            >
              {sensoryPreferences.darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleHighContrast}
              aria-label={`Toggle high contrast ${sensoryPreferences.highContrast ? 'off' : 'on'}`}
              className={cn(
                sensoryPreferences.highContrast && "bg-muted"
              )}
            >
              <Contrast className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMotionReduction}
              aria-label={`Toggle motion reduction ${sensoryPreferences.motionReduction ? 'off' : 'on'}`}
              className={cn(
                sensoryPreferences.motionReduction && "bg-muted"
              )}
            >
              <MousePointer className="h-4 w-4" />
            </Button>
          </div>

          {/* Settings dropdown for mobile */}
          <div className="relative lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQuickSettings(!showQuickSettings)}
              aria-label="Quick accessibility settings"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {showQuickSettings && (
              <div className="absolute right-0 top-full mt-2 w-64 p-4 bg-background border rounded-lg shadow-lg z-50">
                <h3 className="font-medium mb-3">Quick Settings</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="dark-mode" className="text-sm">
                      Dark Mode
                    </label>
                    <Switch
                      id="dark-mode"
                      checked={sensoryPreferences.darkMode}
                      onCheckedChange={() => toggleDarkMode()}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="high-contrast" className="text-sm">
                      High Contrast
                    </label>
                    <Switch
                      id="high-contrast"
                      checked={sensoryPreferences.highContrast}
                      onCheckedChange={() => toggleHighContrast()}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="motion-reduction" className="text-sm">
                      Reduce Motion
                    </label>
                    <Switch
                      id="motion-reduction"
                      checked={sensoryPreferences.motionReduction}
                      onCheckedChange={() => toggleMotionReduction()}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}