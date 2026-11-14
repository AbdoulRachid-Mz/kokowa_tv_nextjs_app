// app/(admins)/ad/phases/[phaseId]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { updatePhase, getPhaseById } from "@/actions/phases";

export default function EditPhasePage() {
  const params = useParams();
  const router = useRouter();
  const phaseId = Number(params.phaseId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    phase_type: "group",
    phase_order: 1,
    description: "",
    start_date: "",
    end_date: "",
    is_active: true,
    is_completed: false,
    edition_id: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await getPhaseById(phaseId, { with_relations: false });
        setPhase(data);
        setForm({
          name: data.name || "",
          phase_type: data.phase_type || "group",
          phase_order: data.phase_order || 1,
          description: data.description || "",
          start_date: data.start_date ? String(data.start_date).slice(0, 10) : "",
          end_date: data.end_date ? String(data.end_date).slice(0, 10) : "",
          is_active: data.is_active ?? true,
          is_completed: data.is_completed ?? false,
          edition_id: data.edition_id,
        });
      } catch (e) {
        toast.error("Erreur lors du chargement de la phase");
      } finally {
        setLoading(false);
      }
    })();
  }, [phaseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("edition_id", String(form.edition_id));
      fd.append("name", form.name);
      fd.append("phase_order", String(form.phase_order));
      fd.append("phase_type", form.phase_type);
      fd.append("description", form.description);
      if (form.start_date) fd.append("start_date", form.start_date);
      if (form.end_date) fd.append("end_date", form.end_date);
      fd.append("is_active", form.is_active ? "true" : "false");
      fd.append("is_completed", form.is_completed ? "true" : "false");

      await updatePhase(phaseId, fd);
      toast.success("Phase modifiée avec succès");
      router.push(`/ad/phases/${phaseId}`);
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la modification");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span>Chargement...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <Button variant="outline" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Modifier la phase</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Nom</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Type de phase</Label>
              <Select
                value={form.phase_type}
                onValueChange={(v) => setForm({ ...form, phase_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Groupe</SelectItem>
                  <SelectItem value="quarterfinal">1/4 de finale</SelectItem>
                  <SelectItem value="semifinal">1/2 finale</SelectItem>
                  <SelectItem value="final">Finale</SelectItem>
                  <SelectItem value="third_place">3e place</SelectItem>
                  <SelectItem value="knockout">Élimination</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Ordre</Label>
              <Input
                type="number"
                value={form.phase_order}
                onChange={(e) => setForm({ ...form, phase_order: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Active
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_completed}
                  onChange={(e) => setForm({ ...form, is_completed: e.target.checked })}
                />
                Terminée
              </label>
            </div>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
