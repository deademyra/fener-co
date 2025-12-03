import { NextResponse } from 'next/server';
import { getCachedPlayerSidelined } from '@/lib/api';

export const dynamic = 'force-dynamic';

const CALLER_PAGE = '/api/players/[id]/sidelined';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const playerId = parseInt(params.id);
    
    if (isNaN(playerId)) {
      return NextResponse.json(
        { error: 'Invalid player ID' },
        { status: 400 }
      );
    }
    
    const sidelined = await getCachedPlayerSidelined(playerId, CALLER_PAGE);
    
    return NextResponse.json(sidelined || []);
  } catch (error) {
    console.error('Player sidelined API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player injury history' },
      { status: 500 }
    );
  }
}
