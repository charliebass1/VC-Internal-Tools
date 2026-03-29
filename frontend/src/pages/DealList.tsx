import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listDeals, createDeal } from '../api'
import { Deal } from '../types'

const STAGES: Record<string, string> = {
  screening: 'bg-yellow-100 text-yellow-800',
  deep_dive: 'bg-blue-100 text-blue-800',
  ic_review: 'bg-purple-100 text-purple-800',
  closed: 'bg-gray-100 text-gray-600',
}

export default function DealList() {
  const navigate = useNavigate()
  const [deals, setDeals] = useState<Deal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    company_name: '',
    company_website: '',
    sector: '',
    lead_partner: '',
    description: '',
  })
  const [loading, setLoading] = useState(true)
  const [backendDown, setBackendDown] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    loadDeals()
  }, [])

  async function loadDeals() {
    try {
      const data = await listDeals()
      setDeals(data)
      setBackendDown(false)
    } catch (e) {
      setBackendDown(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    try {
      await createDeal(form)
      setForm({ company_name: '', company_website: '', sector: '', lead_partner: '', description: '' })
      setShowForm(false)
      loadDeals()
    } catch (e: any) {
      setCreateError(e.message || 'Failed to create deal — is the backend running?')
    }
  }

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="skeleton h-9 w-48 mb-2" />
            <div className="skeleton h-5 w-64" />
          </div>
          <div className="skeleton h-10 w-28 rounded-lg" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="skeleton h-6 w-48" />
                  <div className="skeleton h-4 w-36" />
                  <div className="skeleton h-4 w-72" />
                </div>
                <div className="skeleton h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {backendDown && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          <strong>Backend not reachable.</strong> Start the dev server with <code className="font-mono bg-red-100 px-1 rounded">./scripts/dev.sh</code> from the project root, then refresh this page.
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deal Pipeline</h1>
          <p className="text-gray-500 mt-1">Track and reference-check your active deals</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all duration-200 font-medium"
        >
          + New Deal
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Add a New Deal</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                required
                value={form.company_name}
                onChange={e => setForm({ ...form, company_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                value={form.company_website}
                onChange={e => setForm({ ...form, company_website: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="https://acme.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
              <input
                value={form.sector}
                onChange={e => setForm({ ...form, sector: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="B2B SaaS"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Partner</label>
              <input
                value={form.lead_partner}
                onChange={e => setForm({ ...form, lead_partner: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="Jane Smith"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              rows={2}
              placeholder="Brief description of what the company does..."
            />
          </div>
          {createError && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {createError}
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all duration-200 font-medium">
              Create Deal
            </button>
            <button type="button" onClick={() => { setShowForm(false); setCreateError('') }} className="text-gray-500 px-4 py-2 hover:text-gray-700 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {deals.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No deals yet</h2>
          <p className="text-gray-500 mb-4">Create your first deal to start reference checking.</p>
          <button
            onClick={() => navigate('/tutorial')}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium underline"
          >
            New here? Take the platform tutorial &rarr;
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {deals.map((deal, index) => (
            <Link
              key={deal.id}
              to={`/deals/${deal.id}`}
              style={{ animationDelay: `${index * 60}ms` }}
              className="deal-card-enter bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-indigo-200 transition-all duration-200 block"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{deal.company_name}</h3>
                  <div className="flex gap-3 mt-2 text-sm text-gray-500">
                    {deal.sector && <span>{deal.sector}</span>}
                    {deal.lead_partner && <span>Lead: {deal.lead_partner}</span>}
                  </div>
                  {deal.description && (
                    <p className="text-gray-600 mt-2 text-sm line-clamp-2">{deal.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${STAGES[deal.stage] || STAGES.screening}`}>
                    {deal.stage.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-400">
                    {deal.completed_references}/{deal.reference_count} refs done
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
