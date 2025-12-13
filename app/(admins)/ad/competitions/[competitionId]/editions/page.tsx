import { getEditions } from "@/actions/editions";
import EditionsPage from "./client-page";

interface Props {
  params: Promise<{
    competitionId: string;
  }>;
}

const Page = async ({ params }: Props) => {
  const { competitionId } = await params;

  const editions = await getEditions({
    competition_id: Number(competitionId),
    with_competition: true,
    with_fighters: true,
    with_groups: true,
    with_phases: true,
    with_regions: true,
    with_subGroups: true,
    with_matches: true,
  });

  return <EditionsPage editions={editions.data} />;
};

export default Page;
