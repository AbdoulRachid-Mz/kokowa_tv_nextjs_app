import EditionForm from '@/components/editions/edition-form';

interface Props {
    params: Promise<{ editionId: string }> 
}

export default async function EditEditionPage({ params }: Props) {
  const { editionId } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/editions/${editionId}`);
  if (!res.ok) {
    throw new Error('Failed to fetch edition');
  }
  const edition = await res.json();

  return (
    <div className="">
      <EditionForm
        competitionId={1} // replace with actual competitionId
        edition={edition}
      />
    </div>
  );
}
