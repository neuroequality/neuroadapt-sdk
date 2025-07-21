'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { PreferenceStore } from '@neuroadapt/core'
import type { SensoryPreferences, CognitivePreferences } from '@neuroadapt/core'

interface PreferenceContextType {
  sensoryPreferences: SensoryPreferences
  cognitivePreferences: CognitivePreferences
  updateSensoryPreference: <K extends keyof SensoryPreferences>(
    key: K,
    value: SensoryPreferences[K]
  ) => Promise<void>
  updateCognitivePreference: <K extends keyof CognitivePreferences>(
    key: K,
    value: CognitivePreferences[K]
  ) => Promise<void>
  isLoading: boolean
  error: string | null
}

const PreferenceContext = createContext<PreferenceContextType | undefined>(undefined)

export function usePreferences() {
  const context = useContext(PreferenceContext)
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferenceProvider')
  }
  return context
}

export function PreferenceProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => new PreferenceStore())
  const [sensoryPreferences, setSensoryPreferences] = useState<SensoryPreferences>({
    motionReduction: false,
    highContrast: false,
    colorVisionFilter: 'none',
    fontSize: 1.0,
    reducedFlashing: false,
    darkMode: false,
  })
  const [cognitivePreferences, setCognitivePreferences] = useState<CognitivePreferences>({
    readingSpeed: 'medium',
    explanationLevel: 'detailed',
    processingPace: 'standard',
    chunkSize: 5,
    allowInterruptions: true,
    preferVisualCues: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeStore = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        await store.initialize()
        
        const preferences = store.getPreferences()
        setSensoryPreferences(preferences.sensory)
        setCognitivePreferences(preferences.cognitive)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize preferences')
      } finally {
        setIsLoading(false)
      }
    }

    initializeStore()

    // Listen for changes
    const handleChange = () => {
      const preferences = store.getPreferences()
      setSensoryPreferences(preferences.sensory)
      setCognitivePreferences(preferences.cognitive)
    }

    const handleError = (err: Error) => {
      setError(err.message)
    }

    store.on('change', handleChange)
    store.on('error', handleError)

    return () => {
      store.off('change', handleChange)
      store.off('error', handleError)
    }
  }, [store])

  const updateSensoryPreference = async <K extends keyof SensoryPreferences>(
    key: K,
    value: SensoryPreferences[K]
  ) => {
    try {
      setError(null)
      await store.updatePreferences({
        sensory: { [key]: value }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preference')
      throw err
    }
  }

  const updateCognitivePreference = async <K extends keyof CognitivePreferences>(
    key: K,
    value: CognitivePreferences[K]
  ) => {
    try {
      setError(null)
      await store.updatePreferences({
        cognitive: { [key]: value }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preference')
      throw err
    }
  }

  return (
    <PreferenceContext.Provider
      value={{
        sensoryPreferences,
        cognitivePreferences,
        updateSensoryPreference,
        updateCognitivePreference,
        isLoading,
        error,
      }}
    >
      {children}
    </PreferenceContext.Provider>
  )
}