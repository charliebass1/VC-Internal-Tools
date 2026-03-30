import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { ScrollArea } from '@/components/ui/scroll-area'

interface AppLayoutProps {
  children: React.ReactNode
  onOpenCommandPalette?: () => void
}

export function AppLayout({ children, onOpenCommandPalette }: AppLayoutProps) {
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setDemoMode(d.demo_mode))
      .catch(() => {})
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onOpenCommandPalette={onOpenCommandPalette} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {demoMode && (
          <div className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm text-center py-1.5 px-4 shrink-0">
            Demo mode — AI features return sample data. Set{' '}
            <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded text-xs">ANTHROPIC_API_KEY</code>{' '}
            for real AI.
          </div>
        )}
        <ScrollArea className="flex-1">
          <main className="max-w-7xl mx-auto px-6 py-8">
            {children}
          </main>
        </ScrollArea>
      </div>
    </div>
  )
}
