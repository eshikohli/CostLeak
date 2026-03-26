'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

interface SavedItem {
  id: string
  issue: string
  recommendedFix: string
  expectedImpact: string
  estimatedBeforeCost: string
  estimatedAfterCost: string
  estimatedSavings: string
  estimationNote: string
  alternativeOption: string
  createdAt: Date | string
  analysis: {
    description: string
    apiCategory: string
    riskLevel: string
  }
}

const CATEGORIES = ['All', 'OpenAI', 'Google Maps', 'Cloud / Other'] as const
type Category = (typeof CATEGORIES)[number]

export default function LibraryClient({
  userEmail,
  saved,
}: {
  userEmail: string
  saved: SavedItem[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialCategory = (): Category => {
    const param = searchParams.get('category')
    return (CATEGORIES as readonly string[]).includes(param ?? '')
      ? (param as Category)
      : 'All'
  }

  const [activeCategory, setActiveCategory] = useState<Category>(initialCategory)

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (activeCategory === 'All') {
      params.delete('category')
    } else {
      params.set('category', activeCategory)
    }
    const qs = params.toString()
    router.replace(`/library${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [activeCategory])

  const filtered =
    activeCategory === 'All'
      ? saved
      : saved.filter((item) => item.analysis.apiCategory === activeCategory)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="font-bold text-xl text-gray-900">CostLeak</span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
              Analyze
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
        {/* Header row */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">My Library</h1>
            <p className="text-gray-500">
              {filtered.length === 0
                ? activeCategory === 'All'
                  ? 'No saved recommendations yet.'
                  : `No saved recommendations for ${activeCategory}.`
                : `${filtered.length} saved recommendation${filtered.length !== 1 ? 's' : ''}${activeCategory !== 'All' ? ` in ${activeCategory}` : ''}`}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            New analysis
          </Link>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors border ${
                activeCategory === cat
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <p className="text-gray-400 mb-4">
              {activeCategory === 'All'
                ? 'No saved recommendations yet.'
                : `No saved recommendations for ${activeCategory}.`}
            </p>
            {activeCategory === 'All' ? (
              <Link href="/dashboard" className="text-sm text-gray-900 underline">
                Analyze your API usage to get started
              </Link>
            ) : (
              <button
                onClick={() => setActiveCategory('All')}
                className="text-sm text-gray-900 underline"
              >
                Show all categories
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    {item.analysis.apiCategory}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    item.analysis.riskLevel === 'High'
                      ? 'bg-red-100 text-red-600'
                      : item.analysis.riskLevel === 'Medium'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {item.analysis.riskLevel} Risk
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 mb-1">Original scenario</p>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                    {item.analysis.description}
                  </p>
                </div>

                <h3 className="font-semibold text-gray-900 mb-3">{item.issue}</h3>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Recommended Fix</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{item.recommendedFix}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Expected Impact</p>
                    <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg leading-relaxed">
                      {item.expectedImpact}
                    </p>
                  </div>
                  {item.alternativeOption && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Alternative Option</p>
                      <p className="text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg leading-relaxed">
                        {item.alternativeOption}
                      </p>
                    </div>
                  )}
                  {item.estimatedBeforeCost && (
                    <div className="border border-gray-100 rounded-xl p-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Estimated Cost Impact</p>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">Before</p>
                          <p className="text-base font-semibold text-red-500">{item.estimatedBeforeCost}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">After</p>
                          <p className="text-base font-semibold text-green-600">{item.estimatedAfterCost}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">Potential Savings</p>
                          <p className="text-base font-semibold text-gray-900">{item.estimatedSavings}</p>
                        </div>
                      </div>
                      {item.estimationNote && (
                        <p className="text-xs text-gray-400 italic">{item.estimationNote}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
