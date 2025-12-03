import { 
  ApiResponse, 
  Fixture, 
  StandingsResponse, 
  Squad, 
  PlayerWithStats,
  TopScorer,
  Coach,
  TeamWithVenue,
  TeamSeasonStatistics
} from '@/types';
import { API_CONFIG, FENERBAHCE_TEAM_ID, CURRENT_SEASON } from '../constants';
import { cacheStore } from '../cache';
import { apiLogger } from '../api-logger';

// =============================================
// API CLIENT CONFIGURATION
// =============================================

const API_KEY = process.env.API_FOOTBALL_KEY || '4b6087faf2421ea633eb2d01f80c501b';
const DAILY_LIMIT = API_CONFIG.DAILY_LIMIT;

interface RequestOptions {
  endpoint: string;
  params?: Record<string, string | number>;
  retries?: number;
  callerPage?: string; // Track which page made the request
}

// =============================================
// RATE LIMITING & ERROR HANDLING
// =============================================

class ApiRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiRateLimitError';
  }
}

class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

// =============================================
// BASE API CLIENT
// =============================================

async function apiRequest<T>(options: RequestOptions): Promise<ApiResponse<T>> {
  const { endpoint, params = {}, retries = 3, callerPage = 'unknown' } = options;
  const startTime = Date.now();
  
  // Rate limit kontrolü
  const dailyRequests = cacheStore.getTotalDailyRequests();
  if (dailyRequests >= DAILY_LIMIT) {
    throw new ApiRateLimitError(`Daily API limit reached: ${dailyRequests}/${DAILY_LIMIT}`);
  }
  
  // URL oluştur
  const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });
  
  let lastError: Error | null = null;
  
  // Retry mekanizması (exponential backoff)
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`[API] Request: ${endpoint} (attempt ${attempt + 1}/${retries})`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-apisports-key': API_KEY,
        },
        next: { revalidate: 0 }, // Next.js cache'ini devre dışı bırak, kendi cache sistemimizi kullanıyoruz
      });
      
      console.log(`[API] Response status: ${response.status} ${response.statusText}`);
      
      // İstek sayacını artır
      cacheStore.incrementRequestCount(endpoint);
      
      if (!response.ok) {
        const responseTime = Date.now() - startTime;
        apiLogger.log({
          callerPage,
          endpoint,
          params,
          status: response.status,
          statusText: response.statusText,
          responseTime,
          response: null,
          error: `API request failed: ${response.statusText}`,
        });
        throw new ApiError(`API request failed: ${response.statusText}`, response.status);
      }
      
      const data: ApiResponse<T> = await response.json();
      const responseTime = Date.now() - startTime;
      
      // Log successful response
      apiLogger.log({
        callerPage,
        endpoint,
        params,
        status: response.status,
        statusText: response.statusText,
        responseTime,
        response: data,
      });
      
      // API hata kontrolü
      if (data.errors && Object.keys(data.errors).length > 0) {
        throw new ApiError(`API returned errors: ${JSON.stringify(data.errors)}`, 400);
      }
      
      return data;
      
    } catch (error) {
      lastError = error as Error;
      
      // Rate limit veya auth hatalarında retry yapma
      if (error instanceof ApiRateLimitError) {
        throw error;
      }
      
      if (error instanceof ApiError && [401, 403, 429].includes(error.statusCode)) {
        throw error;
      }
      
      // Exponential backoff
      if (attempt < retries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`[API] Retry ${attempt + 1}/${retries} after ${delay}ms - Error: ${lastError?.message || 'Unknown'}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('[API] All retries failed:', lastError?.message);
  throw lastError || new Error('Unknown API error');
}

// =============================================
// FIXTURE ENDPOINTS
// =============================================

/**
 * Belirli bir lig ve sezon için tüm maçları getir
 */
export async function getFixtures(
  leagueId: number, 
  season: number = CURRENT_SEASON,
  callerPage: string = 'unknown'
): Promise<Fixture[]> {
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { league: leagueId, season },
    callerPage,
  });
  return response.response;
}

/**
 * Fenerbahçe'nin tüm maçlarını getir
 */
export async function getFenerbahceFixtures(
  season: number = CURRENT_SEASON,
  callerPage: string = 'unknown'
): Promise<Fixture[]> {
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { team: FENERBAHCE_TEAM_ID, season },
    callerPage,
  });
  return response.response;
}

/**
 * Belirli bir maçın detaylarını getir
 */
export async function getFixtureById(
  fixtureId: number,
  callerPage: string = 'unknown'
): Promise<Fixture | null> {
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { id: fixtureId },
    callerPage,
  });
  return response.response[0] || null;
}

/**
 * Belirli bir maçın olaylarını getir (goller, kartlar, değişiklikler)
 */
export async function getFixtureEvents(
  fixtureId: number,
  callerPage: string = 'unknown'
): Promise<Fixture | null> {
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { id: fixtureId },
    callerPage,
  });
  return response.response[0] || null;
}

/**
 * Belirli bir maçın kadrolarını getir
 */
export async function getFixtureLineups(
  fixtureId: number,
  callerPage: string = 'unknown'
): Promise<Fixture | null> {
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { id: fixtureId },
    callerPage,
  });
  return response.response[0] || null;
}

/**
 * Belirli bir maçın istatistiklerini getir
 */
export async function getFixtureStatistics(
  fixtureId: number,
  callerPage: string = 'unknown'
): Promise<Fixture | null> {
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { id: fixtureId },
    callerPage,
  });
  return response.response[0] || null;
}

/**
 * Canlı maçları getir
 */
export async function getLiveFixtures(
  callerPage: string = 'unknown'
): Promise<Fixture[]> {
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { live: 'all' },
    callerPage,
  });
  return response.response;
}

/**
 * Bugünün maçlarını getir
 */
export async function getTodayFixtures(
  callerPage: string = 'unknown'
): Promise<Fixture[]> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { date: today },
    callerPage,
  });
  return response.response;
}

/**
 * Belirli tarih aralığındaki maçları getir
 */
export async function getFixturesByDateRange(
  from: string,
  to: string,
  teamId: number = FENERBAHCE_TEAM_ID,
  callerPage: string = 'unknown'
): Promise<Fixture[]> {
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { team: teamId, from, to },
    callerPage,
  });
  return response.response;
}

/**
 * Sonraki N maçı getir
 */
export async function getNextFixtures(
  teamId: number = FENERBAHCE_TEAM_ID,
  count: number = 5,
  callerPage: string = 'unknown'
): Promise<Fixture[]> {
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { team: teamId, next: count },
    callerPage,
  });
  return response.response;
}

/**
 * Son N maçı getir
 */
export async function getLastFixtures(
  teamId: number = FENERBAHCE_TEAM_ID,
  count: number = 5,
  callerPage: string = 'unknown'
): Promise<Fixture[]> {
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { team: teamId, last: count },
    callerPage,
  });
  return response.response;
}

// =============================================
// STANDINGS ENDPOINTS
// =============================================

/**
 * Puan durumunu getir
 */
export async function getStandings(
  leagueId: number,
  season: number = CURRENT_SEASON,
  callerPage: string = 'unknown'
): Promise<StandingsResponse | null> {
  const response = await apiRequest<StandingsResponse[]>({
    endpoint: '/standings',
    params: { league: leagueId, season },
    callerPage,
  });
  return response.response[0] || null;
}

// =============================================
// TEAM ENDPOINTS
// =============================================

/**
 * Takım bilgilerini getir
 */
export async function getTeam(
  teamId: number,
  callerPage: string = 'unknown'
): Promise<TeamWithVenue | null> {
  const response = await apiRequest<{ team: TeamWithVenue; venue: unknown }[]>({
    endpoint: '/teams',
    params: { id: teamId },
    callerPage,
  });
  
  if (response.response[0]) {
    return {
      ...response.response[0].team,
      venue: response.response[0].venue as TeamWithVenue['venue'],
    };
  }
  return null;
}

/**
 * Takım kadrosunu getir
 */
export async function getSquad(
  teamId: number = FENERBAHCE_TEAM_ID,
  callerPage: string = 'unknown'
): Promise<Squad | null> {
  const response = await apiRequest<Squad[]>({
    endpoint: '/players/squads',
    params: { team: teamId },
    callerPage,
  });
  return response.response[0] || null;
}

/**
 * Takım sezon istatistiklerini getir
 * Bu endpoint form, gol dağılımı, kartlar, clean sheet vb. tüm takım istatistiklerini döner
 */
export async function getTeamStatistics(
  teamId: number = FENERBAHCE_TEAM_ID,
  leagueId: number,
  season: number = CURRENT_SEASON,
  callerPage: string = 'unknown'
): Promise<TeamSeasonStatistics | null> {
  const response = await apiRequest<TeamSeasonStatistics>({
    endpoint: '/teams/statistics',
    params: { team: teamId, league: leagueId, season },
    callerPage,
  });
  return response.response || null;
}

// =============================================
// PLAYER ENDPOINTS
// =============================================

/**
 * Oyuncu bilgilerini getir
 */
export async function getPlayer(
  playerId: number,
  season: number = CURRENT_SEASON,
  callerPage: string = 'unknown'
): Promise<PlayerWithStats | null> {
  const response = await apiRequest<PlayerWithStats[]>({
    endpoint: '/players',
    params: { id: playerId, season },
    callerPage,
  });
  return response.response[0] || null;
}

/**
 * Oyuncunun sezon istatistiklerini getir
 */
export async function getPlayerStatistics(
  playerId: number,
  season: number = CURRENT_SEASON,
  callerPage: string = 'unknown'
): Promise<PlayerWithStats[]> {
  const response = await apiRequest<PlayerWithStats[]>({
    endpoint: '/players',
    params: { id: playerId, season },
    callerPage,
  });
  return response.response;
}

/**
 * Oyuncunun oynadığı sezonları getir
 */
export async function getPlayerSeasons(
  playerId: number,
  callerPage: string = 'unknown'
): Promise<number[]> {
  const response = await apiRequest<number[]>({
    endpoint: '/players/seasons',
    params: { player: playerId },
    callerPage,
  });
  return response.response;
}

/**
 * Takımdaki oyuncuları sezon istatistikleriyle getir
 */
export async function getTeamPlayers(
  teamId: number = FENERBAHCE_TEAM_ID,
  season: number = CURRENT_SEASON,
  callerPage: string = 'unknown'
): Promise<PlayerWithStats[]> {
  const response = await apiRequest<PlayerWithStats[]>({
    endpoint: '/players',
    params: { team: teamId, season },
    callerPage,
  });
  return response.response;
}

// =============================================
// TOP SCORERS / ASSISTS
// =============================================

/**
 * Gol krallığını getir
 */
export async function getTopScorers(
  leagueId: number,
  season: number = CURRENT_SEASON,
  callerPage: string = 'unknown'
): Promise<TopScorer[]> {
  const response = await apiRequest<TopScorer[]>({
    endpoint: '/players/topscorers',
    params: { league: leagueId, season },
    callerPage,
  });
  return response.response;
}

/**
 * Asist krallığını getir
 */
export async function getTopAssists(
  leagueId: number,
  season: number = CURRENT_SEASON,
  callerPage: string = 'unknown'
): Promise<TopScorer[]> {
  const response = await apiRequest<TopScorer[]>({
    endpoint: '/players/topassists',
    params: { league: leagueId, season },
    callerPage,
  });
  return response.response;
}

// =============================================
// COACH ENDPOINTS
// =============================================

/**
 * Teknik direktör bilgilerini getir
 */
export async function getCoach(
  teamId: number = FENERBAHCE_TEAM_ID,
  callerPage: string = 'unknown'
): Promise<Coach | null> {
  const response = await apiRequest<Coach[]>({
    endpoint: '/coachs',
    params: { team: teamId },
    callerPage,
  });
  return response.response[0] || null;
}

// =============================================
// HEAD TO HEAD
// =============================================

/**
 * Karşılıklı istatistikleri getir
 */
export async function getHeadToHead(
  team1: number,
  team2: number,
  last: number = 10,
  callerPage: string = 'unknown'
): Promise<Fixture[]> {
  const h2h = `${team1}-${team2}`;
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures/headtohead',
    params: { h2h, last },
    callerPage,
  });
  return response.response;
}

// =============================================
// TRANSFER ENDPOINTS
// =============================================

/**
 * Transfer bilgilerini getir
 */
export interface TransferResponse {
  player: {
    id: number;
    name: string;
  };
  update: string;
  transfers: Array<{
    date: string;
    type: string;
    teams: {
      in: {
        id: number;
        name: string;
        logo: string;
      };
      out: {
        id: number;
        name: string;
        logo: string;
      };
    };
  }>;
}

export async function getTransfers(
  teamId: number = FENERBAHCE_TEAM_ID,
  callerPage: string = 'unknown'
): Promise<TransferResponse[]> {
  const response = await apiRequest<TransferResponse[]>({
    endpoint: '/transfers',
    params: { team: teamId },
    callerPage,
  });
  return response.response;
}

// =============================================
// API STATUS
// =============================================

/**
 * API kullanım durumunu kontrol et
 */
export function getApiStatus(): {
  dailyRequests: number;
  dailyLimit: number;
  remaining: number;
  percentUsed: number;
} {
  const dailyRequests = cacheStore.getTotalDailyRequests();
  return {
    dailyRequests,
    dailyLimit: DAILY_LIMIT,
    remaining: DAILY_LIMIT - dailyRequests,
    percentUsed: (dailyRequests / DAILY_LIMIT) * 100,
  };
}

// API Client object export
export const apiClient = {
  getFixtures: (teamId: number, season: number) => getFenerbahceFixtures(season),
  getPlayerStatistics,
  getPlayerSeasons,
  getStandings,
  getTopScorers,
  getTopAssists,
  getSquad,
  getTeam,
  getTeamStatistics,
  getCoach,
  getHeadToHead,
  getLiveFixtures,
  getTodayFixtures,
  getTransfers,
};

// =============================================
// PLAYER TRANSFERS ENDPOINT
// =============================================

export interface PlayerTransferResponse {
  player: {
    id: number;
    name: string;
  };
  update: string;
  transfers: Array<{
    date: string;
    type: string;
    teams: {
      in: {
        id: number;
        name: string;
        logo: string;
      };
      out: {
        id: number;
        name: string;
        logo: string;
      };
    };
  }>;
}

/**
 * Get player transfer history
 */
export async function getPlayerTransfers(
  playerId: number,
  callerPage: string = 'unknown'
): Promise<PlayerTransferResponse | null> {
  const response = await apiRequest<PlayerTransferResponse[]>({
    endpoint: '/transfers',
    params: { player: playerId },
    callerPage,
  });
  return response.response[0] || null;
}

// =============================================
// PLAYER TROPHIES ENDPOINT
// =============================================

export interface PlayerTrophy {
  league: string;
  country: string;
  season: string | null;
  place: string;
}

/**
 * Get player trophies/honors
 */
export async function getPlayerTrophies(
  playerId: number,
  callerPage: string = 'unknown'
): Promise<PlayerTrophy[]> {
  const response = await apiRequest<PlayerTrophy[]>({
    endpoint: '/trophies',
    params: { player: playerId },
    callerPage,
  });
  return response.response;
}

// =============================================
// PLAYER SIDELINED (INJURY HISTORY) ENDPOINT
// =============================================

export interface PlayerSidelined {
  type: string;
  start: string;
  end: string;
}

/**
 * Get player injury/sidelined history
 */
export async function getPlayerSidelined(
  playerId: number,
  callerPage: string = 'unknown'
): Promise<PlayerSidelined[]> {
  const response = await apiRequest<PlayerSidelined[]>({
    endpoint: '/sidelined',
    params: { player: playerId },
    callerPage,
  });
  return response.response;
}

// =============================================
// PLAYER TEAMS ENDPOINT
// =============================================

export interface PlayerTeamResponse {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  seasons: number[];
}

/**
 * Get teams a player has played for
 */
export async function getPlayerTeams(
  playerId: number,
  callerPage: string = 'unknown'
): Promise<PlayerTeamResponse[]> {
  const response = await apiRequest<PlayerTeamResponse[]>({
    endpoint: '/players/teams',
    params: { player: playerId },
    callerPage,
  });
  return response.response;
}

// =============================================
// FIXTURE PLAYER STATISTICS ENDPOINT
// =============================================

export interface FixturePlayerStatsResponse {
  team: {
    id: number;
    name: string;
    logo: string;
    update: string;
  };
  players: Array<{
    player: {
      id: number;
      name: string;
      photo: string;
    };
    statistics: Array<{
      games: {
        minutes: number | null;
        number: number | null;
        position: string | null;
        rating: string | null;
        captain: boolean;
        substitute: boolean;
      };
      offsides: number | null;
      shots: {
        total: number | null;
        on: number | null;
      };
      goals: {
        total: number | null;
        conceded: number | null;
        assists: number | null;
        saves: number | null;
      };
      passes: {
        total: number | null;
        key: number | null;
        accuracy: string | null;
      };
      tackles: {
        total: number | null;
        blocks: number | null;
        interceptions: number | null;
      };
      duels: {
        total: number | null;
        won: number | null;
      };
      dribbles: {
        attempts: number | null;
        success: number | null;
        past: number | null;
      };
      fouls: {
        drawn: number | null;
        committed: number | null;
      };
      cards: {
        yellow: number;
        red: number;
      };
      penalty: {
        won: number | null;
        committed: number | null;
        scored: number | null;
        missed: number | null;
        saved: number | null;
      };
    }>;
  }>;
}

/**
 * Get player statistics for a specific fixture
 */
export async function getFixturePlayerStats(
  fixtureId: number,
  callerPage: string = 'unknown'
): Promise<FixturePlayerStatsResponse[]> {
  const response = await apiRequest<FixturePlayerStatsResponse[]>({
    endpoint: '/fixtures/players',
    params: { fixture: fixtureId },
    callerPage,
  });
  return response.response;
}
