// app/admin/transfers/[transferId]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import TransferForm from "@/components/transfers/transfer-form";
import { FighterTransfer } from "@/types";

export default function EditTransferPage() {
  const { transferId } = useParams();
  const [transfer, setTransfer] = useState<FighterTransfer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (transferId) {
      loadTransfer();
    }
  }, [transferId]);

  const loadTransfer = async () => {
    try {
      const response = await fetch(`/api/transfers/${transferId}`);
      if (response.ok) {
        const result = await response.json();
        setTransfer(result.transfer);
      }
    } catch (error) {
      console.error("Erreur chargement transfert:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20">Chargement...</div>;
  }

  if (!transfer) {
    return <div className="text-center py-20">Transfert non trouvé</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TransferForm transfer={transfer} />
    </div>
  );
}