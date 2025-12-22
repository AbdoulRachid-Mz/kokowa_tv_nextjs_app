"use client";

import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";

interface MediaStats {
  total_articles?: number;
  published_articles?: number;
  total_videos?: number;
  total_views?: number;
  total_likes?: number;
  total_media?: number;
  by_status?: Array<{
    status: string;
    count: number;
    total_views: number;
    avg_views: string;
  }>;
  by_category?: Array<{
    category: string;
    count: number;
    total_views: number;
    avg_views: string;
    total_likes: number;
  }>;
  top_articles?: Array<{
    title: string;
    views: number;
    likes: number;
    author: string;
    published_at: string;
  }>;
  top_videos?: Array<{
    title: string;
    views: number;
    likes: number;
    category: string;
    duration: number;
  }>;
}

interface MediaChartProps {
  data: MediaStats;
  loading?: boolean;
  title?: string;
  statId?: "summary" | "articles" | "videos";
}

export function MediaChart({ data, loading = false, title = "Statistiques des Médias", statId = "summary" }: MediaChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Données pour les graphiques
  const summaryPieData = [
    { name: "Articles publiés", value: data.published_articles || 0, color: "#10b981" },
    { name: "Vidéos", value: data.total_videos || 0, color: "#3b82f6" },
    { name: "Articles non publiés", value: (data.total_articles || 0) - (data.published_articles || 0), color: "#6b7280" }
  ].filter(item => item.value > 0);

  const viewsLikesData = [
    { name: "Vues totales", value: data.total_views || 0, color: "#3b82f6" },
    { name: "Likes totaux", value: data.total_likes || 0, color: "#ef4444" }
  ];

  const articlesByStatusData = (data.by_status || []).map(item => ({
    status: item.status,
    count: item.count,
    total_views: item.total_views,
    avg_views: parseFloat(item.avg_views)
  }));

  const videosByCategoryData = (data.by_category || []).map(item => ({
    category: item.category,
    count: item.count,
    total_views: item.total_views,
    avg_views: parseFloat(item.avg_views),
    total_likes: item.total_likes
  }));

  const topArticlesData = (data.top_articles || []).slice(0, 5);
  const topVideosData = (data.top_videos || []).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Répartition des médias */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Médias</CardTitle>
            <CardDescription>Articles vs Vidéos</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryPieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summaryPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {summaryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} médias`, "Quantité"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <Typography theme="muted">Aucune donnée disponible</Typography>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart - Vues vs Likes */}
        <Card>
          <CardHeader>
            <CardTitle>Vues vs Likes</CardTitle>
            <CardDescription>Comparaison des interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viewsLikesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques par statut (articles) */}
      {statId === "articles" && articlesByStatusData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Articles par Statut</CardTitle>
            <CardDescription>Répartition et vues moyennes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={articlesByStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Nombre d'articles" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avg_views" name="Vues moyennes" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques par catégorie (vidéos) */}
      {statId === "videos" && videosByCategoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vidéos par Catégorie</CardTitle>
            <CardDescription>Répartition et interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={videosByCategoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Nombre de vidéos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total_likes" name="Likes totaux" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résumé détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé Détaillé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/20">
              <Typography variant="body-sm" className="mb-2 text-muted-foreground">Total Articles</Typography>
              <Typography variant="h3" weight="bold" className="text-foreground">
                {data.total_articles || 0}
              </Typography>
            </div>
            <div className="text-center p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
              <Typography variant="body-sm" className="mb-2 text-muted-foreground">Articles Publiés</Typography>
              <Typography variant="h3" weight="bold" className="text-green-600">
                {data.published_articles || 0}
              </Typography>
              {data.total_articles && data.published_articles && (
                <Typography variant="caption2" theme="muted" className="mt-1">
                  {Math.round((data.published_articles / data.total_articles) * 100)}% du total
                </Typography>
              )}
            </div>
            <div className="text-center p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Typography variant="body-sm" className="mb-2 text-muted-foreground">Total Vidéos</Typography>
              <Typography variant="h3" weight="bold" className="text-blue-600">
                {data.total_videos || 0}
              </Typography>
            </div>
            <div className="text-center p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <Typography variant="body-sm" className="mb-2 text-muted-foreground">Total Médias</Typography>
              <Typography variant="h3" weight="bold" className="text-purple-600">
                {data.total_media || 0}
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Articles */}
      {statId === "articles" && topArticlesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Articles</CardTitle>
            <CardDescription>Les articles les plus consultés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topArticlesData.map((article, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Typography variant="body-sm" weight="medium">{article.title}</Typography>
                    <Typography variant="caption2" theme="muted">Par {article.author}</Typography>
                  </div>
                  <div className="text-right">
                    <Typography variant="body-sm" weight="bold">{article.views} vues</Typography>
                    <Typography variant="caption2" theme="muted">{article.likes} likes</Typography>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Vidéos */}
      {statId === "videos" && topVideosData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Vidéos</CardTitle>
            <CardDescription>Les vidéos les plus consultées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topVideosData.map((video, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Typography variant="body-sm" weight="medium">{video.title}</Typography>
                    <Typography variant="caption2" theme="muted">{video.category}</Typography>
                  </div>
                  <div className="text-right">
                    <Typography variant="body-sm" weight="bold">{video.views} vues</Typography>
                    <Typography variant="caption2" theme="muted">{video.likes} likes</Typography>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
