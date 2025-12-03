import ClientRegionDetail from "./client-page";

interface Props {
  params: Promise<{ regionId: string }>;
}

async function RegionDetailPage({ params }: Props) {
  const { regionId } = await params;
  const id = parseInt(regionId);
  if (!id) {
    return null;
  }

  return <ClientRegionDetail regionId={id} />;
}
export default RegionDetailPage;
