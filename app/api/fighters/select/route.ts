import { getFightersForSelect } from '@/actions/fighters';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const fighters = await getFightersForSelect();
  return NextResponse.json(fighters);
}
