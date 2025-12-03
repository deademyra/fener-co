'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { cn, formatDate, getPositionFull } from '@/lib/utils';
import { FENERBAHCE_TEAM_ID, CURRENT_SEASON, ROUTES, TRACKED_LEAGUE_IDS, TRANSLATIONS, FRIENDLIES_LEAGUE_IDS } from '@/lib/constants';
import { Player, PlayerSeasonStats, Fixture, SquadPlayer } from '@/types';
import { ChevronUp, ChevronDown } from 'lucide-react';
import SezonOzetiSection from '@/components/player/SezonOzetiSection';
import PlayerHeader from '@/components/player/PlayerHeader';

// =============================================
// TYPES
// =============================================

interface PlayerTransfer {
  date: string;
  type: string;
  teams: {
    in: { id: number; name: string; logo: string };
    out: { id: number; name: string; logo: string };
  };
}

interface PlayerTrophy {
  league: string;
  country: string;
  season: string | null;
  place: string;
}

interface PlayerSidelined {
  type: string;
  start: string;
  end: string;
}

interface PlayerData {
  player: Player;
  statistics: PlayerSeasonStats[];
}

interface PlayerMatchStats {
  fixture: Fixture;
  stats: {
    minutes: number;
    goals: number;
    assists: number;
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
    saves?: number;
    goalsConceded?: number;
  } | null;
}

interface PlayerMatchesResponse {
  matches: PlayerMatchStats[];
  hasMore: boolean;
  total: number;
}

type StatGroup = 'genel' | 'hucum' | 'defans' | 'disiplin' | 'kaleci';
type SortDirection = 'asc' | 'desc' | null;
type SortColumn = string | null;

// =============================================
// TAB CONFIG
// =============================================

const TABS = [
  { key: 'performans', label: 'Sezon Performansı', urlParam: 'performans' },
  { key: 'matches', label: 'Maçlar', urlParam: 'maclar' },
  { key: 'transfers', label: 'Transfer Geçmişi', urlParam: 'transferler' },
  { key: 'injuries', label: 'Sakatlıklar', urlParam: 'sakatliklar' },
  { key: 'trophies', label: 'Başarılar', urlParam: 'basarilar' },
] as const;

type TabKey = typeof TABS[number]['key'];

// Helper to get tab key from URL param
const getTabKeyFromUrl = (urlParam: string | null): TabKey => {
  if (!urlParam) return 'performans';
  const tab = TABS.find(t => t.urlParam === urlParam);
  return tab ? tab.key : 'performans';
};

// Helper to get URL param from tab key
const getUrlParamFromTab = (tabKey: TabKey): string => {
  const tab = TABS.find(t => t.key === tabKey);
  return tab ? tab.urlParam : 'performans';
};

// League order priority
const LEAGUE_ORDER: Record<number, number> = {
  203: 1,  // Süper Lig
  2: 2,    // Şampiyonlar Ligi
  3: 3,    // UEFA Avrupa Ligi
  848: 4,  // Conference League
  206: 5,  // Türkiye Kupası
  5: 6,    // Süper Kupa
};

// Country flag mapping
const COUNTRY_FLAGS: Record<string, string> = {
  'Turkey': 'tr',
  'Morocco': 'ma',
  'Portugal': 'pt',
  'Brazil': 'br',
  'Argentina': 'ar',
  'France': 'fr',
  'Germany': 'de',
  'Spain': 'es',
  'England': 'gb-eng',
  'Italy': 'it',
  'Netherlands': 'nl',
  'Belgium': 'be',
  'Croatia': 'hr',
  'Serbia': 'rs',
  'Bosnia and Herzegovina': 'ba',
  'Poland': 'pl',
  'Czech Republic': 'cz',
  'Slovakia': 'sk',
  'Slovenia': 'si',
  'Austria': 'at',
  'Switzerland': 'ch',
  'Denmark': 'dk',
  'Sweden': 'se',
  'Norway': 'no',
  'Finland': 'fi',
  'Greece': 'gr',
  'Ukraine': 'ua',
  'Russia': 'ru',
  'Japan': 'jp',
  'South Korea': 'kr',
  'USA': 'us',
  'Mexico': 'mx',
  'Colombia': 'co',
  'Uruguay': 'uy',
  'Chile': 'cl',
  'Nigeria': 'ng',
  'Ghana': 'gh',
  'Senegal': 'sn',
  'Cameroon': 'cm',
  'Egypt': 'eg',
  'Algeria': 'dz',
  'Tunisia': 'tn',
  'South Africa': 'za',
  'Australia': 'au',
  'Canada': 'ca',
  'Iran': 'ir',
  'Saudi Arabia': 'sa',
  'Türkiye': 'tr',
};

// =============================================
// HELPER FUNCTIONS
// =============================================

function getRatingClass(rating: number): string {
  if (rating >= 8.0) return 'rating-excellent';
  if (rating >= 7.0) return 'rating-good';
  if (rating >= 6.5) return 'rating-average';
  if (rating >= 6.0) return 'rating-poor';
  return 'rating-bad';
}

function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('tr-TR');
}

function getCountryFlagUrl(nationality: string): string {
  const code = COUNTRY_FLAGS[nationality] || 'xx';
  return `https://media.api-sports.io/flags/${code}.svg`;
}

function sortStats(stats: PlayerSeasonStats[], column: SortColumn, direction: SortDirection): PlayerSeasonStats[] {
  if (!column || !direction) return stats;
  
  return [...stats].sort((a, b) => {
    let aVal: number = 0;
    let bVal: number = 0;
    
    switch (column) {
      case 'rating':
        aVal = a.games.rating ? parseFloat(a.games.rating) : 0;
        bVal = b.games.rating ? parseFloat(b.games.rating) : 0;
        break;
      case 'appearences':
        aVal = a.games.appearences || 0;
        bVal = b.games.appearences || 0;
        break;
      case 'lineups':
        aVal = a.games.lineups || 0;
        bVal = b.games.lineups || 0;
        break;
      case 'minutes':
        aVal = a.games.minutes || 0;
        bVal = b.games.minutes || 0;
        break;
      case 'goals':
        aVal = a.goals.total || 0;
        bVal = b.goals.total || 0;
        break;
      case 'assists':
        aVal = a.goals.assists || 0;
        bVal = b.goals.assists || 0;
        break;
      case 'yellow':
        aVal = a.cards.yellow || 0;
        bVal = b.cards.yellow || 0;
        break;
      case 'red':
        aVal = a.cards.red || 0;
        bVal = b.cards.red || 0;
        break;
      default:
        return 0;
    }
    
    return direction === 'desc' ? bVal - aVal : aVal - bVal;
  });
}

// =============================================
// METRIC CARD COMPONENT
// =============================================

function MetricCard({ 
  value, 
  label, 
  subValue,
  barValue,
  barMax,
  barColor = 'bg-fb-yellow',
}: { 
  value: string | number;
  label: string;
  subValue?: string;
  barValue?: number;
  barMax?: number;
  barColor?: string;
}) {
  const percentage = barValue !== undefined && barMax !== undefined && barMax > 0
    ? calculatePercentage(barValue, barMax)
    : null;

  return (
    <div className="glass-card p-4 flex flex-col h-full">
      <div className="flex-1">
        <p className="text-3xl font-bold text-fb-yellow">{value}</p>
        <p className="text-sm text-gray-400 mt-1">{label}</p>
        {subValue && (
          <p className="text-xs text-gray-500 mt-1">{subValue}</p>
        )}
      </div>
      {percentage !== null && (
        <div className="mt-3">
          <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
            <div 
              className={cn('h-full rounded-full transition-all duration-500', barColor)}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{percentage}%</p>
        </div>
      )}
    </div>
  );
}

// =============================================
// SORTABLE HEADER COMPONENT
// =============================================

function SortableHeader({
  label,
  columnKey,
  sortColumn,
  sortDirection,
  onSort,
  className = ''
}: {
  label: string;
  columnKey: string;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: string) => void;
  className?: string;
}) {
  const isActive = sortColumn === columnKey;
  
  return (
    <th 
      className={cn(
        'py-3 px-2 font-medium text-gray-400 cursor-pointer hover:text-white transition-colors select-none whitespace-nowrap',
        className
      )}
      onClick={() => onSort(columnKey)}
    >
      <div className="flex items-center justify-center gap-1">
        <span>{label}</span>
        <div className="flex flex-col">
          <ChevronUp 
            className={cn(
              'w-3 h-3 -mb-1',
              isActive && sortDirection === 'asc' ? 'text-fb-yellow' : 'text-gray-600'
            )} 
          />
          <ChevronDown 
            className={cn(
              'w-3 h-3 -mt-1',
              isActive && sortDirection === 'desc' ? 'text-fb-yellow' : 'text-gray-600'
            )} 
          />
        </div>
      </div>
    </th>
  );
}

// =============================================
// STAT GROUP TOGGLE COMPONENT
// =============================================

function StatGroupToggle({
  activeGroup,
  onGroupChange,
  isGoalkeeper
}: {
  activeGroup: StatGroup;
  onGroupChange: (group: StatGroup) => void;
  isGoalkeeper: boolean;
}) {
  const groups: { key: StatGroup; label: string }[] = isGoalkeeper
    ? [
        { key: 'kaleci', label: 'Kaleci' },
        { key: 'genel', label: 'Genel' },
        { key: 'defans', label: 'Defans' },
        { key: 'disiplin', label: 'Disiplin' },
      ]
    : [
        { key: 'genel', label: 'Genel' },
        { key: 'hucum', label: 'Hücum' },
        { key: 'defans', label: 'Defans' },
        { key: 'disiplin', label: 'Disiplin' },
      ];

  return (
    <div className="flex flex-wrap gap-2">
      {groups.map(group => (
        <button
          key={group.key}
          onClick={() => onGroupChange(group.key)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-all border',
            activeGroup === group.key
              ? 'bg-fb-yellow text-slate-900 border-fb-yellow'
              : 'bg-slate-800/80 text-gray-400 border-slate-600/50 hover:bg-slate-700/80 hover:text-white'
          )}
        >
          {group.label}
        </button>
      ))}
    </div>
  );
}

// =============================================
// OVERVIEW TAB COMPONENT
// =============================================

function OverviewTab({ 
  player,
  playerId,
  stats,
  metricCardStats,
  otherClubStats,
  teamStats,
  isGoalkeeper,
  isCurrentSquadMember,
  selectedSeason,
  hasPlayedForFenerbahce
}: { 
  player: Player;
  playerId: number;
  stats: PlayerSeasonStats[];
  metricCardStats: PlayerSeasonStats[];
  otherClubStats: PlayerSeasonStats[];
  teamStats: { totalMatches: number; totalGoals: number; totalAssists: number; totalMinutes: number } | null;
  isGoalkeeper: boolean;
  isCurrentSquadMember: boolean;
  selectedSeason: number;
  hasPlayedForFenerbahce: boolean;
}) {
  const [statGroup, setStatGroup] = useState<StatGroup>(isGoalkeeper ? 'kaleci' : 'genel');
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  // Recent matches state
  const [recentMatches, setRecentMatches] = useState<PlayerMatchStats[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [hasMoreMatches, setHasMoreMatches] = useState(false);
  const [matchesOffset, setMatchesOffset] = useState(0);
  const [matchStatGroup, setMatchStatGroup] = useState<StatGroup>(isGoalkeeper ? 'kaleci' : 'genel');
  
  // Fetch recent matches
  useEffect(() => {
    async function fetchMatches() {
      setMatchesLoading(true);
      try {
        const response = await fetch(`/api/players/${playerId}/matches?season=${selectedSeason}&limit=5&offset=0`);
        if (response.ok) {
          const data: PlayerMatchesResponse = await response.json();
          setRecentMatches(data.matches);
          setHasMoreMatches(data.hasMore);
          setMatchesOffset(5);
        }
      } catch (err) {
        console.error('Failed to fetch matches:', err);
      }
      setMatchesLoading(false);
    }
    
    fetchMatches();
  }, [playerId, selectedSeason]);
  
  // Load more matches
  const loadMoreMatches = async () => {
    setMatchesLoading(true);
    try {
      const response = await fetch(`/api/players/${playerId}/matches?season=${selectedSeason}&limit=5&offset=${matchesOffset}`);
      if (response.ok) {
        const data: PlayerMatchesResponse = await response.json();
        setRecentMatches(prev => [...prev, ...data.matches]);
        setHasMoreMatches(data.hasMore);
        setMatchesOffset(prev => prev + 5);
      }
    } catch (err) {
      console.error('Failed to fetch more matches:', err);
    }
    setMatchesLoading(false);
  };

  // Sort stats by appearances (highest to lowest) by default, then by sort column if set
  const sortedStats = useMemo(() => {
    let result = [...stats].sort((a, b) => {
      // Sort by appearances, highest to lowest
      return (b.games.appearences || 0) - (a.games.appearences || 0);
    });
    
    if (sortColumn && sortDirection) {
      result = sortStats(result, sortColumn, sortDirection);
    }
    
    return result;
  }, [stats, sortColumn, sortDirection]);

  // Calculate totals for stats table (Fenerbahçe stats only)
  const totals = useMemo(() => {
    return stats.reduce((acc, st) => ({
      games: acc.games + (st.games.appearences || 0),
      lineups: acc.lineups + (st.games.lineups || 0),
      minutes: acc.minutes + (st.games.minutes || 0),
      goals: acc.goals + (st.goals.total || 0),
      assists: acc.assists + (st.goals.assists || 0),
      saves: acc.saves + (st.goals.saves || 0),
      goalsConceded: acc.goalsConceded + (st.goals.conceded || 0),
      yellowCards: acc.yellowCards + (st.cards.yellow || 0),
      yellowRedCards: acc.yellowRedCards + (st.cards.yellowred || 0),
      redCards: acc.redCards + (st.cards.red || 0),
      shotsTotal: acc.shotsTotal + (st.shots.total || 0),
      shotsOn: acc.shotsOn + (st.shots.on || 0),
      passesTotal: acc.passesTotal + (st.passes.total || 0),
      passesAccuracy: acc.passesAccuracy + (st.passes.accuracy || 0), // Number of accurate passes
      passesKey: acc.passesKey + (st.passes.key || 0),
      tacklesTotal: acc.tacklesTotal + (st.tackles.total || 0),
      tacklesBlocks: acc.tacklesBlocks + (st.tackles.blocks || 0),
      tacklesInterceptions: acc.tacklesInterceptions + (st.tackles.interceptions || 0),
      duelsTotal: acc.duelsTotal + (st.duels.total || 0),
      duelsWon: acc.duelsWon + (st.duels.won || 0),
      dribblesAttempts: acc.dribblesAttempts + (st.dribbles.attempts || 0),
      dribblesSuccess: acc.dribblesSuccess + (st.dribbles.success || 0),
      dribblesPast: acc.dribblesPast + (st.dribbles.past || 0),
      foulsDrawn: acc.foulsDrawn + (st.fouls.drawn || 0),
      foulsCommitted: acc.foulsCommitted + (st.fouls.committed || 0),
      penaltyWon: acc.penaltyWon + (st.penalty.won || 0),
      penaltyCommitted: acc.penaltyCommitted + (st.penalty.committed || 0),
      penaltySaved: acc.penaltySaved + (st.penalty.saved || 0),
      ratingSum: acc.ratingSum + (st.games.rating ? parseFloat(st.games.rating) * (st.games.appearences || 0) : 0),
      ratingCount: acc.ratingCount + (st.games.rating && st.games.appearences ? st.games.appearences : 0),
    }), {
      games: 0, lineups: 0, minutes: 0, goals: 0, assists: 0,
      saves: 0, goalsConceded: 0, yellowCards: 0, yellowRedCards: 0, redCards: 0,
      shotsTotal: 0, shotsOn: 0, passesTotal: 0, passesAccuracy: 0, passesKey: 0,
      tacklesTotal: 0, tacklesBlocks: 0, tacklesInterceptions: 0,
      duelsTotal: 0, duelsWon: 0, dribblesAttempts: 0, dribblesSuccess: 0, dribblesPast: 0,
      foulsDrawn: 0, foulsCommitted: 0, penaltyWon: 0, penaltyCommitted: 0, penaltySaved: 0,
      ratingSum: 0, ratingCount: 0
    });
  }, [stats]);
  
  // Calculate totals for metric cards (may include all teams for non-squad members)
  const metricTotals = useMemo(() => {
    return metricCardStats.reduce((acc, st) => ({
      games: acc.games + (st.games.appearences || 0),
      lineups: acc.lineups + (st.games.lineups || 0),
      minutes: acc.minutes + (st.games.minutes || 0),
      goals: acc.goals + (st.goals.total || 0),
      assists: acc.assists + (st.goals.assists || 0),
      saves: acc.saves + (st.goals.saves || 0),
      goalsConceded: acc.goalsConceded + (st.goals.conceded || 0),
      ratingSum: acc.ratingSum + (st.games.rating ? parseFloat(st.games.rating) * (st.games.appearences || 0) : 0),
      ratingCount: acc.ratingCount + (st.games.rating && st.games.appearences ? st.games.appearences : 0),
    }), {
      games: 0, lineups: 0, minutes: 0, goals: 0, assists: 0,
      saves: 0, goalsConceded: 0, ratingSum: 0, ratingCount: 0
    });
  }, [metricCardStats]);
  
  // Sort other club stats by appearances
  const sortedOtherClubStats = useMemo(() => {
    let result = [...otherClubStats].sort((a, b) => {
      return (b.games.appearences || 0) - (a.games.appearences || 0);
    });
    
    if (sortColumn && sortDirection) {
      result = sortStats(result, sortColumn, sortDirection);
    }
    
    return result;
  }, [otherClubStats, sortColumn, sortDirection]);
  
  // Calculate totals for other club stats
  const otherClubTotals = useMemo(() => {
    return otherClubStats.reduce((acc, st) => ({
      games: acc.games + (st.games.appearences || 0),
      lineups: acc.lineups + (st.games.lineups || 0),
      minutes: acc.minutes + (st.games.minutes || 0),
      goals: acc.goals + (st.goals.total || 0),
      assists: acc.assists + (st.goals.assists || 0),
      saves: acc.saves + (st.goals.saves || 0),
      goalsConceded: acc.goalsConceded + (st.goals.conceded || 0),
      yellowCards: acc.yellowCards + (st.cards.yellow || 0),
      yellowRedCards: acc.yellowRedCards + (st.cards.yellowred || 0),
      redCards: acc.redCards + (st.cards.red || 0),
      shotsTotal: acc.shotsTotal + (st.shots.total || 0),
      shotsOn: acc.shotsOn + (st.shots.on || 0),
      passesTotal: acc.passesTotal + (st.passes.total || 0),
      passesAccuracy: acc.passesAccuracy + (st.passes.accuracy || 0),
      passesKey: acc.passesKey + (st.passes.key || 0),
      tacklesTotal: acc.tacklesTotal + (st.tackles.total || 0),
      tacklesBlocks: acc.tacklesBlocks + (st.tackles.blocks || 0),
      tacklesInterceptions: acc.tacklesInterceptions + (st.tackles.interceptions || 0),
      duelsTotal: acc.duelsTotal + (st.duels.total || 0),
      duelsWon: acc.duelsWon + (st.duels.won || 0),
      dribblesAttempts: acc.dribblesAttempts + (st.dribbles.attempts || 0),
      dribblesSuccess: acc.dribblesSuccess + (st.dribbles.success || 0),
      dribblesPast: acc.dribblesPast + (st.dribbles.past || 0),
      foulsDrawn: acc.foulsDrawn + (st.fouls.drawn || 0),
      foulsCommitted: acc.foulsCommitted + (st.fouls.committed || 0),
      penaltyWon: acc.penaltyWon + (st.penalty.won || 0),
      penaltyCommitted: acc.penaltyCommitted + (st.penalty.committed || 0),
      penaltySaved: acc.penaltySaved + (st.penalty.saved || 0),
      ratingSum: acc.ratingSum + (st.games.rating ? parseFloat(st.games.rating) * (st.games.appearences || 0) : 0),
      ratingCount: acc.ratingCount + (st.games.rating && st.games.appearences ? st.games.appearences : 0),
    }), {
      games: 0, lineups: 0, minutes: 0, goals: 0, assists: 0,
      saves: 0, goalsConceded: 0, yellowCards: 0, yellowRedCards: 0, redCards: 0,
      shotsTotal: 0, shotsOn: 0, passesTotal: 0, passesAccuracy: 0, passesKey: 0,
      tacklesTotal: 0, tacklesBlocks: 0, tacklesInterceptions: 0,
      duelsTotal: 0, duelsWon: 0, dribblesAttempts: 0, dribblesSuccess: 0, dribblesPast: 0,
      foulsDrawn: 0, foulsCommitted: 0, penaltyWon: 0, penaltyCommitted: 0, penaltySaved: 0,
      ratingSum: 0, ratingCount: 0
    });
  }, [otherClubStats]);
  
  // Determine which tables to show
  const hasFenerbahceStats = stats.length > 0;
  const hasOtherClubStats = otherClubStats.length > 0;
  
  const avgRating = totals.ratingCount > 0 ? totals.ratingSum / totals.ratingCount : 0;
  const metricAvgRating = metricTotals.ratingCount > 0 ? metricTotals.ratingSum / metricTotals.ratingCount : 0;
  const minutesPerGoal = metricTotals.goals > 0 ? Math.round(metricTotals.minutes / metricTotals.goals) : 0;
  const minutesPerAssist = metricTotals.assists > 0 ? Math.round(metricTotals.minutes / metricTotals.assists) : 0;
  
  // Calculate minutes percentage based on team's total possible minutes (for metric cards)
  const teamTotalMinutes = (teamStats?.totalMatches || 0) * 90;
  const metricMinutesPercentage = teamTotalMinutes > 0 ? calculatePercentage(metricTotals.minutes, teamTotalMinutes) : 0;

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Calculate values for specific stats
  const calculatePassAccuracy = (st: PlayerSeasonStats) => {
    if (!st.passes.total || st.passes.total === 0 || !st.passes.accuracy) return 0;
    // API returns accuracy as number of accurate passes, not percentage
    return Math.round((st.passes.accuracy / st.passes.total) * 100);
  };

  const calculateShotAccuracy = (st: PlayerSeasonStats) => {
    if (!st.shots.total || st.shots.total === 0) return 0;
    return Math.round(((st.shots.on || 0) / st.shots.total) * 100);
  };

  const calculateDribbleAccuracy = (st: PlayerSeasonStats) => {
    if (!st.dribbles.attempts || st.dribbles.attempts === 0) return 0;
    return Math.round(((st.dribbles.success || 0) / st.dribbles.attempts) * 100);
  };

  const calculateDuelWinRate = (st: PlayerSeasonStats) => {
    if (!st.duels.total || st.duels.total === 0) return 0;
    return Math.round(((st.duels.won || 0) / st.duels.total) * 100);
  };

  // Render stat columns based on active group
  const renderStatColumns = (st: PlayerSeasonStats) => {
    switch (statGroup) {
      case 'genel':
        return (
          <>
            <td className="text-center py-3 px-2 text-fb-yellow font-medium whitespace-nowrap">{st.goals.total || 0}</td>
            <td className="text-center py-3 px-2 text-green-400 whitespace-nowrap">{st.goals.assists || 0}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{st.shots.on || 0}/{st.shots.total || 0}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{st.passes.total || 0}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{calculatePassAccuracy(st) > 0 ? `${calculatePassAccuracy(st)}%` : '-'}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{st.duels.won || 0}/{st.duels.total || 0}</td>
          </>
        );
      case 'hucum':
        return (
          <>
            <td className="text-center py-3 px-2 text-fb-yellow font-medium whitespace-nowrap">{st.goals.total || 0}</td>
            <td className="text-center py-3 px-2 text-green-400 whitespace-nowrap">{st.goals.assists || 0}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{st.shots.on || 0}/{st.shots.total || 0}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{calculateShotAccuracy(st)}%</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{st.passes.total || 0}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{calculatePassAccuracy(st) > 0 ? `${calculatePassAccuracy(st)}%` : '-'}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{st.passes.key || 0}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{st.dribbles.success || 0}/{st.dribbles.attempts || 0}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{calculateDribbleAccuracy(st)}%</td>
          </>
        );
      case 'defans':
        return (
          <>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{st.duels.won || 0}/{st.duels.total || 0}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{calculateDuelWinRate(st)}%</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{st.tackles.total || 0}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{st.tackles.blocks || 0}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{st.tackles.interceptions || 0}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{st.dribbles.past || 0}</td>
          </>
        );
      case 'disiplin':
        return (
          <>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{st.fouls.committed || 0}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{st.fouls.drawn || 0}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{st.penalty.won || 0}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{st.penalty.committed || 0}</td>
            <td className="text-center py-3 px-2 text-yellow-500 whitespace-nowrap">{st.cards.yellow || 0}</td>
            <td className="text-center py-3 px-2 text-orange-500 whitespace-nowrap">{st.cards.yellowred || 0}</td>
            <td className="text-center py-3 px-2 text-red-500 whitespace-nowrap">{st.cards.red || 0}</td>
          </>
        );
      case 'kaleci':
        return (
          <>
            <td className="text-center py-3 px-2 text-blue-400 whitespace-nowrap">{st.goals.saves || 0}</td>
            <td className="text-center py-3 px-2 text-red-400 whitespace-nowrap">{st.goals.conceded || 0}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{st.passes.total || 0}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{calculatePassAccuracy(st) > 0 ? `${calculatePassAccuracy(st)}%` : '-'}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{st.penalty.saved || 0}</td>
          </>
        );
      default:
        return null;
    }
  };

  // Render stat headers based on active group
  const renderStatHeaders = () => {
    switch (statGroup) {
      case 'genel':
        return (
          <>
            <SortableHeader label="Gol" columnKey="goals" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
            <SortableHeader label="Asist" columnKey="assists" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Şut</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Pas</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Pas %</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">İkili M.</th>
          </>
        );
      case 'hucum':
        return (
          <>
            <SortableHeader label="Gol" columnKey="goals" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
            <SortableHeader label="Asist" columnKey="assists" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Şut</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Şut %</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Pas</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Pas %</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Kilit Pas</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Dripling</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Drip. %</th>
          </>
        );
      case 'defans':
        return (
          <>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">İkili M.</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">İkili %</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Top Çalma</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Blok</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Pas Arası</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Adam Geç.</th>
          </>
        );
      case 'disiplin':
        return (
          <>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Faul</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Kazn. Faul</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Pen. Kaz.</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Pen. Yap.</th>
            <th className="text-center py-3 px-2 font-medium text-yellow-500 whitespace-nowrap">Sarı</th>
            <th className="text-center py-3 px-2 font-medium text-orange-500 whitespace-nowrap">2. Sarı</th>
            <th className="text-center py-3 px-2 font-medium text-red-500 whitespace-nowrap">Kırmızı</th>
          </>
        );
      case 'kaleci':
        return (
          <>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Kurtarış</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Yenilen</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Pas</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Pas %</th>
            <th className="text-center py-3 px-2 font-medium text-gray-400 whitespace-nowrap">Pen. Kurt.</th>
          </>
        );
      default:
        return null;
    }
  };

  // Render totals row based on active group
  const renderTotalsColumns = () => {
    const totalDuelWinRate = totals.duelsTotal > 0 ? Math.round((totals.duelsWon / totals.duelsTotal) * 100) : 0;
    const totalShotAccuracy = totals.shotsTotal > 0 ? Math.round((totals.shotsOn / totals.shotsTotal) * 100) : 0;
    const totalDribbleAccuracy = totals.dribblesAttempts > 0 ? Math.round((totals.dribblesSuccess / totals.dribblesAttempts) * 100) : 0;
    const totalPassAccuracy = totals.passesTotal > 0 ? Math.round((totals.passesAccuracy / totals.passesTotal) * 100) : 0;
    
    switch (statGroup) {
      case 'genel':
        return (
          <>
            <td className="text-center py-3 px-2 text-fb-yellow font-bold whitespace-nowrap">{totals.goals}</td>
            <td className="text-center py-3 px-2 text-green-400 font-bold whitespace-nowrap">{totals.assists}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totals.shotsOn}/{totals.shotsTotal}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totals.passesTotal}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totalPassAccuracy > 0 ? `${totalPassAccuracy}%` : '-'}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totals.duelsWon}/{totals.duelsTotal}</td>
          </>
        );
      case 'hucum':
        return (
          <>
            <td className="text-center py-3 px-2 text-fb-yellow font-bold whitespace-nowrap">{totals.goals}</td>
            <td className="text-center py-3 px-2 text-green-400 font-bold whitespace-nowrap">{totals.assists}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totals.shotsOn}/{totals.shotsTotal}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totalShotAccuracy}%</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totals.passesTotal}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totalPassAccuracy > 0 ? `${totalPassAccuracy}%` : '-'}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totals.passesKey}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totals.dribblesSuccess}/{totals.dribblesAttempts}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totalDribbleAccuracy}%</td>
          </>
        );
      case 'defans':
        return (
          <>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totals.duelsWon}/{totals.duelsTotal}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totalDuelWinRate}%</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totals.tacklesTotal}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totals.tacklesBlocks}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totals.tacklesInterceptions}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totals.dribblesPast}</td>
          </>
        );
      case 'disiplin':
        return (
          <>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totals.foulsCommitted}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totals.foulsDrawn}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totals.penaltyWon}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totals.penaltyCommitted}</td>
            <td className="text-center py-3 px-2 text-yellow-500 whitespace-nowrap">{totals.yellowCards}</td>
            <td className="text-center py-3 px-2 text-orange-500 whitespace-nowrap">{totals.yellowRedCards}</td>
            <td className="text-center py-3 px-2 text-red-500 whitespace-nowrap">{totals.redCards}</td>
          </>
        );
      case 'kaleci':
        return (
          <>
            <td className="text-center py-3 px-2 text-blue-400 whitespace-nowrap">{totals.saves}</td>
            <td className="text-center py-3 px-2 text-red-400 whitespace-nowrap">{totals.goalsConceded}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totals.passesTotal}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totalPassAccuracy > 0 ? `${totalPassAccuracy}%` : '-'}</td>
            <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{totals.penaltySaved}</td>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Sezon Özeti - Shows all club stats (no team filter) */}
      <SezonOzetiSection
        stats={metricCardStats}
        teamStats={teamStats}
        recentMatches={recentMatches}
        isGoalkeeper={isGoalkeeper}
      />
      
      {/* Section 2: Fenerbahçe Season Statistics Table - Only show if player has FB stats */}
      {hasFenerbahceStats && (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="section-title text-lg">SEZON İSTATİSTİKLERİ - FENERBAHÇE</h3>
          <StatGroupToggle 
            activeGroup={statGroup} 
            onGroupChange={setStatGroup} 
            isGoalkeeper={isGoalkeeper}
          />
        </div>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-max">
              <thead>
                <tr className="bg-white/5">
                  {/* League logo column */}
                  <th className="text-center py-3 px-2 font-medium text-gray-400 w-10 min-w-[40px]"></th>
                  <th className="text-left py-3 px-3 font-medium text-gray-400 min-w-[120px]">Turnuva</th>
                  <SortableHeader 
                    label="Puan" 
                    columnKey="rating" 
                    sortColumn={sortColumn} 
                    sortDirection={sortDirection} 
                    onSort={handleSort}
                    className="min-w-[60px]"
                  />
                  <SortableHeader 
                    label="Maç" 
                    columnKey="appearences" 
                    sortColumn={sortColumn} 
                    sortDirection={sortDirection} 
                    onSort={handleSort}
                    className="min-w-[50px]"
                  />
                  <SortableHeader 
                    label="İlk 11" 
                    columnKey="lineups" 
                    sortColumn={sortColumn} 
                    sortDirection={sortDirection} 
                    onSort={handleSort}
                    className="min-w-[55px]"
                  />
                  <SortableHeader 
                    label="Dk" 
                    columnKey="minutes" 
                    sortColumn={sortColumn} 
                    sortDirection={sortDirection} 
                    onSort={handleSort}
                    className="min-w-[55px]"
                  />
                  {/* Dynamic stat columns */}
                  {renderStatHeaders()}
                </tr>
              </thead>
              <tbody>
                {sortedStats.map((st, idx) => {
                  const rating = st.games.rating ? parseFloat(st.games.rating) : 0;
                  const leagueName = TRANSLATIONS.leagues[st.league.id as keyof typeof TRANSLATIONS.leagues] || st.league.name;
                  
                  return (
                    <tr key={idx} className="border-t border-white/5 hover:bg-white/5">
                      {/* League logo */}
                      <td className="text-center py-3 px-2">
                        <Image 
                          src={st.league.logo} 
                          alt="" 
                          width={20} 
                          height={20} 
                          className="object-contain mx-auto h-5"
                          style={{ filter: 'brightness(0) invert(1)' }}
                        />
                      </td>
                      <td className="py-3 px-3 text-white whitespace-nowrap text-sm">
                        {leagueName}
                      </td>
                      <td className="text-center py-3 px-2">
                        {rating > 0 ? (
                          <span className={cn('rating-badge', getRatingClass(rating))}>
                            {rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-2 text-white font-medium whitespace-nowrap">
                        {st.games.appearences || 0}
                      </td>
                      <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">
                        {st.games.lineups || 0}
                      </td>
                      <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">
                        {formatNumber(st.games.minutes || 0)}
                      </td>
                      {/* Dynamic stat columns */}
                      {renderStatColumns(st)}
                    </tr>
                  );
                })}
                {stats.length > 1 && (
                  <tr className="border-t border-white/10 bg-white/5 font-medium">
                    <td className="py-3 px-2"></td>
                    <td className="py-3 px-3 text-white whitespace-nowrap">Toplam</td>
                    <td className="text-center py-3 px-2">
                      {avgRating > 0 ? (
                        <span className={cn('rating-badge', getRatingClass(avgRating))}>
                          {avgRating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-2 text-white font-bold whitespace-nowrap">
                      {totals.games}
                    </td>
                    <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">
                      {totals.lineups}
                    </td>
                    <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">
                      {formatNumber(totals.minutes)}
                    </td>
                    {renderTotalsColumns()}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}
      
      {/* Section 3: Other Club Statistics (when applicable) */}
      {hasOtherClubStats && (
        <OtherTeamStatsSection 
          stats={otherClubStats}
          isGoalkeeper={isGoalkeeper}
        />
      )}
    </div>
  );
}

// =============================================
// OTHER TEAM STATS SECTION COMPONENT
// =============================================

function OtherTeamStatsSection({
  stats,
  isGoalkeeper
}: {
  stats: PlayerSeasonStats[];
  isGoalkeeper: boolean;
}) {
  // Group stats by LEAGUE (competition) and merge stats from different teams in the same league
  const statsByLeague = useMemo(() => {
    const grouped: Record<number, {
      league: PlayerSeasonStats['league'];
      teams: PlayerSeasonStats['team'][];
      mergedStats: {
        games: number;
        lineups: number;
        minutes: number;
        goals: number;
        assists: number;
        saves: number;
        goalsConceded: number;
        yellowCards: number;
        redCards: number;
        ratingSum: number;
        ratingCount: number;
      };
    }> = {};
    
    stats.forEach(st => {
      if (!grouped[st.league.id]) {
        grouped[st.league.id] = {
          league: st.league,
          teams: [],
          mergedStats: {
            games: 0, lineups: 0, minutes: 0, goals: 0, assists: 0,
            saves: 0, goalsConceded: 0, yellowCards: 0, redCards: 0,
            ratingSum: 0, ratingCount: 0
          }
        };
      }
      
      // Add team if not already in the list
      if (!grouped[st.league.id].teams.find(t => t.id === st.team.id)) {
        grouped[st.league.id].teams.push(st.team);
      }
      
      // Merge stats
      const m = grouped[st.league.id].mergedStats;
      m.games += st.games.appearences || 0;
      m.lineups += st.games.lineups || 0;
      m.minutes += st.games.minutes || 0;
      m.goals += st.goals.total || 0;
      m.assists += st.goals.assists || 0;
      m.saves += st.goals.saves || 0;
      m.goalsConceded += st.goals.conceded || 0;
      m.yellowCards += st.cards.yellow || 0;
      m.redCards += st.cards.red || 0;
      if (st.games.rating && st.games.appearences) {
        m.ratingSum += parseFloat(st.games.rating) * st.games.appearences;
        m.ratingCount += st.games.appearences;
      }
    });
    
    // Filter out leagues with 0 minutes and sort by appearances (highest to lowest)
    return Object.values(grouped)
      .filter(g => g.mergedStats.minutes > 0)
      .sort((a, b) => b.mergedStats.games - a.mergedStats.games);
  }, [stats]);
  
  // Calculate overall totals
  const overallTotals = useMemo(() => {
    return statsByLeague.reduce((acc, { mergedStats }) => ({
      games: acc.games + mergedStats.games,
      lineups: acc.lineups + mergedStats.lineups,
      minutes: acc.minutes + mergedStats.minutes,
      goals: acc.goals + mergedStats.goals,
      assists: acc.assists + mergedStats.assists,
      saves: acc.saves + mergedStats.saves,
      goalsConceded: acc.goalsConceded + mergedStats.goalsConceded,
      yellowCards: acc.yellowCards + mergedStats.yellowCards,
      redCards: acc.redCards + mergedStats.redCards,
      ratingSum: acc.ratingSum + mergedStats.ratingSum,
      ratingCount: acc.ratingCount + mergedStats.ratingCount,
    }), {
      games: 0, lineups: 0, minutes: 0, goals: 0, assists: 0,
      saves: 0, goalsConceded: 0, yellowCards: 0, redCards: 0,
      ratingSum: 0, ratingCount: 0
    });
  }, [statsByLeague]);
  
  const overallAvgRating = overallTotals.ratingCount > 0 ? overallTotals.ratingSum / overallTotals.ratingCount : 0;

  if (statsByLeague.length === 0) return null;

  return (
    <div>
      <h3 className="section-title text-lg mb-4">DİĞER TAKIM İSTATİSTİKLERİ</h3>
      <div className="glass-card overflow-hidden">
        {/* Stats Table - aligned with main Fenerbahçe stats table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-max">
            <thead>
              <tr className="bg-white/5">
                {/* Team logo column (same width as league logo in main table) */}
                <th className="text-center py-3 px-2 font-medium text-gray-400 w-10 min-w-[40px]"></th>
                <th className="text-left py-3 px-3 font-medium text-gray-400 min-w-[120px]">Turnuva</th>
                <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[60px]">Puan</th>
                <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[50px]">Maç</th>
                <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[55px]">İlk 11</th>
                <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[55px]">Dk</th>
                {isGoalkeeper ? (
                  <>
                    <th className="text-center py-3 px-2 font-medium text-gray-400">Kurtarış</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400">Yenilen</th>
                  </>
                ) : (
                  <>
                    <th className="text-center py-3 px-2 font-medium text-gray-400">Gol</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400">Asist</th>
                  </>
                )}
                <th className="text-center py-3 px-2 font-medium text-yellow-500">Sarı</th>
                <th className="text-center py-3 px-2 font-medium text-red-500">Kırmızı</th>
              </tr>
            </thead>
            <tbody>
              {statsByLeague.map(({ league, teams, mergedStats }) => {
                const avgRating = mergedStats.ratingCount > 0 ? mergedStats.ratingSum / mergedStats.ratingCount : 0;
                const leagueName = TRANSLATIONS.leagues[league.id as keyof typeof TRANSLATIONS.leagues] || league.name;
                
                return (
                  <tr key={league.id} className="border-t border-white/5 hover:bg-white/5">
                    {/* Team logo(s) instead of league logo */}
                    <td className="text-center py-3 px-2">
                      <div className="flex items-center justify-center gap-0.5">
                        {teams.map((team, idx) => (
                          <Image
                            key={team.id}
                            src={team.logo}
                            alt={team.name}
                            width={20}
                            height={20}
                            className="object-contain h-5"
                            title={team.name}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-white whitespace-nowrap text-sm">
                      {leagueName}
                    </td>
                    <td className="text-center py-3 px-2">
                      {avgRating > 0 ? (
                        <span className={cn('rating-badge', getRatingClass(avgRating))}>
                          {avgRating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-2 text-white font-medium whitespace-nowrap">
                      {mergedStats.games}
                    </td>
                    <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">
                      {mergedStats.lineups}
                    </td>
                    <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">
                      {formatNumber(mergedStats.minutes)}
                    </td>
                    {isGoalkeeper ? (
                      <>
                        <td className="text-center py-3 px-2 text-blue-400 whitespace-nowrap">
                          {mergedStats.saves}
                        </td>
                        <td className="text-center py-3 px-2 text-red-400 whitespace-nowrap">
                          {mergedStats.goalsConceded}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="text-center py-3 px-2 text-fb-yellow font-medium whitespace-nowrap">
                          {mergedStats.goals}
                        </td>
                        <td className="text-center py-3 px-2 text-green-400 whitespace-nowrap">
                          {mergedStats.assists}
                        </td>
                      </>
                    )}
                    <td className="text-center py-3 px-2 text-yellow-500 whitespace-nowrap">
                      {mergedStats.yellowCards}
                    </td>
                    <td className="text-center py-3 px-2 text-red-500 whitespace-nowrap">
                      {mergedStats.redCards}
                    </td>
                  </tr>
                );
              })}
              {statsByLeague.length > 1 && (
                <tr className="border-t border-white/10 bg-white/5 font-medium">
                  <td className="py-3 px-2"></td>
                  <td className="py-3 px-3 text-white whitespace-nowrap">Toplam</td>
                  <td className="text-center py-3 px-2">
                    {overallAvgRating > 0 ? (
                      <span className={cn('rating-badge', getRatingClass(overallAvgRating))}>
                        {overallAvgRating.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                  <td className="text-center py-3 px-2 text-white font-bold whitespace-nowrap">
                    {overallTotals.games}
                  </td>
                  <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">
                    {overallTotals.lineups}
                  </td>
                  <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">
                    {formatNumber(overallTotals.minutes)}
                  </td>
                  {isGoalkeeper ? (
                    <>
                      <td className="text-center py-3 px-2 text-blue-400 whitespace-nowrap">
                        {overallTotals.saves}
                      </td>
                      <td className="text-center py-3 px-2 text-red-400 whitespace-nowrap">
                        {overallTotals.goalsConceded}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="text-center py-3 px-2 text-fb-yellow font-bold whitespace-nowrap">
                        {overallTotals.goals}
                      </td>
                      <td className="text-center py-3 px-2 text-green-400 font-bold whitespace-nowrap">
                        {overallTotals.assists}
                      </td>
                    </>
                  )}
                  <td className="text-center py-3 px-2 text-yellow-500 whitespace-nowrap">
                    {overallTotals.yellowCards}
                  </td>
                  <td className="text-center py-3 px-2 text-red-500 whitespace-nowrap">
                    {overallTotals.redCards}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =============================================
// TRANSFERS TAB COMPONENT
// =============================================

interface TransferData {
  date: string;
  type: string;
  teams: {
    in: { id: number; name: string; logo: string };
    out: { id: number; name: string; logo: string };
  };
}

interface TransferResponse {
  player: { id: number; name: string };
  update: string;
  transfers: TransferData[];
}

function TransfersTab({ playerId }: { playerId: number }) {
  const [transfers, setTransfers] = useState<TransferData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransfers() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/players/${playerId}/transfers`);
        if (!response.ok) throw new Error('Transfer verileri yüklenemedi');
        const data: TransferResponse = await response.json();
        
        // Sort transfers by date (newest to oldest)
        const sortedTransfers = (data.transfers || []).sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        setTransfers(sortedTransfers);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }
    fetchTransfers();
  }, [playerId]);

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-12 w-12 bg-white/10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-red-400 mb-2">{error}</p>
        <p className="text-sm text-gray-500">Lütfen daha sonra tekrar deneyin.</p>
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-gray-400 mb-2">Transfer geçmişi bulunamadı</p>
        <p className="text-sm text-gray-500">Bu oyuncu için transfer kaydı bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="section-title text-lg">TRANSFER GEÇMİŞİ</h3>
      
      {/* Desktop View */}
      <div className="hidden md:block glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="text-left py-4 px-4 font-medium text-gray-400">Tarih</th>
              <th className="text-left py-4 px-4 font-medium text-gray-400">Çıkış Takımı</th>
              <th className="text-center py-4 px-4 font-medium text-gray-400">Transfer Türü</th>
              <th className="text-right py-4 px-4 font-medium text-gray-400">Giriş Takımı</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((transfer, index) => {
              const isFenerbahceIn = transfer.teams.in.id === FENERBAHCE_TEAM_ID;
              const isFenerbahceOut = transfer.teams.out.id === FENERBAHCE_TEAM_ID;
              const isFenerbahceTransfer = isFenerbahceIn || isFenerbahceOut;
              
              return (
                <tr 
                  key={index} 
                  className={cn(
                    'border-b border-white/5 transition-colors',
                    isFenerbahceTransfer 
                      ? 'bg-fb-navy/20 hover:bg-fb-navy/30' 
                      : 'hover:bg-white/5'
                  )}
                >
                  <td className="py-4 px-4 text-white whitespace-nowrap">
                    {formatDate(transfer.date, 'd MMMM yyyy')}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {transfer.teams.out.logo ? (
                        <Image
                          src={transfer.teams.out.logo}
                          alt={transfer.teams.out.name}
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs text-gray-400">
                          {transfer.teams.out.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <span className={cn(
                        'text-white',
                        isFenerbahceOut && 'text-fb-yellow font-medium'
                      )}>
                        {transfer.teams.out.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={cn(
                      'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
                      transfer.type === 'Free' && 'bg-green-500/20 text-green-400',
                      transfer.type === 'Loan' && 'bg-blue-500/20 text-blue-400',
                      transfer.type === 'N/A' && 'bg-gray-500/20 text-gray-400',
                      !['Free', 'Loan', 'N/A'].includes(transfer.type) && 'bg-fb-yellow/20 text-fb-yellow'
                    )}>
                      <span className="text-base">→</span>
                      {transfer.type === 'Free' ? 'Serbest' : 
                       transfer.type === 'Loan' ? 'Kiralık' :
                       transfer.type === 'N/A' ? 'Dönüş' :
                       transfer.type}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-3">
                      <span className={cn(
                        'text-white',
                        isFenerbahceIn && 'text-fb-yellow font-medium'
                      )}>
                        {transfer.teams.in.name}
                      </span>
                      {transfer.teams.in.logo ? (
                        <Image
                          src={transfer.teams.in.logo}
                          alt={transfer.teams.in.name}
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs text-gray-400">
                          {transfer.teams.in.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Mobile View - Card Layout */}
      <div className="md:hidden space-y-3">
        {transfers.map((transfer, index) => {
          const isFenerbahceIn = transfer.teams.in.id === FENERBAHCE_TEAM_ID;
          const isFenerbahceOut = transfer.teams.out.id === FENERBAHCE_TEAM_ID;
          const isFenerbahceTransfer = isFenerbahceIn || isFenerbahceOut;
          
          return (
            <div 
              key={index}
              className={cn(
                'glass-card p-4',
                isFenerbahceTransfer && 'border-fb-navy/50 bg-fb-navy/10'
              )}
            >
              {/* Date and Transfer Type */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-400">
                  {formatDate(transfer.date, 'd MMM yyyy')}
                </span>
                <span className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium',
                  transfer.type === 'Free' && 'bg-green-500/20 text-green-400',
                  transfer.type === 'Loan' && 'bg-blue-500/20 text-blue-400',
                  transfer.type === 'N/A' && 'bg-gray-500/20 text-gray-400',
                  !['Free', 'Loan', 'N/A'].includes(transfer.type) && 'bg-fb-yellow/20 text-fb-yellow'
                )}>
                  {transfer.type === 'Free' ? 'Serbest' : 
                   transfer.type === 'Loan' ? 'Kiralık' :
                   transfer.type === 'N/A' ? 'Dönüş' :
                   transfer.type}
                </span>
              </div>
              
              {/* Teams */}
              <div className="flex items-center justify-between gap-3">
                {/* From Team */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  {transfer.teams.out.logo ? (
                    <Image
                      src={transfer.teams.out.logo}
                      alt={transfer.teams.out.name}
                      width={28}
                      height={28}
                      className="object-contain flex-shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                      {transfer.teams.out.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <span className={cn(
                    'text-sm truncate',
                    isFenerbahceOut ? 'text-fb-yellow font-medium' : 'text-white'
                  )}>
                    {transfer.teams.out.name}
                  </span>
                </div>
                
                {/* Arrow */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-fb-yellow text-lg">→</span>
                </div>
                
                {/* To Team */}
                <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                  <span className={cn(
                    'text-sm truncate',
                    isFenerbahceIn ? 'text-fb-yellow font-medium' : 'text-white'
                  )}>
                    {transfer.teams.in.name}
                  </span>
                  {transfer.teams.in.logo ? (
                    <Image
                      src={transfer.teams.in.logo}
                      alt={transfer.teams.in.name}
                      width={28}
                      height={28}
                      className="object-contain flex-shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                      {transfer.teams.in.name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================
// INJURIES TAB COMPONENT
// =============================================

interface SidelinedData {
  type: string;
  start: string;
  end: string;
}

function InjuriesTab({ playerId, selectedSeason }: { playerId: number; selectedSeason: number }) {
  const [sidelinedData, setSidelinedData] = useState<SidelinedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSidelined() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/players/${playerId}/sidelined`);
        if (!response.ok) throw new Error('Sakatlık verileri yüklenemedi');
        const data: SidelinedData[] = await response.json();
        
        // Filter by selected season and sort by date (newest to oldest)
        const seasonStart = new Date(`${selectedSeason}-07-01`);
        const seasonEnd = new Date(`${selectedSeason + 1}-06-30`);
        
        const filteredData = data
          .filter(item => {
            const startDate = new Date(item.start);
            return startDate >= seasonStart && startDate <= seasonEnd;
          })
          .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
        
        setSidelinedData(filteredData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }
    fetchSidelined();
  }, [playerId, selectedSeason]);

  // Calculate duration in days
  const calculateDuration = (start: string, end: string): string => {
    if (!end || end === start) return 'Devam ediyor';
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '1 gün';
    if (diffDays < 7) return `${diffDays} gün`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} hafta`;
    return `${Math.ceil(diffDays / 30)} ay`;
  };

  // Get injury type icon and color
  const getInjuryStyle = (type: string): { icon: string; bgColor: string; textColor: string } => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('muscle') || lowerType.includes('hamstring') || lowerType.includes('groin')) {
      return { icon: '💪', bgColor: 'bg-orange-500/20', textColor: 'text-orange-400' };
    }
    if (lowerType.includes('knee') || lowerType.includes('ankle') || lowerType.includes('foot')) {
      return { icon: '🦵', bgColor: 'bg-amber-500/20', textColor: 'text-amber-400' };
    }
    if (lowerType.includes('back') || lowerType.includes('hip')) {
      return { icon: '🔙', bgColor: 'bg-purple-500/20', textColor: 'text-purple-400' };
    }
    if (lowerType.includes('suspension') || lowerType.includes('card')) {
      return { icon: '🟨', bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-400' };
    }
    if (lowerType.includes('illness') || lowerType.includes('covid')) {
      return { icon: '🤒', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400' };
    }
    return { icon: '🏥', bgColor: 'bg-slate-500/20', textColor: 'text-slate-400' };
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-10 bg-white/10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-2/3" />
                <div className="h-3 bg-white/10 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-red-400 mb-2">{error}</p>
        <p className="text-sm text-gray-500">Lütfen daha sonra tekrar deneyin.</p>
      </div>
    );
  }

  if (sidelinedData.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <p className="text-gray-400 mb-2">
          {selectedSeason}-{(selectedSeason + 1).toString().slice(-2)} sezonu için sakatlık kaydı yok
        </p>
        <p className="text-sm text-gray-500">Bu sezon boyunca sakatlık yaşanmamış.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-title text-lg">SAKATLIK GEÇMİŞİ</h3>
        <span className="text-sm text-gray-400">
          {selectedSeason}-{(selectedSeason + 1).toString().slice(-2)} Sezonu
        </span>
      </div>
      
      {/* Desktop View */}
      <div className="hidden md:block glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="text-left py-4 px-4 font-medium text-gray-400">Sakatlık Türü</th>
              <th className="text-center py-4 px-4 font-medium text-gray-400">Başlangıç</th>
              <th className="text-center py-4 px-4 font-medium text-gray-400">Bitiş</th>
              <th className="text-right py-4 px-4 font-medium text-gray-400">Süre</th>
            </tr>
          </thead>
          <tbody>
            {sidelinedData.map((item, index) => {
              const style = getInjuryStyle(item.type);
              const duration = calculateDuration(item.start, item.end);
              const isOngoing = !item.end || item.end === item.start;
              
              return (
                <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center text-lg',
                        style.bgColor
                      )}>
                        {style.icon}
                      </span>
                      <span className="text-white font-medium">{item.type}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-300">
                    {formatDate(item.start, 'd MMM yyyy')}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {isOngoing ? (
                      <span className="text-orange-400">Devam Ediyor</span>
                    ) : (
                      <span className="text-gray-300">{formatDate(item.end, 'd MMM yyyy')}</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium',
                      isOngoing ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-gray-300'
                    )}>
                      {duration}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Mobile View - Card Layout */}
      <div className="md:hidden space-y-3">
        {sidelinedData.map((item, index) => {
          const style = getInjuryStyle(item.type);
          const duration = calculateDuration(item.start, item.end);
          const isOngoing = !item.end || item.end === item.start;
          
          return (
            <div key={index} className="glass-card p-4">
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <span className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0',
                  style.bgColor
                )}>
                  {style.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{item.type}</p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {formatDate(item.start, 'd MMM yyyy')}
                  </p>
                </div>
                <span className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0',
                  isOngoing ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-gray-300'
                )}>
                  {duration}
                </span>
              </div>
              
              {/* Date Range */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="text-center flex-1">
                  <p className="text-xs text-gray-500 mb-1">Başlangıç</p>
                  <p className="text-sm text-gray-300">{formatDate(item.start, 'd MMM')}</p>
                </div>
                <div className="text-fb-yellow px-3">→</div>
                <div className="text-center flex-1">
                  <p className="text-xs text-gray-500 mb-1">Bitiş</p>
                  {isOngoing ? (
                    <p className="text-sm text-orange-400">Devam Ediyor</p>
                  ) : (
                    <p className="text-sm text-gray-300">{formatDate(item.end, 'd MMM')}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary Stats */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{sidelinedData.length}</p>
            <p className="text-sm text-gray-400">Toplam Sakatlık</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-fb-yellow">
              {sidelinedData.reduce((total, item) => {
                if (!item.end || item.end === item.start) return total;
                const startDate = new Date(item.start);
                const endDate = new Date(item.end);
                const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                return total + diffDays;
              }, 0)}
            </p>
            <p className="text-sm text-gray-400">Toplam Gün</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// TROPHIES TAB COMPONENT
// =============================================

interface TrophyData {
  league: string;
  country: string;
  season: string | null;
  place: string;
}

function TrophiesTab({ playerId }: { playerId: number }) {
  const [trophies, setTrophies] = useState<TrophyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrophies() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/players/${playerId}/trophies`);
        if (!response.ok) throw new Error('Başarı verileri yüklenemedi');
        const data: TrophyData[] = await response.json();
        
        // Filter out entries with null season and sort by season (newest to oldest)
        const filteredTrophies = data
          .filter(trophy => trophy.season !== null && trophy.season !== 'null')
          .sort((a, b) => {
            // Parse season to get year (e.g., "2024/2025" -> 2024, "2023" -> 2023)
            const getYear = (season: string | null): number => {
              if (!season) return 0;
              const yearMatch = season.match(/\d{4}/);
              return yearMatch ? parseInt(yearMatch[0], 10) : 0;
            };
            return getYear(b.season) - getYear(a.season);
          });
        
        setTrophies(filteredTrophies);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }
    fetchTrophies();
  }, [playerId]);

  // Get trophy style based on place
  const getTrophyStyle = (place: string): { icon: string; bgColor: string; textColor: string; borderColor: string } => {
    if (place === 'Winner') {
      return { 
        icon: '🏆', 
        bgColor: 'bg-gradient-to-br from-amber-500/30 to-yellow-600/20', 
        textColor: 'text-fb-yellow',
        borderColor: 'border-fb-yellow/30'
      };
    }
    if (place === '2nd Place') {
      return { 
        icon: '🥈', 
        bgColor: 'bg-gradient-to-br from-slate-400/20 to-gray-500/10', 
        textColor: 'text-gray-300',
        borderColor: 'border-gray-400/30'
      };
    }
    if (place === '3rd Place') {
      return { 
        icon: '🥉', 
        bgColor: 'bg-gradient-to-br from-amber-700/20 to-orange-800/10', 
        textColor: 'text-amber-600',
        borderColor: 'border-amber-600/30'
      };
    }
    return { 
      icon: '🏅', 
      bgColor: 'bg-white/5', 
      textColor: 'text-gray-400',
      borderColor: 'border-white/10'
    };
  };

  // Translate place to Turkish
  const translatePlace = (place: string): string => {
    switch (place) {
      case 'Winner': return 'Şampiyon';
      case '2nd Place': return 'İkincilik';
      case '3rd Place': return 'Üçüncülük';
      default: return place;
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-white/10 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-red-400 mb-2">{error}</p>
        <p className="text-sm text-gray-500">Lütfen daha sonra tekrar deneyin.</p>
      </div>
    );
  }

  if (trophies.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-4xl mb-3">🏆</div>
        <p className="text-gray-400 mb-2">Başarı kaydı bulunamadı</p>
        <p className="text-sm text-gray-500">Bu oyuncu için kupa/başarı kaydı bulunmuyor.</p>
      </div>
    );
  }

  // Count trophies
  const winnerCount = trophies.filter(t => t.place === 'Winner').length;
  const runnerUpCount = trophies.filter(t => t.place === '2nd Place').length;

  return (
    <div className="space-y-4">
      <h3 className="section-title text-lg">BAŞARILAR</h3>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <div className="text-3xl mb-2">🏆</div>
          <p className="text-2xl font-bold text-fb-yellow">{winnerCount}</p>
          <p className="text-xs text-gray-400 mt-1">Şampiyonluk</p>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl mb-2">🥈</div>
          <p className="text-2xl font-bold text-gray-300">{runnerUpCount}</p>
          <p className="text-xs text-gray-400 mt-1">İkincilik</p>
        </div>
        <div className="glass-card p-4 text-center col-span-2 sm:col-span-1">
          <div className="text-3xl mb-2">📊</div>
          <p className="text-2xl font-bold text-white">{trophies.length}</p>
          <p className="text-xs text-gray-400 mt-1">Toplam Başarı</p>
        </div>
      </div>
      
      {/* Trophies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {trophies.map((trophy, index) => {
          const style = getTrophyStyle(trophy.place);
          
          return (
            <div 
              key={index}
              className={cn(
                'glass-card p-4 border transition-all hover:scale-[1.02]',
                style.bgColor,
                style.borderColor
              )}
            >
              <div className="flex items-start gap-3">
                {/* Trophy Icon */}
                <div className="text-3xl flex-shrink-0">{style.icon}</div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className={cn('font-semibold truncate', style.textColor)}>
                    {trophy.league}
                  </h4>
                  <p className="text-sm text-gray-400 mt-0.5">{trophy.country}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                    <span className="text-xs text-gray-500">{trophy.season}</span>
                    <span className={cn('text-xs font-medium', style.textColor)}>
                      {translatePlace(trophy.place)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================
// MATCHES TAB COMPONENT
// =============================================

interface MatchesTabProps {
  playerId: number;
  selectedSeason: number;
  isCurrentSquadMember: boolean;
  isGoalkeeper: boolean;
  hasPlayedForFenerbahce: boolean;
  allSeasonStats: PlayerSeasonStats[];
}

function MatchesTab({ 
  playerId, 
  selectedSeason, 
  isCurrentSquadMember, 
  isGoalkeeper,
  hasPlayedForFenerbahce,
  allSeasonStats
}: MatchesTabProps) {
  const [matches, setMatches] = useState<PlayerMatchStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [matchStatGroup, setMatchStatGroup] = useState<StatGroup>(isGoalkeeper ? 'kaleci' : 'genel');
  
  // Determine the team ID to display
  const teamId = FENERBAHCE_TEAM_ID; // Currently only Fenerbahçe matches are available
  
  const teamInfo = useMemo(() => {
    return { name: 'Fenerbahçe', logo: 'https://media.api-sports.io/football/teams/611.png' };
  }, []);
  
  // Fetch matches
  useEffect(() => {
    async function fetchMatches() {
      setLoading(true);
      try {
        const response = await fetch(`/api/players/${playerId}/matches?season=${selectedSeason}&limit=10&offset=0`);
        if (response.ok) {
          const data: PlayerMatchesResponse = await response.json();
          setMatches(data.matches);
          setHasMore(data.hasMore);
          setOffset(10);
        }
      } catch (err) {
        console.error('Failed to fetch matches:', err);
      }
      setLoading(false);
    }
    
    fetchMatches();
  }, [playerId, selectedSeason]);
  
  // Load more matches
  const loadMoreMatches = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/players/${playerId}/matches?season=${selectedSeason}&limit=10&offset=${offset}`);
      if (response.ok) {
        const data: PlayerMatchesResponse = await response.json();
        setMatches(prev => [...prev, ...data.matches]);
        setHasMore(data.hasMore);
        setOffset(prev => prev + 10);
      }
    } catch (err) {
      console.error('Failed to fetch more matches:', err);
    }
    setLoading(false);
  };
  
  if (loading && matches.length === 0) {
    return (
      <div className="glass-card p-8">
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div>
          <span>Maçlar yükleniyor...</span>
        </div>
      </div>
    );
  }
  
  if (matches.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-gray-400 mb-2">Bu sezon için maç verisi bulunamadı.</p>
        <p className="text-sm text-gray-500">Farklı bir sezon seçmeyi deneyin.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h3 className="section-title text-lg">
          MAÇLAR ({teamInfo.name})
        </h3>
        <StatGroupToggle 
          activeGroup={matchStatGroup} 
          onGroupChange={setMatchStatGroup} 
          isGoalkeeper={isGoalkeeper}
        />
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-max">
            <thead>
              <tr className="bg-white/5">
                <th className="text-center py-3 px-2 font-medium text-gray-400 w-10 min-w-[40px]"></th>
                <th className="text-left py-3 px-3 font-medium text-gray-400 min-w-[80px]">Tarih</th>
                <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[40px]">İç/Dış</th>
                <th className="text-left py-3 px-3 font-medium text-gray-400 min-w-[180px]">Maç</th>
                <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[40px]">S</th>
                <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[60px]">Puan</th>
                <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[55px]">Dk</th>
                {matchStatGroup === 'genel' && (
                  <>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[45px]">Gol</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[45px]">Asist</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[50px]">Şut</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[65px]">Pas</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[50px]">Pas %</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[60px]">İkili M.</th>
                  </>
                )}
                {matchStatGroup === 'hucum' && (
                  <>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[45px]">Gol</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[45px]">Asist</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[50px]">Şut</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[50px]">Şut %</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[65px]">Pas</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[50px]">Pas %</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[60px]">Kilit Pas</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[60px]">Dribling</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[60px]">Drib. %</th>
                  </>
                )}
                {matchStatGroup === 'defans' && (
                  <>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[60px]">İkili M.</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[60px]">İkili %</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[50px]">Müd.</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[45px]">Blok</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[50px]">Kap.</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[50px]">Geç.</th>
                  </>
                )}
                {matchStatGroup === 'disiplin' && (
                  <>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[50px]">Faul</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[60px]">Faul K.</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[50px]">Pen. K.</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[50px]">Pen. Y.</th>
                    <th className="text-center py-3 px-2 font-medium text-yellow-500 min-w-[45px]">Sarı</th>
                    <th className="text-center py-3 px-2 font-medium text-orange-500 min-w-[50px]">2. Sarı</th>
                    <th className="text-center py-3 px-2 font-medium text-red-500 min-w-[50px]">Kırmızı</th>
                  </>
                )}
                {matchStatGroup === 'kaleci' && (
                  <>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[60px]">Kurtarış</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[70px]">Yenilen Gol</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[65px]">Pas</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[50px]">Pas %</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-400 min-w-[60px]">Pen. K.</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {matches.map((match, idx) => {
                const fixture = match.fixture;
                const s = match.stats;
                if (!s) return null;
                
                const isHome = fixture.teams.home.id === teamId;
                const opponent = isHome ? fixture.teams.away : fixture.teams.home;
                const playerTeamGoals = isHome ? fixture.goals.home : fixture.goals.away;
                const opponentGoals = isHome ? fixture.goals.away : fixture.goals.home;
                
                // Determine match result
                let result: 'G' | 'B' | 'M';
                if ((playerTeamGoals ?? 0) > (opponentGoals ?? 0)) result = 'G';
                else if ((playerTeamGoals ?? 0) < (opponentGoals ?? 0)) result = 'M';
                else result = 'B';
                
                const resultColors = {
                  G: 'bg-green-500/20 text-green-400 border border-green-500/30',
                  B: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
                  M: 'bg-red-500/20 text-red-400 border border-red-500/30',
                };
                
                const shotAcc = s.shotsTotal > 0 ? Math.round((s.shotsOn / s.shotsTotal) * 100) : 0;
                const duelWinRate = s.duelsTotal > 0 ? Math.round((s.duelsWon / s.duelsTotal) * 100) : 0;
                const dribbleAcc = s.dribblesAttempts > 0 ? Math.round((s.dribblesSuccess / s.dribblesAttempts) * 100) : 0;
                
                return (
                  <tr key={idx} className="border-t border-white/5 hover:bg-white/5">
                    <td className="text-center py-3 px-2">
                      <Image 
                        src={fixture.league.logo} 
                        alt="" 
                        width={20} 
                        height={20} 
                        className="object-contain mx-auto h-5"
                        style={{ filter: 'brightness(0) invert(1)' }}
                      />
                    </td>
                    <td className="py-3 px-3 text-gray-400 whitespace-nowrap text-sm">
                      {formatDate(fixture.fixture.date, 'short')}
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className={cn(
                        'text-xs font-medium px-1.5 py-0.5 rounded',
                        isHome ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                      )}>
                        {isHome ? 'İç' : 'Dış'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-white whitespace-nowrap text-sm">
                      <Link 
                        href={ROUTES.MATCH_DETAIL(fixture.fixture.id)}
                        className="inline-flex items-center gap-2 hover:text-fb-yellow transition-colors"
                      >
                        <span className="font-bold">{playerTeamGoals} - {opponentGoals}</span>
                        <span className="text-gray-400">vs</span>
                        <span className="flex items-center gap-1.5">
                          <Image 
                            src={opponent.logo} 
                            alt={opponent.name} 
                            width={18} 
                            height={18}
                            className="object-contain flex-shrink-0"
                          />
                          <span className="text-gray-300">{opponent.name}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className={cn(
                        'text-xs font-bold px-2 py-1 rounded',
                        resultColors[result]
                      )}>
                        {result}
                      </span>
                    </td>
                    <td className="text-center py-3 px-2">
                      {s.rating > 0 ? (
                        <span className={cn('rating-badge', getRatingClass(s.rating))}>
                          {s.rating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">
                      {s.minutes}
                    </td>
                    {matchStatGroup === 'genel' && (
                      <>
                        <td className="text-center py-3 px-2 text-fb-yellow font-bold whitespace-nowrap">{s.goals}</td>
                        <td className="text-center py-3 px-2 text-green-400 font-bold whitespace-nowrap">{s.assists}</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.shotsOn}/{s.shotsTotal}</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.passesTotal}</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.passAccuracy > 0 ? `${s.passAccuracy}%` : '-'}</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.duelsWon}/{s.duelsTotal}</td>
                      </>
                    )}
                    {matchStatGroup === 'hucum' && (
                      <>
                        <td className="text-center py-3 px-2 text-fb-yellow font-bold whitespace-nowrap">{s.goals}</td>
                        <td className="text-center py-3 px-2 text-green-400 font-bold whitespace-nowrap">{s.assists}</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.shotsOn}/{s.shotsTotal}</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{shotAcc}%</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.passesTotal}</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.passAccuracy > 0 ? `${s.passAccuracy}%` : '-'}</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.passesKey}</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.dribblesSuccess}/{s.dribblesAttempts}</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{dribbleAcc}%</td>
                      </>
                    )}
                    {matchStatGroup === 'defans' && (
                      <>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.duelsWon}/{s.duelsTotal}</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{duelWinRate}%</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.tacklesTotal}</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.tacklesBlocks}</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.tacklesInterceptions}</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.dribblesPast}</td>
                      </>
                    )}
                    {matchStatGroup === 'disiplin' && (
                      <>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.foulsCommitted}</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.foulsDrawn}</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.penaltyWon}</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.penaltyCommitted}</td>
                        <td className="text-center py-3 px-2 text-yellow-500 whitespace-nowrap">{s.yellowCards}</td>
                        <td className="text-center py-3 px-2 text-orange-500 whitespace-nowrap">{s.yellowRedCards}</td>
                        <td className="text-center py-3 px-2 text-red-500 whitespace-nowrap">{s.redCards}</td>
                      </>
                    )}
                    {matchStatGroup === 'kaleci' && (
                      <>
                        <td className="text-center py-3 px-2 text-blue-400 whitespace-nowrap">{s.saves || 0}</td>
                        <td className="text-center py-3 px-2 text-red-400 whitespace-nowrap">{s.goalsConceded || 0}</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.passesTotal}</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.passAccuracy > 0 ? `${s.passAccuracy}%` : '-'}</td>
                        <td className="text-center py-3 px-2 text-gray-400 whitespace-nowrap">{s.penaltySaved}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {hasMore && (
          <div className="border-t border-white/10 p-4">
            <button
              onClick={loadMoreMatches}
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div>
                  <span>Yükleniyor...</span>
                </>
              ) : (
                <span>Daha Fazla Maç Göster</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// MAIN PLAYER DETAIL PAGE
// =============================================

export default function PlayerDetailPage({ params }: { params: { id: string } }) {
  const playerId = parseInt(params.id);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get tab from URL or default to 'performans'
  const tabFromUrl = searchParams.get('tab');
  const activeTab = getTabKeyFromUrl(tabFromUrl);
  
  // Season dropdown state
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
  const seasonDropdownRef = useRef<HTMLDivElement>(null);
  
  const [selectedSeason, setSelectedSeason] = useState<number>(CURRENT_SEASON);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [teamStats, setTeamStats] = useState<{ totalMatches: number; totalGoals: number; totalAssists: number; totalMinutes: number } | null>(null);
  const [isCurrentSquadMember, setIsCurrentSquadMember] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const availableSeasons = useMemo(() => [2025, 2024, 2023, 2022, 2021, 2020], []);
  
  // Handle tab change with URL update
  const handleTabChange = (tabKey: TabKey) => {
    const urlParam = getUrlParamFromTab(tabKey);
    router.push(`/futbolcu/${playerId}?tab=${urlParam}`, { scroll: false });
  };
  
  // Close season dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (seasonDropdownRef.current && !seasonDropdownRef.current.contains(event.target as Node)) {
        setIsSeasonDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Format season display
  const formatSeasonDisplay = (season: number) => `${season}-${(season + 1).toString().slice(-2)}`;
  
  // Fetch player data and check squad membership
  useEffect(() => {
    async function fetchPlayerData() {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch player statistics and squad data in parallel
        const [statsResponse, squadResponse, teamStatsResponse] = await Promise.all([
          fetch(`/api/players/${playerId}/statistics?season=${selectedSeason}`),
          fetch(`/api/squad?team=${FENERBAHCE_TEAM_ID}`),
          fetch(`/api/team-stats?season=${selectedSeason}`)
        ]);
        
        if (!statsResponse.ok) throw new Error('Oyuncu bilgisi yüklenemedi');
        const statsData = await statsResponse.json();
        setPlayerData(statsData);
        
        // Check if player is in current squad
        if (squadResponse.ok) {
          const squadData = await squadResponse.json();
          const squadPlayerIds = squadData.players?.map((p: SquadPlayer) => p.id) || [];
          setIsCurrentSquadMember(squadPlayerIds.includes(playerId));
        }
        
        // Set team stats for comparison
        if (teamStatsResponse.ok) {
          const teamStatsData = await teamStatsResponse.json();
          setTeamStats(teamStatsData);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPlayerData();
  }, [playerId, selectedSeason]);
  
  // Filter stats to only Fenerbahce & tracked leagues (exclude friendlies and national team)
  // Also exclude rows with 0 minutes played
  const fenerbahceStats = useMemo(() => {
    if (!playerData?.statistics) return [];
    return playerData.statistics.filter(st =>
      st.team.id === FENERBAHCE_TEAM_ID &&
      TRACKED_LEAGUE_IDS.includes(st.league.id) &&
      (st.games.minutes || 0) > 0 // Exclude leagues with 0 minutes
    );
  }, [playerData]);
  
  // Check if player has any Fenerbahçe stats for the selected season
  const hasPlayedForFenerbahce = fenerbahceStats.length > 0;
  
  // Stats from other teams (not Fenerbahçe) - include national team matches, exclude club friendlies and 0 minutes
  const otherTeamStats = useMemo(() => {
    if (!playerData?.statistics) return [];
    return playerData.statistics.filter(st =>
      st.team.id !== FENERBAHCE_TEAM_ID &&
      st.league.id !== null &&
      !FRIENDLIES_LEAGUE_IDS.includes(st.league.id) && // Exclude club friendlies only
      (st.games.minutes || 0) > 0 // Exclude leagues with 0 minutes
    );
  }, [playerData]);
  
  // All season stats (for non-current squad members who played for FB)
  const allSeasonStats = useMemo(() => {
    if (!playerData?.statistics) return [];
    return playerData.statistics.filter(st =>
      !st.team.national && // Exclude national team
      st.league.id !== null &&
      !FRIENDLIES_LEAGUE_IDS.includes(st.league.id) &&
      st.league.id !== 10 && // Exclude International Friendlies
      st.league.id !== 6 && // Exclude Africa Cup of Nations
      (st.games.minutes || 0) > 0 // Exclude leagues with 0 minutes
    );
  }, [playerData]);
  
  // For Sezon İstatistikleri - Fenerbahçe table: Only FB stats
  const filteredStats = fenerbahceStats;
  
  // For Sezon İstatistikleri - Diğer Takımlar table: Non-FB club stats (exclude national team and friendlies)
  const otherClubStats = useMemo(() => {
    if (!playerData?.statistics) return [];
    return playerData.statistics.filter(st =>
      st.team.id !== FENERBAHCE_TEAM_ID &&
      !st.team.national && // Exclude national team
      st.league.id !== null &&
      !FRIENDLIES_LEAGUE_IDS.includes(st.league.id) &&
      st.league.id !== 10 && // Exclude International Friendlies
      st.league.id !== 6 && // Exclude Africa Cup of Nations
      (st.games.minutes || 0) > 0 // Exclude leagues with 0 minutes
    );
  }, [playerData]);
  
  // For Sezon Özeti (Metric Cards): ALL club stats without team filter (exclude national team and friendlies)
  const metricCardStats = allSeasonStats;
  
  // Check if player is goalkeeper based on all available stats
  const isGoalkeeper = useMemo(() => {
    return allSeasonStats.some(st => st.games.position === 'Goalkeeper');
  }, [allSeasonStats]);
  
  // Determine which team info to display in the header
  // If player played for Fenerbahçe this season, use FB info
  // Otherwise, use the first available club team from allSeasonStats
  const headerTeamInfo = useMemo(() => {
    if (hasPlayedForFenerbahce && fenerbahceStats.length > 0) {
      return {
        teamLogo: fenerbahceStats[0].team.logo,
        jerseyNumber: fenerbahceStats[0].games.number,
        stats: fenerbahceStats,
      };
    }
    
    // Find the first non-national-team stats for jersey number and team logo
    const clubStats = allSeasonStats.find(st => !st.team.national);
    if (clubStats) {
      return {
        teamLogo: clubStats.team.logo,
        jerseyNumber: clubStats.games.number,
        stats: allSeasonStats.length > 0 ? allSeasonStats : fenerbahceStats,
      };
    }
    
    // Fallback to whatever stats we have
    const fallbackStats = allSeasonStats.length > 0 ? allSeasonStats : fenerbahceStats;
    return {
      teamLogo: fallbackStats[0]?.team.logo || 'https://media.api-sports.io/football/teams/611.png',
      jerseyNumber: fallbackStats[0]?.games.number || null,
      stats: fallbackStats,
    };
  }, [hasPlayedForFenerbahce, fenerbahceStats, allSeasonStats]);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="skeleton h-64 rounded-lg mb-6" />
        <div className="skeleton h-12 w-96 rounded-lg mb-6" />
        <div className="skeleton h-96 rounded-lg" />
      </div>
    );
  }
  
  if (error || !playerData || !playerData.player) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="glass-card p-8 text-center">
          <p className="text-red-400 mb-4">{error || 'Oyuncu bulunamadı'}</p>
          <Link href={ROUTES.SQUAD} className="btn btn-secondary">
            Kadroya Dön
          </Link>
        </div>
      </div>
    );
  }
  
  const player = playerData.player;

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Hero Section with New Player Header */}
      <PlayerHeader 
        player={player} 
        stats={headerTeamInfo.stats}
        jerseyNumber={headerTeamInfo.jerseyNumber}
        teamLogo={headerTeamInfo.teamLogo}
      />
      
      {/* Tabs with Season Selector - use glass-card-tabs to allow dropdown z-index */}
      <div className="glass-card-tabs p-1.5 sm:p-2 overflow-visible relative z-50">
        <div className="flex items-center justify-between gap-2 overflow-visible">
          {/* Tab Buttons */}
          <div className="flex gap-1 overflow-x-auto min-w-0 flex-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  'px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0',
                  activeTab === tab.key
                    ? 'bg-fb-navy text-fb-yellow shadow-lg'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Season Selector - Turnuvalar Style */}
          <div className="relative flex-shrink-0 isolate" ref={seasonDropdownRef}>
            <button
              onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800/80 hover:bg-slate-700/80 
                         border border-slate-600/50 rounded-lg text-white transition-all
                         focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
            >
              <span className="text-slate-400 text-xs sm:text-sm hidden sm:inline">Sezon:</span>
              <span className="font-semibold text-xs sm:text-sm">{formatSeasonDisplay(selectedSeason)}</span>
              <ChevronDown 
                className={cn('w-4 h-4 text-slate-400 transition-transform', isSeasonDropdownOpen && 'rotate-180')} 
              />
            </button>

            {/* Dropdown Menu - must overlay content below */}
            {isSeasonDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-36 sm:w-48 bg-slate-800 border border-slate-600/50 
                           rounded-lg shadow-2xl overflow-visible animate-in fade-in slide-in-from-top-2 duration-200"
                style={{ zIndex: 9999 }}
              >
                <div className="max-h-80 overflow-y-auto">
                  {availableSeasons.map(season => (
                    <button
                      key={season}
                      onClick={() => {
                        setSelectedSeason(season);
                        setIsSeasonDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full px-4 py-2.5 text-left hover:bg-slate-700/50 transition-colors text-sm',
                        season === selectedSeason 
                          ? 'bg-yellow-500/10 text-yellow-400 font-semibold' 
                          : 'text-white'
                      )}
                    >
                      {formatSeasonDisplay(season)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Tab Content - lower z-index to allow dropdown to overlay */}
      <div className="animate-fade-in relative z-0">
        {activeTab === 'performans' && (
          <OverviewTab 
            player={player}
            playerId={playerId}
            stats={filteredStats}
            metricCardStats={metricCardStats}
            otherClubStats={otherClubStats}
            teamStats={teamStats}
            isGoalkeeper={isGoalkeeper}
            isCurrentSquadMember={isCurrentSquadMember}
            selectedSeason={selectedSeason}
            hasPlayedForFenerbahce={hasPlayedForFenerbahce}
          />
        )}
        {activeTab === 'matches' && (
          <MatchesTab 
            playerId={playerId}
            selectedSeason={selectedSeason}
            isCurrentSquadMember={isCurrentSquadMember}
            isGoalkeeper={isGoalkeeper}
            hasPlayedForFenerbahce={hasPlayedForFenerbahce}
            allSeasonStats={allSeasonStats}
          />
        )}
        {activeTab === 'transfers' && <TransfersTab playerId={playerId} />}
        {activeTab === 'injuries' && <InjuriesTab playerId={playerId} selectedSeason={selectedSeason} />}
        {activeTab === 'trophies' && <TrophiesTab playerId={playerId} />}
      </div>
      
      {/* No Stats Warning - Show only if both FB and other club stats are empty */}
      {filteredStats.length === 0 && otherClubStats.length === 0 && activeTab === 'performans' && (
        <div className="glass-card p-8 text-center">
          <p className="text-gray-400 mb-2">
            Bu sezon için istatistik bulunamadı.
          </p>
          <p className="text-sm text-gray-500">Farklı bir sezon seçmeyi deneyin.</p>
        </div>
      )}
    </div>
  );
}
