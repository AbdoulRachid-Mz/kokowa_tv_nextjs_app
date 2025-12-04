import CompetitionForm from "@/components/competitions/competition-form-2";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    competitionId: string;
  }>;
}

async function getCompetition(id: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/competitions/${id}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error("Erreur lors du chargement de la compétition:", error);
    return null;
  }
}

export default async function EditCompetitionPage({ params }: PageProps) {
  const { competitionId } = await params;
  const competition = await getCompetition(competitionId);

  if (!competition) {
    notFound();
  }

  return (
    <div className="">
      <div className="max-w-4xl mx-auto">
        <CompetitionForm competition={competition} />
      </div>
    </div>
  );
}
