import { FC } from "react";
import { AdvertisementForm } from "@/components/advertisements/advertisement-form";
import { getAdvertisementById } from "@/actions/advertisements";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

async function loadAdvertisement(id: number){
  const response = await getAdvertisementById(id);
  return response;
}

const EditPage: FC<EditPageProps> = async ({ params }) => {
  const { id } = await params;
  const advertisement = await loadAdvertisement(parseInt(id, 10));

  return (
    <AdvertisementForm initialData={advertisement} isEditing={true} />
  );
};

export default EditPage;

