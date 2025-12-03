import { NextResponse } from 'next/server';
import { 
  getCachedLiveFixtures,
  getCachedTodayFixtures,
  fixtureToMatchCard 
} from '@/lib/api';
import { TRACKED_LEAGUE_IDS, FENERBAHCE_TEAM_ID } from '@/lib/constants';
import { isLive } from '@/lib/utils';

// Cache'i devre dışı bırak - her zaman güncel veri
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CALLER_PAGE = '/api/live';

export async function GET() {
  try {
    const [liveMatches, todayFixtures] = await Promise.all([
      getCachedLiveFixtures(CALLER_PAGE),
      getCachedTodayFixtures(CALLER_PAGE),
    ]);

    // Fenerbahçe maçını bul
    const fenerbahceMatch = liveMatches.find(
      m => m.teams.home.id === FENERBAHCE_TEAM_ID || m.teams.away.id === FENERBAHCE_TEAM_ID
    ) || null;
    
    // Takip edilen liglerdeki diğer canlı maçlar
    const otherTrackedMatches = liveMatches.filter(
      m => 
        TRACKED_LEAGUE_IDS.includes(m.league.id) &&
        m.teams.home.id !== FENERBAHCE_TEAM_ID &&
        m.teams.away.id !== FENERBAHCE_TEAM_ID
    );

    // Takip edilen liglerdeki bugünkü maçlar
    const trackedFixtures = todayFixtures.filter(f => 
      TRACKED_LEAGUE_IDS.includes(f.league.id)
    );

    // Canlı olmayan, bugün oynanacak maçlar
    const upcomingToday = trackedFixtures
      .filter(f => !isLive(f.fixture.status.short) && f.fixture.status.short === 'NS')
      .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
      .map(fixtureToMatchCard);

    // Bugün biten maçlar
    const finishedToday = trackedFixtures
      .filter(f => ['FT', 'AET', 'PEN'].includes(f.fixture.status.short))
      .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
      .map(fixtureToMatchCard);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        // Canlı maç verileri
        hasLiveMatch: fenerbahceMatch !== null,
        fenerbahceMatch,
        otherLiveMatches: otherTrackedMatches.map(fixtureToMatchCard),
        
        // Bugünkü maçlar
        upcomingToday,
        finishedToday,
      }
    });
  } catch (error) {
    console.error('Error fetching live data:', error);
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: 'Failed to fetch live data',
      data: {
        hasLiveMatch: false,
        fenerbahceMatch: null,
        otherLiveMatches: [],
        upcomingToday: [],
        finishedToday: [],
      }
    }, { status: 500 });
  }
}
