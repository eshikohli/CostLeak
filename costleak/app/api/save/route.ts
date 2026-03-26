import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { recommendationId } = await req.json()

  const rec = await prisma.savedRecommendation.findUnique({
    where: { id: recommendationId },
    include: { analysis: true },
  })

  if (!rec || rec.analysis.userId !== session.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await prisma.savedRecommendation.update({
    where: { id: recommendationId },
    data: { saved: !rec.saved },
  })

  return NextResponse.json({ saved: updated.saved })
}
