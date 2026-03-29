import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [demoMode, setDemoMode] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setDemoMode(d.demo_mode))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen">
      {demoMode && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm text-center py-2 px-4">
          Demo mode — AI features return sample data. Set <code className="font-mono bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> in <code className="font-mono bg-amber-100 px-1 rounded">.env</code> for real AI.
        </div>
      )}
      <nav className={`bg-white border-b border-gray-200 sticky top-0 z-10 transition-shadow duration-200 ${scrolled ? 'shadow-sm' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-indigo-600">RefCheck</span>
              <span className="text-sm text-gray-400 font-medium">by VC Internal Tools</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/tutorial"
                className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Tutorial
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <div ref={sentinelRef} className="h-px" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
