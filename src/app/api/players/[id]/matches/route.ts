import { NextResponse } from 'next/server';
import { 
  getCachedFenerbahceFixtures,
  getCachedFixturePlayerStats 
} from '@/lib/api';
import { cacheStore, getCachedData } from '@/lib/cache';
import { FENERBAHCE_TEAM_ID, CURRENT_SEASON, TRACKED_LEAGUE_IDS, CACHE_TTL } from '@/lib/constants';
import { Fixture } from '@/types';

export const dynamic = 'force-dynamic';

const CALLER_PAGE = '/api/players/[id]/matches';

// Rate limiting: max concurrent requests
const MAX_CONCURRENT = 3;
const DELAY_BETWEEN_BATCHES = 200; // ms

interface PlayerMatchData {
  fixture: Fixture;
  stats: {
    minutes: number;
    goals: number;
    assists: number;
    saves: number;
    goalsConceded: number;
    yellowCards: number;
    redCards: number;
    yellowRedCards: number;
    shotsTotal: number;
    shotsOn: number;
    passesTotal: number;
    passesKey: number;
    passAccuracy: number;
    duelsTotal: number;
    duelsWon: number;
    tacklesTotal: number;
    tacklesBlocks: number;
    tacklesInterceptions: number;
    dribblesAttempts: number;
    dribblesSuccess: number;
    dribblesPast: number;
    foulsCommitted: number;
    foulsDrawn: number;
    penaltyWon: number;
    penaltyCommitted: number;
    penaltyScored: number;
    penaltyMissed: number;
    penaltySaved: number;
    rating: number;
  };
}

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch player stats for a single fixture
async function fetchPlayerStatsForFixture(
  fixture: Fixture,
  playerId: number
): Promise<PlayerMatchData | null> {
  try {
    const playerStats = await getCachedFixturePlayerStats(fixture.fixture.id, CALLER_PAGE);
    
    for (const teamStats of playerStats) {
      const foundPlayer = teamStats.players?.find(p => p.player.id === playerId);
      if (foundPlayer && foundPlayer.statistics?.[0]) {
        const s = foundPlayer.statistics[0];
        const minutes = s.games?.minutes || 0;
        
        if (minutes > 0) {
          return {
            fixture,
            stats: {
              minutes,
              goals: s.goals?.total || 0,
              assists: s.goals?.assists || 0,
              saves: s.goals?.saves || 0,
              goalsConceded: s.goals?.conceded || 0,
              yellowCards: s.cards?.yellow || 0,
              redCards: s.cards?.red || 0,
              yellowRedCards: 0,
              shotsTotal: s.shots?.total || 0,
              shotsOn: s.shots?.on || 0,
              passesTotal: s.passes?.total || 0,
              passesKey: s.passes?.key || 0,
              // Calculate pass accuracy as percentage: (accurate / total) * 100
              passAccuracy: (s.passes?.total && s.passes?.accuracy) 
                ? Math.round((parseInt(s.passes.accuracy) / s.passes.total) * 100) 
                : 0,
              duelsTotal: s.duels?.total || 0,
              duelsWon: s.duels?.won || 0,
              tacklesTotal: s.tackles?.total || 0,
              tacklesBlocks: s.tackles?.blocks || 0,
              tacklesInterceptions: s.tackles?.interceptions || 0,
              dribblesAttempts: s.dribbles?.attempts || 0,
              dribblesSuccess: s.dribbles?.success || 0,
              dribblesPast: s.dribbles?.past || 0,
              foulsCommitted: s.fouls?.committed || 0,
              foulsDrawn: s.fouls?.drawn || 0,
              penaltyWon: s.penalty?.won || 0,
              penaltyCommitted: s.penalty?.committed || 0,
              penaltyScored: s.penalty?.scored || 0,
              penaltyMissed: s.penalty?.missed || 0,
              penaltySaved: s.penalty?.saved || 0,
              rating: s.games?.rating ? parseFloat(s.games.rating) : 0,
            },
          };
        }
      }
    }
    return null;
  } catch (err) {
    console.log(`Skipping fixture ${fixture.fixture.id} - no stats available`);
    return null;
  }
}

// Fetch all player matches with rate-limited parallel requests
async function fetchAllPlayerMatches(
  playerId: number,
  season: number
): Promise<PlayerMatchData[]> {
  // Get Fenerbahce fixtures for the season
  const fixtures = await getCachedFenerbahceFixtures(season, CALLER_PAGE);
  
  // Filter to finished matches in tracked leagues
  const finishedMatches = fixtures
    .filter(f => 
      ['FT', 'AET', 'PEN'].includes(f.fixture.status.short) &&
      TRACKED_LEAGUE_IDS.includes(f.league.id)
    )
    .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime());
  
  const allMatches: PlayerMatchData[] = [];
  
  // Process in batches to avoid rate limiting
  for (let i = 0; i < finishedMatches.length; i += MAX_CONCURRENT) {
    const batch = finishedMatches.slice(i, i + MAX_CONCURRENT);
    
    // Fetch batch in parallel
    const results = await Promise.all(
      batch.map(fixture => fetchPlayerStatsForFixture(fixture, playerId))
    );
    
    // Collect non-null results
    for (const result of results) {
      if (result) {
        allMatches.push(result);
      }
    }
    
    // Delay between batches to avoid rate limiting (only if more batches remain)
    if (i + MAX_CONCURRENT < finishedMatches.length) {
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }
  
  return allMatches;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const playerId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const season = parseInt(searchParams.get('season') || String(CURRENT_SEASON));
    const limit = parseInt(searchParams.get('limit') || '5');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (isNaN(playerId)) {
      return NextResponse.json(
        { error: 'Invalid player ID' },
        { status: 400 }
      );
    }
    
    // Cache key for this player's all matches for the season
    const cacheKey = `player:${playerId}:matches:${season}`;
    
    // Check if already cached
    const cachedData = cacheStore.get<PlayerMatchData[]>(cacheKey);
    if (cachedData) {
      console.log(`[Cache HIT] Player ${playerId} matches for season ${season}`);
      const paginatedMatches = cachedData.slice(offset, offset + limit);
      const hasMore = offset + limit < cachedData.length;
      
      return NextResponse.json({
        matches: paginatedMatches,
        hasMore,
        total: cachedData.length,
      });
    }
    
    console.log(`[Cache MISS] Fetching player ${playerId} matches for season ${season}`);
    
    // Get all matches from cache or fetch
    const allMatches = await getCachedData<PlayerMatchData[]>(
      cacheKey,
      () => fetchAllPlayerMatches(playerId, season),
      CACHE_TTL.COMPLETED_MATCH // 1 week cache
    );
    
    console.log(`[Cache SET] Player ${playerId} has ${allMatches.length} matches cached`);
    
    // Apply pagination
    const paginatedMatches = allMatches.slice(offset, offset + limit);
    const hasMore = offset + limit < allMatches.length;
    
    return NextResponse.json({
      matches: paginatedMatches,
      hasMore,
      total: allMatches.length,
    });
  } catch (error) {
    console.error('Player matches API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player matches' },
      { status: 500 }
    );
  }
}
