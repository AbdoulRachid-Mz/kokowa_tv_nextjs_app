// app/admin/transfers/[transferId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { FighterTransfer } from "@/types";
import {
  Edit,
  ArrowRight,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Image from "next/image";

export default function TransferDetailPage() {
  const { transferId } = useParams();
  const router = useRouter();
  const id = parseInt(transferId as string);

  const [transfer, setTransfer] = useState<FighterTransfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (!isNaN(id)) loadTransfer();
  }, [id]);

  const loadTransfer = async () => {
    try {
      setLoading(true);
      const transferData = await api.get<any>(`/api/transfers/${id}`);
      setTransfer(transferData.transfer);
    } catch (error) {
      console.error("Erreur chargement transfert:", error);
      setTransfer(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-center py-20">Chargement du transfert...</div>;
  }

  if (!transfer) {
    return (
      <div className="text-center py-20">
        <Typography variant="h3" className="mb-4">
          Transfert non trouvé
        </Typography>
        <Button onClick={() => window.location.reload()}>🔄 Actualiser</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* En-tête */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Lutteur */}
            {transfer.fighter && (
              <div className="flex items-center space-x-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-background">
                  <Image
                    src={
                      transfer.fighter.profile_image ||
                      "/placeholder-profile.jpg"
                    }
                    alt={`${transfer.fighter.first_name} ${transfer.fighter.last_name}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <Typography variant="h3" weight="bold">
                    {transfer.fighter.first_name} {transfer.fighter.last_name}
                  </Typography>
                  {transfer.fighter.nickname && (
                    <Typography variant="body-lg" theme="muted">
                      "{transfer.fighter.nickname}"
                    </Typography>
                  )}
                </div>
              </div>
            )}

            {/* Flèche de transfert */}
            <div className="flex items-center space-x-4 lg:space-x-8">
              {transfer.from_region && (
                <div className="text-center">
                  <Typography variant="h4" weight="medium">
                    {transfer.from_region.name}
                  </Typography>
                  <Typography variant="body-sm" theme="muted">
                    Région d'origine
                  </Typography>
                </div>
              )}

              <ArrowRight className="h-8 w-8 text-muted-foreground" />

              {transfer.to_region && (
                <div className="text-center">
                  <Typography variant="h4" weight="medium">
                    {transfer.to_region.name}
                  </Typography>
                  <Typography variant="body-sm" theme="muted">
                    Région de destination
                  </Typography>
                </div>
              )}
            </div>

            {/* Statut et actions */}
            <div className="flex flex-col items-center lg:items-end space-y-3 ml-auto">
              <Badge
                variant={getStatusVariant(transfer.status)}
                className="text-sm px-3 py-1"
              >
                <span className="flex items-center space-x-1">
                  {getStatusIcon(transfer.status)}
                  <span className="capitalize">{transfer.status}</span>
                </span>
              </Badge>

              <Button
                onClick={() => router.push(`/ad/transfers/${id}/edit`)}
                size="sm"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenu (onglets) */}
      <Card>
        <CardHeader>
          <CardTitle>Détails du transfert</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex justify-center mb-4">
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="financial">Financier</TabsTrigger>
            </TabsList>

            {/* Onglet Détails */}
            <TabsContent value="details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Info
                  label="Date de transfert"
                  value={new Date(transfer.transfer_date).toLocaleDateString()}
                  icon={<Calendar className="h-4 w-4" />}
                />
                <Info
                  label="Type de transfert"
                  value={transfer.is_permanent ? "Permanent" : "Temporaire"}
                />
                {transfer.contract_duration && (
                  <Info
                    label="Durée du contrat"
                    value={`${transfer.contract_duration} mois`}
                  />
                )}
                {transfer.transfer_reason && (
                  <div className="md:col-span-2">
                    <Info
                      label="Raison du transfert"
                      value={transfer.transfer_reason}
                    />
                  </div>
                )}
              </div>

              {/* Informations sur l'approbation */}
              {transfer.approved_by_user && (
                <div className="mt-6 p-4 border rounded-lg">
                  <Typography variant="h5" className="mb-2">
                    Informations d'approbation
                  </Typography>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Info
                      label="Approuvé par"
                      value={`${transfer.approved_by_user.displayName}`}
                    />
                    <Info
                      label="Nom d'utilisateur"
                      value={transfer.approved_by_user.displayName}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Onglet Financier */}
            <TabsContent value="financial">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {transfer.transfer_fee ? (
                  <Info
                    label="Frais de transfert"
                    value={`${transfer.transfer_fee.toLocaleString()} FCFA`}
                    icon={<DollarSign className="h-4 w-4" />}
                  />
                ) : (
                  <Info label="Frais de transfert" value="Gratuit" />
                )}

                {transfer.contract_duration && (
                  <Info
                    label="Durée du contrat"
                    value={`${transfer.contract_duration} mois`}
                  />
                )}

                <Info
                  label="Type"
                  value={transfer.is_permanent ? "Transfert définitif" : "Prêt"}
                />

                <Info
                  label="Statut"
                  value={
                    <Badge variant={getStatusVariant(transfer.status)}>
                      {transfer.status === "completed"
                        ? "Finalisé"
                        : transfer.status === "approved"
                        ? "Approuvé"
                        : transfer.status === "pending"
                        ? "En attente"
                        : "Rejeté"}
                    </Badge>
                  }
                />
              </div>

              {!transfer.transfer_fee && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <Typography variant="body-sm" theme="muted">
                    Aucun frais de transfert n'a été spécifié pour cette
                    opération.
                  </Typography>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Composants utilitaires
function Info({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number | React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start space-x-3">
      {icon && <div className="text-muted-foreground mt-1">{icon}</div>}
      <div className="flex-1">
        <Typography
          variant="body-sm"
          weight="medium"
          theme="muted"
          className="mb-1"
        >
          {label}
        </Typography>
        <Typography className="break-words">
          {value || "Non spécifié"}
        </Typography>
      </div>
    </div>
  );
}
