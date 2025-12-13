// app/editions/[id]/page.tsx
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getEditionById } from '@/actions/editions'
import EditionDetailPage from '@/components/pages/editions/edition-detail-page'
import { Skeleton } from '@/components/ui/skeleton'

async function EditionPage({ params }: { params: Promise<{ id: string }> }) {
  const {id} = await params
  const editionId = parseInt(id, 10)

  if (isNaN(editionId)) {
    notFound()
  }

  const edition = await getEditionById(editionId, {
    with_relations: true,
    relations: {
      with_phases: true,
      with_regions: true,
      with_fighters: true,
      with_groups: true,
      with_subGroups: true,
      with_matches: true
    }
  })

  if (!edition) {
    notFound()
  }

  return (
    <Suspense fallback={<EditionDetailSkeleton />}>
      <EditionDetailPage edition={edition} />
    </Suspense>
  )
}

function EditionDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-12 w-3/4 mb-6" />
      <Skeleton className="h-24 w-full mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-32 w-full mb-6" />
        </div>
        <div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  )
}

export default EditionPage