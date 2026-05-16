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
  FormDescription,
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
  Phone,
  Star,
  Layers,
  Settings,
  AlertCircle,
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

export function TeamMemberForm({
  initialData,
  onSubmit,
  loading,
}: TeamMemberFormProps) {
  const form = useForm<any>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: initialData
      ? {
          first_name: initialData.first_name || "",
          last_name: initialData.last_name || "",
          nickname: initialData.nickname || "",
          email: initialData.email || "",
          phone: initialData.phone || "",
          role: initialData.role || "",
          department: initialData.department || "",
          specialization: initialData.specialization || "",
          profile_image: initialData.profile_image || "",
          cover_image: initialData.cover_image || "",
          bio: initialData.bio || "",
          quote: initialData.quote || "",
          is_lead: initialData.is_lead || false,
          is_active:
            initialData.is_active !== undefined ? initialData.is_active : true,
          position_order: initialData.position_order || 0,
          years_experience: initialData.years_experience || 0,
          projects_count: initialData.projects_count || 0,
          contributions_count: initialData.contributions_count || 0,
          expertise: Array.isArray(initialData.expertise)
            ? initialData.expertise
            : [],
          languages: Array.isArray(initialData.languages)
            ? initialData.languages
            : [],
          social_links:
            typeof initialData.social_links === "object" &&
            initialData.social_links !== null
              ? initialData.social_links
              : {},
          badges: Array.isArray(initialData.badges) ? initialData.badges : [],
          availability: initialData.availability || "full-time",
          joined_date: initialData.joined_date
            ? new Date(initialData.joined_date).toISOString().split("T")[0]
            : "",
          last_active: initialData.last_active
            ? new Date(initialData.last_active).toISOString().slice(0, 16)
            : "",
        }
      : {
          first_name: "",
          last_name: "",
          nickname: "",
          email: "",
          phone: "",
          role: "",
          department: "",
          specialization: "",
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
          social_links: {},
          badges: [],
          availability: "full-time",
          joined_date: new Date().toISOString().split("T")[0],
          last_active: "",
        },
  });

  const { errors } = form.formState;

  const handleFormSubmit = async (values: any) => {
    console.log("Submitting values:", values);
    try {
      const formattedValues = {
  ...values,
  last_active: values.last_active
    ? new Date(values.last_active).toISOString()
    : undefined,
};
      await onSubmit(formattedValues);
    } catch (error) {
      console.error("Form submit error:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const onInvalid = (formErrors: any) => {
    console.error("Form validation errors:", formErrors);
    toast.error(
      "Le formulaire contient des erreurs. Veuillez vérifier les champs soulignés en rouge.",
    );
  };

  // Helpers pour les listes (Expertise, Langues)
  const addToList = (
    field: "expertise" | "languages" | "badges",
    value: string,
  ) => {
    if (!value.trim()) return;
    const current = form.getValues(field) || [];
    if (!current.includes(value.trim())) {
      form.setValue(field, [...current, value.trim()]);
    }
  };

  const removeFromList = (
    field: "expertise" | "languages" | "badges",
    value: string,
  ) => {
    const current = form.getValues(field) || [];
    form.setValue(
      field,
      current.filter((v: string) => v !== value),
    );
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit, onInvalid)}
        className="space-y-8"
      >
        {Object.keys(errors).length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de validation</AlertTitle>
            <AlertDescription>
              Certains champs obligatoires sont manquants ou invalides.
              <ul className="list-disc pl-5 mt-2 text-xs">
                {Object.entries(errors).map(([key, error]: [string, any]) => (
                  <li key={key}>
                    {key}: {error.message}
                  </li>
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
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom *</FormLabel>
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
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surnom / Pseudonyme</FormLabel>
                      <FormControl>
                        <Input placeholder="Surnom (optionnel)" {...field} />
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
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder="email@kokowa.tv"
                            {...field}
                          />
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
                        <div className="relative">
                          <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder="+223 ..."
                            {...field}
                          />
                        </div>
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
                  <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Spécialisation</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Frontend React, UI/UX Design"
                            {...field}
                          />
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
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addToList("expertise", e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const input = document.getElementById(
                          "expertise-input",
                        ) as HTMLInputElement;
                        addToList("expertise", input.value);
                        input.value = "";
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.watch("expertise")?.map((item: string) => (
                      <Badge
                        key={item}
                        variant="secondary"
                        className="pl-2 pr-1 py-1 gap-1"
                      >
                        {item}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeFromList("expertise", item)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Languages List */}
                <div className="space-y-2">
                  <FormLabel>Langues</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ajouter une langue"
                      id="languages-input"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addToList("languages", e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const input = document.getElementById(
                          "languages-input",
                        ) as HTMLInputElement;
                        addToList("languages", input.value);
                        input.value = "";
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.watch("languages")?.map((item: string) => (
                      <Badge
                        key={item}
                        variant="outline"
                        className="pl-2 pr-1 py-1 gap-1"
                      >
                        {item}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeFromList("languages", item)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Badges List */}
                <div className="space-y-2">
                  <FormLabel>Badges / Distinctions</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ajouter un badge"
                      id="badges-input"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addToList("badges", e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const input = document.getElementById(
                          "badges-input",
                        ) as HTMLInputElement;
                        addToList("badges", input.value);
                        input.value = "";
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.watch("badges")?.map((item: string) => (
                      <Badge
                        key={item}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white pl-2 pr-1 py-1 gap-1"
                      >
                        <Star className="h-3 w-3 fill-current" />
                        {item}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent text-white"
                          onClick={() => removeFromList("badges", item)}
                        >
                          <Trash2 className="h-3 w-3" />
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

                <FormField
                  control={form.control}
                  name="quote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Citation préférée</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Une citation qui vous inspire..."
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
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="cover_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Images de Profil & couverture</FormLabel>
                      <FormControl>
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-dashed border-input">
                          <AdvancedUpload
                            value={field.value}
                            onChange={field.onChange}
                            uploadPath="teams/covers"
                            className="w-full h-full"
                            previewClassName="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-4 left-4 w-24 h-24 md:w-32 md:h-32">
                            <AdvancedUpload
                              value={form.getValues("profile_image")}
                              onChange={(value) =>
                                form.setValue("profile_image", value)
                              }
                              uploadPath="teams/profiles"
                              className="w-full h-full border-4 border-white rounded-full overflow-hidden shadow-lg"
                              isRounded
                              maxWidthOrHeight={92}
                              previewClassName="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription className="mt-3">
                        L'image de couverture s'affiche en arrière-plan, la
                        photo de profil (ronde) est superposée en bas à gauche.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground">
                      Photo de profil
                    </p>
                    <p>Format carré recommandé: 400x400</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Image de couverture
                    </p>
                    <p>Format paysage recommandé: 1200x400</p>
                  </div>
                </div>
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
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponibilité</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="full-time">Temps plein</option>
                          <option value="part-time">Temps partiel</option>
                          <option value="contract">Contractuel</option>
                          <option value="freelance">Freelance</option>
                        </select>
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
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
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
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contributions_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contributions</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="joined_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'arrivée</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_active"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dernière activité</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading
                    ? "Enregistrement..."
                    : initialData
                      ? "Mettre à jour"
                      : "Créer le Membre"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => window.history.back()}
                >
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
