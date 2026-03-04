import { NextRequest, NextResponse } from 'next/server';
import { createMobileMessage, getMobileMessages } from '@/actions/mobile/messages';
import { MobileMessageFilters } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Build filters from query parameters
    const filters: MobileMessageFilters = {
      authId: searchParams.get('authId') || undefined,
      entityId: searchParams.get('entityId')
        ? Number(searchParams.get('entityId'))
        : undefined,
      entityType:
        (searchParams.get('entityType') as MobileMessageFilters['entityType']) ||
        undefined,
      page: searchParams.get('page')
        ? Number(searchParams.get('page'))
        : undefined,
      limit: searchParams.get('limit')
        ? Number(searchParams.get('limit'))
        : undefined,
    };

    const result = await getMobileMessages(filters);

    if (!result.success) {
      return NextResponse.json(result, {
        status: result.error?.code || 400,
      });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('❌ API GET /api/mobile/messages:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 500,
          message: 'Erreur serveur',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let body: any = {};

    // ✅ Cas JSON
    if (contentType.includes('application/json')) {
      body = await req.json();
    }
    // ✅ Cas form-urlencoded (Flutter, mobile)
    else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      body = Object.fromEntries(new URLSearchParams(text));
    }
    // ❌ Autre format
    else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 415,
            message: 'Content-Type non supporté',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 415 }
      );
    }

    const result = await createMobileMessage({
      authId: body.authId,
      content: body.content,
      entityId: Number(body.entityId),
      entityType: body.entityType,
      parentMessageId: body.parentMessageId
        ? Number(body.parentMessageId)
        : undefined,
    });

    if (!result.success) {
      return NextResponse.json(result, {
        status: result.error?.code || 400,
      });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('❌ API POST /api/mobile/messages:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 500,
          message: 'Erreur serveur',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
