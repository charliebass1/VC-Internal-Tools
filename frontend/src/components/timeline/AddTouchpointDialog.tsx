import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTouchpoint } from '@/api'

interface AddTouchpointDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dealId: string
  onCreated?: () => void
}

const INITIAL = {
  type: 'meeting' as const,
  title: '',
  content: '',
  created_by: '',
  occurred_at: new Date().toISOString().slice(0, 16),
}

export function AddTouchpointDialog({ open, onOpenChange, dealId, onCreated }: AddTouchpointDialogProps) {
  const [form, setForm] = useState(INITIAL)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createTouchpoint({
        ...form,
        deal_id: dealId,
        occurred_at: new Date(form.occurred_at).toISOString(),
      })
      toast.success('Touchpoint added')
      setForm(INITIAL)
      onOpenChange(false)
      onCreated?.()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add touchpoint')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Log Touchpoint</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Type</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as any })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="meeting">Meeting</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="intro">Intro</option>
                <option value="note">Note</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date & Time</label>
              <Input
                type="datetime-local"
                value={form.occurred_at}
                onChange={e => setForm({ ...form, occurred_at: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title *</label>
            <Input
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Founder pitch meeting"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Attendee / Created by</label>
            <Input
              value={form.created_by}
              onChange={e => setForm({ ...form, created_by: e.target.value })}
              placeholder="e.g. Jane Smith"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              rows={3}
              placeholder="Meeting notes, key takeaways..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Add Touchpoint'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
