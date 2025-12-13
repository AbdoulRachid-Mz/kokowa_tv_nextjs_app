// app/fighters/[id]/page.tsx
// import FighterProfilePage from '@/components/fighters/fighter-profile-page'
import FighterProfilePage from '@/components/pages/fighters/fighter-profile-page'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function FighterPage({ params }: PageProps) {
  const { id } = await params
  
  if (!id || isNaN(parseInt(id))) {
    notFound()
  }

  return <FighterProfilePage fighterId={parseInt(id)} />
}