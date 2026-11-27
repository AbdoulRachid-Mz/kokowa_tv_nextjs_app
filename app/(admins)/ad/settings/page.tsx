// app/(admins)/ad/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getAppSettings, updateAppSetting } from "@/actions/app-settings";
import type { AppSetting } from "@/types";
import { Save, Settings } from "lucide-react";
import { ResponsiveTabs } from "@/components/shared/responsive-tabs";

const CATEGORY_LABELS: Record<string, string> = {
  general: "Général",
  system: "Système",
  auth: "Authentification",
  media: "Médias",
  localization: "Localisation",
  matches: "Matchs",
  ranking: "Classement",
  social: "Réseaux sociaux",
  contact: "Contact",
  analytics: "Analytics",
  notifications: "Notifications",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAppSettings({ limit: 500 });
      const list = res.data || [];
      setSettings(list);
      const v: Record<string, string> = {};
      list.forEach((s) => {
        v[s.setting_key] = String(s.setting_value ?? "");
      });
      setValues(v);
    } catch (e: any) {
      toast.error(e?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (key: string) => {
    setSavingKey(key);
    try {
      const fd = new FormData();
      fd.append("setting_value", values[key] ?? "");
      await updateAppSetting(key, fd);
      toast.success("Paramètre mis à jour");
    } catch (e: any) {
      toast.error(e?.message || "Erreur de sauvegarde");
    } finally {
      setSavingKey(null);
    }
  };

  const grouped = settings.reduce<Record<string, AppSetting[]>>((acc, s) => {
    const cat = s.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const tabs = Object.entries(grouped).map(([category, items]) => ({
    value: category,
    label: CATEGORY_LABELS[category] || category,
    content: (
      <Card>
        <CardHeader>
          <CardTitle className="capitalize">{CATEGORY_LABELS[category] || category}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((s) => (
            <div key={s.setting_key} className="flex flex-col sm:flex-row sm:items-center gap-3 border-b pb-3 last:border-0">
              <div className="flex-1">
                <Label className="font-medium">{s.setting_key}</Label>
                {s.description && (
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                )}
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{s.setting_type}</Badge>
                  {s.is_public && <Badge variant="secondary" className="text-xs">public</Badge>}
                  {!s.is_editable && <Badge variant="destructive" className="text-xs">non modifiable</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {s.setting_type === "boolean" ? (
                  <Switch
                    checked={values[s.setting_key] === "true"}
                    onCheckedChange={(v) => setValues({ ...values, [s.setting_key]: v ? "true" : "false" })}
                    disabled={!s.is_editable}
                  />
                ) : (
                  <Input
                    value={values[s.setting_key] ?? ""}
                    onChange={(e) => setValues({ ...values, [s.setting_key]: e.target.value })}
                    disabled={!s.is_editable}
                    className="w-64"
                  />
                )}
                {s.is_editable && (
                  <Button
                    size="sm"
                    onClick={() => handleSave(s.setting_key)}
                    disabled={savingKey === s.setting_key}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    ),
  }));

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Paramètres de l'application</h1>
      </div>
      <ResponsiveTabs tabs={tabs} defaultValue={tabs[0]?.value} />
    </div>
  );
}
