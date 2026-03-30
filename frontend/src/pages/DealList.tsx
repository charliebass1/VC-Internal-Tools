import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { listDeals } from '@/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreateDealDialog } from '@/components/CreateDealDialog'
import type { Deal } from '@/types'

const STAGE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  screening: 'secondary',
  deep_dive: 'default',
  ic_review: 'default',
  closed: 'outline',
}

export default function DealList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(searchParams.get('new') === 'true')

  useEffect(() => {
    loadDeals()
  }, [])

  async function loadDeals() {
    try {
      const data = await listDeals()
      setDeals(data)
    } catch {
      toast.error('Failed to load deals. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  function handleDialogChange(open: boolean) {
    setDialogOpen(open)
    if (!open) {
      searchParams.delete('new')
      setSearchParams(searchParams, { replace: true })
    }
  }

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-9 w-48 mb-2 bg-muted animate-pulse rounded" />
            <div className="h-5 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-28 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border bg-card p-6">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-36 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Deals</h1>
          <p className="text-muted-foreground mt-1">Track and reference-check your active deals</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Deal
        </Button>
      </div>

      <CreateDealDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        onCreated={() => loadDeals()}
      />

      {deals.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold mb-2">No deals yet</h2>
          <p className="text-muted-foreground mb-4">Create your first deal to start reference checking.</p>
          <button
            onClick={() => navigate('/tutorial')}
            className="text-primary hover:underline text-sm font-medium"
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
              className="deal-card-enter rounded-xl border bg-card p-6 hover:shadow-md hover:border-primary/20 transition-all duration-200 block"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{deal.company_name}</h3>
                  <div className="flex gap-3 mt-2 text-sm text-muted-foreground">
                    {deal.sector && <span>{deal.sector}</span>}
                    {deal.lead_partner && <span>Lead: {deal.lead_partner}</span>}
                  </div>
                  {deal.description && (
                    <p className="text-muted-foreground mt-2 text-sm line-clamp-2">{deal.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={STAGE_VARIANTS[deal.stage] || 'secondary'}>
                    {deal.stage.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
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
