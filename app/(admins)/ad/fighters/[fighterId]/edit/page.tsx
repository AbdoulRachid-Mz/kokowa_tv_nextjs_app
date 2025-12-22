import ClienttFigtherPage from "./client-page";

interface Props {
  params: Promise<{ fighterId: string }>;
}

const EditFigtherPage = async ({ params }: Props) => {
  const { fighterId } = await params;

  return <ClienttFigtherPage fighterId={fighterId} />;
};

export default EditFigtherPage;
