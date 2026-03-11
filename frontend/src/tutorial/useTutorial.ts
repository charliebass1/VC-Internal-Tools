import { useState, useCallback } from 'react'
import {
  TutorialProgress,
  TutorialStep,
  TUTORIAL_STORAGE_KEY,
  DILIGENCE_TUTORIAL_STEPS,
} from './types'

function loadProgress(): TutorialProgress | null {
  try {
    const raw = localStorage.getItem(TUTORIAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveProgress(progress: TutorialProgress) {
  localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(progress))
}

export function useTutorial() {
  const [active, setActive] = useState(false)
  const [progress, setProgress] = useState<TutorialProgress>(
    () =>
      loadProgress() || {
        currentStep: 0,
        completedSteps: [],
        tutorialId: 'diligence-v1',
        startedAt: new Date().toISOString(),
        completed: false,
      }
  )

  const steps = DILIGENCE_TUTORIAL_STEPS
  const currentStep: TutorialStep | null = active ? steps[progress.currentStep] || null : null
  const totalSteps = steps.length

  const start = useCallback(() => {
    const fresh: TutorialProgress = {
      currentStep: 0,
      completedSteps: [],
      tutorialId: 'diligence-v1',
      startedAt: new Date().toISOString(),
      completed: false,
    }
    setProgress(fresh)
    saveProgress(fresh)
    setActive(true)
  }, [])

  const next = useCallback(() => {
    setProgress((prev) => {
      const step = steps[prev.currentStep]
      const nextIdx = prev.currentStep + 1
      const isComplete = nextIdx >= steps.length
      const updated: TutorialProgress = {
        ...prev,
        currentStep: isComplete ? prev.currentStep : nextIdx,
        completedSteps: step ? [...prev.completedSteps, step.id] : prev.completedSteps,
        completed: isComplete,
      }
      saveProgress(updated)
      if (isComplete) setActive(false)
      return updated
    })
  }, [steps])

  const prev = useCallback(() => {
    setProgress((p) => {
      const updated = { ...p, currentStep: Math.max(0, p.currentStep - 1) }
      saveProgress(updated)
      return updated
    })
  }, [])

  const goTo = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        setProgress((p) => {
          const updated = { ...p, currentStep: stepIndex }
          saveProgress(updated)
          return updated
        })
      }
    },
    [steps]
  )

  const dismiss = useCallback(() => {
    setActive(false)
  }, [])

  const reset = useCallback(() => {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY)
    setProgress({
      currentStep: 0,
      completedSteps: [],
      tutorialId: 'diligence-v1',
      startedAt: new Date().toISOString(),
      completed: false,
    })
    setActive(false)
  }, [])

  return {
    active,
    currentStep,
    progress,
    totalSteps,
    steps,
    start,
    next,
    prev,
    goTo,
    dismiss,
    reset,
  }
}
