import { useState, useEffect, useCallback } from 'react'
import { AppLayout } from './layout/AppLayout'
import { CommandPalette } from '@/components/CommandPalette'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), [])

  return (
    <AppLayout onOpenCommandPalette={openCommandPalette}>
      {children}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </AppLayout>
  )
}
