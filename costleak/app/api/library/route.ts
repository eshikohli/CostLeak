import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const saved = await prisma.savedRecommendation.findMany({
    where: {
      saved: true,
      analysis: { userId: session.id },
    },
    include: { analysis: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ saved })
}
