"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  competitionEditionSchema,
  CompetitionEditionInput,
} from "@/validation/schemas";
import { Competition } from "@/types";

type Props = {
  competitionId?: number;
  edition?: CompetitionEditionInput & { id?: number };
};

export default function EditionForm({ competitionId, edition }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [nextEditionNumber, setNextEditionNumber] = useState(1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        if (competitionId) {
          // Fetch single competition with its editions
          const res = await fetch(
            `/api/competitions?with_editions=true&id=${competitionId}`
          );
          if (!res.ok) throw new Error("Failed to fetch competition");
          const result = await res.json();
          // API returns { data: Competition[], total: number }
          const data = result.data?.[0];
          if (!data) throw new Error("Competition not found");
          setCompetition(data);

          // Calculate next edition number
          if (data.editions && data.editions.length > 0) {
            const maxEditionNumber = Math.max(
              ...data.editions.map((e: any) => e.edition_number)
            );
            setNextEditionNumber(maxEditionNumber + 1);
          } else {
            setNextEditionNumber(1);
          }
        } else {
          // Fetch all competitions so user can choose
          const res = await fetch("/api/competitions");
          if (!res.ok) throw new Error("Failed to fetch competitions");
          const result = await res.json();
          // API returns { data: Competition[], total: number }
          setCompetitions(result.data || []);
        }
      } catch (err) {
        console.error("Error fetching competition(s):", err);
      }
    };
    fetchCompetitions();
  }, [competitionId]);

  // Préparer les valeurs par défaut
  const defaultValues: CompetitionEditionInput = edition
    ? {
        competition_id: edition.competition_id || competitionId!,
        edition_number: edition.edition_number,
        year: edition.year,
        theme: edition.theme || undefined,
        start_date: edition.start_date || undefined,
        end_date: edition.end_date || undefined,
        winner_fighter_id: edition.winner_fighter_id || undefined,
        winner_region_id: edition.winner_region_id || undefined,
        region_id: edition.region_id || undefined,
        prize_pool: edition.prize_pool || undefined,
        registration_deadline: edition.registration_deadline || undefined,
        is_active: edition.is_active !== undefined ? edition.is_active : true,
        total_participants: edition.total_participants || 0,
      }
    : {
        competition_id: competitionId!,
        edition_number: nextEditionNumber,
        year: currentYear,
        theme: undefined,
        start_date: undefined,
        end_date: undefined,
        winner_fighter_id: undefined,
        winner_region_id: undefined,
        region_id: undefined,
        prize_pool: undefined,
        registration_deadline: undefined,
        is_active: true,
        total_participants: 0,
      };

  const form = useForm<CompetitionEditionInput>({
    resolver: zodResolver(competitionEditionSchema) as any,
    defaultValues,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = form;

  const startDate = watch("start_date");
  const endDate = watch("end_date");
  const registrationDeadline = watch("registration_deadline");
  const selectedCompetitionId = watch("competition_id");

  // Reset edition number when competition changes
  useEffect(() => {
    if (!edition && selectedCompetitionId) {
      const selectedCompetition = competitions.find(
        (c) => c.id === Number(selectedCompetitionId)
      );
      if (selectedCompetition && selectedCompetition.editions) {
        const maxEditionNumber = Math.max(
          ...selectedCompetition.editions.map((e: any) => e.edition_number)
        );
        setValue("edition_number", maxEditionNumber + 1);
      } else {
        setValue("edition_number", 1);
      }
    }
  }, [selectedCompetitionId, competitions, edition, setValue]);

  // Update form when nextEditionNumber changes
  useEffect(() => {
    if (!edition) {
      setValue("edition_number", nextEditionNumber);
      setValue("year", currentYear);
    }
  }, [nextEditionNumber, currentYear, edition, setValue]);

  const onSubmit = async (data: CompetitionEditionInput) => {
    setIsLoading(true);
    setError(null);

    try {
      // Nettoyer les données pour l'envoi
      const cleanedData = {
        ...data,
        competition_id: Number(data.competition_id),
        edition_number: Number(data.edition_number),
        year: Number(data.year),
        theme: data.theme || undefined,
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
        winner_fighter_id: data.winner_fighter_id
          ? Number(data.winner_fighter_id)
          : undefined,
        winner_region_id: data.winner_region_id
          ? Number(data.winner_region_id)
          : undefined,
        region_id: data.region_id ? Number(data.region_id) : undefined,
        prize_pool: data.prize_pool ? Number(data.prize_pool) : undefined,
        registration_deadline: data.registration_deadline || undefined,
        is_active: Boolean(data.is_active),
        total_participants: data.total_participants
          ? Number(data.total_participants)
          : 0,
      };

      let url: string;
      let method: string;

      if (edition?.id) {
        // Mode édition - utiliser FormData pour PUT
        url = `/api/editions/${edition.id}`;
        method = "PUT";

        const formData = new FormData();
        Object.entries(cleanedData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });

        const res = await fetch(url, {
          method,
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Erreur lors de la mise à jour");
        }
      } else {
        // Mode création - utiliser JSON pour POST
        url = "/api/editions";
        method = "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanedData),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Erreur lors de la création");
        }
      }

      // Redirection après succès
      const redirectId = competitionId || data.competition_id;
      router.push(`/competitions/${redirectId}`);
      router.refresh();
    } catch (err: any) {
      console.error("Erreur:", err);
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {edition ? "Modifier l'édition" : "Créer une édition"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Competition selection - only show if no competitionId provided */}
          {!competitionId && (
            <div>
              <Label htmlFor="competition_id">Compétition *</Label>
              <select
                id="competition_id"
                {...register("competition_id", { valueAsNumber: true })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Sélectionner une compétition</option>
                {competitions.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name}
                  </option>
                ))}
              </select>
              {errors.competition_id && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.competition_id.message}
                </p>
              )}
            </div>
          )}

          {/* Display competition name if competitionId is provided */}
          {competition && (
            <div className="p-3 bg-muted rounded-md">
              <Label className="text-sm font-medium">Compétition</Label>
              <p className="text-lg font-semibold">{competition.name}</p>
            </div>
          )}

          {/* Auto-determined fields - display only */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edition_number">Numéro d'édition</Label>
              <Input
                id="edition_number"
                type="number"
                {...register("edition_number", { valueAsNumber: true })}
                min="1"
                readOnly
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Déterminé automatiquement
              </p>
            </div>

            <div>
              <Label htmlFor="year">Année</Label>
              <Input
                id="year"
                type="number"
                {...register("year", { valueAsNumber: true })}
                min="1900"
                max={new Date().getFullYear() + 5}
                readOnly
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Année en cours
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="theme">Thème (optionnel)</Label>
            <Input
              id="theme"
              {...register("theme")}
              placeholder="Thème de l'édition..."
            />
            {errors.theme && (
              <p className="text-red-500 text-sm mt-1">
                {errors.theme.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Date de début</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate
                      ? format(new Date(startDate), "PPP", { locale: fr })
                      : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate ? new Date(startDate) : undefined}
                    onSelect={(date) =>
                      setValue(
                        "start_date",
                        date ? format(date, "yyyy-MM-dd") : undefined
                      )
                    }
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              {errors.start_date && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.start_date.message}
                </p>
              )}
            </div>

            <div>
              <Label>Date de fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate
                      ? format(new Date(endDate), "PPP", { locale: fr })
                      : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate ? new Date(endDate) : undefined}
                    onSelect={(date) =>
                      setValue(
                        "end_date",
                        date ? format(date, "yyyy-MM-dd") : undefined
                      )
                    }
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              {errors.end_date && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.end_date.message}
                </p>
              )}
            </div>

            <div>
              <Label>Date limite d'inscription</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !registrationDeadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {registrationDeadline
                      ? format(new Date(registrationDeadline), "PPP", {
                          locale: fr,
                        })
                      : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      registrationDeadline
                        ? new Date(registrationDeadline)
                        : undefined
                    }
                    onSelect={(date) =>
                      setValue(
                        "registration_deadline",
                        date ? format(date, "yyyy-MM-dd") : undefined
                      )
                    }
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              {errors.registration_deadline && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.registration_deadline.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="prize_pool">Prize pool (optionnel)</Label>
              <Input
                id="prize_pool"
                type="number"
                step="0.01"
                min="0"
                {...register("prize_pool", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.prize_pool && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.prize_pool.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="total_participants">Participants totaux</Label>
              <Input
                id="total_participants"
                type="number"
                min="0"
                {...register("total_participants", { valueAsNumber: true })}
              />
              {errors.total_participants && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.total_participants.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              {...register("is_active")}
              className="rounded border-gray-300"
            />
            <Label
              htmlFor="is_active"
              className="text-sm font-medium leading-none"
            >
              Édition active
            </Label>
          </div>
          {errors.is_active && (
            <p className="text-red-500 text-sm">{errors.is_active.message}</p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-24">
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Enregistrement...
                </>
              ) : edition ? (
                "Mettre à jour"
              ) : (
                "Créer"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
