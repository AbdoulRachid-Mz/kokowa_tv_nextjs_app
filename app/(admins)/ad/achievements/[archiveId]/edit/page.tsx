// app/admin/achievements/[id]/edit/page.tsx
"use client";

import { useParams } from "next/navigation";
import { AchievementForm } from "@/components/achievements/form";

export default function EditAchievementPage() {
  const { archiveId } = useParams();

  return (
    <div className="container mx-auto px-4 py-6">
      <AchievementForm achievementId={parseInt(archiveId as string)} />
    </div>
  );
}