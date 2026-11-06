import { withLightInstrumentation } from "@/lib/server/api-handler";
// api/mobile/interactions/[id]/route.ts
import { NextResponse } from 'next/server';
import { getMobileInteractionById } from '@/actions/mobile/interactions';

export const GET = withLightInstrumentation(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const withUser = searchParams.get('withUser');

    const result = await getMobileInteractionById(parseInt(id), withUser !== 'false');

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.error?.code || 500,
            message: result.error?.message || 'Erreur lors de la récupération de l\'interaction',
            timestamp: new Date().toISOString()
          }
        },
        { status: result.error?.code || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in GET /api/mobile/interactions/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 500,
          message: 'Erreur serveur lors de la récupération de l\'interaction',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
});