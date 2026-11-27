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
        sub_group_default_period: map.sub_group_default_period ?? "matin",
        latest_app_version: map.latest_app_version ?? "1.0.0",
        points_per_draw: map.points_per_draw ?? 1,
        points_per_win: map.points_per_win ?? 3,
        is_under_maintenance: map.is_under_maintenance ?? false,
        is_update_required: map.is_update_required ?? false,
        test_mode: map.test_mode ?? false,
        send_match_push: map.send_match_push ?? true,
        app_update_url: map.app_update_url ?? "",
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
