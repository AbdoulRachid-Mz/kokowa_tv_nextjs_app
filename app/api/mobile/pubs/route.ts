import { getMobileAdvertisements } from "@/actions/mobile/advertisements";
import { AdvertisementMediaType, AdvertisementPosition } from "@/types";
import { NextRequest, NextResponse } from "next/server";

// GET /api/mobile/pubs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Build filters from query parameters
    const filters = {
      position: searchParams.get("position") as AdvertisementPosition | undefined,
      media_type: searchParams.get("media_type") as AdvertisementMediaType | undefined,
      is_active: searchParams.has("is_active")
        ? searchParams.get("is_active") === "true"
        : undefined,
      start_date_from: searchParams.get("start_date_from") || undefined,
      start_date_to: searchParams.get("start_date_to") || undefined,
      end_date_from: searchParams.get("end_date_from") || undefined,
      end_date_to: searchParams.get("end_date_to") || undefined,
      advertiser_name: searchParams.get("advertiser_name") || undefined,
      target_audience: searchParams.get("target_audience") || undefined,
      with_clicks: searchParams.has("with_clicks")
        ? searchParams.get("with_clicks") === "true"
        : undefined,
      userId: searchParams.has("userId")
        ? Number(searchParams.get("userId"))
        : undefined,
      page: searchParams.has("page") ? Number(searchParams.get("page")) : undefined,
      limit: searchParams.has("limit") ? Number(searchParams.get("limit")) : undefined,
    };

    const result = await getMobileAdvertisements(filters);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || "Erreur serveur" },
        { status: result.error?.code || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      // message: "Publicités récupérées avec succès",
      data: {
        advertisements: result.data?.advertisements || [],
      },
      pagination: {
        count: result.data?.count || 0,
        total: result.data?.total || 0,
        page: result.data?.page || 1,
        limit: result.data?.limit || 10,
        totalPages: result.data?.totalPages || 1,
      },
      timestamp: result.data?.timestamp || new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in GET /api/mobile/pubs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des publicités" },
      { status: 500 }
    );
  }
}
