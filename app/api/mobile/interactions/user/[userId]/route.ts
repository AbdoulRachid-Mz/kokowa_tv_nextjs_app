// app/api/mobile/interactions/user/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMobileInteractions, getMobileUserInteractions } from '@/actions/mobile/interactions';
import { EntityType, InteractionType } from '@/types';

interface Props {
  params: Promise<{ userId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 400,
          message: 'ID utilisateur invalide',
          timestamp: new Date().toISOString()
        }
      });
    }

    const { searchParams } = new URL(request.url);

    const filters = {
      authId: userId,
      entityType: searchParams.get("entityType") || undefined,
      entityId: searchParams.get("entityId")
        ? Number(searchParams.get("entityId"))
        : undefined,
      interactionType:
        (searchParams.get("interactionType") as InteractionType) || "like",
      page: searchParams.get("page")
        ? Number(searchParams.get("page"))
        : 1,
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : 20,
    };

    const result = await getMobileInteractions(filters);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Error GET interactions:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 500,
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
