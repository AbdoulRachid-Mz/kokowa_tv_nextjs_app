import CompetitionForm from "@/components/competitions/competition-form-2";


export default function CreateCompetitionPage() {
  return (
    <div className="">
      <div className="max-w-4xl mx-auto">
        <CompetitionForm  withEdition={false} />
      </div>
    </div>
  );
}