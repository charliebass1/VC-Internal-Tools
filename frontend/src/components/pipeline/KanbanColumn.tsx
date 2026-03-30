import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import type { Deal } from '@/types'
import { KanbanDealCard } from './KanbanDealCard'

interface KanbanColumnProps {
  stage: string
  label: string
  color: string
  deals: Deal[]
}

export function KanbanColumn({ stage, label, color, deals }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-lg border bg-muted/50 min-h-[400px] w-72 shrink-0',
        isOver && 'ring-2 ring-primary/50'
      )}
    >
      <div className="flex items-center gap-2 p-3 border-b">
        <div className={`h-3 w-3 rounded-full ${color}`} />
        <h3 className="font-semibold text-sm">{label}</h3>
        <span className="ml-auto text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {deals.length}
        </span>
      </div>
      <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-2 space-y-2 overflow-y-auto">
          {deals.map(deal => (
            <KanbanDealCard key={deal.id} deal={deal} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
