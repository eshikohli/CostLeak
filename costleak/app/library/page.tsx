import { Suspense } from 'react'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import LibraryClient from './LibraryClient'

export default async function LibraryPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const saved = await prisma.savedRecommendation.findMany({
    where: {
      saved: true,
      analysis: { userId: session.id },
    },
    include: { analysis: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <Suspense>
      <LibraryClient userEmail={session.email} saved={saved} />
    </Suspense>
  )
}
