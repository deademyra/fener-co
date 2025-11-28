'use client';

import { TeamStatistics, StatisticItem } from '@/types';
import { cn, parseStatValue, translateStatName } from '@/lib/utils';
import { FENERBAHCE_TEAM_ID } from '@/lib/constants';

interface MatchStatisticsSectionProps {
  homeStats: TeamStatistics;
  awayStats: TeamStatistics;
}

// Gösterilecek istatistikler ve sırası (expected_goals xG Display'de gösterildiği için hariç tutuldu)
const STAT_ORDER = [
  'Ball Possession',
  'Total Shots',
  'Shots on Goal',
  'Shots off Goal',
  'Blocked Shots',
  'Shots insidebox',
  'Shots outsidebox',
  'Total passes',
  'Passes accurate',
  'Passes %',
  'Corner Kicks',
  'Offsides',
  'Goalkeeper Saves',
  'Fouls',
  'Yellow Cards',
  'Red Cards',
];

export function MatchStatisticsSection({ homeStats, awayStats }: MatchStatisticsSectionProps) {
  const isFBHome = homeStats.team.id === FENERBAHCE_TEAM_ID;
  
  // İstatistikleri map'e çevir
  const homeMap = new Map<string, StatisticItem>();
  const awayMap = new Map<string, StatisticItem>();
  
  homeStats.statistics.forEach(s => homeMap.set(s.type, s));
  awayStats.statistics.forEach(s => awayMap.set(s.type, s));
  
  // Sadece gösterilecek istatistikleri al (ve mevcut olanları)
  const displayStats = STAT_ORDER.filter(type => 
    homeMap.has(type) || awayMap.has(type)
  );
  
  if (displayStats.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-gray-400">İstatistik verisi bulunamadı</p>
      </div>
    );
  }
  
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
          
          // Hangi tarafın daha iyi olduğunu belirle
          const homeWins = homeValue > awayValue;
          const awayWins = awayValue > homeValue;
          
          return (
            <div key={statType}>
              {/* Değerler */}
              <div className="flex justify-between items-center mb-1">
                <span className={cn(
                  'font-medium text-sm',
                  isFBHome && homeWins && 'text-fb-yellow',
                  !isFBHome && !homeWins && awayWins && 'text-fb-yellow'
                )}>
                  {displayHomeValue}
                </span>
                <span className="text-xs text-gray-500">
                  {translateStatName(statType)}
                </span>
                <span className={cn(
                  'font-medium text-sm',
                  !isFBHome && awayWins && 'text-fb-yellow',
                  isFBHome && !awayWins && homeWins && 'text-fb-yellow'
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
