import { NextResponse } from 'next/server';
import { getCachedCoach } from '@/lib/api';
import { FENERBAHCE_TEAM_ID } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const CALLER_PAGE = '/api/coach';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = parseInt(searchParams.get('team') || String(FENERBAHCE_TEAM_ID));
    
    const coach = await getCachedCoach(teamId, CALLER_PAGE);
    
    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(coach);
  } catch (error) {
    console.error('Coach API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coach' },
      { status: 500 }
    );
  }
}
