"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { notificationSchema, NotificationInput } from "@/validation/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function NotificationFormPage() {
  const params = useParams();
  const router = useRouter();
  const notificationId = params.notificationId as string;
  const isEditMode = notificationId !== "create";

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<NotificationInput>({
    resolver: zodResolver(notificationSchema) as any,
    defaultValues: {
      user_id: 1, // TODO: ID utilisateur
      title: "",
      message: "",
      notification_type: "system_notification",
      entity_type: undefined,
      entity_id: undefined,
      action_url: "",
      priority: "medium", // obligatoire, même si default dans Zod
      is_read: false, // obligatoire, même si default dans Zod
      expires_at: undefined,
    },
  });

  const notificationType = watch("notification_type");
  const selectedUserId = watch("user_id");

  // Charger la liste des utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users?limit=100");
        if (response.ok) {
          const data = await response.json();
          setUsers(data.data || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Charger les données de la notification en mode édition
  useEffect(() => {
    if (isEditMode) {
      const fetchNotification = async () => {
        try {
          const response = await fetch(`/api/notifications/${notificationId}`);
          if (response.ok) {
            const data = await response.json();

            // Préparer les valeurs pour le formulaire
            const formValues: NotificationInput = {
              user_id: data.user_id,
              title: data.title,
              message: data.message,
              notification_type: data.notification_type,
              is_read: data.is_read ?? false,
              entity_type: data.entity_type || undefined,
              entity_id: data.entity_id || undefined,
              action_url: data.action_url || "",
              priority: data.priority,
              expires_at: data.expires_at || undefined,
            };

            if (data.expires_at) {
              setExpiresAt(new Date(data.expires_at));
            }

            reset(formValues);
          } else {
            toast.error("Erreur lors du chargement de la notification");
            router.push("/ad/notifications");
          }
        } catch (error) {
          console.error("Erreur:", error);
          toast.error("Erreur réseau");
        }
      };
      fetchNotification();
    }
  }, [notificationId, isEditMode, reset, router]);

  const onSubmit = async (data: NotificationInput) => {
    setLoading(true);
    setFormError(null);

    try {
      // Nettoyer les données
      const cleanedData = {
        ...data,
        entity_id: data.entity_id ? Number(data.entity_id) : undefined,
      };

      const formData = new FormData();
      Object.entries(cleanedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value.toString());
        }
      });

      const url = isEditMode
        ? `/api/notifications/${notificationId}`
        : "/api/notifications";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'enregistrement");
      }

      toast.success(
        isEditMode
          ? "Notification modifiée avec succès"
          : "Notification créée avec succès"
      );

      // Rediriger après succès
      if (isEditMode) {
        router.push(`/ad/notifications/${notificationId}`);
      } else {
        router.push("/ad/notifications");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setFormError(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const notificationTypes = [
    { value: "system_notification", label: "Système" },
    { value: "match_update", label: "Mise à jour de match" },
    { value: "fighter_update", label: "Mise à jour de lutteur" },
    { value: "competition_update", label: "Mise à jour de compétition" },
    { value: "achievement", label: "Récompense" },
    { value: "message", label: "Message" },
  ];

  const priorities = [
    { value: "low", label: "Basse" },
    { value: "medium", label: "Moyenne" },
    { value: "high", label: "Haute" },
  ];

  const entityTypes = [
    { value: "", label: "Aucune" },
    { value: "article", label: "Article" },
    { value: "match", label: "Match" },
    { value: "fighter", label: "Lutteur" },
    { value: "competition", label: "Compétition" },
    { value: "user", label: "Utilisateur" },
    { value: "message", label: "Message" },
  ];

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditMode
            ? "Modifier la notification"
            : "Créer une nouvelle notification"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Destinataire */}
          <div>
            <Label htmlFor="user_id">
              Destinataire <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedUserId?.toString() || ""}
              onValueChange={(value) => setValue("user_id", Number(value))}
              disabled={loadingUsers}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.username}
                    {user.first_name &&
                      ` (${user.first_name} ${user.last_name})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loadingUsers && (
              <p className="text-gray-500 text-sm mt-1">
                Chargement des utilisateurs...
              </p>
            )}
            {errors.user_id && (
              <p className="text-red-500 text-sm mt-1">
                {errors.user_id.message}
              </p>
            )}
          </div>

          {/* Titre et type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="title">
                Titre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Titre de la notification"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="notification_type">Type de notification</Label>
              <Select
                value={notificationType}
                onValueChange={(value) =>
                  setValue("notification_type", value as any)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.notification_type && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.notification_type.message}
                </p>
              )}
            </div>
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="message"
              {...register("message")}
              placeholder="Contenu de la notification"
              rows={4}
            />
            {errors.message && (
              <p className="text-red-500 text-sm mt-1">
                {errors.message.message}
              </p>
            )}
          </div>

          {/* Entité associée */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="entity_type">
                Type d'entité associée (optionnel)
              </Label>
              <Select
                value={watch("entity_type") || ""}
                onValueChange={(value) =>
                  setValue(
                    "entity_type",
                    value
                      ? (value as
                          | "match"
                          | "article"
                          | "message"
                          | "user"
                          | "fighter"
                          | "competition")
                      : undefined
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {entityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.entity_type && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.entity_type.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="entity_id">
                ID de l'entité associée (optionnel)
              </Label>
              <Input
                id="entity_id"
                type="number"
                min="0"
                {...register("entity_id", { valueAsNumber: true })}
                placeholder="ID numérique"
              />
              {errors.entity_id && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.entity_id.message}
                </p>
              )}
            </div>
          </div>

          {/* URL d'action et priorité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="action_url">URL d'action (optionnel)</Label>
              <Input
                id="action_url"
                type="url"
                {...register("action_url")}
                placeholder="https://example.com/action"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL vers laquelle rediriger lors du clic
              </p>
              {errors.action_url && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.action_url.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={watch("priority")}
                onValueChange={(value) => setValue("priority", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une priorité" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.priority.message}
                </p>
              )}
            </div>
          </div>

          {/* Date d'expiration */}
          <div>
            <Label>Date d'expiration (optionnel)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expiresAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiresAt
                    ? format(expiresAt, "PPP", { locale: fr })
                    : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={expiresAt}
                  onSelect={(date) => {
                    setExpiresAt(date);
                    setValue(
                      "expires_at",
                      date ? date.toISOString() : undefined
                    );
                  }}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
            <div className="flex gap-2 mt-2">
              {expiresAt && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setExpiresAt(undefined);
                    setValue("expires_at", undefined);
                  }}
                >
                  Supprimer la date
                </Button>
              )}
            </div>
            {errors.expires_at && (
              <p className="text-red-500 text-sm mt-1">
                {errors.expires_at.message}
              </p>
            )}
          </div>

          {/* Informations */}
          <Alert>
            <AlertDescription>
              {isEditMode
                ? "Modifiez les informations de la notification. Les changements seront visibles immédiatement."
                : "La notification sera envoyée immédiatement. Vous pouvez la planifier pour plus tard en définissant une date d'expiration."}
            </AlertDescription>
          </Alert>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Enregistrement..."
                : isEditMode
                ? "Mettre à jour"
                : "Créer la notification"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
