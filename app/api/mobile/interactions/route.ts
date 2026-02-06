import { createMobileInteraction, getMobileInteractions } from "@/actions/mobile/interactions";
import { InteractionType } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = {
      userId: searchParams.get("userId") ? Number(searchParams.get("userId")) : undefined,
      entityType: searchParams.get("entityType") || undefined,
      entityId: searchParams.get("entityId") ? Number(searchParams.get("entityId")) : undefined,
      interactionType: searchParams.get("interactionType") || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      withUser: searchParams.get("withUser") !== "false",
    };

    const result = await getMobileInteractions({
      ...filters,
      interactionType: filters.interactionType as InteractionType | undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching mobile interactions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch mobile interactions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // data in json format
    const formData = await req.json();
    const result = await createMobileInteraction(formData);
    if (!result.success) {
      return NextResponse.json(result, { status: result.error?.code || 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating mobile interaction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create mobile interaction" },
      { status: 500 }
    );
  }
}
