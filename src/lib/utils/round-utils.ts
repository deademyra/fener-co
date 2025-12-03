// Round Utilities
// Fenerbahçe Stats - FENER.CO
// Handles round/stage parsing, categorization and display

import { RoundInfo, StageCategory, FENERBAHCE_COMPETITIONS, CompetitionConfig } from '@/types/api-football';

/**
 * Parse a round string and return structured info
 */
export function parseRound(round: string, leagueId: number): RoundInfo {
  const competition = FENERBAHCE_COMPETITIONS.find(c => c.id === leagueId);
  
  // Try to find exact match in competition config
  if (competition) {
    const configRound = competition.roundStructure.find(r => r.round === round);
    if (configRound) return configRound;
  }
  
  // Fallback parsing for unknown rounds
  return parseRoundFallback(round);
}

/**
 * Fallback parser for rounds not in config
 */
function parseRoundFallback(round: string): RoundInfo {
  const roundLower = round.toLowerCase();
  
  // League Phase / Regular Season
  const leaguePhaseMatch = round.match(/League Stage - (\d+)/i);
  if (leaguePhaseMatch) {
    const num = parseInt(leaguePhaseMatch[1]);
    return {
      round,
      category: 'league_phase',
      displayName: `Matchday ${num}`,
      displayNameTr: `${num}. Maç Haftası`,
      order: num
    };
  }
  
  const regularSeasonMatch = round.match(/Regular Season - (\d+)/i);
  if (regularSeasonMatch) {
    const num = parseInt(regularSeasonMatch[1]);
    return {
      round,
      category: 'league_phase',
      displayName: `Week ${num}`,
      displayNameTr: `${num}. Hafta`,
      order: num
    };
  }
  
  // Group Stage
  const groupMatch = round.match(/Group ([A-H])/i);
  if (groupMatch) {
    const group = groupMatch[1].toUpperCase();
    return {
      round,
      category: 'group_stage',
      displayName: `Group ${group}`,
      displayNameTr: `${group} Grubu`,
      order: group.charCodeAt(0) - 64 // A=1, B=2, etc.
    };
  }
  
  // Qualifying Rounds
  const qualifyingMatch = round.match(/(\d+)(st|nd|rd|th)\s*(Qualifying|Round)/i);
  if (qualifyingMatch) {
    const num = parseInt(qualifyingMatch[1]);
    return {
      round,
      category: 'qualifying',
      displayName: `${num}${getOrdinalSuffix(num)} Qualifying`,
      displayNameTr: `${num}. Eleme Turu`,
      order: num
    };
  }
  
  // Knockout rounds
  if (roundLower.includes('play-off') || roundLower.includes('playoff')) {
    return {
      round,
      category: 'knockout',
      displayName: 'Play-offs',
      displayNameTr: 'Play-off',
      order: 100
    };
  }
  
  if (roundLower.includes('round of 32')) {
    return { round, category: 'knockout', displayName: 'Round of 32', displayNameTr: 'Son 32', order: 101 };
  }
  
  if (roundLower.includes('round of 16')) {
    return { round, category: 'knockout', displayName: 'Round of 16', displayNameTr: 'Son 16', order: 102 };
  }
  
  if (roundLower.includes('quarter')) {
    return { round, category: 'knockout', displayName: 'Quarter-finals', displayNameTr: 'Çeyrek Final', order: 103 };
  }
  
  if (roundLower.includes('semi')) {
    return { round, category: 'knockout', displayName: 'Semi-finals', displayNameTr: 'Yarı Final', order: 104 };
  }
  
  if (roundLower === 'final') {
    return { round, category: 'final', displayName: 'Final', displayNameTr: 'Final', order: 105 };
  }
  
  // Default
  return {
    round,
    category: 'league_phase',
    displayName: round,
    displayNameTr: round,
    order: 0
  };
}

/**
 * Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Group rounds by category
 */
export function groupRoundsByCategory(rounds: string[], leagueId: number): Map<StageCategory, RoundInfo[]> {
  const grouped = new Map<StageCategory, RoundInfo[]>();
  
  rounds.forEach(round => {
    const info = parseRound(round, leagueId);
    const existing = grouped.get(info.category) || [];
    existing.push(info);
    grouped.set(info.category, existing);
  });
  
  // Sort each group by order
  grouped.forEach((rounds, category) => {
    grouped.set(category, rounds.sort((a, b) => a.order - b.order));
  });
  
  return grouped;
}

/**
 * Get display name for a stage category
 */
export function getStageCategoryDisplay(category: StageCategory, locale: 'en' | 'tr' = 'tr'): string {
  const displays: Record<StageCategory, { en: string; tr: string }> = {
    qualifying: { en: 'Qualifying Rounds', tr: 'Eleme Turları' },
    league_phase: { en: 'League Phase', tr: 'Lig Aşaması' },
    group_stage: { en: 'Group Stage', tr: 'Grup Aşaması' },
    knockout: { en: 'Knockout Phase', tr: 'Eleme Turu' },
    final: { en: 'Final', tr: 'Final' }
  };
  
  return displays[category][locale];
}

/**
 * Check if a competition has multiple stages/phases
 */
export function hasMultiplePhases(leagueId: number): boolean {
  const competition = FENERBAHCE_COMPETITIONS.find(c => c.id === leagueId);
  if (!competition) return false;
  
  const categories = new Set(competition.roundStructure.map(r => r.category));
  return categories.size > 1;
}

/**
 * Check if competition uses new Swiss/League Phase format
 */
export function usesLeaguePhase(leagueId: number): boolean {
  const competition = FENERBAHCE_COMPETITIONS.find(c => c.id === leagueId);
  return competition?.hasLeaguePhase ?? false;
}

/**
 * Check if competition has group stage
 */
export function hasGroupStage(leagueId: number): boolean {
  const competition = FENERBAHCE_COMPETITIONS.find(c => c.id === leagueId);
  return competition?.hasGroups ?? false;
}

/**
 * Get competition config by ID
 */
export function getCompetitionConfig(leagueId: number): CompetitionConfig | undefined {
  return FENERBAHCE_COMPETITIONS.find(c => c.id === leagueId);
}

/**
 * Sort fixtures by round order
 */
export function sortFixturesByRound<T extends { league: { round: string; id: number } }>(
  fixtures: T[]
): T[] {
  return [...fixtures].sort((a, b) => {
    const roundA = parseRound(a.league.round, a.league.id);
    const roundB = parseRound(b.league.round, b.league.id);
    return roundA.order - roundB.order;
  });
}

/**
 * Get current phase of a competition based on rounds played
 */
export function getCurrentPhase(
  rounds: string[], 
  leagueId: number
): { category: StageCategory; displayName: string; displayNameTr: string } | null {
  if (rounds.length === 0) return null;
  
  // Sort by order and get the latest
  const parsedRounds = rounds.map(r => parseRound(r, leagueId));
  const sorted = parsedRounds.sort((a, b) => b.order - a.order);
  
  const latest = sorted[0];
  return {
    category: latest.category,
    displayName: getStageCategoryDisplay(latest.category, 'en'),
    displayNameTr: getStageCategoryDisplay(latest.category, 'tr')
  };
}

/**
 * Format round for display in UI
 */
export function formatRoundDisplay(round: string, leagueId: number, locale: 'en' | 'tr' = 'tr'): string {
  const info = parseRound(round, leagueId);
  return locale === 'tr' ? info.displayNameTr : info.displayName;
}

/**
 * Get available seasons for a competition
 */
export function getAvailableSeasons(leagueId: number): number[] {
  const competition = FENERBAHCE_COMPETITIONS.find(c => c.id === leagueId);
  return competition?.seasons ?? [];
}

/**
 * Format season for display (e.g., "2024-25")
 */
export function formatSeasonDisplay(season: number): string {
  const nextYear = (season + 1) % 100;
  return `${season}-${nextYear.toString().padStart(2, '0')}`;
}

/**
 * Get current season based on date
 * API-Football uses the season START year
 * Example: 2024-25 season = season parameter is 2024
 * 
 * Current date: November 2025 = We're in 2025-26 season
 * BUT if we're testing with real API and 2025-26 hasn't started yet,
 * the "current" available season would be 2024
 * 
 * For now, returning the season start year based on current date:
 * - Jan-Jun: previous year (e.g., Jun 2025 = 2024-25 season = 2024)
 * - Jul-Dec: current year (e.g., Nov 2025 = 2025-26 season = 2025)
 */
export function getCurrentSeason(): number {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();
  
  // Season starts in July/August
  // If we're in months 0-6 (Jan-Jun), we're in the previous year's season
  // If we're in months 7-11 (Jul-Dec), we're in the current year's season
  return month < 7 ? year - 1 : year;
}

/**
 * Get the correct API season parameter for a league
 * API-Football uses the season start year for all leagues
 * For example: 2024-25 season = season=2024
 * 
 * This function ensures we always use the correct season parameter
 * regardless of the current date
 */
export function getApiSeason(leagueId: number, displaySeason?: number): number {
  // If a display season is provided, use it directly
  // The display season should already be the start year (e.g., 2024 for 2024-25)
  if (displaySeason !== undefined) {
    return displaySeason;
  }
  
  // Otherwise calculate current season
  return getCurrentSeason();
}
