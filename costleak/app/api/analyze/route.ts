import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { analyzeUsage } from '@/lib/analyze'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { description, apiCategory } = await req.json()
  if (!description || description.trim().length < 10) {
    return NextResponse.json({ error: 'Please provide a more detailed description' }, { status: 400 })
  }

  const result = await analyzeUsage(description, apiCategory || 'General')

  const analysis = await prisma.analysis.create({
    data: {
      userId: session.id,
      description,
      apiCategory: apiCategory || 'General',
      summary: result.summary,
      riskLevel: result.riskLevel,
      riskReason: result.riskReason,
      recommendations: {
        create: result.recommendations.map((r) => ({
          issue: r.issue,
          recommendedFix: r.recommendedFix,
          expectedImpact: r.expectedImpact,
          estimatedBeforeCost: r.estimatedBeforeCost,
          estimatedAfterCost: r.estimatedAfterCost,
          estimatedSavings: r.estimatedSavings,
          estimationNote: r.estimationNote,
        })),
      },
    },
    include: { recommendations: true },
  })

  return NextResponse.json({ analysis })
}
