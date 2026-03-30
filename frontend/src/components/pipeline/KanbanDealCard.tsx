import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Deal } from '@/types'

interface KanbanDealCardProps {
  deal: Deal
}

export function KanbanDealCard({ deal }: KanbanDealCardProps) {
  const navigate = useNavigate()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn('cursor-grab active:cursor-grabbing', isDragging && 'opacity-50')}
    >
      <Card
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/deals/${deal.id}`)}
      >
        <CardContent className="p-3 space-y-2">
          <p className="font-medium text-sm">{deal.company_name}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {deal.sector && (
              <Badge variant="secondary" className="text-xs">
                {deal.sector}
              </Badge>
            )}
          </div>
          {typeof deal.reference_count === 'number' && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>
                {deal.completed_references}/{deal.reference_count} refs
              </span>
              {deal.reference_count > 0 && (
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden ml-1">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{
                      width: `${(deal.completed_references / deal.reference_count) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
