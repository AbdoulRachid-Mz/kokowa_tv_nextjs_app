import { NextRequest, NextResponse } from 'next/server';
import { getRegionById, updateRegion, deleteRegion } from '@/actions/regions';

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ regionId: string }> }
) {
  const {regionId} = await params;
  const regionIdNumber = Number(regionId);
  if (isNaN(regionIdNumber)) {
    return NextResponse.json({ error: 'Invalid region ID' }, { status: 400 });
  }

  const region = await getRegionById(regionIdNumber);
  if (!region) {
    return NextResponse.json({ error: 'Region non trouvee' }, { status: 404 });
  }

  return NextResponse.json(region);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ regionId: string }> }
) {
  const {regionId} = await params;
  const regionIdNumber = Number(regionId);
  if (isNaN(regionIdNumber)) {
    return NextResponse.json({ error: 'Invalid region ID' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const formData = new FormData();
  if (body.name !== undefined) formData.append('name', body.name);
  if (body.code !== undefined) formData.append('code', body.code);
  if (body.description !== undefined) formData.append('description', body.description || "");
  if (body.flag_image !== undefined) formData.append('flag_image', body.flag_image || null);
  if (body.color !== undefined) formData.append('color', body.color);

  try {
    const updated = await updateRegion(regionIdNumber, formData);
    if (!updated || updated.success === false) {
      return NextResponse.json({ error: 'Region not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /regions/[regionId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ regionId: string }> }
) {
  const {regionId} = await params;
  const regionIdNumber = Number(regionId);
  if (isNaN(regionIdNumber)) {
    return NextResponse.json({ error: 'Invalid region ID' }, { status: 400 });
  }

  const deleted = await deleteRegion(regionIdNumber);
  if (!deleted || deleted.success === false) {
    return NextResponse.json({ error: 'Region not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Region deleted successfully' });
}
