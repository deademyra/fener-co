import { NextRequest, NextResponse } from 'next/server';
import { getPlayerStatistics } from '@/lib/api/client';

export const dynamic = 'force-dynamic';

const CALLER_PAGE = '/api/players/[id]/statistics';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const searchParams = request.nextUrl.searchParams;
  const season = searchParams.get('season') || new Date().getFullYear();
  
  try {
    const response = await getPlayerStatistics(parseInt(params.id), Number(season), CALLER_PAGE);
    
    // API returns an array, we need the first item
    if (!response || response.length === 0) {
      return NextResponse.json({ 
        player: null, 
        statistics: [] 
      }, { status: 404 });
    }
    
    // The first item contains player info and all statistics
    const playerData = response[0];
    
    return NextResponse.json({
      player: playerData.player,
      statistics: playerData.statistics
    });
  } catch (error) {
    console.error('Error fetching player statistics:', error);
    return NextResponse.json({ 
      player: null, 
      statistics: [] 
    }, { status: 500 });
  }
}
