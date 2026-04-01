import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Columns3,
  Briefcase,
  BookOpen,
  Users,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Mountain,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Pipeline', icon: Columns3, path: '/pipeline' },
  { label: 'Deals', icon: Briefcase, path: '/deals' },
  { label: 'Network', icon: Users, path: '/network' },
  { label: 'Tutorial', icon: BookOpen, path: '/tutorial' },
  { label: 'Settings', icon: Settings, path: '/settings' },
]

interface SidebarProps {
  onOpenCommandPalette?: () => void
}

export function Sidebar({ onOpenCommandPalette }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('teton-sidebar-collapsed') === 'true'
  })
  const location = useLocation()

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      localStorage.setItem('teton-sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex flex-col h-screen border-r border-sidebar-border bg-sidebar text-sidebar-foreground shrink-0 overflow-hidden"
    >
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 h-16 shrink-0">
        <Mountain className="h-6 w-6 text-primary shrink-0" />
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold text-primary whitespace-nowrap"
          >
            Teton
          </motion.span>
        )}
      </div>

      <Separator />

      {/* Search trigger */}
      {onOpenCommandPalette && (
        <div className="px-3 pt-3">
          <button
            onClick={onOpenCommandPalette}
            className={cn(
              'flex items-center gap-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors',
              collapsed && 'justify-center px-0'
            )}
          >
            <Search className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Search...</span>
                <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </>
            )}
          </button>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)

          const link = (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                collapsed && 'justify-center px-0'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )

          if (collapsed) {
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          }

          return link
        })}
      </nav>

      {/* Bottom controls */}
      <div className="shrink-0 px-3 pb-3 space-y-1">
        <Separator className="mb-2" />
        <div className={cn('flex items-center', collapsed ? 'flex-col gap-1' : 'justify-between')}>
          <ThemeToggle />
          <button
            onClick={toggleCollapsed}
            className="inline-flex items-center justify-center rounded-md h-9 w-9 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
