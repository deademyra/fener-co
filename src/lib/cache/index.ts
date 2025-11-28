import { CacheEntry } from '@/types';
import { CACHE_TTL } from '../constants';

// =============================================
// IN-MEMORY CACHE STORE
// =============================================

class CacheStore {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private requestCount: Map<string, number> = new Map(); // Günlük istek sayacı
  private lastResetDate: string = new Date().toDateString();

  // Cache'den veri al
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const expiresAt = entry.timestamp + (entry.ttl * 1000);

    if (now > expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Cache'e veri yaz
  set<T>(key: string, data: T, ttl: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    this.cache.set(key, entry as CacheEntry<unknown>);
  }

  // Cache'den sil
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Belirli prefix ile başlayan tüm cache'leri sil
  deleteByPrefix(prefix: string): number {
    let deletedCount = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  // Tüm cache'i temizle
  clear(): void {
    this.cache.clear();
  }

  // Cache boyutunu al
  size(): number {
    return this.cache.size;
  }

  // Expire olmuş cache'leri temizle
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      const expiresAt = entry.timestamp + (entry.ttl * 1000);
      if (now > expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  // API istek sayacını artır
  incrementRequestCount(endpoint: string): number {
    // Günü kontrol et, yeni gün ise sıfırla
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.requestCount.clear();
      this.lastResetDate = today;
    }

    const current = this.requestCount.get(endpoint) || 0;
    this.requestCount.set(endpoint, current + 1);
    return current + 1;
  }

  // Toplam günlük istek sayısını al
  getTotalDailyRequests(): number {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      return 0;
    }

    let total = 0;
    for (const count of this.requestCount.values()) {
      total += count;
    }
    return total;
  }

  // Cache durumunu al
  getStats(): {
    cacheSize: number;
    dailyRequests: number;
    entries: { key: string; expiresIn: number }[];
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      expiresIn: Math.max(0, Math.round((entry.timestamp + entry.ttl * 1000 - now) / 1000)),
    }));

    return {
      cacheSize: this.cache.size,
      dailyRequests: this.getTotalDailyRequests(),
      entries,
    };
  }
}

// Singleton instance
export const cacheStore = new CacheStore();

// =============================================
// CACHE KEY GENERATORS
// =============================================

export const CacheKeys = {
  // Fixture keys
  fixtures: (leagueId: number, season: number) => `fixtures:${leagueId}:${season}`,
  fixtureDetail: (fixtureId: number) => `fixture:${fixtureId}`,
  fixtureEvents: (fixtureId: number) => `fixture:${fixtureId}:events`,
  fixtureLineups: (fixtureId: number) => `fixture:${fixtureId}:lineups`,
  fixtureStatistics: (fixtureId: number) => `fixture:${fixtureId}:stats`,
  fixturePlayers: (fixtureId: number) => `fixture:${fixtureId}:players`,
  
  // Live fixtures
  liveFixtures: () => 'fixtures:live',
  todayFixtures: () => `fixtures:today:${new Date().toDateString()}`,
  
  // Team keys
  team: (teamId: number) => `team:${teamId}`,
  teamStatistics: (teamId: number, leagueId: number, season: number) => 
    `team:${teamId}:stats:${leagueId}:${season}`,
  teamSquad: (teamId: number, season: number) => `team:${teamId}:squad:${season}`,
  teamFixtures: (teamId: number, season: number) => `team:${teamId}:fixtures:${season}`,
  
  // Player keys
  player: (playerId: number) => `player:${playerId}`,
  playerStatistics: (playerId: number, season: number) => `player:${playerId}:stats:${season}`,
  
  // Standings keys
  standings: (leagueId: number, season: number) => `standings:${leagueId}:${season}`,
  
  // Top scorers/assists
  topScorers: (leagueId: number, season: number) => `topscorers:${leagueId}:${season}`,
  topAssists: (leagueId: number, season: number) => `topassists:${leagueId}:${season}`,
  
  // Coach
  coach: (teamId: number) => `coach:${teamId}`,
  
  // H2H
  h2h: (team1: number, team2: number) => `h2h:${Math.min(team1, team2)}:${Math.max(team1, team2)}`,
};

// =============================================
// CACHE HELPER FUNCTIONS
// =============================================

/**
 * Cache'li veri getir - yoksa fetch et ve cache'le
 * Returns: { data, fromCache } - fromCache true ise cache'den geldi
 */
export async function getCachedDataWithInfo<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<{ data: T; fromCache: boolean }> {
  // Önce cache'e bak
  const cached = cacheStore.get<T>(key);
  if (cached !== null) {
    return { data: cached, fromCache: true };
  }

  // Cache'de yoksa fetch et
  const data = await fetcher();
  
  // Cache'e kaydet
  cacheStore.set(key, data, ttl);
  
  return { data, fromCache: false };
}

/**
 * Cache'li veri getir - yoksa fetch et ve cache'le
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  const { data } = await getCachedDataWithInfo(key, fetcher, ttl);
  return data;
}

/**
 * Fixture için uygun TTL'i belirle
 */
export function getFixtureCacheTTL(status: string): number {
  const liveStatuses = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P'];
  const finishedStatuses = ['FT', 'AET', 'PEN'];
  
  if (liveStatuses.includes(status)) {
    return CACHE_TTL.LIVESCORE;
  }
  
  if (finishedStatuses.includes(status)) {
    return CACHE_TTL.COMPLETED_MATCH;
  }
  
  // Scheduled veya diğer durumlar
  return CACHE_TTL.TODAY_FIXTURES;
}

/**
 * Periyodik cache cleanup (her 5 dakikada bir çalıştırılabilir)
 */
export function scheduleCleanup(intervalMs: number = 300000): NodeJS.Timeout {
  return setInterval(() => {
    const cleaned = cacheStore.cleanup();
    if (cleaned > 0) {
      console.log(`[Cache] Cleaned ${cleaned} expired entries`);
    }
  }, intervalMs);
}
