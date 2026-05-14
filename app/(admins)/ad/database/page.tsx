"use client";

import React, { useState, useEffect } from "react";
import { 
  getDatabaseSummary, 
  exportTableData, 
  importTableData, 
  resetDatabase,
  getAvailableBackups
} from "@/actions/database";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  AlertTriangle, 
  Search,
  FileJson,
  HardDrive,
  History,
  Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DatabaseManagerPage() {
  const [summary, setSummary] = useState<any>(null);
  const [backups, setBackups] = useState<string[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<string>("latest");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryData, backupsList] = await Promise.all([
        getDatabaseSummary(),
        getAvailableBackups()
      ]);
      setSummary(summaryData);
      setBackups(backupsList);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = async (tableName?: string) => {
    setActionLoading(tableName || "all_export");
    try {
      const result = await exportTableData(tableName);
      if (result.success) {
        toast.success(result.message);
        const updatedBackups = await getAvailableBackups();
        setBackups(updatedBackups);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erreur lors de l'exportation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleImport = async (tableName?: string) => {
    const backupName = tableName ? "latest" : selectedBackup;
    if (!confirm(`Êtes-vous sûr de vouloir restaurer les données depuis "${backupName}" ? Cela écrasera les données existantes.`)) return;
    
    setActionLoading(tableName || "all_import");
    try {
      const result = await importTableData(tableName, backupName);
      if (result.success) {
        toast.success(result.message);
        fetchData();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erreur lors de l'importation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReset = async () => {
    if (!confirm("DANGER : Voulez-vous vraiment vider toutes les tables ? Cette action est irréversible !")) return;
    
    setActionLoading("reset");
    try {
      const result = await resetDatabase();
      if (result.success) {
        toast.success(result.message);
        fetchData();
      }
    } catch (error) {
      toast.error("Erreur lors de la réinitialisation");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTables = summary?.tables?.filter((t: any) => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <Typography variant="h2" weight="bold" className="flex items-center gap-2">
            <Database className="h-8 w-8 text-primary" />
            Gestion des Données
          </Typography>
          <Typography variant="body-sm" theme="muted">
            Outils d'exportation, de restauration et de maintenance de la base de données
          </Typography>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchData} 
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <Typography variant="h4" weight="bold">{summary?.totalTables || 0}</Typography>
              <Typography variant="caption1" theme="muted">Tables totales</Typography>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-full">
              <HardDrive className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <Typography variant="h4" weight="bold">{summary?.totalRows?.toLocaleString() || 0}</Typography>
              <Typography variant="caption1" theme="muted">Enregistrements</Typography>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <History className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <Typography variant="h4" weight="bold">{backups.length}</Typography>
              <Typography variant="caption1" theme="muted">Backups datés</Typography>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <Typography variant="h4" weight="bold">{summary?.isolatedTables || 0}</Typography>
              <Typography variant="caption1" theme="muted">Tables isolées</Typography>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Global Actions */}
        <Card className="lg:col-span-2 border-2 border-primary/20 shadow-lg bg-gradient-to-br from-background to-primary/5">
          <CardHeader>
            <CardTitle>Actions Globales</CardTitle>
            <CardDescription>Sauvegardez l'état actuel ou restaurez une version précédente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-4">
              <Button 
                className="flex-1 min-w-[200px]" 
                size="lg"
                onClick={() => handleExport()}
                disabled={!!actionLoading}
              >
                {actionLoading === "all_export" ? <RefreshCw className="animate-spin mr-2" /> : <Download className="mr-2" />}
                Créer un Snapshot
              </Button>
              <Button 
                variant="destructive" 
                className="min-w-[150px]" 
                size="lg"
                onClick={handleReset}
                disabled={!!actionLoading}
              >
                {actionLoading === "reset" ? <RefreshCw className="animate-spin mr-2" /> : <AlertTriangle className="mr-2" />}
                Vider la Base
              </Button>
            </div>

            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Typography variant="body-sm" weight="semibold" className="mb-1 block">Source de restauration</Typography>
                  <Select value={selectedBackup} onValueChange={setSelectedBackup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un backup..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest" className="font-bold text-primary">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Dernier état (latest)
                        </div>
                      </SelectItem>
                      {backups.map(b => (
                        <SelectItem key={b} value={b}>
                          Snapshot du {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="outline" 
                  className="mt-6 min-w-[180px]"
                  size="lg"
                  onClick={() => handleImport()}
                  disabled={!!actionLoading}
                >
                  {actionLoading === "all_import" ? <RefreshCw className="animate-spin mr-2" /> : <Upload className="mr-2" />}
                  Restaurer "{selectedBackup}"
                </Button>
              </div>
              <Typography variant="caption1" theme="muted" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-yellow-600" />
                La restauration remplace les données existantes par celles du snapshot choisi.
              </Typography>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileJson className="h-4 w-4 text-primary" />
              Format de Stockage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Typography variant="caption1" theme="muted">
              Les données sont stockées au format JSON dans le dossier <code>database/backups/</code>.
            </Typography>
            <div className="bg-muted p-3 rounded text-[10px] font-mono overflow-hidden">
              <div className="text-primary font-bold">// Structure</div>
              database/<br/>
              &nbsp;&nbsp;backups/<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;2026-05-14/<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;users.json<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;regions.json<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;latest/<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;... (dernière copie)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Explorer */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Explorateur de Tables</CardTitle>
            <CardDescription>Exportez ou restaurez des tables individuellement (utilise toujours "latest" pour le restore)</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher une table..." 
              className="pl-8" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left font-medium">Nom de la Table</th>
                  <th className="p-3 text-center font-medium">Lignes</th>
                  <th className="p-3 text-center font-medium">Relations</th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTables.map((table: any) => (
                  <tr key={table.name} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-semibold text-primary">{table.name}</td>
                    <td className="p-3 text-center">
                      <Badge variant="outline">{table.rowCount}</Badge>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-1">
                        {table.hasChildren && <Badge variant="secondary" className="text-[10px]">Parent</Badge>}
                        {table.hasParents && <Badge variant="outline" className="text-[10px]">Enfant</Badge>}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => handleExport(table.name)}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === table.name ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                          Export
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-blue-600 hover:text-blue-600 hover:bg-blue-600/10"
                          onClick={() => handleImport(table.name)}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === table.name ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                          Restore
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
