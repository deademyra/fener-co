import { NextRequest, NextResponse } from 'next/server';
import { getCachedFenerbahceFixtures } from '@/lib/api';
import { CURRENT_SEASON } from '@/lib/constants';

export const revalidate = 300; // 5 minutes

const CALLER_PAGE = '/api/fixtures';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const season = searchParams.get('season') || CURRENT_SEASON;
  
  try {
    const fixtures = await getCachedFenerbahceFixtures(Number(season), CALLER_PAGE);
    
    return NextResponse.json({ 
      fixtures,
      season: Number(season),
      total: fixtures.length 
    });
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    return NextResponse.json({ 
      fixtures: [], 
      season: Number(season),
      total: 0,
      error: 'Failed to fetch fixtures' 
    }, { status: 500 });
  }
}
