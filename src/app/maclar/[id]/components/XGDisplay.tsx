'use client';

import Image from 'next/image';
import { TeamStatistics, TeamScore } from '@/types';
import { cn, parseStatValue } from '@/lib/utils';
import { FENERBAHCE_TEAM_ID } from '@/lib/constants';

interface XGDisplayProps {
  homeStats: TeamStatistics;
  awayStats: TeamStatistics;
  homeTeam: TeamScore;
  awayTeam: TeamScore;
}

export function XGDisplay({ homeStats, awayStats, homeTeam, awayTeam }: XGDisplayProps) {
  const isFBHome = homeTeam.id === FENERBAHCE_TEAM_ID;
  const isFBAway = awayTeam.id === FENERBAHCE_TEAM_ID;
  
  // xG değerlerini bul
  const homeXG = homeStats.statistics.find(s => s.type === 'expected_goals')?.value;
  const awayXG = awayStats.statistics.find(s => s.type === 'expected_goals')?.value;
  
  // xG yoksa gösterme
  if (!homeXG && !awayXG) return null;
  
  const homeValue = typeof homeXG === 'string' ? parseFloat(homeXG) : (homeXG || 0);
  const awayValue = typeof awayXG === 'string' ? parseFloat(awayXG) : (awayXG || 0);
  const total = homeValue + awayValue || 1;
  const homePercent = (homeValue / total) * 100;
  const awayPercent = (awayValue / total) * 100;
  
  return (
    <div className="card p-4">
      <h3 className="section-title text-lg mb-4">BEKLENEN GOL (xG)</h3>
      
      <div className="flex items-center gap-4">
        {/* Home Team */}
        <div className="flex items-center gap-2">
          <Image 
            src={homeTeam.logo} 
            alt={homeTeam.name} 
            width={32} 
            height={32}
            className="object-contain"
          />
          <span className={cn(
            'text-2xl font-bold',
            isFBHome ? 'text-fb-yellow' : 'text-white'
          )}>
            {homeValue.toFixed(2)}
          </span>
        </div>
        
        {/* xG Bar */}
        <div className="flex-1 flex gap-1 h-4">
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
                isFBAway ? 'bg-fb-navy' : 'bg-gray-600'
              )}
              style={{ width: `${awayPercent}%` }}
            />
          </div>
        </div>
        
        {/* Away Team */}
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-2xl font-bold',
            isFBAway ? 'text-fb-yellow' : 'text-white'
          )}>
            {awayValue.toFixed(2)}
          </span>
          <Image 
            src={awayTeam.logo} 
            alt={awayTeam.name} 
            width={32} 
            height={32}
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
