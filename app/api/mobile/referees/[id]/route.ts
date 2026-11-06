import { withLightInstrumentation } from "@/lib/server/api-handler";
// app/api/mobile/referees/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getMobileRefereeById, 
  updateMobileReferee, 
  deleteMobileReferee 
} from '@/actions/mobile/referees';

interface Props {
  params: Promise<{ id: string }>
}

export const GET = withLightInstrumentation(async (
  request: NextRequest,
  { params }: Props
) => {
  try {
    const { id } = await params;
    const idNum = Number(id);
    
    if (isNaN(idNum)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 400,
          message: 'ID d\'arbitre invalide',
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    
    const options = {
      withRegion: searchParams.get('withRegion') !== 'false',
      withSubGroups: searchParams.get('withSubGroups') === 'true',
      withStatistics: searchParams.get('withStatistics') === 'true'
    };

    const result = await getMobileRefereeById(idNum, options);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error GET /api/mobile/referees/[id]:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 500,
          message: error.message || 'Erreur lors de la récupération de l\'arbitre',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
});

export async function PUT(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { id } = await params;
    const idNum = Number(id);
    
    if (isNaN(idNum)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 400,
          message: 'ID d\'arbitre invalide',
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }

    const formData = await request.formData();
    const result = await updateMobileReferee(idNum, formData);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error PUT /api/mobile/referees/[id]:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 500,
          message: error.message || 'Erreur lors de la mise à jour de l\'arbitre',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { id } = await params;
    const idNum = Number(id);
    
    if (isNaN(idNum)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 400,
          message: 'ID d\'arbitre invalide',
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }

    const result = await deleteMobileReferee(idNum);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error DELETE /api/mobile/referees/[id]:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 500,
          message: error.message || 'Erreur lors de la suppression de l\'arbitre',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}