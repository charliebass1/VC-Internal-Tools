import { useState, useEffect } from 'react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { listDeals, updateDeal } from '@/api'
import { KanbanColumn } from '@/components/pipeline/KanbanColumn'
import { KanbanDealCard } from '@/components/pipeline/KanbanDealCard'
import type { Deal } from '@/types'

const STAGES = [
  { key: 'screening', label: 'Screening', color: 'bg-blue-500' },
  { key: 'deep_dive', label: 'Deep Dive', color: 'bg-amber-500' },
  { key: 'ic_review', label: 'IC Review', color: 'bg-purple-500' },
  { key: 'closed', label: 'Closed', color: 'bg-emerald-500' },
]

export default function Pipeline() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  useEffect(() => {
    listDeals()
      .then(setDeals)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const groupedDeals = STAGES.reduce<Record<string, Deal[]>>((acc, stage) => {
    acc[stage.key] = deals.filter(d => d.stage === stage.key)
    return acc
  }, {})

  const activeDeal = deals.find(d => d.id === activeId) || null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const dealId = active.id as string
    const deal = deals.find(d => d.id === dealId)
    if (!deal) return

    let targetStage = over.id as string
    if (!STAGES.find(s => s.key === targetStage)) {
      const targetDeal = deals.find(d => d.id === over.id)
      if (targetDeal) targetStage = targetDeal.stage
      else return
    }

    if (deal.stage === targetStage) return

    // Optimistic update
    setDeals(prev =>
      prev.map(d => (d.id === dealId ? { ...d, stage: targetStage } : d))
    )

    updateDeal(dealId, { stage: targetStage }).catch(() => {
      // Revert on failure
      setDeals(prev =>
        prev.map(d => (d.id === dealId ? { ...d, stage: deal.stage } : d))
      )
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(s => (
            <div key={s.key} className="w-72 h-[400px] rounded-lg bg-muted animate-pulse shrink-0" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-muted-foreground mt-1">Drag deals between stages to update their status.</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => (
            <KanbanColumn
              key={stage.key}
              stage={stage.key}
              label={stage.label}
              color={stage.color}
              deals={groupedDeals[stage.key] || []}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal ? <KanbanDealCard deal={activeDeal} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
