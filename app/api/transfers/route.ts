// app/api/transfers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFighterTransfers, createFighterTransfer } from '@/actions/fighter-transfers';
import { getCurrentUser } from '@/lib/auth';
// import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      fighter_id: searchParams.get('fighter_id') ? parseInt(searchParams.get('fighter_id')!) : undefined,
      from_region_id: searchParams.get('from_region_id') ? parseInt(searchParams.get('from_region_id')!) : undefined,
      to_region_id: searchParams.get('to_region_id') ? parseInt(searchParams.get('to_region_id')!) : undefined,
      status: searchParams.get('status') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      with_fighter: searchParams.get('with_fighter') !== 'false' || 0 ? true : false,
      with_regions: searchParams.get('with_regions') !== 'false' || 0 ? true : false,
      with_approver: searchParams.get('with_approver') !== 'false' || 0 ? true : false,
    };
    
    const result = await getFighterTransfers(filters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/transfers:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des transferts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    
    const rawData = {
      fighter_id: formData.get('fighter_id'),
      from_region_id: formData.get('from_region_id'),
      to_region_id: formData.get('to_region_id'),
      transfer_date: formData.get('transfer_date'),
      transfer_reason: formData.get('transfer_reason'),
      transfer_fee: formData.get('transfer_fee'),
      contract_duration: formData.get('contract_duration'),
      is_permanent: formData.get('is_permanent'),
      status: formData.get('status'),
    };

    const cleanedData = {
      fighter_id: Number(rawData.fighter_id),
      from_region_id: Number(rawData.from_region_id),
      to_region_id: Number(rawData.to_region_id),
      transfer_date: rawData.transfer_date as string,
      transfer_reason: rawData.transfer_reason as string || undefined,
      transfer_fee: rawData.transfer_fee ? Number(rawData.transfer_fee) : undefined,
      contract_duration: rawData.contract_duration ? Number(rawData.contract_duration) : undefined,
      is_permanent: rawData.is_permanent === 'true',
      status: (rawData.status as 'pending' | 'approved' | 'rejected' | 'completed') || 'pending',
    };

    const { fighterTransferSchema } = await import('@/validation/schemas');
    const validatedData = fighterTransferSchema.parse(cleanedData);

    const result = await createFighterTransfer(validatedData, user.user_id);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/transfers:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la création du transfert' },
      { status: 500 }
    );
  }
}