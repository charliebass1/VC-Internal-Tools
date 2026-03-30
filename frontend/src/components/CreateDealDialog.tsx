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
import { createDeal } from '@/api'
import type { Deal } from '@/types'

interface CreateDealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (deal: Deal) => void
}

const INITIAL_FORM = {
  company_name: '',
  company_website: '',
  sector: '',
  stage: 'screening',
  lead_partner: '',
  description: '',
}

export function CreateDealDialog({ open, onOpenChange, onCreated }: CreateDealDialogProps) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const deal = await createDeal(form)
      toast.success('Deal created successfully')
      setForm(INITIAL_FORM)
      onOpenChange(false)
      onCreated?.(deal)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create deal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add a New Deal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Company Name *</label>
              <Input
                required
                value={form.company_name}
                onChange={e => setForm({ ...form, company_name: e.target.value })}
                placeholder="Acme Corp"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Website</label>
              <Input
                value={form.company_website}
                onChange={e => setForm({ ...form, company_website: e.target.value })}
                placeholder="https://acme.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Sector</label>
              <Input
                value={form.sector}
                onChange={e => setForm({ ...form, sector: e.target.value })}
                placeholder="B2B SaaS"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Stage</label>
              <select
                value={form.stage}
                onChange={e => setForm({ ...form, stage: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="screening">Screening</option>
                <option value="deep_dive">Deep Dive</option>
                <option value="ic_review">IC Review</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Lead Partner</label>
              <Input
                value={form.lead_partner}
                onChange={e => setForm({ ...form, lead_partner: e.target.value })}
                placeholder="Jane Smith"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              rows={2}
              placeholder="Brief description of what the company does..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Deal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
