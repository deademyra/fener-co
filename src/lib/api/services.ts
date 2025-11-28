import {
  Fixture,
  StandingsResponse,
  Squad,
  PlayerWithStats,
  TopScorer,
  Coach,
  TeamWithVenue,
  MatchCardData,
  TeamSeasonStatistics,
} from '@/types';
import {
  getFixtures,
  getFenerbahceFixtures,
  getFixtureById,
  getLiveFixtures,
  getTodayFixtures,
  getNextFixtures,
  getLastFixtures,
  getStandings,
  getTeam,
  getSquad,
  getTeamStatistics,
  getPlayer,
  getPlayerStatistics,
  getTopScorers,
  getTopAssists,
  getCoach,
  getHeadToHead,
} from './client';
import { getCachedData, getCachedDataWithInfo, CacheKeys, getFixtureCacheTTL } from '../cache';
import { 
  CACHE_TTL, 
  FENERBAHCE_TEAM_ID, 
  CURRENT_SEASON,
  TRACKED_LEAGUE_IDS,
  LIVE_STATUSES,
} from '../constants';

// =============================================
// CACHED FIXTURE SERVICES
// =============================================

/**
 * Cache'li - Belirli bir lig ve sezon için tüm maçları getir
 */
export async function getCachedFixtures(
  leagueId: number,
  season: number = CURRENT_SEASON
): Promise<Fixture[]> {
  return getCachedData(
    CacheKeys.fixtures(leagueId, season),
    () => getFixtures(leagueId, season),
    CACHE_TTL.TODAY_FIXTURES
  );
}

/**
 * Cache'li - Fenerbahçe'nin tüm maçlarını getir
 */
export async function getCachedFenerbahceFixtures(
  season: number = CURRENT_SEASON
): Promise<Fixture[]> {
  return getCachedData(
    CacheKeys.teamFixtures(FENERBAHCE_TEAM_ID, season),
    () => getFenerbahceFixtures(season),
    CACHE_TTL.TODAY_FIXTURES
  );
}

/**
 * Cache'li - Belirli bir maçın detaylarını getir
 */
export async function getCachedFixtureById(fixtureId: number): Promise<Fixture | null> {
  // Önce cache'den kontrol et
  const cacheKey = CacheKeys.fixtureDetail(fixtureId);
  
  return getCachedData(
    cacheKey,
    async () => {
      const fixture = await getFixtureById(fixtureId);
      return fixture;
    },
    CACHE_TTL.TODAY_FIXTURES // Dinamik TTL için status'e göre ayarlanabilir
  );
}

/**
 * Cache'li - Canlı maçları getir (kısa TTL)
 */
export async function getCachedLiveFixtures(): Promise<Fixture[]> {
  return getCachedData(
    CacheKeys.liveFixtures(),
    () => getLiveFixtures(),
    CACHE_TTL.LIVESCORE
  );
}

/**
 * Cache'li - Bugünün maçlarını getir
 */
export async function getCachedTodayFixtures(): Promise<Fixture[]> {
  return getCachedData(
    CacheKeys.todayFixtures(),
    () => getTodayFixtures(),
    CACHE_TTL.TODAY_FIXTURES
  );
}

/**
 * Cache'li - Sonraki N maçı getir
 */
export async function getCachedNextFixtures(
  teamId: number = FENERBAHCE_TEAM_ID,
  count: number = 5
): Promise<Fixture[]> {
  return getCachedData(
    `next:${teamId}:${count}`,
    () => getNextFixtures(teamId, count),
    CACHE_TTL.TODAY_FIXTURES
  );
}

/**
 * Cache'li - Son N maçı getir
 */
export async function getCachedLastFixtures(
  teamId: number = FENERBAHCE_TEAM_ID,
  count: number = 5
): Promise<Fixture[]> {
  return getCachedData(
    `last:${teamId}:${count}`,
    () => getLastFixtures(teamId, count),
    CACHE_TTL.COMPLETED_MATCH
  );
}

// =============================================
// CACHED STANDINGS SERVICES
// =============================================

/**
 * Cache'li - Puan durumunu getir
 */
export async function getCachedStandings(
  leagueId: number,
  season: number = CURRENT_SEASON
): Promise<StandingsResponse | null> {
  return getCachedData(
    CacheKeys.standings(leagueId, season),
    () => getStandings(leagueId, season),
    CACHE_TTL.STANDINGS
  );
}

// =============================================
// CACHED TEAM SERVICES
// =============================================

/**
 * Cache'li - Takım bilgilerini getir
 */
export async function getCachedTeam(teamId: number): Promise<TeamWithVenue | null> {
  return getCachedData(
    CacheKeys.team(teamId),
    () => getTeam(teamId),
    CACHE_TTL.TEAM_INFO
  );
}

/**
 * Cache'li - Takım kadrosunu getir
 */
export async function getCachedSquad(
  teamId: number = FENERBAHCE_TEAM_ID,
  season: number = CURRENT_SEASON
): Promise<Squad | null> {
  return getCachedData(
    CacheKeys.teamSquad(teamId, season),
    () => getSquad(teamId),
    CACHE_TTL.SQUAD
  );
}

/**
 * Cache'li - Takım sezon istatistiklerini getir
 */
export async function getCachedTeamStatistics(
  teamId: number = FENERBAHCE_TEAM_ID,
  leagueId: number,
  season: number = CURRENT_SEASON
): Promise<TeamSeasonStatistics | null> {
  return getCachedData(
    `team:statistics:${teamId}:${leagueId}:${season}`,
    () => getTeamStatistics(teamId, leagueId, season),
    CACHE_TTL.STANDINGS // 1 saat cache
  );
}

// =============================================
// CACHED PLAYER SERVICES
// =============================================

/**
 * Cache'li - Oyuncu bilgilerini getir
 */
export async function getCachedPlayer(
  playerId: number,
  season: number = CURRENT_SEASON
): Promise<PlayerWithStats | null> {
  return getCachedData(
    CacheKeys.playerStatistics(playerId, season),
    () => getPlayer(playerId, season),
    CACHE_TTL.PLAYER_INFO
  );
}

/**
 * Cache'li - Oyuncu sezon istatistiklerini getir
 */
export async function getCachedPlayerStatistics(
  playerId: number,
  season: number = CURRENT_SEASON
): Promise<PlayerWithStats[]> {
  return getCachedData(
    `player:stats:${playerId}:${season}`,
    () => getPlayerStatistics(playerId, season),
    CACHE_TTL.PLAYER_INFO
  );
}

/**
 * Cache'li - Oyuncu sezon istatistiklerini getir (cache bilgisi ile)
 */
export async function getCachedPlayerStatisticsWithInfo(
  playerId: number,
  season: number = CURRENT_SEASON
): Promise<{ data: PlayerWithStats[]; fromCache: boolean }> {
  return getCachedDataWithInfo(
    `player:stats:${playerId}:${season}`,
    () => getPlayerStatistics(playerId, season),
    CACHE_TTL.PLAYER_INFO
  );
}

// =============================================
// CACHED TOP SCORERS / ASSISTS
// =============================================

/**
 * Cache'li - Gol krallığını getir
 */
export async function getCachedTopScorers(
  leagueId: number,
  season: number = CURRENT_SEASON
): Promise<TopScorer[]> {
  return getCachedData(
    CacheKeys.topScorers(leagueId, season),
    () => getTopScorers(leagueId, season),
    CACHE_TTL.TOP_SCORERS
  );
}

/**
 * Cache'li - Asist krallığını getir
 */
export async function getCachedTopAssists(
  leagueId: number,
  season: number = CURRENT_SEASON
): Promise<TopScorer[]> {
  return getCachedData(
    CacheKeys.topAssists(leagueId, season),
    () => getTopAssists(leagueId, season),
    CACHE_TTL.TOP_SCORERS
  );
}

// =============================================
// CACHED COACH SERVICE
// =============================================

/**
 * Cache'li - Teknik direktör bilgilerini getir
 */
export async function getCachedCoach(
  teamId: number = FENERBAHCE_TEAM_ID
): Promise<Coach | null> {
  return getCachedData(
    CacheKeys.coach(teamId),
    () => getCoach(teamId),
    CACHE_TTL.TEAM_INFO
  );
}

// =============================================
// CACHED H2H SERVICE
// =============================================

/**
 * Cache'li - Karşılıklı istatistikleri getir
 */
export async function getCachedHeadToHead(
  team1: number,
  team2: number,
  last: number = 10
): Promise<Fixture[]> {
  return getCachedData(
    CacheKeys.h2h(team1, team2),
    () => getHeadToHead(team1, team2, last),
    CACHE_TTL.HISTORICAL_DATA
  );
}

// =============================================
// COMPOSITE/HELPER SERVICES
// =============================================

/**
 * Fenerbahçe canlı maç kontrolü ve gösterimi için
 */
export async function checkFenerbahceLiveMatch(): Promise<{
  hasLiveMatch: boolean;
  fenerbahceMatch: Fixture | null;
  otherTrackedMatches: Fixture[];
}> {
  const liveMatches = await getCachedLiveFixtures();
  
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
  
  return {
    hasLiveMatch: fenerbahceMatch !== null,
    fenerbahceMatch,
    otherTrackedMatches,
  };
}

/**
 * Anasayfa için gerekli tüm verileri topla
 */
export async function getHomePageData(): Promise<{
  liveData: {
    hasLiveMatch: boolean;
    fenerbahceMatch: Fixture | null;
    otherTrackedMatches: Fixture[];
  };
  nextMatches: Fixture[];
  lastMatches: Fixture[];
  standings: StandingsResponse | null;
  topScorers: TopScorer[];
  topAssists: TopScorer[];
}> {
  const [
    liveData,
    nextMatches,
    lastMatches,
    standings,
    topScorers,
    topAssists,
  ] = await Promise.all([
    checkFenerbahceLiveMatch(),
    getCachedNextFixtures(FENERBAHCE_TEAM_ID, 5),
    getCachedLastFixtures(FENERBAHCE_TEAM_ID, 5),
    getCachedStandings(203), // Süper Lig
    getCachedTopScorers(203),
    getCachedTopAssists(203),
  ]);
  
  return {
    liveData,
    nextMatches,
    lastMatches,
    standings,
    topScorers: topScorers.slice(0, 5),
    topAssists: topAssists.slice(0, 5),
  };
}

/**
 * Fixture'ı MatchCardData'ya dönüştür
 */
export function fixtureToMatchCard(fixture: Fixture): MatchCardData {
  return {
    id: fixture.fixture.id,
    date: fixture.fixture.date,
    status: fixture.fixture.status.short,
    elapsed: fixture.fixture.status.elapsed,
    league: {
      id: fixture.league.id,
      name: fixture.league.name,
      logo: fixture.league.logo,
    },
    homeTeam: {
      id: fixture.teams.home.id,
      name: fixture.teams.home.name,
      logo: fixture.teams.home.logo,
    },
    awayTeam: {
      id: fixture.teams.away.id,
      name: fixture.teams.away.name,
      logo: fixture.teams.away.logo,
    },
    homeScore: fixture.goals.home,
    awayScore: fixture.goals.away,
    isFenerbahceMatch: 
      fixture.teams.home.id === FENERBAHCE_TEAM_ID || 
      fixture.teams.away.id === FENERBAHCE_TEAM_ID,
  };
}

/**
 * Maç durumunun canlı olup olmadığını kontrol et
 */
export function isLiveMatch(status: string): boolean {
  return LIVE_STATUSES.includes(status as typeof LIVE_STATUSES[number]);
}
