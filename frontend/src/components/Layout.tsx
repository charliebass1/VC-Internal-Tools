import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setDemoMode(d.demo_mode))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen">
      {demoMode && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm text-center py-2 px-4">
          Demo mode — AI features return sample data. Set <code className="font-mono bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> in <code className="font-mono bg-amber-100 px-1 rounded">.env</code> for real AI.
        </div>
      )}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-indigo-600">RefCheck</span>
              <span className="text-sm text-gray-400 font-medium">by VC Internal Tools</span>
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
