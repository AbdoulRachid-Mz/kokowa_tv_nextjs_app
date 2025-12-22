// app/matches/[matchId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, RefreshCw, Share2, Bookmark, Bell } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MatchDetailHeader } from "@/components/pages/matches/match-detail-header";
import { MatchParticipants } from "@/components/pages/matches/match-participants";
import { MatchStatistics } from "@/components/pages/matches/match-statistics";
import { MatchTimeline } from "@/components/pages/matches/match-timeline";
// Fetch du match
import { Match } from "@/types";

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const matchId = parseInt(params.matchId as string);

  const {
    data: match,
    isLoading,
    error,
    refetch,
  } = useQuery<Match>({
    queryKey: ["match", matchId],
    queryFn: async () => {
      const response = await fetch(
        `/api/matches/${matchId}?with_relations=true`
      );
      if (!response.ok) {
        throw new Error("Match non trouvé");
      }
      const data = await response.json();
      return data.data;
    },
    staleTime: 30000,
    refetchInterval: (query) =>
      query.state.data?.status === "live" ? 10000 : false, // Polling pour les matchs en direct
  });

  // Gestion des erreurs
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Typography variant="h3" className="text-destructive mb-4">
            Match non trouvé
          </Typography>
          <Typography variant="body-base" theme="muted" className="mb-6">
            Le match que vous recherchez n'existe pas ou a été supprimé.
          </Typography>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/matches">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux matches
              </Link>
            </Button>
            <Button variant="outline" onClick={() => router.refresh()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="h-12 bg-muted animate-pulse rounded-xl w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Typography variant="h3" className="text-destructive mb-4">
            Match non trouvé
          </Typography>
          <Typography variant="body-base" theme="muted" className="mb-6">
            Le match que vous recherchez n'existe pas ou a été supprimé.
          </Typography>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/matches">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux matches
              </Link>
            </Button>
            <Button variant="outline" onClick={() => router.refresh()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-b from-background to-muted/20"
    >
      {/* Header */}
      <MatchDetailHeader match={match} />

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Contenu principal */}
          <div className="lg:w-2/3">
            {/* Onglets */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="mb-6"
            >
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="statistics">Statistiques</TabsTrigger>
                <TabsTrigger value="timeline">Chronologie</TabsTrigger>
                <TabsTrigger value="comments">Commentaires</TabsTrigger>
              </TabsList>

              {/* Vue d'ensemble */}
              <TabsContent value="overview" className="mt-6 space-y-6">
                <MatchParticipants match={match} />

                <Card>
                  <CardHeader>
                    <CardTitle>Informations du match</CardTitle>
                    <CardDescription>
                      Détails complets de la rencontre
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Typography
                          variant="body-sm"
                          theme="muted"
                          className="mb-1"
                        >
                          Date et heure
                        </Typography>
                        <Typography variant="body-base" weight="medium">
                          {new Date(match.match_date).toLocaleDateString(
                            "fr-FR",
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                          {match.start_time &&
                            ` à ${match.start_time.substring(0, 5)}`}
                        </Typography>
                      </div>

                      <div>
                        <Typography
                          variant="body-sm"
                          theme="muted"
                          className="mb-1"
                        >
                          Durée
                        </Typography>
                        <Typography variant="body-base" weight="medium">
                          {match.total_duration || "Non spécifiée"}
                        </Typography>
                      </div>

                      <div>
                        <Typography
                          variant="body-sm"
                          theme="muted"
                          className="mb-1"
                        >
                          Spectateurs
                        </Typography>
                        <Typography variant="body-base" weight="medium">
                          {match.audience_count || "Non spécifié"}
                        </Typography>
                      </div>

                      <div>
                        <Typography
                          variant="body-sm"
                          theme="muted"
                          className="mb-1"
                        >
                          Pauses
                        </Typography>
                        <Typography variant="body-base" weight="medium">
                          {match.break_count || 0}
                        </Typography>
                      </div>
                    </div>

                    {match.notes && (
                      <div>
                        <Typography
                          variant="body-sm"
                          theme="muted"
                          className="mb-1"
                        >
                          Notes
                        </Typography>
                        <Typography
                          variant="body-base"
                          className="bg-muted p-3 rounded-lg"
                        >
                          {match.notes}
                        </Typography>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {match.sub_group && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Contexte de la rencontre</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Typography
                            variant="body-sm"
                            theme="muted"
                            className="mb-1"
                          >
                            Compétition
                          </Typography>
                          <Typography variant="body-base" weight="medium">
                            {
                              match.sub_group.group?.phase?.edition?.competition
                                ?.name
                            }
                          </Typography>
                        </div>

                        <div>
                          <Typography
                            variant="body-sm"
                            theme="muted"
                            className="mb-1"
                          >
                            Édition
                          </Typography>
                          <Typography variant="body-base" weight="medium">
                            {
                              match.sub_group.group?.phase?.edition
                                ?.edition_number
                            }
                          </Typography>
                        </div>

                        <div>
                          <Typography
                            variant="body-sm"
                            theme="muted"
                            className="mb-1"
                          >
                            Phase
                          </Typography>
                          <Typography variant="body-base" weight="medium">
                            {match.sub_group.group?.phase?.name}(
                            {match.sub_group.group?.phase?.phase_type})
                          </Typography>
                        </div>

                        <div>
                          <Typography
                            variant="body-sm"
                            theme="muted"
                            className="mb-1"
                          >
                            Groupe
                          </Typography>
                          <Typography variant="body-base" weight="medium">
                            {match.sub_group.group?.name}
                          </Typography>
                        </div>
                      </div>

                      {/* Régions */}
                      {(match.sub_group.region1 || match.sub_group.region2) && (
                        <div>
                          <Typography
                            variant="body-sm"
                            theme="muted"
                            className="mb-2"
                          >
                            Régions participantes
                          </Typography>
                          <div className="flex items-center gap-4">
                            {match.sub_group.region1 && (
                              <Badge variant="outline" className="gap-2">
                                {match.sub_group.region1.name}
                                {match.sub_group.belt1 && (
                                  <div
                                    className="h-3 w-3 rounded-full"
                                    style={{
                                      backgroundColor:
                                        match.sub_group.belt1.color,
                                    }}
                                  />
                                )}
                              </Badge>
                            )}
                            <span className="text-muted-foreground">vs</span>
                            {match.sub_group.region2 && (
                              <Badge variant="outline" className="gap-2">
                                {match.sub_group.region2.name}
                                {match.sub_group.belt2 && (
                                  <div
                                    className="h-3 w-3 rounded-full"
                                    style={{
                                      backgroundColor:
                                        match.sub_group.belt2.color,
                                    }}
                                  />
                                )}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Statistiques */}
              <TabsContent value="statistics" className="mt-6">
                <MatchStatistics match={match} />
              </TabsContent>

              {/* Chronologie */}
              <TabsContent value="timeline" className="mt-6">
                <MatchTimeline match={match} />
              </TabsContent>

              {/* Commentaires */}
              <TabsContent value="comments" className="mt-6">
                {/* <MatchComments matchId={matchId} /> */}
                {"commentaires ici..."}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            <div className="space-y-6 sticky top-6">
              {/* Actions rapides */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full gap-2">
                    <Bell className="h-4 w-4" />
                    Suivre ce match
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <Share2 className="h-4 w-4" />
                    Partager
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <Bookmark className="h-4 w-4" />
                    Sauvegarder
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => refetch()}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Actualiser
                  </Button>
                </CardContent>
              </Card>

              {/* Informations de diffusion */}
              {(match.video_url || match.live_stream_url) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Diffusion</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {match.live_stream_url && (
                      <Button className="w-full gap-2" asChild>
                        <a
                          href={match.live_stream_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Regarder en direct
                        </a>
                      </Button>
                    )}
                    {match.video_url && (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        asChild
                      >
                        <a
                          href={match.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Voir l'enregistrement
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Cards du match */}
              {match.cards && match.cards.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Cartons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {match.cards.map((card: any) => (
                        <div
                          key={card.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-6 w-6 rounded-full flex items-center justify-center ${
                                card.card_type === "red"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              <Typography variant="body-sm" weight="bold">
                                {card.card_type === "red" ? "R" : "J"}
                              </Typography>
                            </div>
                            <div>
                              <Typography variant="body-sm" weight="medium">
                                {card.fighter?.first_name}{" "}
                                {card.fighter?.last_name}
                              </Typography>
                              <Typography variant="body-sm" theme="muted">
                                {card.card_reason}
                              </Typography>
                            </div>
                          </div>
                          <Typography variant="body-sm" theme="muted">
                            {card.minute_given}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Bouton retour */}
              <Button variant="ghost" className="w-full gap-2" asChild>
                <Link href="/matches">
                  <ArrowLeft className="h-4 w-4" />
                  Retour aux matches
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
