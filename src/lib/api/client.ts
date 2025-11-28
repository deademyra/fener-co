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

// =============================================
// API CLIENT CONFIGURATION
// =============================================

const API_KEY = process.env.API_FOOTBALL_KEY;

if (!API_KEY) {
  throw new Error('API_FOOTBALL_KEY environment variable is not set');
}

const DAILY_LIMIT = API_CONFIG.DAILY_LIMIT;

interface RequestOptions {
  endpoint: string;
  params?: Record<string, string | number>;
  retries?: number;
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
  const { endpoint, params = {}, retries = 3 } = options;
  
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
        throw new ApiError(`API request failed: ${response.statusText}`, response.status);
      }
      
      const data: ApiResponse<T> = await response.json();
      
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
  season: number = CURRENT_SEASON
): Promise<Fixture[]> {
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { league: leagueId, season },
  });
  return response.response;
}

/**
 * Fenerbahçe'nin tüm maçlarını getir
 */
export async function getFenerbahceFixtures(
  season: number = CURRENT_SEASON
): Promise<Fixture[]> {
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { team: FENERBAHCE_TEAM_ID, season },
  });
  return response.response;
}

/**
 * Belirli bir maçın detaylarını getir
 */
export async function getFixtureById(fixtureId: number): Promise<Fixture | null> {
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { id: fixtureId },
  });
  return response.response[0] || null;
}

/**
 * Belirli bir maçın olaylarını getir (goller, kartlar, değişiklikler)
 */
export async function getFixtureEvents(fixtureId: number): Promise<Fixture | null> {
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { id: fixtureId },
  });
  return response.response[0] || null;
}

/**
 * Belirli bir maçın kadrolarını getir
 */
export async function getFixtureLineups(fixtureId: number): Promise<Fixture | null> {
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { id: fixtureId },
  });
  return response.response[0] || null;
}

/**
 * Belirli bir maçın istatistiklerini getir
 */
export async function getFixtureStatistics(fixtureId: number): Promise<Fixture | null> {
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { id: fixtureId },
  });
  return response.response[0] || null;
}

/**
 * Canlı maçları getir
 */
export async function getLiveFixtures(): Promise<Fixture[]> {
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { live: 'all' },
  });
  return response.response;
}

/**
 * Bugünün maçlarını getir
 */
export async function getTodayFixtures(): Promise<Fixture[]> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { date: today },
  });
  return response.response;
}

/**
 * Belirli tarih aralığındaki maçları getir
 */
export async function getFixturesByDateRange(
  from: string,
  to: string,
  teamId: number = FENERBAHCE_TEAM_ID
): Promise<Fixture[]> {
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { team: teamId, from, to },
  });
  return response.response;
}

/**
 * Sonraki N maçı getir
 */
export async function getNextFixtures(
  teamId: number = FENERBAHCE_TEAM_ID,
  count: number = 5
): Promise<Fixture[]> {
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { team: teamId, next: count },
  });
  return response.response;
}

/**
 * Son N maçı getir
 */
export async function getLastFixtures(
  teamId: number = FENERBAHCE_TEAM_ID,
  count: number = 5
): Promise<Fixture[]> {
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures',
    params: { team: teamId, last: count },
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
  season: number = CURRENT_SEASON
): Promise<StandingsResponse | null> {
  const response = await apiRequest<StandingsResponse[]>({
    endpoint: '/standings',
    params: { league: leagueId, season },
  });
  return response.response[0] || null;
}

// =============================================
// TEAM ENDPOINTS
// =============================================

/**
 * Takım bilgilerini getir
 */
export async function getTeam(teamId: number): Promise<TeamWithVenue | null> {
  const response = await apiRequest<{ team: TeamWithVenue; venue: unknown }[]>({
    endpoint: '/teams',
    params: { id: teamId },
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
  teamId: number = FENERBAHCE_TEAM_ID
): Promise<Squad | null> {
  const response = await apiRequest<Squad[]>({
    endpoint: '/players/squads',
    params: { team: teamId },
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
  season: number = CURRENT_SEASON
): Promise<TeamSeasonStatistics | null> {
  const response = await apiRequest<TeamSeasonStatistics>({
    endpoint: '/teams/statistics',
    params: { team: teamId, league: leagueId, season },
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
  season: number = CURRENT_SEASON
): Promise<PlayerWithStats | null> {
  const response = await apiRequest<PlayerWithStats[]>({
    endpoint: '/players',
    params: { id: playerId, season },
  });
  return response.response[0] || null;
}

/**
 * Oyuncunun sezon istatistiklerini getir
 */
export async function getPlayerStatistics(
  playerId: number,
  season: number = CURRENT_SEASON
): Promise<PlayerWithStats[]> {
  const response = await apiRequest<PlayerWithStats[]>({
    endpoint: '/players',
    params: { id: playerId, season },
  });
  return response.response;
}

/**
 * Oyuncunun oynadığı sezonları getir
 */
export async function getPlayerSeasons(playerId: number): Promise<number[]> {
  const response = await apiRequest<number[]>({
    endpoint: '/players/seasons',
    params: { player: playerId },
  });
  return response.response;
}

/**
 * Takımdaki oyuncuları sezon istatistikleriyle getir
 */
export async function getTeamPlayers(
  teamId: number = FENERBAHCE_TEAM_ID,
  season: number = CURRENT_SEASON
): Promise<PlayerWithStats[]> {
  const response = await apiRequest<PlayerWithStats[]>({
    endpoint: '/players',
    params: { team: teamId, season },
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
  season: number = CURRENT_SEASON
): Promise<TopScorer[]> {
  const response = await apiRequest<TopScorer[]>({
    endpoint: '/players/topscorers',
    params: { league: leagueId, season },
  });
  return response.response;
}

/**
 * Asist krallığını getir
 */
export async function getTopAssists(
  leagueId: number,
  season: number = CURRENT_SEASON
): Promise<TopScorer[]> {
  const response = await apiRequest<TopScorer[]>({
    endpoint: '/players/topassists',
    params: { league: leagueId, season },
  });
  return response.response;
}

// =============================================
// COACH ENDPOINTS
// =============================================

/**
 * Teknik direktör bilgilerini getir
 */
export async function getCoach(teamId: number = FENERBAHCE_TEAM_ID): Promise<Coach | null> {
  const response = await apiRequest<Coach[]>({
    endpoint: '/coachs',
    params: { team: teamId },
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
  last: number = 10
): Promise<Fixture[]> {
  const h2h = `${team1}-${team2}`;
  const response = await apiRequest<Fixture[]>({
    endpoint: '/fixtures/headtohead',
    params: { h2h, last },
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

export async function getTransfers(teamId: number = FENERBAHCE_TEAM_ID): Promise<TransferResponse[]> {
  const response = await apiRequest<TransferResponse[]>({
    endpoint: '/transfers',
    params: { team: teamId },
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
