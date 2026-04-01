import { Video, Mail, Phone, UserPlus, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Touchpoint } from '@/types'

const TYPE_CONFIG: Record<string, { icon: typeof Video; label: string; color: string }> = {
  meeting: { icon: Video, label: 'Meeting', color: 'bg-blue-500' },
  email: { icon: Mail, label: 'Email', color: 'bg-amber-500' },
  call: { icon: Phone, label: 'Call', color: 'bg-emerald-500' },
  intro: { icon: UserPlus, label: 'Intro', color: 'bg-purple-500' },
  note: { icon: FileText, label: 'Note', color: 'bg-gray-500' },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

interface TimelineProps {
  touchpoints: Touchpoint[]
  loading?: boolean
}

export function Timeline({ touchpoints, loading }: TimelineProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Meeting Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (touchpoints.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Meeting Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No interactions logged yet. Add a touchpoint or sync from Granola.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Meeting Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-6">
            {touchpoints.map((tp) => {
              const config = TYPE_CONFIG[tp.type] || TYPE_CONFIG.note
              const Icon = config.icon

              return (
                <div key={tp.id} className="relative flex gap-4 pl-0">
                  {/* Icon dot */}
                  <div
                    className={`relative z-10 h-8 w-8 rounded-full ${config.color} flex items-center justify-center shrink-0`}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{tp.title || config.label}</p>
                      <Badge variant="outline" className="text-xs">
                        {config.label}
                      </Badge>
                      {tp.source === 'granola' && (
                        <Badge variant="secondary" className="text-xs">
                          Granola
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(tp.occurred_at)} at {formatTime(tp.occurred_at)}
                      {tp.created_by && ` · ${tp.created_by}`}
                      {tp.contact && ` · with ${tp.contact.name}`}
                    </p>
                    {tp.content && (
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap line-clamp-4">
                        {tp.content}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
