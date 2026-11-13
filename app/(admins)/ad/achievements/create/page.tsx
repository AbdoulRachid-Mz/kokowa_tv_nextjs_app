// app/admin/achievements/create/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { AchievementForm } from "@/components/achievements/form";

export default function CreateAchievementPage() {
  const searchParams = useSearchParams();
  const fighterId = searchParams.get("fighterId");
  const regionId = searchParams.get("regionId");
  const editionId = searchParams.get("editionId");

  return (
    <div className="container mx-auto px-4 py-6">
      <AchievementForm
        initialFighterId={fighterId ? parseInt(fighterId) : undefined}
        initialRegionId={regionId ? parseInt(regionId) : undefined}
        initialEditionId={editionId ? parseInt(editionId) : undefined}
      />
    </div>
  );
}