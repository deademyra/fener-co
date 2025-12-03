import { NextResponse } from 'next/server';
import { getCachedSquad } from '@/lib/api';
import { FENERBAHCE_TEAM_ID } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const CALLER_PAGE = '/api/squad';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = parseInt(searchParams.get('team') || String(FENERBAHCE_TEAM_ID));
    
    const squad = await getCachedSquad(teamId, CALLER_PAGE);
    
    if (!squad) {
      return NextResponse.json(
        { error: 'Squad not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(squad);
  } catch (error) {
    console.error('Squad API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch squad' },
      { status: 500 }
    );
  }
}
