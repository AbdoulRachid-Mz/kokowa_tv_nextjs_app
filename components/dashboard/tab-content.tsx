"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompetitionChart } from "./charts/competition-chart";
import { FighterChart } from "./charts/fighter-chart";
import { RegionChart } from "./charts/region-chart";
import { SimpleChart } from "./charts/simple-chart";
import { UserChart } from "./charts/user-chart";
import { TransferChart } from "./charts/transfer-chart";
import { MediaChart } from "./charts/media-chart";
import { MatchChart } from "./charts/match-chart";

interface TabContentProps {
  entity: string;
  title: string;
  description?: string;
}

export function TabContent({ entity, title, description }: TabContentProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/stats?entity=${entity}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Erreur inconnue");
      }
    } catch (err) {
      console.error(`Erreur chargement ${entity}:`, err);
      setError("Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [entity]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={loadData} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Rendu spécifique par entité avec les nouveaux composants
  const renderContent = () => {
    switch (entity) {
      case "competitions":
        return <CompetitionChart data={data} title={title} />;

      case "fighters":
        return <FighterChart data={data} title={title} />;

      case "regions":
        return <RegionChart data={data} title={title} />;

      case "matches":
        return (
          <MatchChart
            data={data}
            title="Statistiques des Matchs"
            // description="Répartition des matchs par statut"
          />
        );

      case "transfers":
        return (
          <TransferChart
            data={data}
            title={title || "Statistiques des Transferts"}
            // description={description}
          />
        );

      case "media":
        return (
          <MediaChart
            data={data}
            title={title}
            // description={description}
          />
        );

      case "users":
        return <UserChart data={data} title={title} />;

      default:
        return (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Typography variant="body-lg" weight="medium" className="mb-2">
                  Vue non configurée pour {entity}
                </Typography>
                <Typography variant="body-sm" theme="muted" className="mb-4">
                  Les données sont disponibles ci-dessous:
                </Typography>
                {data?.statId === "summary" && data.data ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                    <div>
                      <Typography variant="body-sm" theme="muted">
                        Total
                      </Typography>
                      <Typography variant="h4">{data.data.total}</Typography>
                    </div>
                    <div>
                      <Typography variant="body-sm" theme="muted">
                        Actifs
                      </Typography>
                      <Typography variant="h4">{data.data.active}</Typography>
                    </div>
                    <div>
                      <Typography variant="body-sm" theme="muted">
                        Vérifiés
                      </Typography>
                      <Typography variant="h4">{data.data.verified}</Typography>
                    </div>
                    <div>
                      <Typography variant="body-sm" theme="muted">
                        Dernier mois
                      </Typography>
                      <Typography variant="h4">
                        {data.data.last_month}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="body-sm" theme="muted">
                        Admins
                      </Typography>
                      <Typography variant="h4">{data.data.admins}</Typography>
                    </div>
                    <div>
                      <Typography variant="body-sm" theme="muted">
                        Modérateurs
                      </Typography>
                      <Typography variant="h4">
                        {data.data.moderators}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="body-sm" theme="muted">
                        Éditeurs
                      </Typography>
                      <Typography variant="h4">{data.data.editors}</Typography>
                    </div>
                  </div>
                ) : (
                  <pre className="mt-4 p-4 bg-muted rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                )}
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return <div className="space-y-6">{renderContent()}</div>;
}
