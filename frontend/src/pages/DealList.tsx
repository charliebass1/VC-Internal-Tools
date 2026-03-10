import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listDeals, createDeal } from '../api'
import { Deal } from '../types'

const STAGES: Record<string, string> = {
  screening: 'bg-yellow-100 text-yellow-800',
  deep_dive: 'bg-blue-100 text-blue-800',
  ic_review: 'bg-purple-100 text-purple-800',
  closed: 'bg-gray-100 text-gray-600',
}

export default function DealList() {
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

  useEffect(() => {
    loadDeals()
  }, [])

  async function loadDeals() {
    try {
      const data = await listDeals()
      setDeals(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createDeal(form)
      setForm({ company_name: '', company_website: '', sector: '', lead_partner: '', description: '' })
      setShowForm(false)
      loadDeals()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deal Pipeline</h1>
          <p className="text-gray-500 mt-1">Track and reference-check your active deals</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                value={form.company_website}
                onChange={e => setForm({ ...form, company_website: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="https://acme.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
              <input
                value={form.sector}
                onChange={e => setForm({ ...form, sector: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="B2B SaaS"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Partner</label>
              <input
                value={form.lead_partner}
                onChange={e => setForm({ ...form, lead_partner: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Jane Smith"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              rows={2}
              placeholder="Brief description of what the company does..."
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium">
              Create Deal
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-4 py-2 hover:text-gray-700">
              Cancel
            </button>
          </div>
        </form>
      )}

      {deals.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No deals yet</h2>
          <p className="text-gray-500">Create your first deal to start reference checking.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {deals.map(deal => (
            <Link
              key={deal.id}
              to={`/deals/${deal.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-indigo-200 transition block"
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
