// app/api/mobile/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAppSettings } from '@/actions/mobile/app-settings';
import { AppSettingFilters } from '@/types';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const filters: AppSettingFilters = {
    search: searchParams.get('search') || undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    category: searchParams.get('category') || undefined,
    is_public: searchParams.get('is_public') ? searchParams.get('is_public') === 'true' : undefined,
    is_editable: searchParams.get('is_editable') ? searchParams.get('is_editable') === 'true' : undefined,
  };
  try {
    const settings = await getAppSettings(filters);
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching app settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch app settings' },
      { status: 500 }
    );
  }
}