import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import {
  getDeal, deleteDeal, updateDeal,
  listReferences, createReference, updateReference, deleteReference,
  addNote, discoverCustomers, generateOutreach,
  generateInterviewGuide, synthesizeSignals, getSignalReports,
  getCompanyProfile, enrichCompany, listTouchpoints,
  getEvaluation, upsertEvaluation, analyzeDemoTranscript,
  listDiligenceWorkstreams, createDiligenceWorkstream, updateDiligenceWorkstream,
  deleteDiligenceWorkstream, seedDiligenceChecklist, generateDiligenceChecklist,
} from '@/api'
import { Deal, ReferenceContact, SignalReport, CompanyProfile, Touchpoint, ProductEvaluation, DemoAnalysis, DiligenceWorkstream } from '@/types'
import { CompanyProfileCard } from '@/components/CompanyProfileCard'
import { Timeline } from '@/components/timeline/Timeline'
import { AddTouchpointDialog } from '@/components/timeline/AddTouchpointDialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  identified: 'bg-gray-100 text-gray-700',
  outreach_sent: 'bg-yellow-100 text-yellow-800',
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-700',
}

const SOURCE_LABELS: Record<string, string> = {
  company_provided: 'Company Provided',
  discovered: 'AI Discovered',
  backchannel: 'Backchannel',
}

export default function DealDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [deal, setDeal] = useState<Deal | null>(null)
  const [references, setReferences] = useState<ReferenceContact[]>([])
  const [signals, setSignals] = useState<SignalReport[]>([])
  const [tab, setTab] = useState<'references' | 'discover' | 'guide' | 'signals' | 'timeline' | 'evaluation' | 'diligence'>('references')
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null)
  const [enriching, setEnriching] = useState(false)
  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>([])
  const [touchpointDialogOpen, setTouchpointDialogOpen] = useState(false)

  // Form states
  const [showAddRef, setShowAddRef] = useState(false)
  const [refForm, setRefForm] = useState({ name: '', title: '', company: '', email: '', source: 'company_provided' })
  const [noteForm, setNoteForm] = useState<Record<string, string>>({})
  const [discoveredCustomers, setDiscoveredCustomers] = useState<any[]>([])
  const [interviewGuide, setInterviewGuide] = useState('')
  const [outreachResult, setOutreachResult] = useState<Record<string, string>>({})
  const [expandedRef, setExpandedRef] = useState<string | null>(null)

  // Product evaluation state
  const [evaluation, setEvaluation] = useState<ProductEvaluation | null>(null)
  const [evalScores, setEvalScores] = useState<Record<string, number | null>>({
    ux_score: null, performance_score: null, integration_score: null,
    roadmap_score: null, moat_score: null,
  })
  const [evalNotes, setEvalNotes] = useState<Record<string, string>>({
    ux_notes: '', performance_notes: '', integration_notes: '',
    roadmap_notes: '', moat_notes: '',
  })
  const [reviewData, setReviewData] = useState({
    g2_rating: '' as string, g2_review_count: '' as string,
    capterra_rating: '' as string, capterra_review_count: '' as string,
  })
  const [demoTranscript, setDemoTranscript] = useState('')
  const [demoAnalysis, setDemoAnalysis] = useState<DemoAnalysis | null>(null)
  const [evalSaving, setEvalSaving] = useState(false)

  // Diligence state
  const [workstreams, setWorkstreams] = useState<DiligenceWorkstream[]>([])
  const [diligenceLoading, setDiligenceLoading] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    customer: true, legal: true, financial: true, technical: true, market: true, team: true, commercial: true,
  })

  useEffect(() => {
    if (id) loadAll()
  }, [id])

  async function loadAll() {
    try {
      const [d, refs, sigs, profile, tps, evalData, diligenceData] = await Promise.all([
        getDeal(id!),
        listReferences(id!),
        getSignalReports(id!),
        getCompanyProfile(id!).catch(() => null),
        listTouchpoints(id!).catch(() => []),
        getEvaluation(id!).catch(() => null),
        listDiligenceWorkstreams(id!).catch(() => []),
      ])
      setDeal(d)
      setReferences(refs)
      setSignals(sigs)
      setCompanyProfile(profile)
      setTouchpoints(tps)
      setWorkstreams(diligenceData)
      if (evalData) {
        setEvaluation(evalData)
        setEvalScores({
          ux_score: evalData.ux_score, performance_score: evalData.performance_score,
          integration_score: evalData.integration_score, roadmap_score: evalData.roadmap_score,
          moat_score: evalData.moat_score,
        })
        setEvalNotes({
          ux_notes: evalData.ux_notes || '', performance_notes: evalData.performance_notes || '',
          integration_notes: evalData.integration_notes || '', roadmap_notes: evalData.roadmap_notes || '',
          moat_notes: evalData.moat_notes || '',
        })
        setReviewData({
          g2_rating: evalData.g2_rating != null ? String(evalData.g2_rating) : '',
          g2_review_count: evalData.g2_review_count != null ? String(evalData.g2_review_count) : '',
          capterra_rating: evalData.capterra_rating != null ? String(evalData.capterra_rating) : '',
          capterra_review_count: evalData.capterra_review_count != null ? String(evalData.capterra_review_count) : '',
        })
        setDemoTranscript(evalData.demo_transcript || '')
        if (evalData.demo_analysis) {
          try { setDemoAnalysis(JSON.parse(evalData.demo_analysis)) } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load deal')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddRef(e: React.FormEvent) {
    e.preventDefault()
    await createReference(id!, refForm)
    setRefForm({ name: '', title: '', company: '', email: '', source: 'company_provided' })
    setShowAddRef(false)
    loadAll()
  }

  async function handleStatusChange(refId: string, status: string) {
    await updateReference(refId, { status })
    loadAll()
  }

  async function handleAddNote(refId: string) {
    const content = noteForm[refId]
    if (!content?.trim()) return
    await addNote(refId, { content, interviewer: deal?.lead_partner || '' })
    setNoteForm({ ...noteForm, [refId]: '' })
    loadAll()
  }

  async function handleDiscover() {
    if (!deal) return
    setAiLoading(true)
    try {
      const result = await discoverCustomers(id!, {
        company_name: deal.company_name,
        company_website: deal.company_website,
        sector: deal.sector,
        description: deal.description,
      })
      setDiscoveredCustomers(result.customers || [])
    } catch (e: any) {
      toast.error(e.message || 'Discovery failed')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleAddDiscovered(customer: any) {
    await createReference(id!, {
      name: customer.name,
      title: customer.title,
      company: customer.company,
      source: 'discovered',
    })
    setDiscoveredCustomers(discoveredCustomers.filter(c => c.name !== customer.name))
    loadAll()
  }

  async function handleOutreach(ref: ReferenceContact) {
    setAiLoading(true)
    try {
      const result = await generateOutreach(ref.id, {
        reference_name: ref.name,
        reference_company: ref.company,
        reference_title: ref.title,
        target_company: deal!.company_name,
      })
      setOutreachResult({ ...outreachResult, [ref.id]: result.email })
    } catch (e: any) {
      toast.error(e.message || 'Outreach generation failed')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleInterviewGuide() {
    if (!deal) return
    setAiLoading(true)
    try {
      const result = await generateInterviewGuide(id!, {
        company_name: deal.company_name,
        sector: deal.sector,
      })
      setInterviewGuide(result.guide)
    } catch (e: any) {
      toast.error(e.message || 'Guide generation failed')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSynthesize() {
    setAiLoading(true)
    try {
      await synthesizeSignals(id!)
      const sigs = await getSignalReports(id!)
      setSignals(sigs)
      setTab('signals')
    } catch (e: any) {
      toast.error(e.message || 'Synthesis failed')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleEnrich() {
    if (!deal) return
    setEnriching(true)
    try {
      const profile = await enrichCompany(id!, {
        company_name: deal.company_name,
        company_website: deal.company_website,
        sector: deal.sector,
        description: deal.description,
      })
      setCompanyProfile(profile)
      toast.success('Company profile enriched')
    } catch (e: any) {
      toast.error(e.message || 'Enrichment failed')
    } finally {
      setEnriching(false)
    }
  }

  async function handleReEnrich() {
    setCompanyProfile(null)
    await handleEnrich()
  }

  // Product Evaluation handlers
  function computeOverallScore(): number | null {
    const scores = Object.values(evalScores).filter((s): s is number => s !== null)
    if (scores.length === 0) return null
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
  }

  async function handleSaveEvaluation() {
    setEvalSaving(true)
    try {
      const overall = computeOverallScore()
      const payload = {
        ...evalScores,
        ...evalNotes,
        g2_rating: reviewData.g2_rating ? parseFloat(reviewData.g2_rating) : null,
        g2_review_count: reviewData.g2_review_count ? parseInt(reviewData.g2_review_count) : null,
        capterra_rating: reviewData.capterra_rating ? parseFloat(reviewData.capterra_rating) : null,
        capterra_review_count: reviewData.capterra_review_count ? parseInt(reviewData.capterra_review_count) : null,
        overall_score: overall,
      }
      const saved = await upsertEvaluation(id!, payload)
      setEvaluation(saved)
      toast.success('Evaluation saved')
    } catch (e: any) {
      toast.error(e.message || 'Failed to save evaluation')
    } finally {
      setEvalSaving(false)
    }
  }

  async function handleAnalyzeDemo() {
    if (!demoTranscript.trim()) return
    setAiLoading(true)
    try {
      let evalId = evaluation?.id
      if (!evalId) {
        const saved = await upsertEvaluation(id!, { ...evalScores, ...evalNotes })
        setEvaluation(saved)
        evalId = saved.id
      }
      const result = await analyzeDemoTranscript(evalId!, demoTranscript, deal!.company_name, deal!.sector)
      setDemoAnalysis(result)
      toast.success('Demo analysis complete')
    } catch (e: any) {
      toast.error(e.message || 'Demo analysis failed')
    } finally {
      setAiLoading(false)
    }
  }

  function handleApplySuggestedScores() {
    if (!demoAnalysis?.suggested_scores) return
    const suggested = demoAnalysis.suggested_scores
    setEvalScores(prev => ({
      ux_score: suggested.ux_score ?? prev.ux_score,
      performance_score: suggested.performance_score ?? prev.performance_score,
      integration_score: suggested.integration_score ?? prev.integration_score,
      roadmap_score: suggested.roadmap_score ?? prev.roadmap_score,
      moat_score: suggested.moat_score ?? prev.moat_score,
    }))
    toast.success('Suggested scores applied — click Save to persist')
  }

  // Diligence handlers
  async function handleSeedChecklist() {
    setDiligenceLoading(true)
    try {
      const items = await seedDiligenceChecklist(id!)
      setWorkstreams(prev => [...prev, ...items])
      toast.success(`${items.length} items added`)
    } catch (e: any) {
      toast.error(e.message || 'Failed to seed checklist')
    } finally {
      setDiligenceLoading(false)
    }
  }

  async function handleGenerateChecklist() {
    if (!deal) return
    setDiligenceLoading(true)
    try {
      const result = await generateDiligenceChecklist(id!, {
        company_name: deal.company_name,
        sector: deal.sector,
        stage: deal.stage,
        description: deal.description,
      })
      const items = result.items || []
      const created = await Promise.all(
        items.map((item: any) => createDiligenceWorkstream(id!, item))
      )
      setWorkstreams(prev => [...prev, ...created])
      toast.success(`AI generated ${created.length} checklist items`)
    } catch (e: any) {
      toast.error(e.message || 'AI generation failed')
    } finally {
      setDiligenceLoading(false)
    }
  }

  async function handleToggleStatus(item: DiligenceWorkstream) {
    const next = item.status === 'complete' ? 'not_started' : 'complete'
    try {
      const updated = await updateDiligenceWorkstream(item.id, { status: next })
      setWorkstreams(prev => prev.map(w => w.id === item.id ? updated : w))
    } catch (e: any) {
      toast.error(e.message || 'Update failed')
    }
  }

  async function handleUpdateWorkstreamField(id: string, field: string, value: string) {
    try {
      const updated = await updateDiligenceWorkstream(id, { [field]: value })
      setWorkstreams(prev => prev.map(w => w.id === id ? updated : w))
    } catch (e: any) {
      toast.error(e.message || 'Update failed')
    }
  }

  async function handleDeleteWorkstream(itemId: string) {
    try {
      await deleteDiligenceWorkstream(itemId)
      setWorkstreams(prev => prev.filter(w => w.id !== itemId))
    } catch (e: any) {
      toast.error(e.message || 'Delete failed')
    }
  }

  function computeIcReadiness(): number | null {
    if (workstreams.length === 0) return null
    const complete = workstreams.filter(w => w.status === 'complete').length
    return Math.round((complete / workstreams.length) * 100)
  }

  async function handleDeleteDeal() {
    if (!confirm('Delete this deal and all its references?')) return
    await deleteDeal(id!)
    navigate('/deals')
  }

  async function handleDeleteRef(refId: string) {
    await deleteReference(refId)
    loadAll()
  }

  async function handleStageChange(stage: string) {
    await updateDeal(id!, { stage })
    loadAll()
  }

  if (loading) return (
    <div>
      <div className="skeleton h-4 w-24 mb-4" />
      <div className="skeleton h-9 w-64 mb-3" />
      <div className="flex gap-3 mb-6">
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-5 w-24" />
      </div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 p-4"><div className="skeleton h-8 w-10 mx-auto mb-2" /><div className="skeleton h-4 w-16 mx-auto" /></div>)}
      </div>
      <div className="skeleton h-10 w-80 rounded-lg mb-6" />
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 p-4"><div className="skeleton h-5 w-56" /></div>)}
      </div>
    </div>
  )
  if (!deal) return <div className="text-center py-20 text-red-500">Deal not found</div>

  const latestReport = signals.length > 0 ? signals[signals.length - 1] : null

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to="/deals" className="text-primary hover:text-primary/80 text-sm mb-2 inline-block">&larr; All Deals</Link>
          <h1 className="text-3xl font-bold text-gray-900">{deal.company_name}</h1>
          <div className="flex gap-3 mt-2 text-sm text-gray-500">
            {deal.company_website && <a href={deal.company_website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{deal.company_website}</a>}
            {deal.sector && <span className="bg-gray-100 px-2 py-0.5 rounded">{deal.sector}</span>}
            {deal.lead_partner && <span>Lead: {deal.lead_partner}</span>}
          </div>
          {deal.description && <p className="text-gray-600 mt-2 max-w-2xl">{deal.description}</p>}
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={deal.stage}
            onChange={e => handleStageChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="screening">Screening</option>
            <option value="deep_dive">Deep Dive</option>
            <option value="ic_review">IC Review</option>
            <option value="closed">Closed</option>
          </select>
          <button onClick={handleDeleteDeal} className="text-red-400 hover:text-red-600 text-sm px-2">Delete</button>
        </div>
      </div>

      {/* Company Profile Card */}
      <CompanyProfileCard
        profile={companyProfile}
        deal={deal}
        onEnrich={handleEnrich}
        onReEnrich={handleReEnrich}
        enriching={enriching}
      />

      {/* Stats Bar */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{references.length}</div>
          <div className="text-sm text-gray-500">Total Refs</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{references.filter(r => r.status === 'completed').length}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{references.filter(r => r.status === 'scheduled').length}</div>
          <div className="text-sm text-gray-500">Scheduled</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{signals.length}</div>
          <div className="text-sm text-gray-500">Signal Reports</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          {(() => {
            const score = computeOverallScore()
            const color = score === null ? 'text-gray-400' : score >= 3.5 ? 'text-green-600' : score >= 2.5 ? 'text-yellow-600' : 'text-red-600'
            return (
              <>
                <div className={`text-2xl font-bold ${color}`}>
                  {score !== null ? `${score.toFixed(1)}` : '—'}
                </div>
                <div className="text-sm text-gray-500">Product Score</div>
              </>
            )
          })()}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          {(() => {
            const pct = computeIcReadiness()
            const color = pct === null ? 'text-gray-400' : pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-yellow-600' : 'text-red-600'
            return (
              <>
                <div className={`text-2xl font-bold ${color}`}>
                  {pct !== null ? `${pct}%` : '—'}
                </div>
                <div className="text-sm text-gray-500">IC Readiness</div>
              </>
            )
          })()}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-muted p-1 rounded-lg w-fit flex-wrap">
        {(['references', 'timeline', 'discover', 'guide', 'signals', 'evaluation', 'diligence'] as const).map(t => {
          const labels: Record<string, string> = {
            references: 'References',
            timeline: `Timeline (${touchpoints.length})`,
            discover: 'AI Discovery',
            guide: 'Interview Guide',
            signals: 'Signal Report',
            evaluation: 'Product Eval',
            diligence: 'Diligence',
          }
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                tab === t ? 'bg-white dark:bg-background text-gray-900 dark:text-foreground shadow-sm' : 'text-gray-500 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground'
              }`}
            >
              {labels[t]}
            </button>
          )
        })}
      </div>

      {/* Tab content with fade-in on switch */}
      <div key={tab} className="tab-content-enter">

      {/* References Tab */}
      {tab === 'references' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Reference Contacts</h2>
            <div className="flex gap-2">
              <button onClick={() => setShowAddRef(!showAddRef)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700 active:scale-95 transition-all duration-200">
                + Add Reference
              </button>
              {references.some(r => r.notes.length > 0) && (
                <button
                  onClick={handleSynthesize}
                  disabled={aiLoading}
                  className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-emerald-700 active:scale-95 transition-all duration-200 disabled:opacity-50"
                >
                  {aiLoading ? 'Synthesizing...' : 'Synthesize Signals'}
                </button>
              )}
            </div>
          </div>

          {showAddRef && (
            <form onSubmit={handleAddRef} className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Name *" value={refForm.name} onChange={e => setRefForm({ ...refForm, name: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Title" value={refForm.title} onChange={e => setRefForm({ ...refForm, title: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Company (customer)" value={refForm.company} onChange={e => setRefForm({ ...refForm, company: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Email" value={refForm.email} onChange={e => setRefForm({ ...refForm, email: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2 mt-3">
                <select value={refForm.source} onChange={e => setRefForm({ ...refForm, source: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="company_provided">Company Provided</option>
                  <option value="discovered">AI Discovered</option>
                  <option value="backchannel">Backchannel</option>
                </select>
                <button type="submit" className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm">Add</button>
                <button type="button" onClick={() => setShowAddRef(false)} className="text-gray-500 text-sm">Cancel</button>
              </div>
            </form>
          )}

          {references.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">No references yet. Add one manually or use AI Discovery.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {references.map(ref => (
                <div key={ref.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => setExpandedRef(expandedRef === ref.id ? null : ref.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-gray-900">{ref.name}</span>
                        {ref.title && <span className="text-gray-500 ml-2">{ref.title}</span>}
                        {ref.company && <span className="text-gray-400 ml-2">at {ref.company}</span>}
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-gray-400">{SOURCE_LABELS[ref.source]}</span>
                        <select
                          value={ref.status}
                          onChange={e => { e.stopPropagation(); handleStatusChange(ref.id, e.target.value) }}
                          onClick={e => e.stopPropagation()}
                          className={`text-xs px-2 py-1 rounded-full border-0 ${STATUS_COLORS[ref.status]}`}
                        >
                          <option value="identified">Identified</option>
                          <option value="outreach_sent">Outreach Sent</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="declined">Declined</option>
                        </select>
                        <span className="text-gray-300">{expandedRef === ref.id ? '▲' : '▼'}</span>
                      </div>
                    </div>
                  </div>

                  {expandedRef === ref.id && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                      <div className="flex gap-2 text-sm">
                        {ref.email && <span className="text-gray-500">Email: {ref.email}</span>}
                        {ref.linkedin_url && <a href={ref.linkedin_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">LinkedIn</a>}
                      </div>

                      {/* Outreach */}
                      <div>
                        <button
                          onClick={() => handleOutreach(ref)}
                          disabled={aiLoading}
                          className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                          {aiLoading ? 'Generating...' : 'Generate Outreach Email'}
                        </button>
                        {(outreachResult[ref.id] || ref.outreach_template) && (
                          <pre className="mt-2 p-3 bg-white rounded-lg border border-gray-200 text-sm whitespace-pre-wrap font-sans">
                            {outreachResult[ref.id] || ref.outreach_template}
                          </pre>
                        )}
                      </div>

                      {/* Notes */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Call Notes ({ref.notes.length})</h4>
                        {ref.notes.map(note => (
                          <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-3 mb-2">
                            <div className="text-xs text-gray-400 mb-1">
                              {new Date(note.call_date).toLocaleDateString()} {note.interviewer && `- ${note.interviewer}`}
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                          </div>
                        ))}
                        <div className="flex gap-2 mt-2">
                          <textarea
                            placeholder="Add call notes..."
                            value={noteForm[ref.id] || ''}
                            onChange={e => setNoteForm({ ...noteForm, [ref.id]: e.target.value })}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            rows={2}
                          />
                          <button
                            onClick={() => handleAddNote(ref.id)}
                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm self-end hover:bg-indigo-700"
                          >
                            Save
                          </button>
                        </div>
                      </div>

                      <button onClick={() => handleDeleteRef(ref.id)} className="text-red-400 hover:text-red-600 text-xs">
                        Remove reference
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline Tab */}
      {tab === 'timeline' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Meeting Timeline</h2>
            <Button size="sm" onClick={() => setTouchpointDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Log Touchpoint
            </Button>
          </div>
          <Timeline touchpoints={touchpoints} />
          <AddTouchpointDialog
            open={touchpointDialogOpen}
            onOpenChange={setTouchpointDialogOpen}
            dealId={id!}
            onCreated={loadAll}
          />
        </div>
      )}

      {/* AI Discovery Tab */}
      {tab === 'discover' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-2">AI Customer Discovery</h2>
          <p className="text-gray-500 text-sm mb-4">
            Use AI to suggest likely customers of <strong>{deal.company_name}</strong> that you can reach out to for independent reference checks.
          </p>
          <button
            onClick={handleDiscover}
            disabled={aiLoading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all duration-200 disabled:opacity-50"
          >
            {aiLoading ? 'Discovering...' : 'Discover Customers'}
          </button>

          {discoveredCustomers.length > 0 && (
            <div className="mt-6 space-y-3">
              {discoveredCustomers.map((c, i) => (
                <div key={i} className="flex justify-between items-center border border-gray-200 rounded-lg p-4">
                  <div>
                    <div className="font-medium text-gray-900">{c.name}</div>
                    <div className="text-sm text-gray-500">{c.title} at {c.company}</div>
                    {c.reasoning && <div className="text-sm text-gray-400 mt-1">{c.reasoning}</div>}
                  </div>
                  <button
                    onClick={() => handleAddDiscovered(c)}
                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700"
                  >
                    Add as Reference
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interview Guide Tab */}
      {tab === 'guide' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-2">Interview Guide</h2>
          <p className="text-gray-500 text-sm mb-4">
            Generate a tailored reference check interview guide for <strong>{deal.company_name}</strong>.
          </p>
          <button
            onClick={handleInterviewGuide}
            disabled={aiLoading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all duration-200 disabled:opacity-50"
          >
            {aiLoading ? 'Generating...' : 'Generate Interview Guide'}
          </button>
          {interviewGuide && (
            <div className="mt-6 prose prose-sm max-w-none">
              <ReactMarkdown>{interviewGuide}</ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {/* Signal Report Tab */}
      {tab === 'signals' && (
        <div>
          {!latestReport ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500 mb-4">No signal reports yet. Complete some reference calls, add notes, then synthesize.</p>
              <button
                onClick={() => setTab('references')}
                className="text-indigo-600 hover:underline text-sm"
              >
                Go to References
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-3">Overall Assessment</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{latestReport.summary}</p>
                <div className="text-xs text-gray-400 mt-3">
                  Generated {new Date(latestReport.generated_at).toLocaleString()}
                </div>
              </div>

              {/* Flags */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl border border-green-200 p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">Green Flags</h3>
                  <ul className="space-y-2">
                    {latestReport.green_flags.map((f, i) => (
                      <li key={i} className="flex gap-2 text-sm text-green-700">
                        <span className="mt-0.5">+</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50 rounded-xl border border-red-200 p-6">
                  <h3 className="text-lg font-semibold text-red-800 mb-3">Red Flags</h3>
                  <ul className="space-y-2">
                    {latestReport.red_flags.map((f, i) => (
                      <li key={i} className="flex gap-2 text-sm text-red-700">
                        <span className="mt-0.5">!</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Detailed Signals */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Detailed Signals</h3>
                <div className="space-y-3">
                  {latestReport.signals.map((sig, i) => (
                    <div key={i} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">
                            {sig.category.replace('_', ' ')}
                          </span>
                          <p className="text-sm text-gray-900 mt-1 font-medium">{sig.signal}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          sig.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                          sig.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {sig.sentiment}
                        </span>
                      </div>
                      {sig.evidence && (
                        <p className="text-sm text-gray-500 mt-2 italic">"{sig.evidence}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product Evaluation Tab */}
      {tab === 'evaluation' && (
        <div className="space-y-6">
          {/* Section A: Scoring Rubric */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Product Scoring Rubric</h2>
              <div className="flex items-center gap-3">
                {(() => {
                  const score = computeOverallScore()
                  if (score === null) return <span className="text-sm text-gray-400">No scores yet</span>
                  const color = score >= 3.5 ? 'text-green-600 bg-green-50 border-green-200' : score >= 2.5 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' : 'text-red-600 bg-red-50 border-red-200'
                  return <span className={`text-lg font-bold px-3 py-1 rounded-lg border ${color}`}>{score.toFixed(1)} / 5</span>
                })()}
                <button
                  onClick={handleSaveEvaluation}
                  disabled={evalSaving}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 active:scale-95 transition-all duration-200 disabled:opacity-50"
                >
                  {evalSaving ? 'Saving...' : 'Save Scores'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {([
                { key: 'ux', label: 'UX / Usability', desc: 'Intuitiveness, self-serve capability, onboarding friction' },
                { key: 'performance', label: 'Performance', desc: 'Speed, reliability, uptime from references and demo' },
                { key: 'integration', label: 'Integration Depth', desc: 'API quality, ecosystem connectors, data portability' },
                { key: 'roadmap', label: 'Roadmap Credibility', desc: 'Realism, team capacity to execute, prioritization' },
                { key: 'moat', label: 'Technical Moat', desc: 'Defensibility, switching costs, data flywheel' },
              ] as const).map(dim => {
                const scoreKey = `${dim.key}_score` as keyof typeof evalScores
                const notesKey = `${dim.key}_notes` as keyof typeof evalNotes
                const currentScore = evalScores[scoreKey]

                return (
                  <div key={dim.key} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-gray-900">{dim.label}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{dim.desc}</p>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => setEvalScores({ ...evalScores, [scoreKey]: currentScore === n ? null : n })}
                            className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                              currentScore !== null && n <= currentScore
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      placeholder={`Notes on ${dim.label.toLowerCase()}...`}
                      value={evalNotes[notesKey]}
                      onChange={e => setEvalNotes({ ...evalNotes, [notesKey]: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 resize-none"
                      rows={2}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section B: Review Aggregation */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Review Aggregation</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">G2</h3>
                <div className="flex gap-2">
                  <input
                    type="number" step="0.1" min="0" max="5" placeholder="Rating (0-5)"
                    value={reviewData.g2_rating}
                    onChange={e => setReviewData({ ...reviewData, g2_rating: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32"
                  />
                  <input
                    type="number" min="0" placeholder="# Reviews"
                    value={reviewData.g2_review_count}
                    onChange={e => setReviewData({ ...reviewData, g2_review_count: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Capterra</h3>
                <div className="flex gap-2">
                  <input
                    type="number" step="0.1" min="0" max="5" placeholder="Rating (0-5)"
                    value={reviewData.capterra_rating}
                    onChange={e => setReviewData({ ...reviewData, capterra_rating: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32"
                  />
                  <input
                    type="number" min="0" placeholder="# Reviews"
                    value={reviewData.capterra_review_count}
                    onChange={e => setReviewData({ ...reviewData, capterra_review_count: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32"
                  />
                </div>
              </div>
            </div>
            {evaluation?.review_summary && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">AI Review Summary</h4>
                <p className="text-sm text-gray-600">{evaluation.review_summary}</p>
              </div>
            )}
          </div>

          {/* Section C: Demo Analysis */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Demo Analysis</h2>
            <textarea
              placeholder="Paste demo transcript or notes here..."
              value={demoTranscript}
              onChange={e => setDemoTranscript(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              rows={6}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAnalyzeDemo}
                disabled={aiLoading || !demoTranscript.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 active:scale-95 transition-all duration-200 disabled:opacity-50"
              >
                {aiLoading ? 'Analyzing...' : 'Analyze Demo'}
              </button>
            </div>

            {demoAnalysis && (
              <div className="mt-6 space-y-4">
                {/* Summary */}
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-sm text-indigo-900">{demoAnalysis.summary}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Key Strengths */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="text-sm font-semibold text-green-800 mb-2">Key Strengths</h4>
                    <ul className="space-y-1">
                      {demoAnalysis.key_strengths.map((s, i) => (
                        <li key={i} className="text-sm text-green-700 flex gap-2">
                          <span className="mt-0.5 shrink-0">+</span><span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-2">Weaknesses</h4>
                    <ul className="space-y-1">
                      {demoAnalysis.weaknesses.map((w, i) => (
                        <li key={i} className="text-sm text-yellow-700 flex gap-2">
                          <span className="mt-0.5 shrink-0">-</span><span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Follow-up Questions */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">Follow-up Questions</h4>
                    <ul className="space-y-1">
                      {demoAnalysis.follow_up_questions.map((q, i) => (
                        <li key={i} className="text-sm text-blue-700 flex gap-2">
                          <span className="mt-0.5 shrink-0">?</span><span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Red Flags */}
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="text-sm font-semibold text-red-800 mb-2">Red Flags</h4>
                    <ul className="space-y-1">
                      {demoAnalysis.red_flags.map((f, i) => (
                        <li key={i} className="text-sm text-red-700 flex gap-2">
                          <span className="mt-0.5 shrink-0">!</span><span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Suggested Scores */}
                {demoAnalysis.suggested_scores && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">AI Suggested Scores</h4>
                      <button
                        onClick={handleApplySuggestedScores}
                        className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-700 active:scale-95 transition-all"
                      >
                        Apply Suggestions
                      </button>
                    </div>
                    <div className="flex gap-4">
                      {Object.entries(demoAnalysis.suggested_scores).map(([key, val]) => (
                        <div key={key} className="text-center">
                          <div className="text-lg font-bold text-indigo-600">{val}</div>
                          <div className="text-xs text-gray-500">{key.replace('_score', '').replace('_', ' ')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Diligence Tab */}
      {tab === 'diligence' && (
        <div className="space-y-4">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Diligence Checklist</h2>
            <div className="flex gap-2">
              <button
                onClick={handleGenerateChecklist}
                disabled={diligenceLoading}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700 active:scale-95 transition-all duration-200 disabled:opacity-50"
              >
                {diligenceLoading ? 'Working...' : 'Generate AI Checklist'}
              </button>
              <button
                onClick={handleSeedChecklist}
                disabled={diligenceLoading}
                className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 active:scale-95 transition-all duration-200 disabled:opacity-50"
              >
                Seed Default Checklist
              </button>
            </div>
          </div>

          {workstreams.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500 mb-2">No diligence items yet.</p>
              <p className="text-sm text-gray-400">Seed the default checklist or generate an AI-tailored one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(['customer', 'legal', 'financial', 'technical', 'market', 'team', 'commercial'] as const).map(cat => {
                const items = workstreams.filter(w => w.category === cat)
                if (items.length === 0) return null
                const complete = items.filter(w => w.status === 'complete').length
                const isExpanded = expandedCategories[cat] !== false

                const CATEGORY_LABELS: Record<string, string> = {
                  customer: 'Customer', legal: 'Legal', financial: 'Financial',
                  technical: 'Technical', market: 'Market', team: 'Team', commercial: 'Commercial',
                }

                return (
                  <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition text-left"
                      onClick={() => setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }))}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">{CATEGORY_LABELS[cat]}</span>
                        <span className="text-xs text-gray-400">{complete}/{items.length} complete</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full">
                          <div
                            className={`h-1.5 rounded-full transition-all ${complete === items.length ? 'bg-green-500' : 'bg-indigo-500'}`}
                            style={{ width: `${(complete / items.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {items.map(item => (
                          <div key={item.id} className="p-3 flex items-start gap-3 hover:bg-gray-50 transition">
                            <button
                              onClick={() => handleToggleStatus(item)}
                              className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                item.status === 'complete'
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : item.status === 'blocked'
                                  ? 'border-red-400 bg-red-50'
                                  : item.status === 'in_progress'
                                  ? 'border-blue-400 bg-blue-50'
                                  : 'border-gray-300'
                              }`}
                            >
                              {item.status === 'complete' && <span className="text-xs font-bold">✓</span>}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-medium ${item.status === 'complete' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                  {item.title}
                                </span>
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                  item.priority === 'high' ? 'bg-red-100 text-red-700' :
                                  item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-500'
                                }`}>
                                  {item.priority}
                                </span>
                                <select
                                  value={item.status}
                                  onChange={e => handleUpdateWorkstreamField(item.id, 'status', e.target.value)}
                                  className="text-xs border border-gray-200 rounded px-1.5 py-0.5 text-gray-600"
                                >
                                  <option value="not_started">Not Started</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="blocked">Blocked</option>
                                  <option value="complete">Complete</option>
                                </select>
                              </div>
                              <div className="flex gap-2 mt-1">
                                <input
                                  type="text"
                                  placeholder="Owner..."
                                  defaultValue={item.owner}
                                  onBlur={e => handleUpdateWorkstreamField(item.id, 'owner', e.target.value)}
                                  className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 w-32"
                                />
                                <button
                                  onClick={() => handleDeleteWorkstream(item.id)}
                                  className="text-xs text-red-400 hover:text-red-600"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      </div> {/* end tab-content-enter */}
    </div>
  )
}
