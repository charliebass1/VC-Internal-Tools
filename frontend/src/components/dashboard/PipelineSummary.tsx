import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'

const STAGES = [
  { key: 'screening', label: 'Screening', color: 'bg-blue-500' },
  { key: 'deep_dive', label: 'Deep Dive', color: 'bg-amber-500' },
  { key: 'ic_review', label: 'IC Review', color: 'bg-purple-500' },
  { key: 'closed', label: 'Closed', color: 'bg-emerald-500' },
]

interface PipelineSummaryProps {
  pipelineCounts: Record<string, number>
  loading?: boolean
}

export function PipelineSummary({ pipelineCounts, loading }: PipelineSummaryProps) {
  const total = Object.values(pipelineCounts).reduce((a, b) => a + b, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pipeline Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 bg-muted rounded animate-pulse" />
        ) : total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No deals in the pipeline yet.
          </p>
        ) : (
          <>
            <div className="flex rounded-lg overflow-hidden h-8">
              {STAGES.map((stage) => {
                const count = pipelineCounts[stage.key] || 0
                const pct = (count / total) * 100
                if (pct === 0) return null
                return (
                  <motion.div
                    key={stage.key}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`${stage.color} flex items-center justify-center text-white text-xs font-medium`}
                    title={`${stage.label}: ${count}`}
                  >
                    {pct > 15 && count}
                  </motion.div>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              {STAGES.map((stage) => (
                <div key={stage.key} className="flex items-center gap-2 text-sm">
                  <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                  <span className="text-muted-foreground">{stage.label}</span>
                  <span className="font-medium">{pipelineCounts[stage.key] || 0}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
