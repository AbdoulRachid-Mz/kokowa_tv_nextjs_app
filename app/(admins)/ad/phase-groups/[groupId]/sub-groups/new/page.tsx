// app/admin/sub-groups/new/[groupId]/page.tsx
import { Suspense } from "react";
import SubGroupFormV2 from "@/components/sub-groups/sub-group-form-v2";
import { getPhaseGroupById } from "@/actions/phase-groups";

interface CreateSubGroupPageProps {
  params: Promise<{ groupId: string }>;
}

async function GroupDataLoader({ groupId }: { groupId: string }) {
  try {
    const groupIdNum = parseInt(groupId);
    if (isNaN(groupIdNum)) {
      throw new Error("ID de groupe invalide");
    }

    const group = await getPhaseGroupById(groupIdNum, {
      with_relations: true,
      relations: {
        with_phase: true,
        with_edition: true,
        with_subGroups: true,
        with_matches: false,
        with_fighters: false,
        with_regions: true,
        with_referees: false,
        with_belts: false
      }
    });

    // Return null instead of the group object to avoid rendering it
    return null;
  } catch (error) {
    console.error("Erreur lors du chargement du groupe:", error);
    throw error;
  }
}

export default async function CreateSubGroupPage({ params }: CreateSubGroupPageProps) {
  const { groupId } = await params;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={
        <div className="container mx-auto max-w-6xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      }>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <GroupDataLoader groupId={groupId} />
      </Suspense>
      
      <div className="mx-auto max-w-6xl">
        <SubGroupFormV2 groupId={parseInt(groupId)} />
      </div>
    </div>
  );
}