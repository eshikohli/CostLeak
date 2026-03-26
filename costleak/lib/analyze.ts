import OpenAI from 'openai'
import { MOCK_RECOMMENDATIONS } from './mockData'

export type RiskLevel = 'Low' | 'Medium' | 'High'

export interface Recommendation {
  issue: string
  recommendedFix: string
  expectedImpact: string
  estimatedBeforeCost: string
  estimatedAfterCost: string
  estimatedSavings: string
  estimationNote: string
  alternativeOption: string
}

export interface AnalysisResult {
  summary: string
  riskLevel: RiskLevel
  riskReason: string
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
  "riskLevel": "High",
  "riskReason": "One sentence explaining why this risk level was chosen, e.g. 'Your description suggests real-time API calls on every user action with no caching, which can generate very high usage quickly.'",
  "recommendations": [
    {
      "issue": "Specific inefficient pattern found",
      "recommendedFix": "Concrete, actionable fix with a brief example if helpful",
      "expectedImpact": "What cost/performance improvement this change will bring",
      "estimatedBeforeCost": "Estimated monthly cost before the fix, e.g. '$80/mo'",
      "estimatedAfterCost": "Estimated monthly cost after the fix, e.g. '$8/mo'",
      "estimatedSavings": "Potential savings phrase, e.g. 'Save about $72/mo'",
      "estimationNote": "One sentence clarifying these are directional estimates based on the described usage pattern",
      "alternativeOption": "Optional: only include this field when a genuinely cheaper or more appropriate alternative exists for this specific pattern. Leave it out or use an empty string if no clear alternative applies."
    }
  ]
}

Guidelines for alternativeOption:
- Only include it when there is a concrete, realistic alternative that fits the scenario
- Do NOT add it to every recommendation — most recommendations should not need it
- Good cases to include it: using a large LLM for simple classification/formatting (suggest a smaller model), repeated full generation where embeddings or caching could replace it, a heavy endpoint where a lighter one exists
- Keep it to one short sentence. Examples:
  - "Consider gpt-4o-mini instead of gpt-4o for simple classification or summarization — it costs roughly 15x less per token."
  - "Consider using OpenAI embeddings with a vector store for repeated lookups rather than regenerating answers each time."
  - "Consider caching geocoding results locally instead of calling the Maps API on every request."
- Avoid vague suggestions like "use a cheaper API" — be specific about what and why
- Do not make strong guarantees about pricing or claim one provider is always better

For riskLevel, choose exactly one of: "Low", "Medium", or "High".
- High: repeated real-time calls with no caching, every-keystroke triggering, very frequent polling, identical requests sent repeatedly at scale
- Medium: some unnecessary repeated calls, moderate over-fetching, infrequent polling, lack of batching
- Low: minor inefficiencies, low-frequency usage, some optimization already present

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

function heuristicRisk(description: string): { riskLevel: RiskLevel; riskReason: string } {
  const text = description.toLowerCase()

  const isHighFrequency =
    /keystroke|every key|every char|each character|on every (type|keystroke|input|click)/.test(text)
  const isFrequentPolling =
    /every [1-5] second|poll.{0,20}(second|frequent)|setinterval.{0,30}(1000|2000|3000|5000)/.test(text)
  const isRepeatedWithNoCache =
    /(repeated|again and again|every time|each time|always).{0,60}(no cach|without cach|don.t cach|not cach)/.test(text) ||
    /(no cach|without cach|don.t cach|not cach).{0,60}(repeated|again|every time|each time)/.test(text)
  const isSameCallsRepeatedly =
    /same (prompt|request|query|call|address).{0,40}(again|repeated|multiple|every)/.test(text) ||
    /identical (prompt|request|query|call)/.test(text)

  if (isHighFrequency || isFrequentPolling || isRepeatedWithNoCache || isSameCallsRepeatedly) {
    return {
      riskLevel: 'High',
      riskReason:
        'Your description suggests repeated or real-time API calls with no apparent caching, which can generate high usage costs quickly.',
    }
  }

  const isModeratePolling =
    /poll|every \d+ (second|minute)|interval|check.{0,20}(status|update)/.test(text)
  const isOverfetch =
    /full (dataset|catalog|object|list|response)|all (fields|data)|every (field|column|page refresh|page load)/.test(text)
  const isRepeatedCalls =
    /repeated|again and again|every time|each time|every visit|every page/.test(text)
  const isMissingCache =
    /no cach|without cach|don.t cach|not cach|missing cach/.test(text)

  if (isModeratePolling || isOverfetch || isRepeatedCalls || isMissingCache) {
    return {
      riskLevel: 'Medium',
      riskReason:
        'Your description includes some inefficient patterns that could lead to unnecessary API usage over time, but the overall impact is moderate.',
    }
  }

  return {
    riskLevel: 'Low',
    riskReason:
      'Your description suggests a limited-frequency usage pattern. There may be small improvements available, but overall cost risk appears low.',
  }
}

function heuristicAlternative(description: string, apiCategory: string): string {
  const text = description.toLowerCase()

  const isHighFreqLLM =
    (apiCategory === 'OpenAI') &&
    /keystroke|every key|every char|each character|on every|every (request|call|input)/.test(text)
  const isRepeatedLLMCalls =
    (apiCategory === 'OpenAI') &&
    /same (prompt|question|query)|identical (prompt|request)|repeated.{0,30}(prompt|llm|openai|gpt)|faq|common question/.test(text)
  const isExpensiveModelHint =
    (apiCategory === 'OpenAI') &&
    /classif|label|format|extract|simple (task|question|answer)|short (answer|response)|yes.no|true.false/.test(text)
  const isRepeatedGeocode =
    (apiCategory === 'Google Maps') &&
    /same (address|location|place)|repeated|every (time|visit|request)/.test(text)

  if (isHighFreqLLM) {
    return 'Consider gpt-4o-mini instead of a larger model for real-time or high-frequency calls — it costs significantly less per token and responds faster.'
  }
  if (isRepeatedLLMCalls) {
    return 'Consider using OpenAI embeddings with a vector store to match questions to pre-generated answers, rather than regenerating a response on every call.'
  }
  if (isExpensiveModelHint) {
    return 'For simple classification, labeling, or formatting tasks, gpt-4o-mini is often sufficient and costs roughly 15x less per token than gpt-4o.'
  }
  if (isRepeatedGeocode) {
    return 'Consider caching geocoding results in your database after the first lookup, so repeat requests for the same address skip the API entirely.'
  }

  return ''
}

function applyEstimateFallbacks(
  recommendations: Partial<Recommendation>[],
  description: string,
  apiCategory: string
): Recommendation[] {
  const alternativeFallback = heuristicAlternative(description, apiCategory)
  return recommendations.map((r, i) => {
    const issue = r.issue ?? ''
    const fallback = heuristicEstimate(description, issue)
    const llmAlternative = r.alternativeOption?.trim() || ''
    return {
      issue,
      recommendedFix: r.recommendedFix ?? '',
      expectedImpact: r.expectedImpact ?? '',
      estimatedBeforeCost: r.estimatedBeforeCost?.trim() || fallback.estimatedBeforeCost,
      estimatedAfterCost: r.estimatedAfterCost?.trim() || fallback.estimatedAfterCost,
      estimatedSavings: r.estimatedSavings?.trim() || fallback.estimatedSavings,
      estimationNote: r.estimationNote?.trim() || fallback.estimationNote,
      // Apply heuristic fallback only on the first rec if LLM didn't provide any
      alternativeOption: llmAlternative || (i === 0 ? alternativeFallback : ''),
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

  const raw = JSON.parse(content) as {
    summary: string
    riskLevel?: string
    riskReason?: string
    recommendations: Partial<Recommendation>[]
  }

  const validLevels: RiskLevel[] = ['Low', 'Medium', 'High']
  const llmRiskLevel = validLevels.includes(raw.riskLevel as RiskLevel)
    ? (raw.riskLevel as RiskLevel)
    : null

  const fallbackRisk = heuristicRisk(description)

  return {
    summary: raw.summary,
    riskLevel: llmRiskLevel ?? fallbackRisk.riskLevel,
    riskReason: raw.riskReason?.trim() || fallbackRisk.riskReason,
    recommendations: applyEstimateFallbacks(raw.recommendations ?? [], description, apiCategory),
  }
}
