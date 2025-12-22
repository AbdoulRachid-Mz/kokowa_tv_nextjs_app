import ClientFighterDetailPage from "./client-page";

interface Props {
  params: Promise<{ fighterId: string }>;
}

async function FighterDetailPage({ params }: Props) {
  const { fighterId } = await params;
  const id = parseInt(fighterId);
  if (!id) {
    return null;
  }

  return <ClientFighterDetailPage fighterId={id} />;
}
export default FighterDetailPage;
