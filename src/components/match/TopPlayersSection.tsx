'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FixturePlayerStats, PlayerMatchStats, PlayerStatistics } from '@/types';
import { cn, shortenName } from '@/lib/utils';
import { FENERBAHCE_TEAM_ID, ROUTES } from '@/lib/constants';

interface TopPlayersSectionProps {
  players: FixturePlayerStats[];
  homeTeamId: number;
  awayTeamId: number;
  isFenerbahceMatch: boolean;
}

interface PlayerWithTeam extends PlayerMatchStats {
  teamId: number;
  teamLogo: string;
}

// Position types for stat selection logic
type PositionCategory = 'G' | 'D' | 'M' | 'F';

// Rating color helper
function getRatingColor(rating: number): string {
  if (rating >= 8.0) return 'bg-green-500';
  if (rating >= 7.0) return 'bg-green-600';
  if (rating >= 6.5) return 'bg-yellow-500';
  if (rating >= 6.0) return 'bg-orange-500';
  return 'bg-red-500';
}

// Get position category from position string
function getPositionCategory(position: string | undefined): PositionCategory {
  if (!position) return 'M'; // Default to midfielder
  const pos = position.toUpperCase();
  if (pos === 'G') return 'G';
  if (pos === 'D') return 'D';
  if (pos === 'M') return 'M';
  if (pos === 'F') return 'F';
  return 'M';
}

// Stat column configuration
interface StatColumn {
  key: string;
  label: string;
  getValue: (stats: PlayerStatistics) => number | string | null;
  format?: (value: number | string | null) => string;
}

// Available stat columns
const STAT_COLUMNS: Record<string, StatColumn> = {
  goals: {
    key: 'goals',
    label: 'Gol',
    getValue: (stats) => stats.goals.total || 0,
    format: (v) => String(v || 0),
  },
  assists: {
    key: 'assists',
    label: 'Ast',
    getValue: (stats) => stats.goals.assists || 0,
    format: (v) => String(v || 0),
  },
  shotsOn: {
    key: 'shotsOn',
    label: 'İşut',
    getValue: (stats) => stats.shots.on || 0,
    format: (v) => String(v || 0),
  },
  duelsWonPct: {
    key: 'duelsWonPct',
    label: 'İM%',
    getValue: (stats) => {
      const total = stats.duels.total || 0;
      const won = stats.duels.won || 0;
      return total > 0 ? Math.round((won / total) * 100) : 0;
    },
    format: (v) => `${v}%`,
  },
  passAccuracy: {
    key: 'passAccuracy',
    label: 'Pas%',
    getValue: (stats) => {
      const acc = stats.passes.accuracy;
      if (acc === null || acc === undefined) return 0;
      return typeof acc === 'string' ? parseInt(acc) || 0 : acc;
    },
    format: (v) => `${v}%`,
  },
  keyPasses: {
    key: 'keyPasses',
    label: 'KP',
    getValue: (stats) => stats.passes.key || 0,
    format: (v) => String(v || 0),
  },
  interceptions: {
    key: 'interceptions',
    label: 'Top K.',
    getValue: (stats) => stats.tackles.interceptions || 0,
    format: (v) => String(v || 0),
  },
  saves: {
    key: 'saves',
    label: 'Krt',
    getValue: (stats) => stats.goals.saves || 0,
    format: (v) => String(v || 0),
  },
  conceded: {
    key: 'conceded',
    label: 'Gol Y.',
    getValue: (stats) => stats.goals.conceded || 0,
    format: (v) => String(v || 0),
  },
};

// Get dynamic stat columns for a player based on available data and position
function getDynamicStatColumns(stats: PlayerStatistics, position: PositionCategory): StatColumn[] {
  const columns: StatColumn[] = [];
  const MAX_COLUMNS = 3;
  
  // Priority 1: Goals if > 0
  const goals = stats.goals.total || 0;
  if (goals > 0 && columns.length < MAX_COLUMNS) {
    columns.push(STAT_COLUMNS.goals);
  }
  
  // Priority 2: Assists if > 0
  const assists = stats.goals.assists || 0;
  if (assists > 0 && columns.length < MAX_COLUMNS) {
    columns.push(STAT_COLUMNS.assists);
  }
  
  // If we still need more columns, use position-specific logic
  if (columns.length < MAX_COLUMNS) {
    const positionStats: Record<PositionCategory, StatColumn[]> = {
      F: [STAT_COLUMNS.shotsOn, STAT_COLUMNS.duelsWonPct, STAT_COLUMNS.passAccuracy],
      M: [STAT_COLUMNS.keyPasses, STAT_COLUMNS.passAccuracy, STAT_COLUMNS.duelsWonPct],
      D: [STAT_COLUMNS.interceptions, STAT_COLUMNS.duelsWonPct, STAT_COLUMNS.passAccuracy],
      G: [STAT_COLUMNS.saves, STAT_COLUMNS.conceded, STAT_COLUMNS.passAccuracy],
    };
    
    const fallbackColumns = positionStats[position];
    
    for (const col of fallbackColumns) {
      if (columns.length >= MAX_COLUMNS) break;
      // Don't add duplicate columns
      if (!columns.find(c => c.key === col.key)) {
        columns.push(col);
      }
    }
  }
  
  return columns;
}

// Get merged stat columns for all top players (for consistent header display)
function getMergedStatColumns(players: PlayerWithTeam[]): StatColumn[] {
  const columnCounts: Map<string, { column: StatColumn; count: number }> = new Map();
  
  players.forEach(player => {
    const stats = player.statistics[0];
    if (!stats) return;
    
    const position = getPositionCategory(stats.games?.position);
    const playerColumns = getDynamicStatColumns(stats, position);
    
    playerColumns.forEach(col => {
      const existing = columnCounts.get(col.key);
      if (existing) {
        existing.count++;
      } else {
        columnCounts.set(col.key, { column: col, count: 1 });
      }
    });
  });
  
  // Sort by frequency and take top 3
  const sorted = Array.from(columnCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(item => item.column);
  
  return sorted;
}

export function TopPlayersSection({ 
  players, 
  homeTeamId, 
  awayTeamId, 
  isFenerbahceMatch 
}: TopPlayersSectionProps) {
  // Flatten all players and add team info
  let allPlayers: PlayerWithTeam[] = [];
  
  players.forEach(teamPlayers => {
    teamPlayers.players.forEach(player => {
      if (player.statistics[0]?.games?.minutes && player.statistics[0].games.minutes > 0) {
        allPlayers.push({
          ...player,
          teamId: teamPlayers.team.id,
          teamLogo: teamPlayers.team.logo
        });
      }
    });
  });
  
  // Filter to FB players only if it's a Fenerbahçe match
  if (isFenerbahceMatch) {
    allPlayers = allPlayers.filter(p => p.teamId === FENERBAHCE_TEAM_ID);
  }
  
  // Sort by rating and take top 3
  const topPlayers = allPlayers
    .filter(p => p.statistics[0]?.games?.rating)
    .sort((a, b) => {
      const ratingA = parseFloat(a.statistics[0].games.rating || '0');
      const ratingB = parseFloat(b.statistics[0].games.rating || '0');
      return ratingB - ratingA;
    })
    .slice(0, 3);
  
  if (topPlayers.length === 0) {
    return (
      <div className="card p-4">
        <h3 className="section-title text-lg mb-4">ÖNE ÇIKAN OYUNCULAR</h3>
        <p className="text-gray-400 text-center py-4">Oyuncu verisi bulunamadı</p>
      </div>
    );
  }
  
  // Get merged stat columns for consistent header display
  const statColumns = getMergedStatColumns(topPlayers);
  
  return (
    <div className="card p-4">
      <h3 className="section-title text-lg mb-4">ÖNE ÇIKAN OYUNCULAR</h3>
      
      {/* Table Header */}
      <div className="hidden sm:flex items-center gap-2 px-3 pb-2 border-b border-gray-800 mb-2">
        <div className="flex-1" /> {/* Spacer for player info */}
        <div className="flex items-center justify-end gap-2">
          <span className="text-[10px] text-gray-500 uppercase w-10 text-right">Puan</span>
          <span className="text-[10px] text-gray-500 uppercase w-10 text-right">Dk</span>
          {statColumns.map(col => (
            <span key={col.key} className="text-[10px] text-gray-500 uppercase w-10 text-right">
              {col.label}
            </span>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        {topPlayers.map((player, index) => {
          const stats = player.statistics[0];
          const rating = parseFloat(stats.games.rating || '0');
          const isFBPlayer = player.teamId === FENERBAHCE_TEAM_ID;
          const minutes = stats.games.minutes || 0;
          
          return (
            <Link
              key={player.player.id}
              href={ROUTES.PLAYER_DETAIL(player.player.id)}
              className={cn(
                'flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all',
                'hover:bg-gray-800/50',
                index === 0 && 'bg-gradient-to-r from-fb-navy/30 to-transparent border border-fb-navy/30'
              )}
            >
              {/* Left side: Rank + Team Logo + Photo + Name */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                {/* Rank */}
                <span className={cn(
                  'w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0',
                  index === 0 ? 'bg-fb-yellow text-fb-navy' : 'bg-gray-700 text-gray-300'
                )}>
                  {index + 1}
                </span>
                
                {/* Team Logo */}
                <Image
                  src={player.teamLogo}
                  alt=""
                  width={20}
                  height={20}
                  className="object-contain flex-shrink-0 hidden sm:block"
                />
                
                {/* Player Photo */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                  <Image
                    src={player.player.photo}
                    alt={player.player.name}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                </div>
                
                {/* Player Name */}
                <p className={cn(
                  'font-medium truncate text-sm',
                  isFBPlayer ? 'text-fb-yellow' : 'text-white'
                )}>
                  {shortenName(player.player.name)}
                </p>
              </div>
              
              {/* Right side: Stats - Fixed width columns for alignment */}
              <div className="flex items-center justify-end gap-2 flex-shrink-0">
                {/* Rating */}
                <div className={cn(
                  'w-10 h-6 rounded flex items-center justify-center text-xs font-bold text-white',
                  getRatingColor(rating)
                )}>
                  {rating.toFixed(1)}
                </div>
                
                {/* Minutes */}
                <div className="w-10 text-right">
                  <span className="text-xs sm:text-sm text-gray-400 font-mono">
                    {minutes}'
                  </span>
                </div>
                
                {/* Dynamic Stat Columns */}
                {statColumns.map(col => {
                  const value = col.getValue(stats);
                  const formattedValue = col.format ? col.format(value) : String(value || '-');
                  const isGoalOrAssist = col.key === 'goals' || col.key === 'assists';
                  const hasValue = value !== null && value !== 0 && value !== '0';
                  
                  return (
                    <div key={col.key} className="w-10 text-right">
                      <span className={cn(
                        'text-xs sm:text-sm font-medium tabular-nums',
                        isGoalOrAssist && hasValue 
                          ? col.key === 'goals' 
                            ? 'text-green-400' 
                            : 'text-blue-400'
                          : hasValue 
                            ? 'text-gray-300' 
                            : 'text-gray-600'
                      )}>
                        {formattedValue}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
