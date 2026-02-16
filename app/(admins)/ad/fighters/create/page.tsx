// import {FighterForm} from "@/components/lutteurs/fighter-form";
import { Region } from "@/types";
import { getRegionById } from "@/actions/regions";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import FighterForm from "@/components/lutteurs/figther-form";

// async function getRegion(id: string): Promise<Region | undefined> {
//   try {
//     const region = await getRegionById(parseInt(id, 10));
//     return region;
//   } catch {
//     return undefined;
//   }
// }

export default async function CreateFighterPage() {

  return (
    <Suspense fallback={<PageSkeleton type="profile" />}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FighterForm />
        </div>
      </div>
    </Suspense>
  );
}