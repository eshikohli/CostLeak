import OpenAI from 'openai'
import { MOCK_RECOMMENDATIONS } from './mockData'

export interface Recommendation {
  issue: string
  recommendedFix: string
  expectedImpact: string
  estimatedBeforeCost: string
  estimatedAfterCost: string
  estimatedSavings: string
  estimationNote: string
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
      "expectedImpact": "What cost/performance improvement this change will bring",
      "estimatedBeforeCost": "Estimated monthly cost before the fix, e.g. '$80/mo'",
      "estimatedAfterCost": "Estimated monthly cost after the fix, e.g. '$8/mo'",
      "estimatedSavings": "Potential savings phrase, e.g. 'Save about $72/mo'",
      "estimationNote": "One sentence clarifying these are directional estimates based on the described usage pattern"
    }
  ]
}

For the cost estimates:
- Use simple rounded dollar amounts like '$20/mo', '$5/mo', '$150/mo'
- Base them on the pattern severity: high-frequency calls cost more, caching/deduplication saves the most
- Do not pretend to be exact — keep the estimationNote honest about this
- If the pattern involves very high frequency (every keystroke, no debounce), lean toward higher before-cost estimates
- If the pattern is caching or deduplication, savings are typically 70-90%
- If the pattern is polling too frequently, savings are typically 50-80%
- If the pattern is over-fetching or batching, savings are typically 30-60%

Return exactly 2 or 3 recommendations. Be specific — avoid generic advice like "optimize your code".`

interface CostEstimate {
  estimatedBeforeCost: string
  estimatedAfterCost: string
  estimatedSavings: string
  estimationNote: string
}

function heuristicEstimate(description: string, issue: string): CostEstimate {
  const text = (description + ' ' + issue).toLowerCase()

  const isHighFrequency =
    /keystroke|every key|every char|every request|every click|each character|on every/.test(text)
  const isPolling =
    /poll|every \d+ second|interval|setinterval|frequent(ly)? check/.test(text)
  const isCaching =
    /cach|duplicat|repeated|same (prompt|request|query|address|call)|identical/.test(text)
  const isCheaperModel =
    /gpt-4(?!o-mini)|expensive model|cheaper model|model selection|use gpt/.test(text)
  const isOverfetch =
    /over.?fetch|full (dataset|object|catalog|response)|unnecessary field|unused field|batch/.test(text)

  if (isHighFrequency) {
    return {
      estimatedBeforeCost: '$90/mo',
      estimatedAfterCost: '$8/mo',
      estimatedSavings: 'Save about $82/mo',
      estimationNote:
        'Directional estimate based on high-frequency call patterns. Actual savings depend on user count and session length.',
    }
  }
  if (isCaching) {
    return {
      estimatedBeforeCost: '$60/mo',
      estimatedAfterCost: '$8/mo',
      estimatedSavings: 'Save about $52/mo',
      estimationNote:
        'Directional estimate based on repeated identical requests. Savings scale with how often the same inputs recur.',
    }
  }
  if (isCheaperModel) {
    return {
      estimatedBeforeCost: '$80/mo',
      estimatedAfterCost: '$18/mo',
      estimatedSavings: 'Save about $62/mo',
      estimationNote:
        'Directional estimate based on model pricing tiers. GPT-4o-mini is roughly 15x cheaper per token than GPT-4o.',
    }
  }
  if (isPolling) {
    return {
      estimatedBeforeCost: '$45/mo',
      estimatedAfterCost: '$10/mo',
      estimatedSavings: 'Save about $35/mo',
      estimationNote:
        'Directional estimate based on polling frequency described. Savings depend on job volume and how often you poll.',
    }
  }
  if (isOverfetch) {
    return {
      estimatedBeforeCost: '$30/mo',
      estimatedAfterCost: '$12/mo',
      estimatedSavings: 'Save about $18/mo',
      estimationNote:
        'Directional estimate based on over-fetching patterns. Savings depend on payload size and request frequency.',
    }
  }

  return {
    estimatedBeforeCost: '$40/mo',
    estimatedAfterCost: '$14/mo',
    estimatedSavings: 'Save about $26/mo',
    estimationNote:
      'Directional estimate based on the described usage pattern. Actual costs vary with usage volume.',
  }
}

function applyEstimateFallbacks(
  recommendations: Partial<Recommendation>[],
  description: string
): Recommendation[] {
  return recommendations.map((r) => {
    const issue = r.issue ?? ''
    const fallback = heuristicEstimate(description, issue)
    return {
      issue,
      recommendedFix: r.recommendedFix ?? '',
      expectedImpact: r.expectedImpact ?? '',
      estimatedBeforeCost: r.estimatedBeforeCost?.trim() || fallback.estimatedBeforeCost,
      estimatedAfterCost: r.estimatedAfterCost?.trim() || fallback.estimatedAfterCost,
      estimatedSavings: r.estimatedSavings?.trim() || fallback.estimatedSavings,
      estimationNote: r.estimationNote?.trim() || fallback.estimationNote,
    }
  })
}

export async function analyzeUsage(
  description: string,
  apiCategory: string
): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey || apiKey.trim() === '') {
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

  const raw = JSON.parse(content) as { summary: string; recommendations: Partial<Recommendation>[] }
  return {
    summary: raw.summary,
    recommendations: applyEstimateFallbacks(raw.recommendations ?? [], description),
  }
}
