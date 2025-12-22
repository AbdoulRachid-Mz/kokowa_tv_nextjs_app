"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { createRegion, updateRegion } from "@/actions/regions";

interface RegionFormProps {
  region?: any;
  isEdit?: boolean;
}

export function RegionForm({ region, isEdit = false }: RegionFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: region?.name || "",
    code: region?.code || "",
    stadium_name: region?.stadium_name || "",
    stadium_image: region?.stadium_image || "",
    description: region?.description || "",
    color: region?.color || "#3b82f6",
  });
  const [stadiumImage, setStadiumImage] = useState(
    region?.stadium_image || undefined
  );
  const [flagImage, setFlagImage] = useState(region?.flag_image || undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("code", formData.code);
      if (formData.description)
        formDataToSend.append("description", formData.description);
      if (formData.color) formDataToSend.append("color", formData.color);
      if (flagImage) formDataToSend.append("flag_image", flagImage);

      let result;
      if (isEdit && region) {
        result = await fetch(`/api/regions/${region.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            code: formData.code,
            description: formData.description,
            color: formData.color,
            flag_image: flagImage,
          }),
        }).then((res) => res.json());
      } else {
        result = await fetch("/api/regions", {
          method: "POST",
          body: formDataToSend,
        }).then((res) => res.json());
      }

      if (result.success) {
        router.push("/ad/regions");
        router.refresh();
      } else {
        setErrors({ submit: result.message || "Une erreur est survenue" });
      }
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'enregistrement",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-2">
      <div className="max-w-4xl mx-auto">
        <Typography variant="h4" className="mb-3">
          {isEdit ? "Modifier la Région" : "Créer une Région"}
        </Typography>

        <Card className="p-2 gap-2">
          <CardHeader>
            <CardTitle>Informations de la région</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative mb-14">
                <div>
                  <Typography
                    variant="body-sm"
                    weight="medium"
                    className="mb-2"
                  >
                    Stade
                  </Typography>
                  <AdvancedUpload
                    value={stadiumImage}
                    onChange={setStadiumImage}
                    maxSizeMB={2}
                    isAutoUpload={false}
                    isRounded={false}
                    className="w-full"
                  />
                </div>
                {/* Upload du drapeau */}
                <div className="max-w-fit absolute -bottom-14 left-2 ">
                  <Typography
                    variant="body-sm"
                    weight="medium"
                    className="mb-2"
                  >
                    Drapeau de la région
                  </Typography>
                  <AdvancedUpload
                    value={flagImage}
                    onChange={setFlagImage}
                    maxSizeMB={2}
                    isAutoUpload={false}
                    isRounded={true}
                    className="w-full "
                  />
                </div>
              </div>

              {/* nom et stade */}
              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-2"> */}
                {/* Nom */}
                <div className="grid grid cols-1 md:grid-cols-2 gap-2 ">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium mb-2"
                    >
                      Nom de la région *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Ex: Dakar"
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium mb-2"
                    >
                      Nom de stade*
                    </label>
                    <Input
                      id="stadium_name"
                      name="stadium_name"
                      type="text"
                      value={formData.stadium_name}
                      onChange={handleChange}
                      placeholder="Ex: Dakar"
                      className={errors.stadium_name ? "border-red-500" : ""}
                    />
                    {errors.stadium_name && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.stadium_name}
                      </p>
                    )}
                  </div>
                </div>
              {/* </div> */}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* Code */}
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium mb-2"
                >
                  Code *
                </label>
                <Input
                  id="code"
                  name="code"
                  type="text"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="Ex: DK"
                  maxLength={10}
                  className={errors.code ? "border-red-500" : ""}
                />
                {errors.code && (
                  <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                )}
              </div>

              {/* Couleur */}
              <div>
                <label
                  htmlFor="color"
                  className="block text-sm font-medium mb-2"
                >
                  Couleur
                </label>
                <div className="flex gap-4 items-center">
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="w-20 h-10 p-1"
                  />
                  <Input
                    value={formData.color}
                    onChange={handleChange}
                    className="flex-1"
                  />
                </div>
              </div>
               </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Description de la région..."
                />
              </div>

              {/* Boutons */}
              <div className="flex justify-end gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/ad/regions")}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Enregistrement..."
                    : isEdit
                    ? "Modifier"
                    : "Créer"}
                </Button>
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <Typography variant="body-sm" theme="danger">
                    {errors.submit}
                  </Typography>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
