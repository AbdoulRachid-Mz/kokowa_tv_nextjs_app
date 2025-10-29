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
  if (!region || region.length === 0) {
    return NextResponse.json({ error: 'Region not found' }, { status: 404 });
  }

  return NextResponse.json(region[0]);
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
  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: 'Region not found' }, { status: 404 });
  }

  return NextResponse.json(updated[0]);
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
  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: 'Region not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Region deleted successfully' });
}
