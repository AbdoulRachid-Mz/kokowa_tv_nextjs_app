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
        // test message
        testMessage: map.test_message ?? "",
        latestAppVersion: map.latest_app_version ?? "1.0.0",
        isUnderMaintenance: map.is_under_maintenance ?? false,
        isUpdateRequired: map.is_update_required ?? false,
        testMode: map.test_mode ?? false,
        sendMatchPush: map.send_match_push ?? true,
        appUpdateUrl: map.app_update_url ?? "",
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
