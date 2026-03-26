'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EXAMPLE_PROMPTS } from '@/lib/mockData'

interface Recommendation {
  id: string
  issue: string
  recommendedFix: string
  expectedImpact: string
  estimatedBeforeCost: string
  estimatedAfterCost: string
  estimatedSavings: string
  estimationNote: string
  saved: boolean
}

interface Analysis {
  id: string
  summary: string
  recommendations: Recommendation[]
}

export default function DashboardClient({ userEmail }: { userEmail: string }) {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [apiCategory, setApiCategory] = useState('OpenAI')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setAnalysis(null)

    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, apiCategory }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Analysis failed. Please try again.')
      return
    }

    setAnalysis(data.analysis)
  }

  async function handleSave(recommendationId: string) {
    setSavingId(recommendationId)

    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendationId }),
    })

    const data = await res.json()
    setSavingId(null)

    if (res.ok) {
      if (data.saved) {
        setSavedIds((prev) => new Set([...prev, recommendationId]))
      } else {
        setSavedIds((prev) => {
          const next = new Set(prev)
          next.delete(recommendationId)
          return next
        })
      }
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="font-bold text-xl text-gray-900">CostLeak</span>
          <div className="flex items-center gap-4">
            <Link href="/library" className="text-sm text-gray-600 hover:text-gray-900">
              My Library
            </Link>
            <span className="text-sm text-gray-400">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Analyze API Usage</h1>
          <p className="text-gray-500">Describe how your app uses an API and get specific cost-saving recommendations.</p>
        </div>

        <div className="grid grid-cols-5 gap-8">
          {/* Left: Form */}
          <div className="col-span-3">
            <form onSubmit={handleAnalyze} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Category
                </label>
                <select
                  value={apiCategory}
                  onChange={(e) => setApiCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                >
                  <option value="OpenAI">OpenAI</option>
                  <option value="Google Maps">Google Maps</option>
                  <option value="Cloud / Other">Cloud / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Describe your API usage
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                  placeholder="e.g. My app calls the OpenAI API every time a user types a character in the search box. Users often type full sentences before stopping..."
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || description.trim().length < 10}
                className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Analyzing...' : 'Get recommendations'}
              </button>
            </form>
          </div>

          {/* Right: Example prompts */}
          <div className="col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-700 mb-3">Try an example</p>
              <div className="space-y-2">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => {
                      setDescription(prompt.text)
                      setApiCategory(prompt.category)
                    }}
                    className="w-full text-left text-sm text-gray-600 px-3 py-2.5 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="mt-8 text-center py-12">
            <div className="inline-block w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Analyzing your API usage...</p>
          </div>
        )}

        {analysis && !loading && (
          <div className="mt-8">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-amber-800 mb-1">Summary</p>
              <p className="text-amber-700 text-sm">{analysis.summary}</p>
            </div>

            <div className="space-y-4">
              {analysis.recommendations.map((rec, i) => {
                const isSaved = savedIds.has(rec.id) || rec.saved
                return (
                  <div key={rec.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">
                          #{i + 1}
                        </span>
                        <p className="font-semibold text-gray-900">{rec.issue}</p>
                      </div>
                      <button
                        onClick={() => handleSave(rec.id)}
                        disabled={savingId === rec.id}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
                          isSaved
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {savingId === rec.id ? 'Saving...' : isSaved ? 'Saved' : 'Save'}
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Recommended Fix</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{rec.recommendedFix}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Expected Impact</p>
                        <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg leading-relaxed">{rec.expectedImpact}</p>
                      </div>
                      {rec.estimatedBeforeCost && (
                        <div className="border border-gray-100 rounded-xl p-4 mt-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Estimated Cost Impact</p>
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div className="text-center">
                              <p className="text-xs text-gray-400 mb-1">Before</p>
                              <p className="text-base font-semibold text-red-500">{rec.estimatedBeforeCost}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-400 mb-1">After</p>
                              <p className="text-base font-semibold text-green-600">{rec.estimatedAfterCost}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-400 mb-1">Potential Savings</p>
                              <p className="text-base font-semibold text-gray-900">{rec.estimatedSavings}</p>
                            </div>
                          </div>
                          {rec.estimationNote && (
                            <p className="text-xs text-gray-400 italic">{rec.estimationNote}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 text-center">
              <Link href="/library" className="text-sm text-gray-600 hover:text-gray-900 underline">
                View your saved library →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
