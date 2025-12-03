// API-Football v3 Service
// Fenerbahçe Stats - FENER.CO

import {
  APIResponse,
  Fixture,
  FixturesResponse,
  League,
  LeaguesResponse,
  RoundsResponse,
  Standing,
  StandingsResponse,
  LeagueWithSeasons,
} from '@/types/api-football';

// Configuration
const API_BASE_URL = process.env.API_FOOTBALL_BASE_URL || 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY || '';

// Fenerbahçe Team ID
export const FENERBAHCE_TEAM_ID = 611;

// Tracked league IDs
export const TRACKED_LEAGUES = {
  SUPER_LIG: 203,
  TURKISH_CUP: 206,
  CHAMPIONS_LEAGUE: 2,
  EUROPA_LEAGUE: 3,
  CONFERENCE_LEAGUE: 848,
} as const;

// Cache TTLs (in seconds)
export const CACHE_TTL = {
  LIVE: 15,
  TODAY: 300,
  STANDINGS: 3600,
  FIXTURES: 3600,
  ROUNDS: 86400,
  TEAMS: 86400,
  COMPLETED_MATCH: 604800,
} as const;

/**
 * API Request helper with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const url = new URL(endpoint, API_BASE_URL);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  const response = await fetch(url.toString(), {
    headers: {
      'x-apisports-key': API_KEY,
      'x-apisports-host': 'v3.football.api-sports.io',
    },
    next: {
      revalidate: CACHE_TTL.FIXTURES, // Default cache
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Check for API errors
  if (data.errors && Object.keys(data.errors).length > 0) {
    const errorMessage = typeof data.errors === 'object' 
      ? Object.values(data.errors).join(', ')
      : data.errors;
    throw new Error(`API error: ${errorMessage}`);
  }

  return data;
}

// ============================================
// Rounds API
// ============================================

/**
 * Get all rounds for a league/season
 */
export async function getRounds(leagueId: number, season: number): Promise<string[]> {
  const data = await apiRequest<RoundsResponse>('/fixtures/rounds', {
    league: leagueId,
    season,
  });
  
  return data.response || [];
}

/**
 * Get current round for a league/season
 */
export async function getCurrentRound(leagueId: number, season: number): Promise<string | null> {
  const data = await apiRequest<RoundsResponse>('/fixtures/rounds', {
    league: leagueId,
    season,
    current: 'true',
  });
  
  return data.response?.[0] || null;
}

// ============================================
// Fixtures API
// ============================================

/**
 * Get fixtures by league and season
 */
export async function getFixtures(
  leagueId: number,
  season: number,
  options?: {
    round?: string;
    from?: string;
    to?: string;
    status?: string;
    team?: number;
  }
): Promise<Fixture[]> {
  const params: Record<string, string | number> = {
    league: leagueId,
    season,
  };

  if (options?.round) params.round = options.round;
  if (options?.from) params.from = options.from;
  if (options?.to) params.to = options.to;
  if (options?.status) params.status = options.status;
  if (options?.team) params.team = options.team;

  const data = await apiRequest<FixturesResponse>('/fixtures', params);
  return data.response || [];
}

/**
 * Get Fenerbahçe fixtures for a league/season
 */
export async function getFenerbahceFixtures(
  leagueId: number,
  season: number,
  options?: {
    round?: string;
    from?: string;
    to?: string;
    status?: string;
  }
): Promise<Fixture[]> {
  return getFixtures(leagueId, season, {
    ...options,
    team: FENERBAHCE_TEAM_ID,
  });
}

/**
 * Get all Fenerbahçe fixtures across all tracked leagues for a season
 */
export async function getAllFenerbahceFixtures(season: number): Promise<Fixture[]> {
  const leagueIds = Object.values(TRACKED_LEAGUES);
  
  const fixturesPromises = leagueIds.map(leagueId =>
    getFenerbahceFixtures(leagueId, season).catch(() => [] as Fixture[])
  );

  const fixturesArrays = await Promise.all(fixturesPromises);
  return fixturesArrays.flat().sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);
}

/**
 * Get fixtures by round
 */
export async function getFixturesByRound(
  leagueId: number,
  season: number,
  round: string
): Promise<Fixture[]> {
  return getFixtures(leagueId, season, { round });
}

/**
 * Get fixture by ID
 */
export async function getFixtureById(fixtureId: number): Promise<Fixture | null> {
  const data = await apiRequest<FixturesResponse>('/fixtures', {
    id: fixtureId,
  });
  
  return data.response?.[0] || null;
}

/**
 * Get live fixtures
 */
export async function getLiveFixtures(leagueId?: number): Promise<Fixture[]> {
  const params: Record<string, string | number> = {
    live: 'all',
  };
  
  if (leagueId) params.league = leagueId;

  const data = await apiRequest<FixturesResponse>('/fixtures', params);
  return data.response || [];
}

/**
 * Get today's fixtures
 */
export async function getTodayFixtures(leagueId?: number): Promise<Fixture[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const params: Record<string, string | number> = {
    date: today,
  };
  
  if (leagueId) params.league = leagueId;

  const data = await apiRequest<FixturesResponse>('/fixtures', params);
  return data.response || [];
}

// ============================================
// Standings API
// ============================================

/**
 * Get standings for a league/season
 */
export async function getStandings(
  leagueId: number,
  season: number
): Promise<Standing[][]> {
  const data = await apiRequest<StandingsResponse>('/standings', {
    league: leagueId,
    season,
  });
  
  return data.response?.[0]?.league?.standings || [];
}

/**
 * Get Fenerbahçe position in standings
 */
export async function getFenerbahceStanding(
  leagueId: number,
  season: number
): Promise<Standing | null> {
  const standings = await getStandings(leagueId, season);
  
  // Flatten all groups/tables
  const allStandings = standings.flat();
  
  return allStandings.find(s => s.team.id === FENERBAHCE_TEAM_ID) || null;
}

/**
 * Get standings grouped by group name (for cup/uefa competitions)
 */
export async function getGroupedStandings(
  leagueId: number,
  season: number
): Promise<Record<string, Standing[]>> {
  const standings = await getStandings(leagueId, season);
  
  const grouped: Record<string, Standing[]> = {};
  
  standings.forEach(group => {
    if (group.length > 0) {
      const groupName = group[0].group || 'League';
      grouped[groupName] = group;
    }
  });
  
  return grouped;
}

// ============================================
// Leagues API
// ============================================

/**
 * Get all leagues Fenerbahçe has participated in (single API call)
 * Returns leagues with their seasons - can check participation by season
 */
export async function getFenerbahceLeagues(): Promise<LeagueWithSeasons[]> {
  const data = await apiRequest<LeaguesResponse>('/leagues', {
    team: FENERBAHCE_TEAM_ID,
  });
  
  if (!data.response) return [];
  
  return data.response.map(item => ({
    ...item.league,
    country: item.country,
    seasons: item.seasons,
  }));
}

/**
 * Check if Fenerbahçe participated in a league for a specific season
 * Uses the seasons array from getFenerbahceLeagues result
 */
export function hasParticipationInSeason(
  league: LeagueWithSeasons, 
  season: number
): boolean {
  if (!league.seasons) return false;
  return league.seasons.some(s => {
    const year = typeof s.year === 'number' ? s.year : parseInt(s.year);
    return year === season;
  });
}

/**
 * Get league info
 */
export async function getLeague(leagueId: number): Promise<LeagueWithSeasons | null> {
  const data = await apiRequest<LeaguesResponse>('/leagues', {
    id: leagueId,
  });
  
  const leagueData = data.response?.[0];
  if (!leagueData) return null;
  
  return {
    ...leagueData.league,
    country: leagueData.country,
    seasons: leagueData.seasons,
  };
}

/**
 * Get the current season for a league from API
 * Uses the 'current: true' flag from the seasons array
 */
export async function getCurrentSeasonFromApi(leagueId: number): Promise<number | null> {
  const league = await getLeague(leagueId);
  if (!league || !league.seasons) return null;
  
  const currentSeason = league.seasons.find(s => s.current === true);
  if (!currentSeason) return null;
  
  return typeof currentSeason.year === 'number' 
    ? currentSeason.year 
    : parseInt(currentSeason.year);
}

/**
 * Get all tracked leagues info
 */
export async function getTrackedLeagues(): Promise<LeagueWithSeasons[]> {
  const leagueIds = Object.values(TRACKED_LEAGUES);
  
  const leaguesPromises = leagueIds.map(id =>
    getLeague(id).catch(() => null)
  );

  const leagues = await Promise.all(leaguesPromises);
  return leagues.filter((l): l is LeagueWithSeasons => l !== null);
}

/**
 * Get seasons for a league
 */
export async function getLeagueSeasons(leagueId: number): Promise<number[]> {
  const league = await getLeague(leagueId);
  if (!league) return [];
  
  return league.seasons
    .map(s => typeof s.year === 'number' ? s.year : parseInt(s.year))
    .sort((a, b) => b - a); // Newest first
}

// ============================================
// Team Statistics
// ============================================

export interface TeamStatistics {
  form: string;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals: {
    for: { total: { home: number; away: number; total: number }; minute: Record<string, { total: number; percentage: string }> };
    against: { total: { home: number; away: number; total: number } };
  };
  clean_sheet: { home: number; away: number; total: number };
  penalty: { scored: { total: number }; missed: { total: number } };
  lineups: Array<{ formation: string; played: number }>;
}

/**
 * Get team statistics for a league/season
 */
export async function getTeamStatistics(
  teamId: number,
  leagueId: number,
  season: number
): Promise<TeamStatistics | null> {
  const data = await apiRequest<APIResponse<TeamStatistics>>('/teams/statistics', {
    team: teamId,
    league: leagueId,
    season,
  });
  
  return data.response || null;
}

/**
 * Get Fenerbahçe statistics for a league/season
 */
export async function getFenerbahceStatistics(
  leagueId: number,
  season: number
): Promise<TeamStatistics | null> {
  return getTeamStatistics(FENERBAHCE_TEAM_ID, leagueId, season);
}

// ============================================
// Top Players Statistics (Scorers, Assists, Cards)
// ============================================

export interface TopPlayer {
  player: {
    id: number;
    name: string;
    firstname: string | null;
    lastname: string | null;
    age: number | null;
    birth: {
      date: string | null;
      place: string | null;
      country: string | null;
    };
    nationality: string | null;
    height: string | null;
    weight: string | null;
    injured: boolean;
    photo: string;
  };
  statistics: Array<{
    team: {
      id: number;
      name: string;
      logo: string;
    };
    league: {
      id: number;
      name: string;
      country: string;
      logo: string;
      flag: string | null;
      season: number;
    };
    games: {
      appearences: number | null;
      lineups: number | null;
      minutes: number | null;
      number: number | null;
      position: string | null;
      rating: string | null;
      captain: boolean;
    };
    goals: {
      total: number | null;
      conceded: number | null;
      assists: number | null;
      saves: number | null;
    };
    cards: {
      yellow: number | null;
      yellowred: number | null;
      red: number | null;
    };
  }>;
}

type TopPlayersResponse = APIResponse<TopPlayer[]>;

/**
 * Get top scorers for a league/season
 */
export async function getTopScorers(
  leagueId: number,
  season: number
): Promise<TopPlayer[]> {
  const data = await apiRequest<TopPlayersResponse>('/players/topscorers', {
    league: leagueId,
    season,
  });
  
  return data.response || [];
}

/**
 * Get top assists for a league/season
 */
export async function getTopAssists(
  leagueId: number,
  season: number
): Promise<TopPlayer[]> {
  const data = await apiRequest<TopPlayersResponse>('/players/topassists', {
    league: leagueId,
    season,
  });
  
  return data.response || [];
}

/**
 * Get top yellow cards for a league/season
 */
export async function getTopYellowCards(
  leagueId: number,
  season: number
): Promise<TopPlayer[]> {
  const data = await apiRequest<TopPlayersResponse>('/players/topyellowcards', {
    league: leagueId,
    season,
  });
  
  return data.response || [];
}

/**
 * Get top red cards for a league/season
 */
export async function getTopRedCards(
  leagueId: number,
  season: number
): Promise<TopPlayer[]> {
  const data = await apiRequest<TopPlayersResponse>('/players/topredcards', {
    league: leagueId,
    season,
  });
  
  return data.response || [];
}

/**
 * Check if Fenerbahçe participated in a league for a given season
 * by checking if there are any fixtures
 */
export async function hasFenerbahceParticipation(
  leagueId: number,
  season: number
): Promise<boolean> {
  try {
    const fixtures = await getFenerbahceFixtures(leagueId, season);
    return fixtures.length > 0;
  } catch {
    return false;
  }
}
