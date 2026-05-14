"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { teamMemberSchema } from "@/validation/schemas";
import { TeamMember } from "@/types";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, 
  Mail, 
  Briefcase, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  ExternalLink,
  Code,
  Globe,
  Settings,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TeamMemberFormProps {
  initialData?: TeamMember | null;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export function TeamMemberForm({ initialData, onSubmit, loading }: TeamMemberFormProps) {
  const form = useForm<any>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: initialData ? {
      ...initialData,
      profile_image: initialData.profile_image || "",
      avatar_url: initialData.avatar_url || "",
      cover_image: initialData.cover_image || "",
      email: initialData.email || "",
      phone: initialData.phone || "",
      nickname: initialData.nickname || "",
      first_name: initialData.first_name || "",
      last_name: initialData.last_name || "",
      department: initialData.department || "",
      specialization: initialData.specialization || "",
      bio: initialData.bio || "",
      quote: initialData.quote || "",
      availability: initialData.availability || "full-time",
      joined_date: initialData.joined_date || "",
      last_active: initialData.last_active || "",
      social_links: Array.isArray(initialData.social_links) ? initialData.social_links : [],
      expertise: Array.isArray(initialData.expertise) ? initialData.expertise : [],
      languages: Array.isArray(initialData.languages) ? initialData.languages : [],
      badges: Array.isArray(initialData.badges) ? initialData.badges : [],
    } : {
      full_name: "",
      first_name: "",
      last_name: "",
      role: "",
      department: "",
      email: "",
      phone: "",
      avatar_url: "",
      profile_image: "",
      cover_image: "",
      bio: "",
      quote: "",
      is_lead: false,
      is_active: true,
      position_order: 0,
      years_experience: 0,
      projects_count: 0,
      contributions_count: 0,
      expertise: [],
      languages: [],
      social_links: [],
      badges: [],
      availability: "full-time"
    },
  });

  const { errors, isSubmitting } = form.formState;

  const handleFormSubmit = async (values: any) => {
    console.log("Submitting values:", values);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error("Form submit error:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const onInvalid = (formErrors: any) => {
    console.error("Form validation errors:", formErrors);
    toast.error("Le formulaire contient des erreurs. Veuillez vérifier les champs soulignés en rouge.");
  };

  // Helpers pour les listes (Expertise, Langues)
  const addToList = (field: "expertise" | "languages", value: string) => {
    if (!value) return;
    const current = form.getValues(field) || [];
    if (!current.includes(value)) {
      form.setValue(field, [...current, value]);
    }
  };

  const removeFromList = (field: "expertise" | "languages", value: string) => {
    const current = form.getValues(field) || [];
    form.setValue(field, current.filter((v: string) => v !== value));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit, onInvalid)} className="space-y-8">
        {Object.keys(errors).length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de validation</AlertTitle>
            <AlertDescription>
              Certains champs obligatoires sont manquants ou invalides.
              <ul className="list-disc pl-5 mt-2 text-xs">
                {Object.entries(errors).map(([key, error]: [string, any]) => (
                  <li key={key}>{key}: {error.message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informations Personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nom Complet *</FormLabel>
                      <FormControl>
                        <Input placeholder="Prénom et Nom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input placeholder="Prénom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" placeholder="email@kokowa.tv" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="+223 ..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Rôle et Expertise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rôle / Titre *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Lead Developer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Département</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Développement" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Expertise List */}
                <div className="space-y-2">
                  <FormLabel>Expertise / Skills</FormLabel>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Ajouter un skill (ex: React)" 
                      id="expertise-input"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToList('expertise', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        const input = document.getElementById('expertise-input') as HTMLInputElement;
                        addToList('expertise', input.value);
                        input.value = '';
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.watch('expertise')?.map((item: string) => (
                      <Badge key={item} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                        {item}
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeFromList('expertise', item)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biographie</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Parlez-nous de vous..." 
                          className="min-h-[120px] resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Médias et Visuels
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="profile_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photo de Profil</FormLabel>
                      <FormControl>
                        <AdvancedUpload 
                          value={field.value} 
                          onChange={field.onChange}
                          uploadPath="teams/profiles"
                          className="aspect-square"
                          isRounded
                        />
                      </FormControl>
                      <FormDescription>Format recommandé: Carré (ex: 400x400)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="avatar_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar (Legacy)</FormLabel>
                      <FormControl>
                        <AdvancedUpload 
                          value={field.value} 
                          onChange={field.onChange}
                          uploadPath="teams/avatars"
                          className="aspect-square"
                          isRounded
                        />
                      </FormControl>
                      <FormDescription>Utilisé comme secours</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cover_image"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Image de Couverture</FormLabel>
                      <FormControl>
                        <AdvancedUpload 
                          value={field.value} 
                          onChange={field.onChange}
                          uploadPath="teams/covers"
                          className="aspect-video"
                          previewClassName="aspect-video"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Statut et Paramètres
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Actif</FormLabel>
                        <FormDescription>Visible sur le site</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_lead"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Leader / Manager</FormLabel>
                        <FormDescription>Mise en avant</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordre d'affichage</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="years_experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Années Exp.</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="projects_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Projets</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enregistrement..." : initialData ? "Mettre à jour" : "Créer le Membre"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => window.history.back()}>
                  Annuler
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
