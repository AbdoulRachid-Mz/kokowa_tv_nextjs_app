// app/admin/fighters/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { api } from "@/lib/api";


export default function FighterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fighterId = parseInt(params.fighterId as string);
  
  const [fighter, setFighter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    loadFighter();
  }, [fighterId]);

  const loadFighter = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<{ data: any }>(`/api/fighters/${fighterId}`);
      setFighter(data);
    } catch (error) {
      console.error("Erreur chargement lutteur:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!fighter) {
    return <div>Lutteur non trouvé avec l'ID: {params.figtherId}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        {/* Photo et informations basiques */}
        <Card className="lg:w-1/3">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="mb-4">
                <AdvancedUpload
                  value={fighter.profile_image || ""}
                  onChange={(url) => {
                    // Mettre à jour la photo de profil
                    setFighter((prev: any) => ({ ...prev, profile_image: url }));
                  }}
                  maxSizeMB={2}
                  isRounded={true}
                  className="w-48 h-48 mx-auto"
                />
              </div>
              
              <Typography variant="h3" className="mb-2">
                {fighter.first_name} {fighter.last_name}
              </Typography>
              
              {fighter.nickname && (
                <Typography variant="h5" theme="muted" className="mb-4">
                  "{fighter.nickname}"
                </Typography>
              )}

              <div className="flex flex-wrap gap-2 justify-center mb-4">
                <Badge variant={fighter.is_active ? "default" : "outline"}>
                  {fighter.is_active ? "Actif" : "Inactif"}
                </Badge>
                <Badge variant={fighter.is_champion ? "default" : "secondary"}>
                  {fighter.is_champion ? "Champion" : "Lutteur"}
                </Badge>
                {fighter.ranking && (
                  <Badge variant="outline">
                    Classement: {fighter.ranking}
                  </Badge>
                )}
              </div>

              <Button 
                onClick={() => router.push(`/admin/fighters/${fighterId}/edit`)}
                className="w-full"
              >
                Modifier le profil
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informations détaillées */}
        <Card className="lg:w-2/3">
          <CardHeader>
            <CardTitle>Informations du lutteur</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="profile">Profil</TabsTrigger>
                <TabsTrigger value="stats">Statistiques</TabsTrigger>
                <TabsTrigger value="achievements">Palmarès</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Typography variant="body-sm" weight="medium" theme="muted">
                      Région
                    </Typography>
                    <Typography>
                      {fighter.region?.name || "Non spécifiée"}
                    </Typography>
                  </div>
                  
                  <div>
                    <Typography variant="body-sm" weight="medium" theme="muted">
                      Ville
                    </Typography>
                    <Typography>
                      {fighter.city?.name || "Non spécifiée"}
                    </Typography>
                  </div>

                  {fighter.birth_date && (
                    <div>
                      <Typography variant="body-sm" weight="medium" theme="muted">
                        Date de naissance
                      </Typography>
                      <Typography>
                        {new Date(fighter.birth_date).toLocaleDateString()}
                      </Typography>
                    </div>
                  )}

                  {fighter.birth_place && (
                    <div>
                      <Typography variant="body-sm" weight="medium" theme="muted">
                        Lieu de naissance
                      </Typography>
                      <Typography>{fighter.birth_place}</Typography>
                    </div>
                  )}

                  {fighter.height && (
                    <div>
                      <Typography variant="body-sm" weight="medium" theme="muted">
                        Taille
                      </Typography>
                      <Typography>{fighter.height}m</Typography>
                    </div>
                  )}

                  {fighter.weight && (
                    <div>
                      <Typography variant="body-sm" weight="medium" theme="muted">
                        Poids
                      </Typography>
                      <Typography>{fighter.weight}kg</Typography>
                    </div>
                  )}

                  {fighter.debut_year && (
                    <div>
                      <Typography variant="body-sm" weight="medium" theme="muted">
                        Année de début
                      </Typography>
                      <Typography>{fighter.debut_year}</Typography>
                    </div>
                  )}

                  {fighter.fighting_style && (
                    <div className="md:col-span-2">
                      <Typography variant="body-sm" weight="medium" theme="muted">
                        Style de combat
                      </Typography>
                      <Typography>{fighter.fighting_style}</Typography>
                    </div>
                  )}
                </div>

                {fighter.bio && (
                  <div>
                    <Typography variant="body-sm" weight="medium" theme="muted">
                      Biographie
                    </Typography>
                    <Typography>{fighter.bio}</Typography>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="stats">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="text-center p-4">
                      <Typography variant="h4" weight="bold">
                        {fighter.total_matches || 0}
                      </Typography>
                      <Typography variant="body-sm" theme="muted">
                        Matchs totaux
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="text-center p-4">
                      <Typography variant="h4" weight="bold">
                        {fighter.wins || 0}
                      </Typography>
                      <Typography variant="body-sm" theme="muted">
                        Victoires
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="text-center p-4">
                      <Typography variant="h4" weight="bold">
                        {fighter.losses || 0}
                      </Typography>
                      <Typography variant="body-sm" theme="muted">
                        Défaites
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="text-center p-4">
                      <Typography variant="h4" weight="bold">
                        {fighter.wins && fighter.total_matches 
                          ? Math.round((fighter.wins / fighter.total_matches) * 100) 
                          : 0}%
                      </Typography>
                      <Typography variant="body-sm" theme="muted">
                        Taux de victoire
                      </Typography>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="achievements">
                {fighter.achievements && fighter.achievements.length > 0 ? (
                  <div className="space-y-3">
                    {fighter.achievements.map((achievement: any) => (
                      <Card key={achievement.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <Typography variant="h6" className="mb-1">
                                {achievement.title}
                              </Typography>
                              <Typography variant="body-sm" theme="muted">
                                {achievement.competition} • {achievement.year}
                              </Typography>
                              {achievement.description && (
                                <Typography variant="body-sm" className="mt-2">
                                  {achievement.description}
                                </Typography>
                              )}
                            </div>
                            <Badge variant={
                              achievement.position === '1st' ? 'default' :
                              achievement.position === '2nd' ? 'secondary' : 'outline'
                            }>
                              {achievement.position === '1st' ? '🥇' :
                               achievement.position === '2nd' ? '🥈' :
                               achievement.position === '3rd' ? '🥉' : ''}
                              {achievement.position}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Typography variant="h4" theme="muted">
                      Aucun palmarès
                    </Typography>
                    <Typography variant="body-sm" theme="muted" className="mt-2">
                      Aucune réalisation enregistrée pour ce lutteur.
                    </Typography>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}