import { NextRequest, NextResponse } from 'next/server';
import { getMobileAdvertisementById } from '@/actions/mobile/advertisements';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }>  }
) {
  try {
    const { id } = await params;
    const adIdNum = Number(id);

    if (isNaN(adIdNum)) {
      return NextResponse.json(
        { error: { code: 400, message: 'Invalid advertisement ID' } },
        { status: 400 }
      );
    }

    // Optional userId from query or auth context
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId')
      ? Number(url.searchParams.get('userId'))
      : undefined;

    const result = await getMobileAdvertisementById(adIdNum, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.code ?? 500 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('API /api/ads/[adId] error:', err);
    return NextResponse.json(
      {
        error: {
          code: 500,
          message: 'Internal server error',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
