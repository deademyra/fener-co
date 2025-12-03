import { NextResponse } from 'next/server';
import { getCachedPlayerTrophies } from '@/lib/api';

export const dynamic = 'force-dynamic';

const CALLER_PAGE = '/api/players/[id]/trophies';

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
    
    const trophies = await getCachedPlayerTrophies(playerId, CALLER_PAGE);
    
    return NextResponse.json(trophies || []);
  } catch (error) {
    console.error('Player trophies API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player trophies' },
      { status: 500 }
    );
  }
}
