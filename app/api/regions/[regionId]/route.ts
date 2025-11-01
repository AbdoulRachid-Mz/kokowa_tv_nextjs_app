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

  const body = await request.json();
  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const updated = await updateRegion(regionIdNumber, body.name);
  if (!updated || updated.success === false) {
    return NextResponse.json({ error: 'Region not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
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
