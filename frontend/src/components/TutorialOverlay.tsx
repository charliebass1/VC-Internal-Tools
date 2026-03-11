import { TutorialStep } from '../tutorial/types'

interface TutorialOverlayProps {
  step: TutorialStep
  currentIndex: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onDismiss: () => void
}

export default function TutorialOverlay({
  step,
  currentIndex,
  totalSteps,
  onNext,
  onPrev,
  onDismiss,
}: TutorialOverlayProps) {
  const isFirst = currentIndex === 0
  const isLast = currentIndex === totalSteps - 1
  const progressPct = ((currentIndex + 1) / totalSteps) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onDismiss} />

      {/* Tutorial Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-5 flex items-center justify-between">
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            {currentIndex + 1} of {totalSteps}
          </span>
          {step.tab && (
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
              Tab: {step.tab === 'discover' ? 'AI Discovery' : step.tab === 'guide' ? 'Interview Guide' : step.tab === 'signals' ? 'Signal Report' : 'References'}
            </span>
          )}
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 text-sm font-medium"
          >
            Skip tutorial
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
          <p className="text-gray-600 leading-relaxed">{step.description}</p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 px-6 pb-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === currentIndex
                  ? 'w-6 bg-indigo-600'
                  : i < currentIndex
                  ? 'w-1.5 bg-indigo-300'
                  : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 pt-3 flex justify-between items-center">
          <button
            onClick={onPrev}
            disabled={isFirst}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2"
          >
            Back
          </button>
          <button
            onClick={onNext}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
          >
            {isLast ? 'Finish Tutorial' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
