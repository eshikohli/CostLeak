import OpenAI from 'openai'
import { MOCK_RECOMMENDATIONS } from './mockData'

export interface Recommendation {
  issue: string
  recommendedFix: string
  expectedImpact: string
}

export interface AnalysisResult {
  summary: string
  recommendations: Recommendation[]
}

const SYSTEM_PROMPT = `You are a cost-saving advisor for developers who use external APIs. Your job is to analyze how a developer is using an API and identify inefficient patterns that lead to unnecessary costs.

Your audience is beginner builders and first-time founders. Keep your language clear, practical, and friendly. Avoid jargon.

Focus on patterns like:
- Caching missing or insufficient
- Repeated identical requests
- Calling APIs too frequently (polling, no debounce)
- Fetching more data than needed (over-fetching)
- Using expensive operations when cheaper ones exist
- Not batching requests when possible
- Not storing/reusing computed results

Return ONLY a JSON object with this exact shape:
{
  "summary": "A short 1-2 sentence explanation of the main cost issues",
  "recommendations": [
    {
      "issue": "Specific inefficient pattern found",
      "recommendedFix": "Concrete, actionable fix with a brief example if helpful",
      "expectedImpact": "What cost/performance improvement this change will bring"
    }
  ]
}

Return exactly 2 or 3 recommendations. Be specific — avoid generic advice like "optimize your code".`

export async function analyzeUsage(
  description: string,
  apiCategory: string
): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey || apiKey.trim() === '') {
    // Mock fallback
    await new Promise((r) => setTimeout(r, 800))
    return MOCK_RECOMMENDATIONS
  }

  const client = new OpenAI({ apiKey })

  const userMessage = `API Category: ${apiCategory}

How I'm using the API:
${description}

Please analyze this and return your structured recommendations as JSON.`

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error('Empty response from OpenAI')

  const result = JSON.parse(content) as AnalysisResult
  return result
}
