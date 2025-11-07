"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Referee } from "@/types";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Region } from "@/types";

interface RefereeFormProps {
  referee?: Referee;
  isEditing?: boolean;
}

export function RefereeForm({ referee, isEditing = false }: RefereeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [formData, setFormData] = useState({
    first_name: referee?.first_name || "",
    last_name: referee?.last_name || "",
    nickname: referee?.nickname || "",
    birth_date: referee?.birth_date ? referee.birth_date.split('T')[0] : "",
    region_id: referee?.region_id?.toString() || "",
    license_number: referee?.license_number || "",
    certification_level: referee?.certification_level || "",
    experience_years: referee?.experience_years?.toString() || "",
    profile_image: referee?.profile_image || "",
    is_active: referee?.is_active ?? true,
  });

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await fetch('/api/regions?limit=100');
        if (response.ok) {
          const data = await response.json();
          setRegions(data.data || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des régions:', error);
      }
    };

    fetchRegions();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditing && referee 
        ? `/api/referees/${referee.id}`
        : '/api/referees';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          region_id: formData.region_id ? parseInt(formData.region_id) : null,
          experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        }),
      });

      if (response.ok) {
        router.push('/admin/referees');
        router.refresh();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* En-tête */}
        <div>
          <Typography variant="h1">
            {isEditing ? 'Modifier l\'arbitre' : 'Créer un nouvel arbitre'}
          </Typography>
          <Typography variant="body-lg" theme="muted">
            {isEditing 
              ? 'Modifiez les informations de l\'arbitre' 
              : 'Ajoutez un nouvel arbitre à la base de données'
            }
          </Typography>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informations personnelles */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Prénom *</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        placeholder="Prénom de l'arbitre"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Nom *</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        placeholder="Nom de l'arbitre"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nickname">Surnom</Label>
                      <Input
                        id="nickname"
                        value={formData.nickname}
                        onChange={(e) => handleInputChange('nickname', e.target.value)}
                        placeholder="Surnom (optionnel)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birth_date">Date de naissance</Label>
                      <Input
                        id="birth_date"
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => handleInputChange('birth_date', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informations professionnelles */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations professionnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="license_number">Numéro de licence</Label>
                      <Input
                        id="license_number"
                        value={formData.license_number}
                        onChange={(e) => handleInputChange('license_number', e.target.value)}
                        placeholder="Numéro de licence officiel"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="certification_level">Niveau de certification</Label>
                      <Select
                        value={formData.certification_level}
                        onValueChange={(value) => handleInputChange('certification_level', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un niveau" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="national">National</SelectItem>
                          <SelectItem value="regional">Régional</SelectItem>
                          <SelectItem value="international">International</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience_years">Années d'expérience</Label>
                      <Input
                        id="experience_years"
                        type="number"
                        min="0"
                        max="50"
                        value={formData.experience_years}
                        onChange={(e) => handleInputChange('experience_years', e.target.value)}
                        placeholder="Nombre d'années d'expérience"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="region_id">Région</Label>
                      <Select
                        value={formData.region_id}
                        onValueChange={(value) => handleInputChange('region_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une région" />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map((region) => (
                            <SelectItem key={region.id} value={region.id.toString()}>
                              {region.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Colonne latérale */}
            <div className="space-y-6">
              {/* Photo de profil */}
              <Card>
                <CardHeader>
                  <CardTitle>Photo de profil</CardTitle>
                </CardHeader>
                <CardContent>
                  <AdvancedUpload
                    value={formData.profile_image}
                    onChange={(url) => handleInputChange('profile_image', url)}
                    isRounded={true}
                  />
                </CardContent>
              </Card>

              {/* Statut */}
              <Card>
                <CardHeader>
                  <CardTitle>Statut</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active" className="cursor-pointer">
                      Arbitre actif
                    </Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                    />
                  </div>
                  <Badge 
                    variant={formData.is_active ? "default" : "secondary"}
                    className="w-full justify-center"
                  >
                    {formData.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? "Sauvegarde..." : 
                     isEditing ? "Modifier l'arbitre" : "Créer l'arbitre"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/ad/referees')}
                  >
                    Annuler
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}