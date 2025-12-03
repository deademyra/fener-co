import { NextResponse } from 'next/server';
import { getCachedPlayerTransfers } from '@/lib/api';

export const dynamic = 'force-dynamic';

const CALLER_PAGE = '/api/players/[id]/transfers';

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
    
    const transfers = await getCachedPlayerTransfers(playerId, CALLER_PAGE);
    
    if (!transfers) {
      return NextResponse.json({ transfers: [] });
    }
    
    return NextResponse.json(transfers);
  } catch (error) {
    console.error('Player transfers API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player transfers' },
      { status: 500 }
    );
  }
}
