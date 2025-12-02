// app/admin/sub-groups/[subGroupId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { SubGroup, Match } from "@/types";
import { Edit, Plus, Users, MapPin, Trophy, Clock, Swords } from "lucide-react";
import { MatchCard } from "./organisation/matches-card";

export default function SubGroupDetailPage() {
  const { subGroupId } = useParams();
  const router = useRouter();
  const id = parseInt(subGroupId as string);

  const [subGroup, setSubGroup] = useState<SubGroup | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!isNaN(id)) loadSubGroup();
  }, [id]);

  const loadSubGroup = async () => {
    try {
      setLoading(true);
      const subGroupData = await api.get<any>(`/api/sub-groups/${id}`);
      setSubGroup(subGroupData);
      setMatches(subGroupData.matches || []);
    } catch (error) {
      console.error("Erreur chargement sous-groupe:", error);
      setSubGroup(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMatch = async (matchId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce match ?")) return;

    try {
      await api.delete(`/api/matches/${matchId}`);
      setMatches(matches.filter((m) => m.id !== matchId));
      loadSubGroup(); // Recharger les données
    } catch (error) {
      console.error("Erreur suppression match:", error);
      alert("Erreur lors de la suppression du match");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">Chargement de la rencontre...</div>
    );
  }

  if (!subGroup) {
    return (
      <div className="text-center py-20">
        <Typography variant="h3" className="mb-4">
          Rencontre non trouvée
        </Typography>
        <Button onClick={() => window.location.reload()}>🔄 Actualiser</Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* En-tête de la rencontre */}
      <Card className="p-2">
        <CardContent className="p-2">
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between space-y-4 lg:space-y-0">
            <div className="text-center lg:text-left">
              <Typography variant="h4" weight="bold" className="mb-2">
                {subGroup.name}
              </Typography>
              <Typography variant="body-base" theme="muted" className="mb-4">
                {subGroup.description}
              </Typography>

              {/* Régions participantes */}
              <div className="flex items-center justify-center lg:justify-start space-x-6">
                {subGroup.region1 && (
                  <div className="text-center">
                    <div className="flex items-center space-x-2 mb-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Typography variant="body-sm" weight="medium">
                        {subGroup.region1.name}
                      </Typography>
                    </div>
                    {subGroup.belt1 && (
                      <Badge variant="outline" className="text-xs">
                        Ceinture {subGroup.belt1.color}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="text-muted-foreground">VS</div>

                {subGroup.region2 && (
                  <div className="text-center">
                    <div className="flex items-center space-x-2 mb-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Typography variant="body-sm" weight="medium">
                        {subGroup.region2.name}
                      </Typography>
                    </div>
                    {subGroup.belt2 && (
                      <Badge variant="outline" className="text-xs">
                        Ceinture {subGroup.belt2.color}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center lg:items-end space-y-2">
              <div className="flex gap-2">
                <Badge variant={subGroup.is_active ? "default" : "outline"}>
                  {subGroup.is_active ? "Active" : "Inactive"}
                </Badge>
                <Badge
                  variant={subGroup.is_completed ? "default" : "secondary"}
                >
                  {subGroup.is_completed ? "Terminée" : "En cours"}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => router.push(`/ad/sub-groups/${id}/edit`)}
                  size="sm"
                >
                  <Typography
                    hasTooltip
                    tooltipContent="Modifier"
                    className="flex gap-2 items-center justify-center text-white"
                  >
                    <Edit className="h-4 w-4 text-white" />
                    <span className="max-md:hidden">Modifier</span>
                  </Typography>
                </Button>
                <Button
                  onClick={() =>
                    router.push(`/ad/sub-groups/${id}/organisation`)
                  }
                  size="sm"
                >
                  <Typography
                    hasTooltip
                    tooltipContent="Organisation"
                    className="flex gap-2 items-center justify-center text-white"
                  >
                    <Swords className="h-4 w-4" />
                    <span className="max-md:hidden">Organisation</span>
                  </Typography>
                </Button>
                <Button
                  onClick={() =>
                    router.push(`/ad/sub-groups/${id}/matches/new`)
                  }
                  size="sm"
                >
                  <Typography
                    hasTooltip
                    tooltipContent="Ajouter Match"
                    className="flex gap-2 items-center text-white"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="max-md:hidden">Ajouter Match</span>
                  </Typography>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenu (onglets) */}
      <Card className="p-3">
        <CardHeader>
          <CardTitle>Gestion de la rencontre</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex justify-center mb-2">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="matches">
                Matchs ({matches.length})
              </TabsTrigger>
              <TabsTrigger value="organization">Organisation</TabsTrigger>
            </TabsList>

            {/* Onglet Vue d'ensemble */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Info label="Groupe" value={subGroup.group?.name} />
                <Info label="Ordre" value={subGroup.sub_group_order} />
                <Info label="Phase" value={subGroup.group?.phase?.name} />
                <Info
                  label="Édition"
                  value={`${subGroup.group?.phase?.edition?.edition_number} - ${subGroup.group?.phase?.edition?.year}`}
                />
                {subGroup.main_referee && (
                  <Info
                    label="Arbitre Principal"
                    value={`${subGroup.main_referee.first_name} ${subGroup.main_referee.last_name}`}
                  />
                )}
              </div>

              {/* Statistiques des matchs */}
              <div className="mt-3">
                <Typography variant="h5" className="mb-4">
                  Statistiques des matchs
                </Typography>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label="Total Matchs"
                    value={matches.length}
                    icon={Users}
                  />
                  <StatCard
                    label="Terminés"
                    value={
                      matches.filter((m) => m.status === "completed").length
                    }
                    icon={Trophy}
                  />
                  <StatCard
                    label="Programmés"
                    value={
                      matches.filter((m) => m.status === "scheduled").length
                    }
                    icon={Clock}
                  />
                  <StatCard
                    label="En Direct"
                    value={matches.filter((m) => m.status === "live").length}
                    icon={Users}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Onglet Matchs */}
            <TabsContent value="matches">
              <MatchesList
                matches={matches}
                subGroupId={id}
                onEditMatch={(match) =>
                  router.push(`/ad/matches/${match.id}/edit`)
                }
                onDeleteMatch={handleDeleteMatch}
                onAddMatch={() =>
                  router.push(`/ad/sub-groups/${id}/matches/new`)
                }
              />
            </TabsContent>

            {/* Onglet Organisation */}
            <TabsContent value="organization">
              <OrganizationTab
                subGroup={subGroup}
                onEdit={() => router.push(`/ad/sub-groups/${id}/edit`)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Composant pour la liste des matchs
function MatchesList({
  matches,
  subGroupId,
  onEditMatch,
  onDeleteMatch,
  onAddMatch,
}: {
  matches: Match[];
  subGroupId: number;
  onEditMatch: (match: Match) => void;
  onDeleteMatch: (matchId: number) => void;
  onAddMatch: () => void;
}) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-8">
        <Typography variant="h4" theme="muted" className="mb-4">
          Aucun match programmé
        </Typography>
        <Typography variant="body-sm" theme="muted" className="mb-6">
          Commencez par ajouter des matchs à cette rencontre.
        </Typography>
        <Button onClick={onAddMatch}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter le premier match
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Typography variant="h5">Liste des matchs</Typography>
        <Button onClick={onAddMatch} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau match
        </Button>
      </div>

      <div className="space-y-3">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onEdit={() => onEditMatch(match)}
            onDelete={() => onDeleteMatch(match.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Composant pour l'onglet Organisation
function OrganizationTab({
  subGroup,
  onEdit,
}: {
  subGroup: SubGroup;
  onEdit: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Typography variant="h5">Configuration de la rencontre</Typography>
        <Button onClick={onEdit} size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Modifier l'organisation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Région 1 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {subGroup.region1?.name || "Région 1"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Info
              label="Ceinture"
              value={subGroup.belt1?.color || "Non assignée"}
            />
            <Info label="Statut" value="Prête" />
            {subGroup.region1 && (
              <div className="p-3 bg-muted rounded-lg">
                <Typography variant="body-sm">
                  Région {subGroup.region1.code} - {subGroup.region1.name}
                </Typography>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Région 2 */}
        <Card className="p-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {subGroup.region2?.name || "Région 2"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Info
              label="Ceinture"
              value={subGroup.belt2?.color || "Non assignée"}
            />
            <Info label="Statut" value="Prête" />
            {subGroup.region2 && (
              <div className="p-3 bg-muted rounded-lg">
                <Typography variant="body-sm">
                  Région {subGroup.region2.code} - {subGroup.region2.name}
                </Typography>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Arbitrage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Arbitrage</CardTitle>
        </CardHeader>
        <CardContent>
          {subGroup.main_referee ? (
            <div className="space-y-2">
              <Info
                label="Arbitre Principal"
                value={`${subGroup.main_referee.first_name} ${subGroup.main_referee.last_name}`}
              />
              {subGroup.main_referee.nickname && (
                <Info label="Surnom" value={subGroup.main_referee.nickname} />
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Typography variant="body-sm" theme="muted">
                Aucun arbitre principal assigné
              </Typography>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Composants utilitaires
function Info({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <Typography variant="body-sm" weight="medium" theme="muted">
        {label}
      </Typography>
      <Typography>{value || "Non spécifié"}</Typography>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: any;
}) {
  return (
    <Card className="p-2 border-t-primary border-2 border-b-green-500">
      <CardContent className="text-center p-2">
        <Typography variant="h4" weight="bold">
          {value}
        </Typography>
        <div className="flex items-center justify-center space-x-2 mt-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <Typography variant="body-sm" theme="muted">
            {label}
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}
