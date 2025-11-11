// app/admin/transfers/new/page.tsx
import TransferForm from "@/components/transfers/transfer-form";

export default function CreateTransferPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TransferForm />
    </div>
  );
}