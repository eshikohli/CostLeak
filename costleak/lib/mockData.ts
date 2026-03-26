export const EXAMPLE_PROMPTS = [
  {
    id: 1,
    label: "OpenAI on every keystroke",
    text: "My chat app calls the OpenAI API on every single keystroke in the input box. Users type messages and each character triggers a new completion request.",
    category: "OpenAI",
  },
  {
    id: 2,
    label: "Repeated geocoding",
    text: "Every time a user opens a store detail page, my app calls the Google Maps Geocoding API to convert the store address to coordinates, even if they visit the same store multiple times.",
    category: "Google Maps",
  },
  {
    id: 3,
    label: "Full dataset on every page load",
    text: "My app fetches the entire product catalog from an external API on every page refresh. The catalog has thousands of items and rarely changes.",
    category: "Cloud / Other",
  },
  {
    id: 4,
    label: "Identical prompts to LLM",
    text: "My FAQ bot sends the same common questions to the OpenAI API repeatedly. Many users ask the exact same questions and each one triggers a fresh API call.",
    category: "OpenAI",
  },
  {
    id: 5,
    label: "Polling too frequently",
    text: "My app polls an external REST API every 2 seconds to check for status updates on a background job that typically takes 5-10 minutes to complete.",
    category: "Cloud / Other",
  },
  {
    id: 6,
    label: "Over-fetching fields",
    text: "When displaying a user list, my app requests the full user object from the API including photos, preferences, and activity history, but only displays name and email in the UI.",
    category: "Cloud / Other",
  },
]

export const MOCK_RECOMMENDATIONS = {
  summary: "Your implementation has several patterns that will lead to excessive API usage and costs. Here are specific changes to reduce your spending.",
  recommendations: [
    {
      issue: "API called on every user action without debouncing",
      recommendedFix: "Add a debounce of 300 to 500ms so the API is only called after the user pauses, not on every single event. In JavaScript: use setTimeout/clearTimeout or a library like lodash.debounce.",
      expectedImpact: "Reduces API calls by 80 to 95% for typing-triggered requests, cutting costs proportionally.",
      estimatedBeforeCost: "$90/mo",
      estimatedAfterCost: "$8/mo",
      estimatedSavings: "Save about $82/mo",
      estimationNote: "Directional estimate based on high-frequency call patterns. Actual savings depend on user count and average session length.",
    },
    {
      issue: "Same data fetched repeatedly without caching",
      recommendedFix: "Cache results in memory or localStorage using the input as the cache key. Before making an API call, check if you already have that result stored. Set a reasonable TTL (e.g. 1 hour for static data).",
      expectedImpact: "Eliminates duplicate API calls entirely for repeated inputs. Near-zero cost for cached hits.",
      estimatedBeforeCost: "$60/mo",
      estimatedAfterCost: "$8/mo",
      estimatedSavings: "Save about $52/mo",
      estimationNote: "Directional estimate based on repeated identical requests. Savings scale with how often the same inputs recur.",
    },
    {
      issue: "No request deduplication for concurrent identical calls",
      recommendedFix: "Track in-flight requests using a Map keyed by request parameters. If the same request is already pending, return the existing promise instead of starting a new one.",
      expectedImpact: "Prevents parallel duplicate calls, which is common when multiple components mount simultaneously.",
      estimatedBeforeCost: "$40/mo",
      estimatedAfterCost: "$14/mo",
      estimatedSavings: "Save about $26/mo",
      estimationNote: "Directional estimate based on the described usage pattern. Actual costs vary with usage volume.",
    },
  ],
}
