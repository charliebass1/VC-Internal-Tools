import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Plus, Search, UserPlus } from 'lucide-react'
import { listContacts, createContact, updateContact, deleteContact } from '@/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Contact } from '@/types'

const STRENGTH_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  strong: { label: 'Strong', variant: 'default' },
  warm: { label: 'Warm', variant: 'secondary' },
  cold: { label: 'Cold', variant: 'outline' },
}

const INITIAL_FORM: {
  name: string
  title: string
  company: string
  email: string
  linkedin_url: string
  relationship_strength: 'strong' | 'warm' | 'cold'
  notes: string
} = {
  name: '',
  title: '',
  company: '',
  email: '',
  linkedin_url: '',
  relationship_strength: 'cold',
  notes: '',
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadContacts()
  }, [])

  async function loadContacts() {
    try {
      const data = await listContacts()
      setContacts(data)
    } catch {
      toast.error('Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let result = contacts
    if (filter !== 'all') {
      result = result.filter(c => c.relationship_strength === filter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      )
    }
    return result
  }, [contacts, search, filter])

  function openCreate() {
    setForm(INITIAL_FORM)
    setEditingId(null)
    setDialogOpen(true)
  }

  function openEdit(contact: Contact) {
    setForm({
      name: contact.name,
      title: contact.title,
      company: contact.company,
      email: contact.email,
      linkedin_url: contact.linkedin_url,
      relationship_strength: contact.relationship_strength,
      notes: contact.notes,
    })
    setEditingId(contact.id)
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingId) {
        await updateContact(editingId, form)
        toast.success('Contact updated')
      } else {
        await createContact(form)
        toast.success('Contact created')
      }
      setDialogOpen(false)
      loadContacts()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save contact')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this contact?')) return
    try {
      await deleteContact(id)
      toast.success('Contact deleted')
      loadContacts()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete contact')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-9 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[140px] rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network</h1>
          <p className="text-muted-foreground mt-1">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''} in your firm's network
          </p>
        </div>
        <Button onClick={openCreate}>
          <UserPlus className="h-4 w-4 mr-2" /> Add Contact
        </Button>
      </div>

      {/* Search + filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'strong', 'warm', 'cold'].map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : STRENGTH_CONFIG[f]?.label || f}
            </Button>
          ))}
        </div>
      </div>

      {/* Contact grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-1">
            {contacts.length === 0 ? 'No contacts yet' : 'No matches'}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {contacts.length === 0
              ? 'Start building your network by adding contacts.'
              : 'Try adjusting your search or filters.'}
          </p>
          {contacts.length === 0 && (
            <Button onClick={openCreate} variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Add First Contact
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(contact => {
            const strength = STRENGTH_CONFIG[contact.relationship_strength] || STRENGTH_CONFIG.cold
            return (
              <Card
                key={contact.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openEdit(contact)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {contact.name
                          .split(' ')
                          .map(w => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        {contact.title && (
                          <p className="text-xs text-muted-foreground">{contact.title}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={strength.variant} className="text-xs shrink-0">
                      {strength.label}
                    </Badge>
                  </div>
                  {contact.company && (
                    <p className="text-sm text-muted-foreground mt-2">{contact.company}</p>
                  )}
                  {contact.last_contact_date && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last contact: {new Date(contact.last_contact_date).toLocaleDateString()}
                    </p>
                  )}
                  {contact.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {contact.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Name *</label>
                <Input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Partner"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Company</label>
                <Input
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                  placeholder="Acme Ventures"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="john@acme.vc"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">LinkedIn URL</label>
                <Input
                  value={form.linkedin_url}
                  onChange={e => setForm({ ...form, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Relationship</label>
                <select
                  value={form.relationship_strength}
                  onChange={e => setForm({ ...form, relationship_strength: e.target.value as any })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="strong">Strong</option>
                  <option value="warm">Warm</option>
                  <option value="cold">Cold</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                rows={2}
                placeholder="Context about this contact..."
              />
            </div>
            <div className="flex justify-between">
              <div>
                {editingId && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      handleDelete(editingId)
                      setDialogOpen(false)
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Add Contact'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
