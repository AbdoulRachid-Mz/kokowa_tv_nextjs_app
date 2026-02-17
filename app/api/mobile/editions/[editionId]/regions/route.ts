// @/api/mobile/editions/editionId/regions
// import { getEditionRegions } from '@/actions/mobile/getEditionRegions';
import { getMobileEditionRegions } from '@/actions/mobile/getEditionRegions';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ editionId: string }> }
) {
  const { editionId } = await params;
  const editionIdNum = Number(editionId);

  if (isNaN(editionIdNum)) {
    return NextResponse.json(
      { success: false, error: { code: 400, message: "Invalid editionId", timestamp: new Date().toISOString() } },
      { status: 400 }
    );
  }

  const result = await getMobileEditionRegions(editionIdNum);
  return NextResponse.json(result, { status: result.success ? 200 : result.error?.code || 500 });
}
