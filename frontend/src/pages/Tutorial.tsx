import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTutorial } from '../tutorial/useTutorial'
import TutorialOverlay from '../components/TutorialOverlay'
import { seedTutorialData } from '../api'
import { useScrollReveal } from '../hooks/useScrollReveal'

const MOCK_DEALS = [
  { name: 'Acme Analytics', sector: 'B2B SaaS', stage: 'deep_dive', refs: 3, total: 6, partner: 'Sarah Chen', desc: 'AI-powered business intelligence for mid-market companies' },
  { name: 'Nexus Health', sector: 'HealthTech', stage: 'screening', refs: 1, total: 4, partner: 'Mike Torres', desc: 'Patient engagement platform for specialty clinics' },
  { name: 'BuildFlow', sector: 'Vertical SaaS', stage: 'ic_review', refs: 5, total: 5, partner: 'Sarah Chen', desc: 'Project management built for general contractors' },
]

const MOCK_CONTACTS = [
  { name: 'Jennifer Walsh', title: 'VP Operations', company: 'Meridian Capital', reasoning: 'Known early adopter in the B2B analytics space' },
  { name: 'David Park', title: 'Head of Data', company: 'Cascade Ventures', reasoning: 'Cited Acme favorably in two recent industry panels' },
  { name: 'Rachel Kim', title: 'CTO', company: 'Lighthouse Group', reasoning: 'Listed as customer in Acme\'s most recent press release' },
  { name: 'Marcus Chen', title: 'Director of Strategy', company: 'Summit Partners', reasoning: 'LinkedIn post mentioned Acme implementation last quarter' },
]

const MOCK_REFS = [
  { name: 'Jennifer Walsh', title: 'VP Operations', company: 'Meridian Capital', status: 'completed' },
  { name: 'David Park', title: 'Head of Data', company: 'Cascade Ventures', status: 'scheduled' },
  { name: 'Rachel Kim', title: 'CTO', company: 'Lighthouse Group', status: 'outreach_sent' },
  { name: 'Marcus Chen', title: 'Director of Strategy', company: 'Summit Partners', status: 'identified' },
]

const MOCK_QUESTIONS = [
  { category: 'Product Evaluation', question: 'How did you evaluate Acme against alternatives? What was the deciding factor?' },
  { category: 'Implementation', question: 'How long did implementation take? What were the biggest friction points getting started?' },
  { category: 'ROI & Value', question: 'How do you measure value from the product today? What metrics have moved?' },
  { category: 'Support & Reliability', question: 'Describe a time the product fell short. How did the team handle it?' },
  { category: 'Renewal Intent', question: 'Would you renew today? Have you expanded seats — or considered churning?' },
]

const GREEN_FLAGS = [
  'Strong NPS — all 3 completed refs unprompted recommended to peers',
  'Zero churn risk signals — all customers expanded in the past 12 months',
  'Implementation praised as fastest in category by 2 of 3 references',
  'Product roadmap closely aligned with stated customer priorities',
]

const RED_FLAGS = [
  'Support response times cited as slow by 2 of 3 references',
  'Enterprise tier pricing seen as high relative to mid-market alternatives',
  'API reliability issues noted in Q3 — unclear if resolved',
]

const STAGE_COLORS: Record<string, string> = {
  screening: 'bg-yellow-100 text-yellow-800',
  deep_dive: 'bg-blue-100 text-blue-800',
  ic_review: 'bg-purple-100 text-purple-800',
}

const STATUS_COLORS: Record<string, string> = {
  identified: 'bg-gray-100 text-gray-700',
  outreach_sent: 'bg-yellow-100 text-yellow-800',
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
}

function SectionLabel({ label }: { label: string }) {
  return (
    <span className="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-3">
      {label}
    </span>
  )
}

function reveal(visible: boolean, delay = 0) {
  return {
    style: { transitionDelay: visible ? `${delay}ms` : '0ms' },
    className: `transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`,
  }
}

export default function Tutorial() {
  const navigate = useNavigate()
  const tutorial = useTutorial()
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string; deal_id?: string } | null>(null)
  const [seedError, setSeedError] = useState('')

  const { ref: heroRef, isVisible: heroVisible } = useScrollReveal({ threshold: 0.1 })
  const { ref: pipelineRef, isVisible: pipelineVisible } = useScrollReveal()
  const { ref: discoverRef, isVisible: discoverVisible } = useScrollReveal()
  const { ref: refsRef, isVisible: refsVisible } = useScrollReveal()
  const { ref: guideRef, isVisible: guideVisible } = useScrollReveal()
  const { ref: signalsRef, isVisible: signalsVisible } = useScrollReveal()
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollReveal()

  async function handleSeedData() {
    setSeeding(true)
    setSeedError('')
    setSeedResult(null)
    try {
      const data = await seedTutorialData()
      setSeedResult(data)
    } catch (e: any) {
      setSeedError(e.message)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div>
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

      {/* Hero */}
      <section className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-6">
        <div ref={heroRef} className={`text-center max-w-2xl transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            VC Due Diligence · Automated
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-5 leading-tight">
            Reference checks that<br />actually surface signal
          </h1>
          <p className="text-xl text-gray-500 mb-8 leading-relaxed">
            RefCheck automates the reference workflow from AI customer discovery through signal synthesis — so you spend less time scheduling and more time evaluating.
          </p>
          <button
            onClick={() => document.getElementById('section-pipeline')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-indigo-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 active:scale-95 transition-all duration-200 text-lg"
          >
            See How It Works ↓
          </button>
        </div>
      </section>

      {/* Deal Pipeline */}
      <section id="section-pipeline" className="-mx-4 sm:-mx-6 lg:-mx-8 min-h-screen flex items-center justify-center bg-white px-6 py-24">
        <div className="max-w-3xl w-full">
          <div ref={pipelineRef} className={`transition-all duration-700 ${pipelineVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <SectionLabel label="Deal Pipeline" />
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Track every deal in one place</h2>
            <p className="text-gray-500 text-lg mb-10 max-w-xl">
              Each deal shows stage, sector, lead partner, and reference completion at a glance. No spreadsheets, no lost threads.
            </p>
          </div>
          <div className="grid gap-4">
            {MOCK_DEALS.map((deal, i) => (
              <div key={deal.name} {...reveal(pipelineVisible, 100 + i * 100)}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{deal.name}</h3>
                      <div className="flex gap-3 mt-1 text-sm text-gray-500">
                        <span>{deal.sector}</span>
                        <span>Lead: {deal.partner}</span>
                      </div>
                      <p className="text-gray-400 text-sm mt-2">{deal.desc}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[deal.stage]}`}>
                        {deal.stage.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-400">{deal.refs}/{deal.total} refs done</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Discovery */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 min-h-screen flex items-center justify-center bg-indigo-50 px-6 py-24">
        <div className="max-w-3xl w-full">
          <div ref={discoverRef} className={`transition-all duration-700 ${discoverVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <SectionLabel label="AI Discovery" />
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Find customers the company didn't give you</h2>
            <p className="text-gray-500 text-lg mb-10 max-w-xl">
              Claude identifies likely customers from public signals — press mentions, LinkedIn, G2 reviews — independently of the founder's reference list.
            </p>
          </div>
          <div className="space-y-3">
            {MOCK_CONTACTS.map((c, i) => (
              <div key={c.name} {...reveal(discoverVisible, 100 + i * 100)}>
                <div className="flex justify-between items-start bg-white border border-gray-200 rounded-xl p-4">
                  <div>
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.title} at {c.company}</p>
                    <p className="text-sm text-gray-400 mt-0.5 italic">{c.reasoning}</p>
                  </div>
                  <span className="ml-4 shrink-0 text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                    AI Discovered
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reference Tracking */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 min-h-screen flex items-center justify-center bg-white px-6 py-24">
        <div className="max-w-3xl w-full">
          <div ref={refsRef} className={`transition-all duration-700 ${refsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <SectionLabel label="Reference Tracking" />
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Track every contact from cold to complete</h2>
            <p className="text-gray-500 text-lg mb-10 max-w-xl">
              Generate personalized outreach emails, track status, capture call notes, and keep the whole team in sync on every reference.
            </p>
          </div>
          <div className="space-y-3">
            {MOCK_REFS.map((ref, i) => (
              <div key={ref.name} {...reveal(refsVisible, 100 + i * 100)}>
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{ref.name}</p>
                    <p className="text-sm text-gray-500">{ref.title} at {ref.company}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[ref.status]}`}>
                    {ref.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interview Guide */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 min-h-screen flex items-center justify-center bg-gray-50 px-6 py-24">
        <div className="max-w-3xl w-full">
          <div ref={guideRef} className={`transition-all duration-700 ${guideVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <SectionLabel label="Interview Guide" />
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Questions tailored to every deal</h2>
            <p className="text-gray-500 text-lg mb-10 max-w-xl">
              AI generates a structured interview guide based on the company's sector, stage, and product. No more improvising on the call.
            </p>
          </div>
          <div className="space-y-3">
            {MOCK_QUESTIONS.map((q, i) => (
              <div key={q.category} {...reveal(guideVisible, 100 + i * 120)}>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500">{q.category}</span>
                  <p className="text-gray-900 font-medium mt-1">{q.question}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signal Synthesis */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 min-h-screen flex items-center justify-center bg-white px-6 py-24">
        <div className="max-w-3xl w-full">
          <div ref={signalsRef} className={`transition-all duration-700 ${signalsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <SectionLabel label="Signal Synthesis" />
            <h2 className="text-4xl font-bold text-gray-900 mb-4">AI turns call notes into IC-ready signal</h2>
            <p className="text-gray-500 text-lg mb-10 max-w-xl">
              After completing reference calls, Claude analyzes all notes and surfaces a structured report with green flags, red flags, and evidence-backed signals.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              style={{ transitionDelay: signalsVisible ? '100ms' : '0ms' }}
              className={`bg-green-50 rounded-xl border border-green-200 p-6 transition-all duration-700 ${signalsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
            >
              <h3 className="text-lg font-semibold text-green-800 mb-4">Green Flags</h3>
              <ul className="space-y-3">
                {GREEN_FLAGS.map((f, i) => (
                  <li
                    key={i}
                    style={{ transitionDelay: signalsVisible ? `${200 + i * 80}ms` : '0ms' }}
                    className={`flex gap-2 text-sm text-green-700 transition-all duration-500 ${signalsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                  >
                    <span className="mt-0.5 font-bold shrink-0">+</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              style={{ transitionDelay: signalsVisible ? '100ms' : '0ms' }}
              className={`bg-red-50 rounded-xl border border-red-200 p-6 transition-all duration-700 ${signalsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
            >
              <h3 className="text-lg font-semibold text-red-800 mb-4">Red Flags</h3>
              <ul className="space-y-3">
                {RED_FLAGS.map((f, i) => (
                  <li
                    key={i}
                    style={{ transitionDelay: signalsVisible ? `${200 + i * 80}ms` : '0ms' }}
                    className={`flex gap-2 text-sm text-red-700 transition-all duration-500 ${signalsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                  >
                    <span className="mt-0.5 font-bold shrink-0">!</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 -mb-8 bg-indigo-600 px-6 py-24 flex items-center justify-center">
        <div ref={ctaRef} className={`text-center max-w-xl transition-all duration-700 ${ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl font-bold text-white mb-3">Ready to start?</h2>
          <p className="text-indigo-200 text-lg mb-8">
            Load sample data to explore every feature, or jump straight into the guided walkthrough.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 active:scale-95 transition-all duration-200 disabled:opacity-50"
            >
              {seeding ? 'Loading...' : 'Load Sample Dataset'}
            </button>
            <button
              onClick={tutorial.start}
              className="border-2 border-white text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-500 active:scale-95 transition-all duration-200"
            >
              Start Interactive Tutorial
            </button>
          </div>
          {seedResult?.success && (
            <div className="mt-6 bg-white/20 text-white px-4 py-3 rounded-xl text-sm">
              <p className="font-medium">{seedResult.message}</p>
              {seedResult.deal_id && (
                <button
                  onClick={() => navigate(`/deals/${seedResult.deal_id}`)}
                  className="mt-2 underline hover:no-underline font-medium"
                >
                  Open the sample deal →
                </button>
              )}
            </div>
          )}
          {seedError && (
            <div className="mt-6 bg-white/20 text-white px-4 py-3 rounded-xl text-sm">{seedError}</div>
          )}
          {tutorial.progress.completed && (
            <button onClick={tutorial.reset} className="mt-4 text-indigo-300 hover:text-white text-sm transition-colors">
              Reset tutorial progress
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
