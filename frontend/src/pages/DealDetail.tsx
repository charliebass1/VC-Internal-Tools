import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import {
  getDeal, deleteDeal, updateDeal,
  listReferences, createReference, updateReference, deleteReference,
  addNote, discoverCustomers, generateOutreach,
  generateInterviewGuide, synthesizeSignals, getSignalReports,
} from '../api'
import { Deal, ReferenceContact, SignalReport } from '../types'

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
  const [tab, setTab] = useState<'references' | 'discover' | 'guide' | 'signals'>('references')
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')

  // Form states
  const [showAddRef, setShowAddRef] = useState(false)
  const [refForm, setRefForm] = useState({ name: '', title: '', company: '', email: '', source: 'company_provided' })
  const [noteForm, setNoteForm] = useState<Record<string, string>>({})
  const [discoveredCustomers, setDiscoveredCustomers] = useState<any[]>([])
  const [interviewGuide, setInterviewGuide] = useState('')
  const [outreachResult, setOutreachResult] = useState<Record<string, string>>({})
  const [expandedRef, setExpandedRef] = useState<string | null>(null)

  useEffect(() => {
    if (id) loadAll()
  }, [id])

  async function loadAll() {
    try {
      const [d, refs, sigs] = await Promise.all([
        getDeal(id!),
        listReferences(id!),
        getSignalReports(id!),
      ])
      setDeal(d)
      setReferences(refs)
      setSignals(sigs)
    } catch (e: any) {
      setError(e.message)
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
    setError('')
    try {
      const result = await discoverCustomers(id!, {
        company_name: deal.company_name,
        company_website: deal.company_website,
        sector: deal.sector,
        description: deal.description,
      })
      setDiscoveredCustomers(result.customers || [])
    } catch (e: any) {
      setError(e.message)
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
    setError('')
    try {
      const result = await generateOutreach(ref.id, {
        reference_name: ref.name,
        reference_company: ref.company,
        reference_title: ref.title,
        target_company: deal!.company_name,
      })
      setOutreachResult({ ...outreachResult, [ref.id]: result.email })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleInterviewGuide() {
    if (!deal) return
    setAiLoading(true)
    setError('')
    try {
      const result = await generateInterviewGuide(id!, {
        company_name: deal.company_name,
        sector: deal.sector,
      })
      setInterviewGuide(result.guide)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSynthesize() {
    setAiLoading(true)
    setError('')
    try {
      await synthesizeSignals(id!)
      const sigs = await getSignalReports(id!)
      setSignals(sigs)
      setTab('signals')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleDeleteDeal() {
    if (!confirm('Delete this deal and all its references?')) return
    await deleteDeal(id!)
    navigate('/')
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
          <Link to="/" className="text-indigo-600 hover:text-indigo-800 text-sm mb-2 inline-block">&larr; All Deals</Link>
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button onClick={() => setError('')} className="ml-2 font-bold">&times;</button>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-8">
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
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {(['references', 'discover', 'guide', 'signals'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'references' ? 'References' : t === 'discover' ? 'AI Discovery' : t === 'guide' ? 'Interview Guide' : 'Signal Report'}
          </button>
        ))}
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

      </div> {/* end tab-content-enter */}
    </div>
  )
}
