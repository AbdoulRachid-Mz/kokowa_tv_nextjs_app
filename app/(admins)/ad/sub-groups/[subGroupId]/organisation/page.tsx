// app/admin/sub-groups/[subGroupId]/organisation/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { SubGroup, Match, Fighter, Region } from "@/types";
import { Plus, Users, MapPin, Trophy, Swords } from "lucide-react";
import { MatchCard } from "./matches-card";
import { EmptyMatchCard } from "./empty-match-card";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRealtime } from "@/hooks/use-realtime"; // IMPORT AJOUTÉ

export default function SubGroupOrganizationPage() {
  const { subGroupId } = useParams();
  const router = useRouter();
  const id = parseInt(subGroupId as string);

  const [subGroup, setSubGroup] = useState<SubGroup | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [region1Fighters, setRegion1Fighters] = useState<Fighter[]>([]);
  const [region2Fighters, setRegion2Fighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);

  // UTILISATION DU TEMPS RÉEL
  const { isConnected, events, subscribeToMatch, subscribeToEdition } = useRealtime();

  useEffect(() => {
    if (!isNaN(id)) {
      loadSubGroup();
    }
  }, [id]);

  // ÉCOUTER LES ÉVÉNEMENTS TEMPS RÉEL
  useEffect(() => {
    if (!isConnected || !subGroup) return;

    // S'abonner aux matches de ce sous-groupe
    matches.forEach(match => {
      subscribeToMatch(match.id);
    });

    // S'abonner à l'édition
    const editionId = subGroup.group?.phase?.edition?.id;
    if (editionId) {
      subscribeToEdition(editionId);
    }
  }, [isConnected, subGroup, matches, subscribeToMatch, subscribeToEdition]);

  // TRAITER LES ÉVÉNEMENTS TEMPS RÉEL
  useEffect(() => {
    const lastEvent = events[events.length - 1];
    if (!lastEvent) return;

    console.log('Événement temps réel reçu:', lastEvent);

    switch (lastEvent.type) {
      case 'match_updated':
      case 'match_status_changed':
      case 'match_live_update':
        // Mettre à jour le match spécifique
        setMatches(prev => prev.map(match => 
          match.id === lastEvent.data.matchId 
            ? { ...match, ...lastEvent.data.match }
            : match
        ));
        break;

      case 'new_message':
        // Gérer les nouveaux messages/commentaires
        console.log('Nouveau message:', lastEvent.data.message);
        break;
    }
  }, [events]);

  const loadSubGroup = async () => {
    try {
      setLoading(true);
      const subGroupData = await api.get<any>(`/api/sub-groups/${id}`);
      setSubGroup(subGroupData);
      setMatches(subGroupData.matches || []);

      // Les lutteurs sont déjà inclus dans la réponse, pas besoin de recharger
      const editionId = subGroupData.group?.phase?.edition?.id;
      if (editionId) {
        const region1Id = subGroupData.region1?.id;
        const region2Id = subGroupData.region2?.id;

        if (region1Id) {
          const fightersRegion1 = await api.get<any>(`/api/editions/${editionId}/fighters?region_id=${region1Id}`);
          setRegion1Fighters(fightersRegion1.data.map((e: any) => e.fighter) || []);
        } else {
          setRegion1Fighters([]);
        }

        if (region2Id) {
          const fightersRegion2 = await api.get<any>(`/api/editions/${editionId}/fighters?region_id=${region2Id}`);
          setRegion2Fighters(fightersRegion2.data.map((e: any) => e.fighter) || []);
        } else {
          setRegion2Fighters([]);
        }
      } else {
        setRegion1Fighters([]);
        setRegion2Fighters([]);
      }
    } catch (error) {
      console.error("Erreur chargement sous-groupe:", error);
      setSubGroup(null);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour obtenir les lutteurs disponibles (sans match)
  const getAvailableFighters = (
    regionFighters: Fighter[],
    regionId?: number
  ) => {
    if (!regionId) return [];

    const fightersInMatches = new Set<number>();
    matches.forEach((match) => {
      if (match.fighter1_id) fightersInMatches.add(match.fighter1_id);
      if (match.fighter2_id) fightersInMatches.add(match.fighter2_id);
    });

    return regionFighters.filter(
      (fighter) => !fightersInMatches.has(fighter.id)
    );
  };

  const handleCreateMatch = async (fighter1Id: number, fighter2Id: number) => {
    try {
      const formData = new FormData();
      formData.append("sub_group_id", id.toString());
      formData.append("fighter1_id", fighter1Id.toString());
      formData.append("fighter2_id", fighter2Id.toString());
      formData.append("status", "scheduled");

      const response = await api.post("/api/matches", formData);

      if (response && typeof response === 'object' && 'success' in response && response.success) {
        loadSubGroup(); // Recharger les données
      }
    } catch (error) {
      console.error("Erreur création match:", error);
      alert("Erreur lors de la création du match");
    }
  };

  const handleEditMatch = async (match: Match) => {
    try {
      const formData = new FormData();
      
      // Ne pas envoyer de champs vides
      if (match.status) formData.append("status", match.status);
      if (match.winner_fighter_id) formData.append("winner_fighter_id", match.winner_fighter_id.toString());
      if (match.match_result) formData.append("match_result", match.match_result);
      if (match.total_duration) formData.append("total_duration", match.total_duration);
      if (match.notes) formData.append("notes", match.notes);

      const response = await api.put(`/api/matches/${match.id}`, formData);

      if (response && typeof response === 'object' && 'success' in response && response.success) {
        // Pas besoin de recharger - le temps réel va mettre à jour
        console.log('Match mis à jour avec succès');
      } else {
        alert("Erreur lors de la mise à jour du match");
      }
    } catch (error) {
      console.error("Erreur édition match:", error);
      alert("Erreur lors de l'édition du match");
    }
  };

  const handleDeleteMatch = async (matchId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce match ?")) return;

    try {
      await api.delete(`/api/matches/${matchId}`);
      loadSubGroup(); // Recharger les données
    } catch (error) {
      console.error("Erreur suppression match:", error);
      alert("Erreur lors de la suppression du match");
    }
  };

  // Afficher l'état de connexion temps réel
  if (loading) {
    return (
      <div className="text-center mx-auto flex justify-center flex-col items-center py-20">
        <Spinner aria-label="Chargement..." />
        Chargement de l'organisation...
      </div>
    );
  }

  if (!subGroup) {
    return (
      <div className="text-center py-20">
        <Typography variant="h3" className="mb-4">
          Rencontre non trouvée
        </Typography>
        <Button onClick={() => router.push("/ad/sub-groups")}>
          ← Retour aux rencontres
        </Button>
      </div>
    );
  }

  const availableRegion1Fighters = getAvailableFighters(
    region1Fighters,
    subGroup.region1?.id
  );
  const availableRegion2Fighters = getAvailableFighters(
    region2Fighters,
    subGroup.region2?.id
  );

  return (
    <div className="mx-auto space-y-1">
      {/* En-tête avec indicateur temps réel */}
      <Card>
        <CardContent className="p-1">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
            <div className="text-center lg:text-left">
              <div className="flex items-center gap-2 mb-2">
                <Typography variant="h5" weight="bold">
                  {subGroup.name}
                </Typography>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <Badge variant={isConnected ? "default" : "outline"}>
                    {isConnected ? 'Temps réel actif' : 'Hors ligne'}
                  </Badge>
                </div>
              </div>

              {/* Informations de la rencontre */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Typography variant="body-sm">
                    {subGroup.group?.phase?.edition?.edition_number} -{" "}
                    {subGroup.group?.phase?.edition?.year}
                  </Typography>
                </div>
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <Typography variant="body-sm">
                    {subGroup.group?.phase?.name} • {subGroup.group?.name}
                  </Typography>
                </div>
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
              </div>
            </div>

            <Button
              onClick={() => router.push(`/ad/sub-groups/${id}`)}
              variant="outline"
            >
              ← Retour au détail
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grille d'organisation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Colonne Région 1 */}
        <div className="space-y-2 col-span-3">
          <RegionColumn
            region={subGroup.region1}
            fighters={availableRegion1Fighters}
            belt={subGroup.belt1}
            side="left"
          />
        </div>

        {/* Colonne centrale - Matches */}
        <div className="space-y-4 col-span-6">
          <MatchesColumn
            matches={matches}
            availableRegion1Fighters={availableRegion1Fighters}
            availableRegion2Fighters={availableRegion2Fighters}
            onCreateMatch={handleCreateMatch}
            onDeleteMatch={handleDeleteMatch}
            onEditMatch={handleEditMatch}
          />
        </div>

        {/* Colonne Région 2 */}
        <div className="space-y-4 col-span-3">
          <RegionColumn
            region={subGroup.region2}
            fighters={availableRegion2Fighters}
            belt={subGroup.belt2}
            side="right"
          />
        </div>
      </div>
    </div>
  );
}

// ... (le reste du code reste identique)

// Composant pour une colonne de région
function RegionColumn({
  region,
  fighters,
  belt,
  side,
}: {
  region?: Region;
  fighters: Fighter[];
  belt?: any;
  side: "left" | "right";
}) {
  if (!region) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-center">
            Région {side === "left" ? "1" : "2"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Typography variant="body-sm" theme="muted">
              Aucune région assignée
            </Typography>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-xl">{region.name}</CardTitle>
          </div>
          {belt && (
            <Badge variant="outline" className="text-sm">
              Ceinture {belt.color}
            </Badge>
          )}
          <Typography variant="body-sm" theme="muted" className="mt-1">
            {region.code} • {fighters.length} lutteur(s) disponible(s)
          </Typography>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {fighters.length === 0 ? (
            <div className="text-center py-4">
              <Typography variant="body-sm" theme="muted">
                Aucun lutteur disponible
              </Typography>
            </div>
          ) : (
            fighters.map((fighter) => (
              <FighterCard key={fighter.id}  position={side} fighter={fighter} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Composant pour un lutteur
function FighterCard({ fighter, position="left" }: { fighter: Fighter, position?: "right" | "left" }) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-3">
        {/* <div className="flex items-center space-x-3"> */}
          <div className={`flex ${position === "right" && "flex-row-reverse"} items-center space-x-3`}>
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={fighter.profile_image || undefined}
                alt={`${fighter.first_name} ${fighter.last_name}`}
              />
              <AvatarFallback>
                {fighter.first_name?.[0]?.toUpperCase()}
                {fighter.last_name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <Typography variant="body-sm" 
              weight="medium"
              hasTooltip={!!fighter.nickname}
              tooltipSide={position === "left" ? "right" : "left"}
              tooltipContent={fighter.nickname && fighter.nickname}
              className="truncate">
                {fighter.first_name} {fighter.last_name}
              </Typography>
              <div className="flex items-center space-x-2 mt-1">
                {fighter.is_champion && (
                  <Badge variant="default" className="text-xs px-1 py-0">
                    🏆
                  </Badge>
                )}
                <Typography variant="body-base" theme="muted">
                  Classement: {fighter.ranking || "N/A"}
                </Typography>
              </div>
            </div>
          </div>

          {/* <div className="flex-1 min-w-0">
            <Typography variant="body-sm" 
            weight="medium"
            hasTooltip={!!fighter.nickname}
            tooltipSide={position}
            tooltipContent={fighter.nickname && fighter.nickname}
            className="truncate">
              {fighter.first_name} {fighter.last_name}
            </Typography>
            <div className="flex items-center space-x-2 mt-1">
              {fighter.is_champion && (
                <Badge variant="default" className="text-xs px-1 py-0">
                  🏆
                </Badge>
              )}
              <Typography variant="body-base" theme="muted">
                Classement: {fighter.ranking || "N/A"}
              </Typography>
            </div>
          </div> */}
        {/* </div> */}
      </CardContent>
    </Card>
  );
}

// Composant pour la colonne des matches
function MatchesColumn({
  matches,
  availableRegion1Fighters,
  availableRegion2Fighters,
  onCreateMatch,
  onDeleteMatch,
  onEditMatch,
}: {
  matches: Match[];
  availableRegion1Fighters: Fighter[];
  availableRegion2Fighters: Fighter[];
  onCreateMatch: (fighter1Id: number, fighter2Id: number) => void;
  onDeleteMatch: (matchId: number) => void;
  onEditMatch: (match: Match) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center space-x-2">
          <Swords className="h-5 w-5" />
          <span>Matchs Programmes</span>
          <Badge variant="outline" className="ml-2">
            {matches.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {matches.length === 0 &&
          availableRegion1Fighters.length === 0 &&
          availableRegion2Fighters.length === 0 ? (
            <div className="text-center py-8">
              <Typography variant="h4" theme="muted" className="mb-2">
                Aucun match
              </Typography>
              <Typography variant="body-sm" theme="muted">
                Ajoutez des lutteurs aux régions pour créer des matchs
              </Typography>
            </div>
          ) : (
            <>
              {/* Matchs existants */}
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onDelete={onDeleteMatch}
                  onEdit={onEditMatch}
                />
              ))}

              {/* Card vide pour nouveau match */}
              {availableRegion1Fighters.length > 0 &&
                availableRegion2Fighters.length > 0 && (
                  <EmptyMatchCard
                    region1Fighters={availableRegion1Fighters}
                    region2Fighters={availableRegion2Fighters}
                    onCreateMatch={onCreateMatch}
                  />
                )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
