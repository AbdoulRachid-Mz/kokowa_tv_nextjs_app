"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createCompetition } from "@/actions/competitions";
import { competitionSchema } from "@/validation/schemas";

type CompetitionFormData = z.infer<typeof competitionSchema>;

export default function CreateCompetitionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CompetitionFormData>({
    title: "",
    description: "",
    lieu: "",
    date: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CompetitionFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof CompetitionFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validation côté client avant envoi
      competitionSchema.parse(formData);

      const formDataToSend = new FormData();
      for (const key in formData) {
        formDataToSend.append(key, formData[key as keyof CompetitionFormData] ?? "");
      }

      const result = await createCompetition(formDataToSend);

      if (!result.success) throw new Error("Erreur serveur");
      router.push("/competitions");
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof CompetitionFormData, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof CompetitionFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        alert("Erreur lors de la création de la compétition");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Créer une compétition</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Champ titre */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Titre <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 ${errors.title ? "border-red-500" : "border-gray-300"}`}
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* Champ description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        {/* Champ lieu */}
        <div>
          <label htmlFor="lieu" className="block text-sm font-medium mb-1">
            Lieu <span className="text-red-500">*</span>
          </label>
          <input
            id="lieu"
            name="lieu"
            type="text"
            value={formData.lieu}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 ${errors.lieu ? "border-red-500" : "border-gray-300"}`}
          />
          {errors.lieu && <p className="text-red-500 text-sm mt-1">{errors.lieu}</p>}
        </div>

        {/* Champ date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 ${errors.date ? "border-red-500" : "border-gray-300"}`}
          />
          {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
        </div>

        {/* Boutons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push("/competitions")}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Création..." : "Créer"}
          </button>
        </div>
      </form>
    </div>
  );
}
