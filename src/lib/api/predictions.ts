// =============================================
// PREDICTIONS API CLIENT
// =============================================

import { Prediction } from '@/types/prediction';
import { API_CONFIG } from '../constants';
import { ApiResponse } from '@/types';
import { apiLogger } from '../api-logger';

const API_KEY = process.env.API_FOOTBALL_KEY || '4b6087faf2421ea633eb2d01f80c501b';

/**
 * Fetch predictions for a fixture
 */
export async function getPredictions(
  fixtureId: number,
  callerPage: string = 'unknown'
): Promise<Prediction | null> {
  const startTime = Date.now();
  
  try {
    const url = new URL(`${API_CONFIG.BASE_URL}/predictions`);
    url.searchParams.append('fixture', String(fixtureId));
    
    console.log(`[API] Fetching predictions for fixture ${fixtureId}`);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-apisports-key': API_KEY,
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      console.error(`[API] Predictions request failed: ${response.status}`);
      apiLogger.log({
        callerPage,
        endpoint: '/predictions',
        params: { fixture: fixtureId },
        status: response.status,
        statusText: response.statusText,
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
      });
      return null;
    }
    
    const data: ApiResponse<Prediction[]> = await response.json();
    
    // Log the API call
    apiLogger.log({
      callerPage,
      endpoint: '/predictions',
      params: { fixture: fixtureId },
      status: response.status,
      statusText: response.statusText,
      responseTime,
      response: data,
    });
    
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error('[API] Predictions API error:', data.errors);
      return null;
    }
    
    return data.response[0] || null;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('[API] Failed to fetch predictions:', error);
    apiLogger.log({
      callerPage,
      endpoint: '/predictions',
      params: { fixture: fixtureId },
      status: 0,
      statusText: 'Error',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Get cached predictions (simple in-memory cache)
 */
const predictionsCache = new Map<number, { data: Prediction | null; timestamp: number }>();
const PREDICTIONS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function getCachedPredictions(
  fixtureId: number,
  callerPage: string = 'unknown'
): Promise<Prediction | null> {
  const cached = predictionsCache.get(fixtureId);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < PREDICTIONS_CACHE_TTL) {
    console.log(`[Cache] Predictions cache hit for fixture ${fixtureId}`);
    return cached.data;
  }
  
  const data = await getPredictions(fixtureId, callerPage);
  predictionsCache.set(fixtureId, { data, timestamp: now });
  
  return data;
}
