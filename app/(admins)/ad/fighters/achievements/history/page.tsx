// app/admin/archives/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "sonner";

interface ArchiveHistory {
  id: number;
  title: string;
  fighter_name: string;
  region_name: string;
  year: number;
  position: string;
  archive_reason: string;
  archived_at: string;
  archived_by: string;
}

interface HistoryStats {
  daily: { date: string; count: number }[];
  by_reason: { reason: string; count: number }[];
  by_user: { user: string; count: number }[];
}

export default function ArchiveHistoryPage() {
  const [data, setData] = useState<ArchiveHistory[]>([]);
  const [stats, setStats] = useState<HistoryStats>({
    daily: [],
    by_reason: [],
    by_user: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    reason: "all",
    year: "all",
    sort: "newest",
  });
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    loadHistory();
    loadStats();
  }, [pagination.page, filters, dateRange]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.reason !== "all" && { reason: filters.reason }),
        ...(filters.year !== "all" && { year: filters.year }),
        ...(dateRange.from && { date_from: dateRange.from.toISOString().split('T')[0] }),
        ...(dateRange.to && { date_to: dateRange.to.toISOString().split('T')[0] }),
        sort: filters.sort,
      });

      const response = await fetch(`/api/archives/history?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
        setPagination(prev => ({
          ...prev,
          total: result.total,
          totalPages: Math.ceil(result.total / prev.limit),
        }));
      }
    } catch (error) {
      console.error("Erreur chargement historique:", error);
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/archives/history/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Erreur chargement statistiques:", error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/archives/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `archives-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Export réussi");
      }
    } catch (error) {
      console.error("Erreur export:", error);
      toast.error("Erreur lors de l'export");
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason.toLowerCase()) {
      case 'correction': return 'bg-blue-100 text-blue-800';
      case 'duplicate': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPositionIcon = (position: string) => {
    switch (position) {
      case "1st": return "🥇";
      case "2nd": return "🥈";
      case "3rd": return "🥉";
      default: return "🏅";
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Typography variant="h2" weight="bold" className="mb-2">
            Historique des Archives
          </Typography>
          <Typography variant="body-lg" theme="muted">
            Suivi complet des opérations d'archivage
          </Typography>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={loadHistory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Archives par jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.daily.slice(0, 5).map((item) => (
                <div key={item.date} className="flex justify-between items-center">
                  <Typography variant="body-sm">{item.date}</Typography>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Par raison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.by_reason.map((item) => (
                <div key={item.reason} className="flex justify-between items-center">
                  <Badge className={getReasonColor(item.reason)}>
                    {item.reason}
                  </Badge>
                  <Typography variant="body-sm" weight="medium">
                    {item.count}
                  </Typography>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.by_user.slice(0, 5).map((item) => (
                <div key={item.user} className="flex justify-between items-center">
                  <Typography variant="body-sm" className="truncate">
                    {item.user}
                  </Typography>
                  <Badge variant="outline">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.reason}
              onValueChange={(value) => setFilters(prev => ({ ...prev, reason: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Raison" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les raisons</SelectItem>
                <SelectItem value="correction">Correction</SelectItem>
                <SelectItem value="duplicate">Doublon</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.year}
              onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les années</SelectItem>
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.sort}
              onValueChange={(value) => setFilters(prev => ({ ...prev, sort: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Plus récent</SelectItem>
                <SelectItem value="oldest">Plus ancien</SelectItem>
                <SelectItem value="year_desc">Année (décroissant)</SelectItem>
                <SelectItem value="year_asc">Année (croissant)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4">
            {/* <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Filtrer par période"
            /> */}
          </div>
        </CardContent>
      </Card>

      {/* Liste d'historique */}
      <Card>
        <CardHeader>
          <CardTitle>Opérations d'archivage</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <Typography variant="body-lg" className="mt-4">
                Chargement de l'historique...
              </Typography>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <Typography variant="body-lg" theme="muted">
                Aucune opération d'archivage trouvée
              </Typography>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((item) => (
                <Card key={item.id} className="hover:bg-gray-50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <Typography variant="body-lg" weight="medium">
                          {item.title}
                        </Typography>
                        <div className="flex flex-wrap gap-2">
                          <Typography variant="body-sm" theme="muted">
                            {item.fighter_name}
                          </Typography>
                          <span className="text-gray-300">•</span>
                          <Typography variant="body-sm" theme="muted">
                            {item.region_name}
                          </Typography>
                          <span className="text-gray-300">•</span>
                          <Badge variant="outline">
                            {getPositionIcon(item.position)} {item.year}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col md:items-end gap-2">
                        <Badge className={getReasonColor(item.archive_reason)}>
                          {item.archive_reason}
                        </Badge>
                        <Typography variant="caption2" theme="muted">
                          Archivé le {new Date(item.archived_at).toLocaleDateString()}
                          {item.archived_by && ` par ${item.archived_by}`}
                        </Typography>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  {/* Previous */}
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }));
                      }}
                      aria-disabled={pagination.page === 1}
                      className={pagination.page === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {/* First page */}
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      isActive={pagination.page === 1}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>

                  {/* Ellipsis before middle */}
                  {pagination.page > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {/* Middle pages */}
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(
                      p =>
                        p === pagination.page ||
                        (p >= pagination.page - 1 && p <= pagination.page + 1)
                    )
                    .slice(1, -1)
                    .map(p => (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPagination(prev => ({ ...prev, page: p }));
                          }}
                          isActive={pagination.page === p}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                  {/* Ellipsis after middle */}
                  {pagination.page < pagination.totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {/* Last page */}
                  {pagination.totalPages > 1 && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPagination(prev => ({ ...prev, page: pagination.totalPages }));
                        }}
                        isActive={pagination.page === pagination.totalPages}
                      >
                        {pagination.totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {/* Next */}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, pagination.totalPages) }));
                      }}
                      aria-disabled={pagination.page === pagination.totalPages}
                      className={pagination.page === pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}