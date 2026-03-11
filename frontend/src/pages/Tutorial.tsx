import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTutorial } from '../tutorial/useTutorial'
import TutorialOverlay from '../components/TutorialOverlay'
import { DILIGENCE_TUTORIAL_STEPS } from '../tutorial/types'

export default function Tutorial() {
  const navigate = useNavigate()
  const tutorial = useTutorial()
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string; deal_id?: string } | null>(null)
  const [seedError, setSeedError] = useState('')

  async function handleSeedData() {
    setSeeding(true)
    setSeedError('')
    setSeedResult(null)
    try {
      const res = await fetch('/api/seed-tutorial', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Seed failed' }))
        throw new Error(err.detail || 'Seed failed')
      }
      const data = await res.json()
      setSeedResult(data)
    } catch (e: any) {
      setSeedError(e.message)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div>
      {/* Tutorial overlay */}
      {tutorial.active && tutorial.currentStep && (
        <TutorialOverlay
          step={tutorial.currentStep}
          currentIndex={tutorial.progress.currentStep}
          totalSteps={tutorial.totalSteps}
          onNext={tutorial.next}
          onPrev={tutorial.prev}
          onDismiss={tutorial.dismiss}
        />
      )}

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Platform Tutorial</h1>
        <p className="text-gray-500 mt-1">Learn how to use RefCheck for VC due diligence reference checking</p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Tutorial */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Guided Walkthrough</h2>
              <p className="text-sm text-gray-500">Step-by-step tour of the diligence workflow</p>
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-6">
            Take an interactive tour through the complete reference checking process — from deal creation to signal synthesis.
            The tutorial walks you through all 10 steps of the workflow with detailed explanations.
          </p>

          <button
            onClick={tutorial.start}
            className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Start Interactive Tutorial
          </button>

          {tutorial.progress.completed && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              Tutorial completed! You can restart it anytime.
            </div>
          )}
        </div>

        {/* Mock Data Seed */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Load Sample Dataset</h2>
              <p className="text-sm text-gray-500">Populate with realistic trial data</p>
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-4">
            Load a pre-built dataset with sample deals, reference contacts at various stages,
            call notes with realistic interview content, and a synthesized signal report.
            This lets you explore every feature without setting up data from scratch.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
            <h4 className="font-medium text-gray-700 mb-2">Sample data includes:</h4>
            <ul className="space-y-1.5 text-gray-600">
              <li className="flex gap-2"><span className="text-indigo-500 font-bold">2</span> deals at different stages</li>
              <li className="flex gap-2"><span className="text-indigo-500 font-bold">6</span> reference contacts with varied statuses</li>
              <li className="flex gap-2"><span className="text-indigo-500 font-bold">4</span> detailed call notes with realistic content</li>
              <li className="flex gap-2"><span className="text-indigo-500 font-bold">1</span> signal report with green/red flags</li>
            </ul>
          </div>

          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="w-full bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 transition font-medium disabled:opacity-50"
          >
            {seeding ? 'Loading Sample Data...' : 'Load Sample Dataset'}
          </button>

          {seedResult?.success && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              <p className="font-medium">{seedResult.message}</p>
              {seedResult.deal_id && (
                <button
                  onClick={() => navigate(`/deals/${seedResult.deal_id}`)}
                  className="mt-2 text-green-800 underline hover:no-underline font-medium"
                >
                  Open the sample deal &rarr;
                </button>
              )}
            </div>
          )}

          {seedError && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {seedError}
            </div>
          )}
        </div>
      </div>

      {/* Workflow Overview */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Diligence Workflow Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DILIGENCE_TUTORIAL_STEPS.filter(s => s.id !== 'welcome' && s.id !== 'complete').map((step, i) => (
            <div
              key={step.id}
              className="border border-gray-100 rounded-lg p-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition cursor-pointer"
              onClick={() => { tutorial.start(); tutorial.goTo(i + 1) }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <h3 className="text-sm font-semibold text-gray-900">{step.title.replace(/Step \d+: /, '')}</h3>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{step.description}</p>
              {step.tab && (
                <span className="inline-block mt-2 text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">
                  {step.tab === 'discover' ? 'AI Discovery' : step.tab === 'guide' ? 'Interview Guide' : step.tab === 'signals' ? 'Signal Report' : 'References'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => navigate('/')}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          &larr; Go to Deal Pipeline
        </button>
        {tutorial.progress.completed && (
          <button
            onClick={tutorial.reset}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Reset tutorial progress
          </button>
        )}
      </div>
    </div>
  )
}
