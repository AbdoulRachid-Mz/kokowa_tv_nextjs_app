// app/api/mobile/app-settings/route.ts
import { NextRequest } from "next/server";
import { getPublicAppSettings } from "@/actions/app-settings";
import { publicHandler } from "@/lib/api-handler";

export const GET = publicHandler(
  async (_request: NextRequest) => {
    try {
      const settings = await getPublicAppSettings();
      const map: Record<string, any> = {};
      for (const s of settings) {
        map[s.setting_key] = s.setting_value;
      }
      const data = {
        app_name: map.app_name ?? "Kokowa TV",
        app_version: map.app_version ?? "1.0.0",
        latest_app_version: map.latest_app_version ?? map.app_version ?? "1.0.0",
        app_update_url: map.app_update_url ?? "",
        is_under_maintenance: map.is_under_maintenance ?? map.maintenance_mode ?? false,
        maintenance_mode: map.maintenance_mode ?? false,
        test_mode: map.test_mode ?? false,
        is_update_required: map.is_update_required ?? false,
        registration_enabled: map.registration_enabled ?? true,
        default_language: map.default_language ?? "fr",
        supported_languages: map.supported_languages ?? ["fr"],
      };
      return Response.json({ success: true, data });
    } catch (error) {
      console.error("Error in mobile app-settings API:", error);
      return Response.json(
        { success: false, error: { code: 500, message: "Erreur serveur", timestamp: new Date().toISOString() } },
        { status: 500 },
      );
    }
  },
  { allowedMethods: ["GET"], cacheControl: "no-store" },
);
