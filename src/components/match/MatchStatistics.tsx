'use client';

import { TeamStatistics, StatisticItem } from '@/types';
import { cn, parseStatValue, translateStatName } from '@/lib/utils';
import { FENERBAHCE_TEAM_ID } from '@/lib/constants';

interface MatchStatisticsProps {
  homeStats: TeamStatistics;
  awayStats: TeamStatistics;
}

// Gösterilecek istatistikler ve sırası
const STAT_ORDER = [
  'Ball Possession',
  'Total Shots',
  'Shots on Goal',
  'Shots off Goal',
  'Corner Kicks',
  'Fouls',
  'Offsides',
  'Yellow Cards',
  'Red Cards',
  'Goalkeeper Saves',
  'Total passes',
  'Passes accurate',
  'Passes %',
];

export function MatchStatistics({ homeStats, awayStats }: MatchStatisticsProps) {
  const isFBHome = homeStats.team.id === FENERBAHCE_TEAM_ID;
  
  // İstatistikleri map'e çevir
  const homeMap = new Map<string, StatisticItem>();
  const awayMap = new Map<string, StatisticItem>();
  
  homeStats.statistics.forEach(s => homeMap.set(s.type, s));
  awayStats.statistics.forEach(s => awayMap.set(s.type, s));
  
  // Sadece gösterilecek istatistikleri al
  const displayStats = STAT_ORDER.filter(type => 
    homeMap.has(type) || awayMap.has(type)
  );
  
  return (
    <div className="card p-4">
      <h3 className="section-title text-lg mb-4">MAÇ İSTATİSTİKLERİ</h3>
      
      <div className="space-y-4">
        {displayStats.map(statType => {
          const homeStat = homeMap.get(statType);
          const awayStat = awayMap.get(statType);
          
          const homeValue = parseStatValue(homeStat?.value ?? 0);
          const awayValue = parseStatValue(awayStat?.value ?? 0);
          const total = homeValue + awayValue || 1;
          
          const homePercent = (homeValue / total) * 100;
          const awayPercent = (awayValue / total) * 100;
          
          // Yüzde değeri mi kontrol et
          const isPercentage = statType.includes('%') || statType === 'Ball Possession';
          const displayHomeValue = isPercentage 
            ? `${homeValue}%` 
            : homeValue;
          const displayAwayValue = isPercentage 
            ? `${awayValue}%` 
            : awayValue;
          
          return (
            <div key={statType}>
              {/* Değerler */}
              <div className="flex justify-between items-center mb-1">
                <span className={cn(
                  'font-medium text-sm',
                  isFBHome && homeValue > awayValue && 'text-fb-yellow',
                  !isFBHome && homeValue < awayValue && 'text-fb-yellow'
                )}>
                  {displayHomeValue}
                </span>
                <span className="text-xs text-gray-500">
                  {translateStatName(statType)}
                </span>
                <span className={cn(
                  'font-medium text-sm',
                  !isFBHome && awayValue > homeValue && 'text-fb-yellow',
                  isFBHome && awayValue < homeValue && 'text-fb-yellow'
                )}>
                  {displayAwayValue}
                </span>
              </div>
              
              {/* Bar */}
              <div className="flex gap-1 h-2">
                <div className="flex-1 flex justify-end">
                  <div 
                    className={cn(
                      'h-full rounded-l-full transition-all duration-500',
                      isFBHome ? 'bg-fb-navy' : 'bg-gray-600'
                    )}
                    style={{ width: `${homePercent}%` }}
                  />
                </div>
                <div className="flex-1">
                  <div 
                    className={cn(
                      'h-full rounded-r-full transition-all duration-500',
                      !isFBHome ? 'bg-fb-navy' : 'bg-gray-600'
                    )}
                    style={{ width: `${awayPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CompactStats({ homeStats, awayStats }: MatchStatisticsProps) {
  const keyStats = ['Ball Possession', 'Total Shots', 'Shots on Goal', 'Corner Kicks', 'Fouls'];
  
  const homeMap = new Map<string, StatisticItem>();
  const awayMap = new Map<string, StatisticItem>();
  
  homeStats.statistics.forEach(s => homeMap.set(s.type, s));
  awayStats.statistics.forEach(s => awayMap.set(s.type, s));
  
  return (
    <div className="grid grid-cols-5 gap-2 text-center">
      {keyStats.map(statType => {
        const homeValue = homeMap.get(statType)?.value ?? '-';
        const awayValue = awayMap.get(statType)?.value ?? '-';
        
        return (
          <div key={statType} className="bg-gray-800/50 rounded-lg p-2">
            <p className="text-xs text-gray-500 mb-1">{translateStatName(statType)}</p>
            <p className="text-sm">
              <span className="text-white">{homeValue}</span>
              <span className="text-gray-500 mx-1">-</span>
              <span className="text-white">{awayValue}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default MatchStatistics;
