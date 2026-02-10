import { NextRequest, NextResponse } from 'next/server';
import { createMobileMessage } from '@/actions/mobile/messages';

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

    // console.log(body)

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

    return NextResponse.json(result, { status: 201 });
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
