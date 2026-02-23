"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  MousePointer,
  Calendar,
  DollarSign,
  MapPin,
  Image as ImageIcon,
  Video,
  Code,
  Globe,
  Users,
  Phone,
  TrendingUp,
  Clock,
  AlertCircle
} from "lucide-react";
import { getAdvertisementById, deleteAdvertisement } from "@/actions/advertisements";
import { Advertisement } from "@/types";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";

export default function ClientAdvertisementDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [advertisement, setAdvertisement] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadAdvertisement();
  }, [id]);

  const loadAdvertisement = async () => {
    try {
      setLoading(true);
      const data = await getAdvertisementById(Number(id), { with_stats: true });
      setAdvertisement(data);
    } catch (error) {
      console.error("Erreur chargement publicité:", error);
      toast.error("Erreur lors du chargement de la publicité");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAdvertisement(Number(id));
      toast.success("Publicité supprimée avec succès");
      router.push("/admin/advertisements");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const getStatusInfo = () => {
    if (!advertisement) return { label: "Inconnu", color: "gray", icon: null };

    const now = new Date();
    const startDate = advertisement.start_date ? new Date(advertisement.start_date) : null;
    const endDate = advertisement.end_date ? new Date(advertisement.end_date) : null;

    if (!advertisement.is_active) {
      return { label: "Inactive", color: "gray", icon: null };
    }
    if (endDate && endDate < now) {
      return { label: "Expirée", color: "red", icon: null };
    }
    if (startDate && startDate > now) {
      return { label: "Planifiée", color: "blue", icon: Calendar };
    }
    return { label: "Active", color: "green", icon: TrendingUp };
  };

  const formatPosition = (position: string) => {
    const positions: Record<string, string> = {
      header: "En-tête",
      sidebar: "Barre latérale",
      footer: "Pied de page",
      in_content: "Dans le contenu",
      popup: "Pop-up",
      banner_top: "Bannière haut",
      banner_bottom: "Bannière bas",
      mobile_sticky: "Mobile collant"
    };
    return positions[position] || position;
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'html': return <Code className="h-5 w-5" />;
      default: return null;
    }
  };

  if (loading) {
    return <PageSkeleton type="profile" />;
  }

  if (!advertisement) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-red-500 to-orange-400 opacity-20 animate-pulse" />
          <AlertCircle className="w-full h-full text-red-500" />
        </div>

        <Typography variant="h3" weight="semibold" className="mb-2">
          Publicité introuvable
        </Typography>
        <Typography variant="body-base" theme="muted" className="mb-6 text-center max-w-sm">
          Il semble que cette publicité n'existe pas ou ait été supprimée.
        </Typography>

        <div className="flex gap-3">
          <Button onClick={() => router.push("/admin/advertisements")}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  const status = getStatusInfo();
  const ctr = advertisement.impression_count > 0
    ? ((advertisement.click_count / advertisement.impression_count) * 100).toFixed(2)
    : "0.00";

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <Typography variant="h3" weight="bold">
              {advertisement.title}
            </Typography>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={`bg-${status.color}-100 text-${status.color}-700`}>
                {status.icon && <status.icon className="h-3 w-3 mr-1" />}
                {status.label}
              </Badge>
              <Badge variant="secondary">
                {formatPosition(advertisement.position)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/admin/advertisements/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-3">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body-sm" theme="muted">Impressions</Typography>
                <Typography variant="h3" weight="bold">
                  {advertisement.impression_count.toLocaleString()}
                </Typography>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body-sm" theme="muted">Clics</Typography>
                <Typography variant="h3" weight="bold">
                  {advertisement.click_count.toLocaleString()}
                </Typography>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <MousePointer className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body-sm" theme="muted">CTR</Typography>
                <Typography variant="h3" weight="bold">
                  {ctr}%
                </Typography>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body-sm" theme="muted">Priorité</Typography>
                <Typography variant="h3" weight="bold">
                  {advertisement.priority}
                </Typography>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="apercu" className="space-y-4">
        <TabsList>
          <TabsTrigger value="apercu">Aperçu</TabsTrigger>
          <TabsTrigger value="performances">Performances</TabsTrigger>
          <TabsTrigger value="details">Détails</TabsTrigger>
        </TabsList>

        <TabsContent value="apercu" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Media */}
            <Card className="lg:col-span-2 p-3">
              <CardHeader>
                <CardTitle>Média</CardTitle>
              </CardHeader>
              <CardContent>
                {advertisement.media ? (
                  <div className="border rounded-lg overflow-hidden">
                    {advertisement.media_type === 'image' && (
                      <div className="relative w-full">
                        <Image
                          src={advertisement.media}
                          fill
                          alt={advertisement.title}
                          className="w-full h-auto"
                        />
                      </div>
                    )}
                    {advertisement.media_type === 'video' && (
                      <video
                        src={advertisement.media}
                        controls
                        className="w-full h-auto"
                      />
                    )}
                    {advertisement.media_type === 'html' && (
                      <div className="p-4 bg-muted">
                        <Code className="h-8 w-8 mx-auto text-muted-foreground" />
                        <Typography className="text-center mt-2">
                          Contenu HTML personnalisé
                        </Typography>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted rounded-lg">
                    {getMediaIcon(advertisement.media_type)}
                    <Typography className="mt-2">
                      Aucun média disponible
                    </Typography>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info */}
            <Card className="p-3">
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Typography variant="body-sm" theme="muted">Description</Typography>
                  <Typography>
                    {advertisement.description || "Aucune description"}
                  </Typography>
                </div>

                {advertisement.cta_text && (
                  <div className='overflow-hidden'>
                    <Typography variant="body-sm" theme="muted">Texte d'appel à l'action</Typography>
                    <Typography>
                      {advertisement.cta_text}
                    </Typography>
                  </div>
                )}

                {advertisement.link_url && (
                  <div className='overflow-hidden'>
                    <Typography variant="body-sm" theme="muted">Lien</Typography>
                    <a
                      href={advertisement.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Globe className="h-4 w-4" />
                      {advertisement.link_url}
                    </a>
                  </div>
                )}

                {advertisement.price > 0 && (
                  <div>
                    <Typography variant="body-sm" theme="muted">Prix</Typography>
                    <Typography variant="h4" weight="bold" className="text-green-600">
                      {advertisement.price.toLocaleString()} FCFA
                    </Typography>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performances" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Évolution */}
            <Card className="p-3">
              <CardHeader>
                <CardTitle>Évolution des impressions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/30 rounded">
                  <Typography theme="muted">
                    Graphique d'évolution à venir
                  </Typography>
                </div>
              </CardContent>
            </Card>

            {/* Répartition */}
            <Card className="p-3">
              <CardHeader>
                <CardTitle>Répartition des clics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/30 rounded">
                  <Typography theme="muted">
                    Graphique de répartition à venir
                  </Typography>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Détails complets</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">ID</dt>
                  <dd className="font-mono">{advertisement.id}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Titre</dt>
                  <dd>{advertisement.title}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Type média</dt>
                  <dd className="flex items-center gap-1">
                    {getMediaIcon(advertisement.media_type)}
                    <span className="capitalize">{advertisement.media_type}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Position</dt>
                  <dd className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {formatPosition(advertisement.position)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Priorité</dt>
                  <dd>{advertisement.priority}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Statut</dt>
                  <dd>
                    <Badge variant={advertisement.is_active ? "default" : "secondary"}>
                      {advertisement.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </dd>
                </div>
                {advertisement.start_date && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Date de début</dt>
                    <dd className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(advertisement.start_date).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </dd>
                  </div>
                )}
                {advertisement.end_date && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Date de fin</dt>
                    <dd className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(advertisement.end_date).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </dd>
                  </div>
                )}
                {advertisement.target_audience && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Cible</dt>
                    <dd className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {advertisement.target_audience}
                    </dd>
                  </div>
                )}
                {advertisement.advertiser_name && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Annonceur</dt>
                    <dd>{advertisement.advertiser_name}</dd>
                  </div>
                )}
                {advertisement.advertiser_contact && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Contact annonceur</dt>
                    <dd className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {advertisement.advertiser_contact}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-muted-foreground">Créée le</dt>
                  <dd className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(advertisement.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>
                {advertisement.updated_at && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Modifiée le</dt>
                    <dd className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(advertisement.updated_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la publicité "{advertisement.title}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}