import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import {
  LayoutDashboard,
  Columns3,
  Briefcase,
  BookOpen,
  Plus,
  Search,
  Moon,
  Sun,
} from 'lucide-react'
import { listDeals } from '@/api'
import { useThemeContext } from '@/contexts/ThemeContext'
import type { Deal } from '@/types'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useThemeContext()
  const [deals, setDeals] = useState<Deal[]>([])

  useEffect(() => {
    if (open) {
      listDeals().then(setDeals).catch(() => {})
    }
  }, [open])

  const runAction = (fn: () => void) => {
    fn()
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-lg">
        <Command
          className="rounded-lg border bg-popover text-popover-foreground shadow-2xl"
          label="Command palette"
        >
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Search deals, navigate..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
              <Command.Item
                onSelect={() => runAction(() => navigate('/'))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Command.Item>
              <Command.Item
                onSelect={() => runAction(() => navigate('/pipeline'))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Columns3 className="h-4 w-4" /> Pipeline
              </Command.Item>
              <Command.Item
                onSelect={() => runAction(() => navigate('/deals'))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Briefcase className="h-4 w-4" /> Deals
              </Command.Item>
              <Command.Item
                onSelect={() => runAction(() => navigate('/tutorial'))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <BookOpen className="h-4 w-4" /> Tutorial
              </Command.Item>
            </Command.Group>

            {deals.length > 0 && (
              <Command.Group heading="Deals" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                {deals.map(deal => (
                  <Command.Item
                    key={deal.id}
                    value={deal.company_name}
                    onSelect={() => runAction(() => navigate(`/deals/${deal.id}`))}
                    className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{deal.company_name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {deal.stage.replace('_', ' ')}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
              <Command.Item
                onSelect={() => runAction(() => navigate('/deals?new=true'))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Plus className="h-4 w-4" /> Create New Deal
              </Command.Item>
              <Command.Item
                onSelect={() => runAction(toggleTheme)}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
