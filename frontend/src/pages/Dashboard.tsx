import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Users, Zap, CheckCircle2, Plus } from 'lucide-react'
import { getDashboardStats, getRecentActivity } from '@/api'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { PipelineSummary } from '@/components/dashboard/PipelineSummary'
import { Button } from '@/components/ui/button'
import type { DashboardStats, ActivityEvent } from '@/types'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getRecentActivity(),
    ])
      .then(([s, a]) => {
        setStats(s)
        setActivity(a)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const metrics = stats
    ? [
        { title: 'Active Deals', value: stats.activeDeals, icon: Briefcase, description: 'Currently in pipeline' },
        { title: 'Refs in Progress', value: stats.refsInProgress, icon: Users, description: 'Outreach sent or scheduled' },
        { title: 'Signals Generated', value: stats.signalsGenerated, icon: Zap, description: 'AI-powered insights' },
        { title: 'Deals Closed', value: stats.dealsClosed, icon: CheckCircle2, description: 'Successfully closed' },
      ]
    : []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your deal intelligence at a glance.</p>
        </div>
        <Button onClick={() => navigate('/deals?new=true')}>
          <Plus className="h-4 w-4 mr-2" /> New Deal
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[120px] rounded-lg bg-muted animate-pulse" />
            ))
          : metrics.map((m) => (
              <MetricCard key={m.title} {...m} />
            ))}
      </div>

      <PipelineSummary
        pipelineCounts={stats?.pipelineCounts || {}}
        loading={loading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityFeed events={activity} loading={loading} />
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/deals?new=true')}
              >
                <Plus className="h-4 w-4 mr-2" /> Create Deal
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/pipeline')}
              >
                <Briefcase className="h-4 w-4 mr-2" /> View Pipeline
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
