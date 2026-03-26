import Link from 'next/link'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const session = await getSession()
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <span className="font-bold text-xl text-gray-900">CostLeak</span>
        <div className="flex gap-3">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2">
            Log in
          </Link>
          <Link href="/signup" className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Stop bleeding money on<br />unnecessary API calls
        </h1>
        <p className="text-xl text-gray-500 mb-10 leading-relaxed">
          CostLeak analyzes how you&apos;re using APIs and gives you 2 to 3 specific,
          actionable fixes to reduce overuse before your bill surprises you.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-gray-900 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-gray-700 transition-colors"
        >
          Get Started
        </Link>

        {/* Steps */}
        <div className="mt-20 grid grid-cols-3 gap-8 text-left">
          {[
            {
              step: '1',
              title: 'Describe your API usage',
              desc: 'Write in plain English how your app calls external APIs. No logs needed.',
            },
            {
              step: '2',
              title: 'Get structured suggestions',
              desc: 'CostLeak returns 2–3 specific cost-saving recommendations with clear explanations.',
            },
            {
              step: '3',
              title: 'Save reusable solutions',
              desc: 'Bookmark fixes you want to remember and build your personal cost-saving library.',
            },
          ].map((item) => (
            <div key={item.step} className="p-6 border border-gray-100 rounded-xl">
              <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center text-sm font-bold mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        CostLeak: Built for builders who want to ship without surprise bills
      </footer>
    </div>
  )
}
