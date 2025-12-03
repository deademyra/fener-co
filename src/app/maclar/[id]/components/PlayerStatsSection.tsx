'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FixturePlayerStats, PlayerMatchStats, TeamScore, PlayerStatistics } from '@/types';
import { cn, shortenName } from '@/lib/utils';
import { FENERBAHCE_TEAM_ID, ROUTES } from '@/lib/constants';

interface PlayerStatsSectionProps {
  players: FixturePlayerStats[];
  homeTeam: TeamScore;
  awayTeam: TeamScore;
  isFenerbahceMatch: boolean;
}

interface PlayerWithTeam extends PlayerMatchStats {
  teamId: number;
  teamLogo: string;
  teamName: string;
}

// Rating rengini belirle
function getRatingColor(rating: number): string {
  if (rating >= 8.0) return 'bg-green-500';
  if (rating >= 7.0) return 'bg-green-600';
  if (rating >= 6.5) return 'bg-yellow-500';
  if (rating >= 6.0) return 'bg-orange-500';
  return 'bg-red-500';
}

// Yüzde hesaplama
function calculatePercentage(won: number | null, total: number | null): string {
  if (!won || !total || total === 0) return '-';
  return `${Math.round((won / total) * 100)}%`;
}

type TeamFilterType = 'all' | 'home' | 'away';
type StatCategoryType = 'genel' | 'hucum' | 'defans' | 'kaleci';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: string;
  direction: SortDirection;
}

// Kolon tanımları
interface ColumnDef {
  key: string;
  label: string;
  shortLabel: string;
  getValue: (stats: PlayerStatistics) => string | number | null;
  getSortValue: (stats: PlayerStatistics) => number; // Numeric value for sorting
  highlight?: 'goals' | 'assists' | 'yellow' | 'red' | 'saves';
}

// Helper function to parse percentage strings to numbers for sorting
function parsePercentage(value: string | number | null): number {
  if (value === null || value === '-') return -1;
  if (typeof value === 'number') return value;
  const match = value.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : -1;
}

// Sort arrow component
function SortArrow({ direction, isActive }: { direction: SortDirection; isActive: boolean }) {
  if (!isActive) {
    return (
      <span className="ml-0.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
        ↕
      </span>
    );
  }
  return (
    <span className="ml-0.5 text-fb-yellow">
      {direction === 'desc' ? '↓' : '↑'}
    </span>
  );
}

// Genel istatistik kolonları
const genelColumns: ColumnDef[] = [
  { 
    key: 'goals', 
    label: 'Gol', 
    shortLabel: 'G',
    getValue: (s) => s.goals?.total,
    getSortValue: (s) => s.goals?.total ?? -1,
    highlight: 'goals'
  },
  { 
    key: 'assists', 
    label: 'Asist', 
    shortLabel: 'A',
    getValue: (s) => s.goals?.assists,
    getSortValue: (s) => s.goals?.assists ?? -1,
    highlight: 'assists'
  },
  { 
    key: 'shots_on', 
    label: 'İsabetli Şut', 
    shortLabel: 'İŞ',
    getValue: (s) => s.shots?.on,
    getSortValue: (s) => s.shots?.on ?? -1
  },
  { 
    key: 'passes_total', 
    label: 'Toplam Pas', 
    shortLabel: 'TP',
    getValue: (s) => s.passes?.total,
    getSortValue: (s) => s.passes?.total ?? -1
  },
  { 
    key: 'passes_accuracy', 
    label: 'Pas %', 
    shortLabel: 'P%',
    // API returns accuracy as number of accurate passes, calculate percentage
    getValue: (s) => calculatePercentage(s.passes?.accuracy ? parseInt(s.passes.accuracy, 10) : null, s.passes?.total),
    getSortValue: (s) => (s.passes?.accuracy && s.passes?.total && s.passes.total > 0) 
      ? Math.round((parseInt(s.passes.accuracy, 10) / s.passes.total) * 100) : -1
  },
  { 
    key: 'duels_pct', 
    label: 'İkili Müc. %', 
    shortLabel: 'İM%',
    getValue: (s) => calculatePercentage(s.duels?.won, s.duels?.total),
    getSortValue: (s) => (s.duels?.won && s.duels?.total && s.duels.total > 0) 
      ? Math.round((s.duels.won / s.duels.total) * 100) : -1
  },
  { 
    key: 'fouls_committed', 
    label: 'Yaptığı Faul', 
    shortLabel: 'FY',
    getValue: (s) => s.fouls?.committed,
    getSortValue: (s) => s.fouls?.committed ?? -1
  },
  { 
    key: 'fouls_drawn', 
    label: 'Yapılan Faul', 
    shortLabel: 'FK',
    getValue: (s) => s.fouls?.drawn,
    getSortValue: (s) => s.fouls?.drawn ?? -1
  },
  { 
    key: 'yellow', 
    label: 'Sarı Kart', 
    shortLabel: '🟨',
    getValue: (s) => s.cards?.yellow > 0 ? s.cards.yellow : null,
    getSortValue: (s) => s.cards?.yellow ?? -1,
    highlight: 'yellow'
  },
  { 
    key: 'red', 
    label: 'Kırmızı Kart', 
    shortLabel: '🟥',
    getValue: (s) => s.cards?.red > 0 ? s.cards.red : null,
    getSortValue: (s) => s.cards?.red ?? -1,
    highlight: 'red'
  },
];

// Hücum istatistik kolonları
const hucumColumns: ColumnDef[] = [
  { 
    key: 'goals', 
    label: 'Gol', 
    shortLabel: 'G',
    getValue: (s) => s.goals?.total,
    getSortValue: (s) => s.goals?.total ?? -1,
    highlight: 'goals'
  },
  { 
    key: 'assists', 
    label: 'Asist', 
    shortLabel: 'A',
    getValue: (s) => s.goals?.assists,
    getSortValue: (s) => s.goals?.assists ?? -1,
    highlight: 'assists'
  },
  { 
    key: 'shots_total', 
    label: 'Şut (Top)', 
    shortLabel: 'TŞ',
    getValue: (s) => s.shots?.total,
    getSortValue: (s) => s.shots?.total ?? -1
  },
  { 
    key: 'shots_on', 
    label: 'Şut (İsabet)', 
    shortLabel: 'İŞ',
    getValue: (s) => s.shots?.on,
    getSortValue: (s) => s.shots?.on ?? -1
  },
  { 
    key: 'shots_pct', 
    label: 'Şut %', 
    shortLabel: 'Ş%',
    getValue: (s) => calculatePercentage(s.shots?.on, s.shots?.total),
    getSortValue: (s) => (s.shots?.on && s.shots?.total && s.shots.total > 0)
      ? Math.round((s.shots.on / s.shots.total) * 100) : -1
  },
  { 
    key: 'key_passes', 
    label: 'Kilit Pas', 
    shortLabel: 'KP',
    getValue: (s) => s.passes?.key,
    getSortValue: (s) => s.passes?.key ?? -1
  },
  { 
    key: 'dribbles_pct', 
    label: 'Dripling %', 
    shortLabel: 'D%',
    getValue: (s) => calculatePercentage(s.dribbles?.success, s.dribbles?.attempts),
    getSortValue: (s) => (s.dribbles?.success && s.dribbles?.attempts && s.dribbles.attempts > 0)
      ? Math.round((s.dribbles.success / s.dribbles.attempts) * 100) : -1
  },
  { 
    key: 'penalty_won', 
    label: 'Penaltı Kaz.', 
    shortLabel: 'PK',
    getValue: (s) => s.penalty?.won,
    getSortValue: (s) => s.penalty?.won ?? -1
  },
  { 
    key: 'offsides', 
    label: 'Ofsayt', 
    shortLabel: 'Of',
    getValue: (s) => s.offsides,
    getSortValue: (s) => s.offsides ?? -1
  },
];

// Defans istatistik kolonları
const defansColumns: ColumnDef[] = [
  { 
    key: 'tackles_total', 
    label: 'Top Çalma', 
    shortLabel: 'TÇ',
    getValue: (s) => s.tackles?.total,
    getSortValue: (s) => s.tackles?.total ?? -1
  },
  { 
    key: 'interceptions', 
    label: 'Pas Arası', 
    shortLabel: 'PA',
    getValue: (s) => s.tackles?.interceptions,
    getSortValue: (s) => s.tackles?.interceptions ?? -1
  },
  { 
    key: 'blocks', 
    label: 'Blok', 
    shortLabel: 'Bl',
    getValue: (s) => s.tackles?.blocks,
    getSortValue: (s) => s.tackles?.blocks ?? -1
  },
  { 
    key: 'duels_total', 
    label: 'Top. İkili Müc.', 
    shortLabel: 'Tİ',
    getValue: (s) => s.duels?.total,
    getSortValue: (s) => s.duels?.total ?? -1
  },
  { 
    key: 'duels_won', 
    label: 'Kaz. İkili Müc.', 
    shortLabel: 'Kİ',
    getValue: (s) => s.duels?.won,
    getSortValue: (s) => s.duels?.won ?? -1
  },
  { 
    key: 'duels_pct', 
    label: 'İkili Müc. %', 
    shortLabel: 'İM%',
    getValue: (s) => calculatePercentage(s.duels?.won, s.duels?.total),
    getSortValue: (s) => (s.duels?.won && s.duels?.total && s.duels.total > 0)
      ? Math.round((s.duels.won / s.duels.total) * 100) : -1
  },
  { 
    key: 'dribbles_past', 
    label: 'Dripling Geçilme', 
    shortLabel: 'DG',
    getValue: (s) => s.dribbles?.past,
    getSortValue: (s) => s.dribbles?.past ?? -1
  },
  { 
    key: 'yellow', 
    label: 'Sarı Kart', 
    shortLabel: '🟨',
    getValue: (s) => s.cards?.yellow > 0 ? s.cards.yellow : null,
    getSortValue: (s) => s.cards?.yellow ?? -1,
    highlight: 'yellow'
  },
  { 
    key: 'red', 
    label: 'Kırmızı Kart', 
    shortLabel: '🟥',
    getValue: (s) => s.cards?.red > 0 ? s.cards.red : null,
    getSortValue: (s) => s.cards?.red ?? -1,
    highlight: 'red'
  },
  { 
    key: 'penalty_committed', 
    label: 'Penaltı Yapt.', 
    shortLabel: 'PY',
    getValue: (s) => s.penalty?.committed,
    getSortValue: (s) => s.penalty?.committed ?? -1
  },
];

// Kaleci istatistik kolonları
const kaleciColumns: ColumnDef[] = [
  { 
    key: 'saves', 
    label: 'Kurtarış', 
    shortLabel: 'Ku',
    getValue: (s) => s.goals?.saves,
    getSortValue: (s) => s.goals?.saves ?? -1,
    highlight: 'saves'
  },
  { 
    key: 'goals_conceded', 
    label: 'Yenilen Gol', 
    shortLabel: 'YG',
    getValue: (s) => s.goals?.conceded,
    getSortValue: (s) => s.goals?.conceded ?? -1
  },
  { 
    key: 'penalty_saved', 
    label: 'Penaltı Kur.', 
    shortLabel: 'PK',
    getValue: (s) => s.penalty?.saved,
    getSortValue: (s) => s.penalty?.saved ?? -1,
    highlight: 'saves'
  },
  { 
    key: 'passes_accuracy', 
    label: 'Pas %', 
    shortLabel: 'P%',
    // API returns accuracy as number of accurate passes, calculate percentage
    getValue: (s) => calculatePercentage(s.passes?.accuracy ? parseInt(s.passes.accuracy, 10) : null, s.passes?.total),
    getSortValue: (s) => (s.passes?.accuracy && s.passes?.total && s.passes.total > 0) 
      ? Math.round((parseInt(s.passes.accuracy, 10) / s.passes.total) * 100) : -1
  },
];

const categoryColumns: Record<StatCategoryType, ColumnDef[]> = {
  genel: genelColumns,
  hucum: hucumColumns,
  defans: defansColumns,
  kaleci: kaleciColumns,
};

const categoryLabels: Record<StatCategoryType, string> = {
  genel: 'Genel',
  hucum: 'Hücum',
  defans: 'Defans',
  kaleci: 'Kaleci',
};

// Legend açıklamaları
const categoryLegends: Record<StatCategoryType, { short: string; long: string }[]> = {
  genel: [
    { short: 'G', long: 'Gol' },
    { short: 'A', long: 'Asist' },
    { short: 'İŞ', long: 'İsabetli Şut' },
    { short: 'TP', long: 'Toplam Pas' },
    { short: 'P%', long: 'Pas Yüzdesi' },
    { short: 'İM%', long: 'İkili Mücadele %' },
    { short: 'FY', long: 'Yaptığı Faul' },
    { short: 'FK', long: 'Kazandığı Faul' },
  ],
  hucum: [
    { short: 'G', long: 'Gol' },
    { short: 'A', long: 'Asist' },
    { short: 'TŞ', long: 'Toplam Şut' },
    { short: 'İŞ', long: 'İsabetli Şut' },
    { short: 'Ş%', long: 'Şut Yüzdesi' },
    { short: 'KP', long: 'Kilit Pas' },
    { short: 'D%', long: 'Dripling %' },
    { short: 'PK', long: 'Penaltı Kazanma' },
    { short: 'Of', long: 'Ofsayt' },
  ],
  defans: [
    { short: 'TÇ', long: 'Top Çalma' },
    { short: 'PA', long: 'Pas Arası' },
    { short: 'Bl', long: 'Blok' },
    { short: 'Tİ', long: 'Toplam İkili' },
    { short: 'Kİ', long: 'Kazanılan İkili' },
    { short: 'İM%', long: 'İkili Müc. %' },
    { short: 'DG', long: 'Dripling Geçilme' },
    { short: 'PY', long: 'Penaltı Yaptırma' },
  ],
  kaleci: [
    { short: 'Ku', long: 'Kurtarış' },
    { short: 'YG', long: 'Yenilen Gol' },
    { short: 'PK', long: 'Penaltı Kurtarma' },
    { short: 'P%', long: 'Pas Yüzdesi' },
  ],
};

export function PlayerStatsSection({ 
  players, 
  homeTeam, 
  awayTeam,
  isFenerbahceMatch 
}: PlayerStatsSectionProps) {
  // Default filter: FB maçı ise FB takımı, değilse home
  const getDefaultTeamFilter = (): TeamFilterType => {
    if (isFenerbahceMatch) {
      if (homeTeam.id === FENERBAHCE_TEAM_ID) return 'home';
      if (awayTeam.id === FENERBAHCE_TEAM_ID) return 'away';
    }
    return 'home';
  };
  
  const [teamFilter, setTeamFilter] = useState<TeamFilterType>(getDefaultTeamFilter());
  const [statCategory, setStatCategory] = useState<StatCategoryType>('genel');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'rating', direction: 'desc' });
  
  // Handle column sort click
  const handleSort = (columnKey: string) => {
    setSortConfig(prev => {
      if (prev.key === columnKey) {
        // Toggle direction if same column
        return { key: columnKey, direction: prev.direction === 'desc' ? 'asc' : 'desc' };
      }
      // New column, start with desc
      return { key: columnKey, direction: 'desc' };
    });
  };
  
  // Reset sort to rating when category changes
  const handleCategoryChange = (category: StatCategoryType) => {
    setStatCategory(category);
    setSortConfig({ key: 'rating', direction: 'desc' });
  };
  
  // Tüm oyuncuları düzleştir ve takım bilgilerini ekle
  const allPlayers = useMemo(() => {
    const result: PlayerWithTeam[] = [];
    
    players.forEach(teamPlayers => {
      teamPlayers.players.forEach(player => {
        // Sadece minutes > 0 olanları al
        if (player.statistics[0]?.games?.minutes && player.statistics[0].games.minutes > 0) {
          result.push({
            ...player,
            teamId: teamPlayers.team.id,
            teamLogo: teamPlayers.team.logo,
            teamName: teamPlayers.team.name
          });
        }
      });
    });
    
    return result;
  }, [players]);
  
  // Filtreleme ve sıralama
  const filteredPlayers = useMemo(() => {
    let result = allPlayers;
    
    if (teamFilter === 'home') {
      result = allPlayers.filter(p => p.teamId === homeTeam.id);
    } else if (teamFilter === 'away') {
      result = allPlayers.filter(p => p.teamId === awayTeam.id);
    }
    
    // Kaleci modunda sadece GK pozisyonundakileri göster
    if (statCategory === 'kaleci') {
      result = result.filter(p => p.statistics[0]?.games?.position === 'G');
    }
    
    // Dynamic sorting based on sortConfig
    const currentCols = categoryColumns[statCategory];
    
    result.sort((a, b) => {
      const statsA = a.statistics[0];
      const statsB = b.statistics[0];
      
      let valueA: number;
      let valueB: number;
      
      if (sortConfig.key === 'rating') {
        valueA = parseFloat(statsA?.games?.rating || '0');
        valueB = parseFloat(statsB?.games?.rating || '0');
      } else if (sortConfig.key === 'minutes') {
        valueA = statsA?.games?.minutes ?? -1;
        valueB = statsB?.games?.minutes ?? -1;
      } else {
        // Find the column definition for this key
        const col = currentCols.find(c => c.key === sortConfig.key);
        if (col) {
          valueA = col.getSortValue(statsA);
          valueB = col.getSortValue(statsB);
        } else {
          // Fallback to rating
          valueA = parseFloat(statsA?.games?.rating || '0');
          valueB = parseFloat(statsB?.games?.rating || '0');
        }
      }
      
      // Handle -1 values (null/undefined) - push them to the end
      if (valueA === -1 && valueB === -1) return 0;
      if (valueA === -1) return 1;
      if (valueB === -1) return -1;
      
      // Apply sort direction
      const multiplier = sortConfig.direction === 'desc' ? -1 : 1;
      return (valueA - valueB) * multiplier;
    });
    
    return result;
  }, [allPlayers, teamFilter, statCategory, homeTeam.id, awayTeam.id, sortConfig]);
  
  const currentColumns = categoryColumns[statCategory];
  const currentLegends = categoryLegends[statCategory];
  
  return (
    <div className="card overflow-hidden">
      {/* Header with Filters */}
      <div className="p-4 border-b border-white/10">
        <div className="flex flex-col gap-4">
          <h3 className="section-title text-lg">FUTBOLCU İSTATİSTİKLERİ</h3>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Team Filter */}
            <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setTeamFilter('all')}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
                  teamFilter === 'all' 
                    ? 'bg-fb-navy text-fb-yellow' 
                    : 'text-gray-400 hover:text-white'
                )}
              >
                Tümü
              </button>
              <button
                onClick={() => setTeamFilter('home')}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5',
                  teamFilter === 'home' 
                    ? 'bg-fb-navy text-fb-yellow' 
                    : 'text-gray-400 hover:text-white'
                )}
              >
                <Image src={homeTeam.logo} alt="" width={16} height={16} className="object-contain" />
                <span className="hidden sm:inline">{shortenName(homeTeam.name)}</span>
              </button>
              <button
                onClick={() => setTeamFilter('away')}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5',
                  teamFilter === 'away' 
                    ? 'bg-fb-navy text-fb-yellow' 
                    : 'text-gray-400 hover:text-white'
                )}
              >
                <Image src={awayTeam.logo} alt="" width={16} height={16} className="object-contain" />
                <span className="hidden sm:inline">{shortenName(awayTeam.name)}</span>
              </button>
            </div>
            
            {/* Stat Category Filter */}
            <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
              {(Object.keys(categoryLabels) as StatCategoryType[]).map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-md transition-colors',
                    statCategory === category 
                      ? 'bg-fb-navy text-fb-yellow' 
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  {categoryLabels[category]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Table with horizontal scroll */}
      <div className="relative">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/10">
              <tr className="text-gray-400 text-xs">
                {/* Sticky Columns */}
                <th className="px-2 py-3 text-left sticky left-0 bg-slate-800 z-20 min-w-[200px] md:min-w-[240px]">
                  Oyuncu
                </th>
                <th 
                  className="px-2 py-3 text-center sticky left-[200px] md:left-[240px] bg-slate-800 z-20 min-w-[50px] cursor-pointer hover:text-white transition-colors group"
                  onClick={() => handleSort('rating')}
                  title="Puan'a göre sırala"
                >
                  <span className="inline-flex items-center justify-center">
                    Puan
                    <SortArrow direction={sortConfig.direction} isActive={sortConfig.key === 'rating'} />
                  </span>
                </th>
                <th 
                  className="px-2 py-3 text-center sticky left-[250px] md:left-[290px] bg-slate-800 z-20 min-w-[45px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] cursor-pointer hover:text-white transition-colors group"
                  onClick={() => handleSort('minutes')}
                  title="Dakika'ya göre sırala"
                >
                  <span className="inline-flex items-center justify-center">
                    Dk
                    <SortArrow direction={sortConfig.direction} isActive={sortConfig.key === 'minutes'} />
                  </span>
                </th>
                
                {/* Dynamic Columns based on category */}
                {currentColumns.map((col) => (
                  <th 
                    key={col.key} 
                    className="px-2 py-3 text-center whitespace-nowrap min-w-[45px] cursor-pointer hover:text-white transition-colors group"
                    onClick={() => handleSort(col.key)}
                    title={`${col.label}'a göre sırala`}
                  >
                    <span className="inline-flex items-center justify-center" title={col.label}>
                      {col.shortLabel}
                      <SortArrow direction={sortConfig.direction} isActive={sortConfig.key === col.key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={3 + currentColumns.length} className="px-4 py-8 text-center text-gray-500">
                    {statCategory === 'kaleci' 
                      ? 'Bu filtrede kaleci bulunamadı' 
                      : 'Oyuncu bulunamadı'}
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player) => {
                  const stats = player.statistics[0];
                  const rating = parseFloat(stats.games?.rating || '0');
                  const isFBPlayer = player.teamId === FENERBAHCE_TEAM_ID;
                  
                  return (
                    <tr 
                      key={player.player.id}
                      className={cn(
                        'border-b border-white/5 hover:bg-white/5 transition-colors',
                        isFBPlayer && 'bg-fb-navy/10'
                      )}
                    >
                      {/* Condensed Player Info - Sticky */}
                      <td className="px-2 py-1.5 sticky left-0 bg-gray-900/98 z-10 min-w-[200px] md:min-w-[240px]">
                        <Link 
                          href={ROUTES.PLAYER_DETAIL(player.player.id)}
                          className="flex items-center gap-2"
                        >
                          {/* Team Logo (only in "all" mode) */}
                          {teamFilter === 'all' && (
                            <Image 
                              src={player.teamLogo} 
                              alt="" 
                              width={14} 
                              height={14}
                              className="object-contain shrink-0"
                            />
                          )}
                          
                          {/* Player Photo - Full Row Height */}
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 shrink-0 ring-1 ring-white/10">
                            <Image
                              src={player.player.photo}
                              alt={player.player.name}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          
                          {/* Name, Position, Number - Condensed */}
                          <div className="min-w-0 flex-1">
                            <div className={cn(
                              'font-medium text-sm truncate leading-tight',
                              isFBPlayer ? 'text-fb-yellow' : 'text-white'
                            )}>
                              {shortenName(player.player.name)}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <span>#{stats.games?.number}</span>
                              <span>•</span>
                              <span>{stats.games?.position}</span>
                            </div>
                          </div>
                        </Link>
                      </td>
                      
                      {/* Rating - Sticky */}
                      <td className="px-2 py-1.5 text-center sticky left-[200px] md:left-[240px] bg-gray-900/98 z-10">
                        {rating > 0 && (
                          <span className={cn(
                            'px-1.5 py-0.5 rounded text-xs font-bold text-white inline-block min-w-[32px]',
                            getRatingColor(rating)
                          )}>
                            {rating.toFixed(1)}
                          </span>
                        )}
                      </td>
                      
                      {/* Minutes - Sticky */}
                      <td className="px-2 py-1.5 text-center text-gray-300 sticky left-[250px] md:left-[290px] bg-gray-900/98 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                        {stats.games?.minutes || '-'}
                      </td>
                      
                      {/* Dynamic Stats Columns */}
                      {currentColumns.map((col) => {
                        const value = col.getValue(stats);
                        const displayValue = value ?? '-';
                        
                        let colorClass = 'text-gray-300';
                        if (col.highlight === 'goals' && value) {
                          colorClass = 'text-green-400 font-medium';
                        } else if (col.highlight === 'assists' && value) {
                          colorClass = 'text-blue-400 font-medium';
                        } else if (col.highlight === 'yellow' && value) {
                          colorClass = 'text-yellow-400 font-medium';
                        } else if (col.highlight === 'red' && value) {
                          colorClass = 'text-red-400 font-medium';
                        } else if (col.highlight === 'saves' && value) {
                          colorClass = 'text-cyan-400 font-medium';
                        } else if (!value || value === '-') {
                          colorClass = 'text-gray-600';
                        }
                        
                        return (
                          <td key={col.key} className="px-2 py-1.5 text-center whitespace-nowrap">
                            <span className={colorClass}>{displayValue}</span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Scroll indicator for mobile */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-900/80 to-transparent pointer-events-none md:hidden" />
      </div>
      
      {/* Legend */}
      <div className="p-3 border-t border-white/10 bg-gray-900/50">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          {currentLegends.map((item) => (
            <span key={item.short}>
              {item.short}: {item.long}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
