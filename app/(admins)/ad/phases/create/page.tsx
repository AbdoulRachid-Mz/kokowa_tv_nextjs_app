// import PhaseGroupForm from '@/components/editions/phase-form';
// import { getEditionById } from '@/actions/editions';

// type Props = {
//   params: Promise<{ editionId: string }>;
//   searchParams: Promise<{ phaseId?: string }>;
// };

// export default async function PhasePage({ params, searchParams }: Props) {
//   const { editionId } = await params;
//   const { phaseId } = await searchParams;
  
//   const edition = await getEditionById(Number(editionId));
//   let phase = null;
  
//   if (phaseId) {
//     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/phases/${phaseId}`);
//     if (res.ok) {
//       phase = await res.json();
//     }
//   }
  
//   return (
//     <div className="container mx-auto py-6">
//       <PhaseGroupForm
//         editionId={Number(editionId)}
//         edition={edition}
//         phase={phase}
//         type="phase"
//       />
//     </div>
//   );
// }