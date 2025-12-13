// app/competitions/[slug]/page.tsx
import { notFound } from 'next/navigation'
import CompetitionDetailPage from '@/components/pages/competitions/competition-detail-page'

interface PageProps {
  params: Promise<{
    competitionId: string
  }>
}

export default async function CompetitionDetailRoute({ params }: PageProps) {
    const {competitionId} = await params
  return <CompetitionDetailPage competitionId={competitionId} />
}