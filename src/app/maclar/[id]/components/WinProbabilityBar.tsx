'use client';

import Image from 'next/image';
import { TeamScore } from '@/types';
import { cn } from '@/lib/utils';
import { FENERBAHCE_TEAM_ID } from '@/lib/constants';

interface WinProbabilityBarProps {
  predictions: {
    percent: {
      home: string;
      draw: string;
      away: string;
    };
  };
  homeTeam: TeamScore;
  awayTeam: TeamScore;
}

export function WinProbabilityBar({ predictions, homeTeam, awayTeam }: WinProbabilityBarProps) {
  const homePercent = parseInt(predictions.percent.home) || 0;
  const drawPercent = parseInt(predictions.percent.draw) || 0;
  const awayPercent = parseInt(predictions.percent.away) || 0;
  
  const isFBHome = homeTeam.id === FENERBAHCE_TEAM_ID;
  const isFBAway = awayTeam.id === FENERBAHCE_TEAM_ID;
  
  return (
    <div className="card p-4">
      <h3 className="section-title text-lg mb-4">KAZANMA OLASILIKLARI</h3>
      
      {/* Team Labels */}
      <div className="flex items-center justify-between mb-3">
        {/* Home Team */}
        <div className="flex items-center gap-2">
          <Image
            src={homeTeam.logo}
            alt={homeTeam.name}
            width={24}
            height={24}
            className="object-contain"
          />
          <span className={cn(
            'text-sm font-medium',
            isFBHome ? 'text-fb-yellow' : 'text-white'
          )}>
            {homeTeam.name}
          </span>
        </div>
        
        {/* Draw */}
        <span className="text-sm text-gray-400">Beraberlik</span>
        
        {/* Away Team */}
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-medium',
            isFBAway ? 'text-fb-yellow' : 'text-white'
          )}>
            {awayTeam.name}
          </span>
          <Image
            src={awayTeam.logo}
            alt={awayTeam.name}
            width={24}
            height={24}
            className="object-contain"
          />
        </div>
      </div>
      
      {/* Probability Bar */}
      <div className="flex h-8 rounded-lg overflow-hidden mb-3">
        {/* Home Win */}
        <div 
          className={cn(
            'flex items-center justify-center text-sm font-bold transition-all duration-500',
            isFBHome 
              ? 'bg-fb-navy text-fb-yellow' 
              : 'bg-green-600 text-white'
          )}
          style={{ width: `${homePercent}%` }}
        >
          {homePercent > 10 && `${homePercent}%`}
        </div>
        
        {/* Draw */}
        <div 
          className="bg-gray-600 flex items-center justify-center text-sm font-bold text-white transition-all duration-500"
          style={{ width: `${drawPercent}%` }}
        >
          {drawPercent > 10 && `${drawPercent}%`}
        </div>
        
        {/* Away Win */}
        <div 
          className={cn(
            'flex items-center justify-center text-sm font-bold transition-all duration-500',
            isFBAway 
              ? 'bg-fb-navy text-fb-yellow' 
              : 'bg-red-600 text-white'
          )}
          style={{ width: `${awayPercent}%` }}
        >
          {awayPercent > 10 && `${awayPercent}%`}
        </div>
      </div>
      
      {/* Percentage Labels (for small percentages) */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className={cn(isFBHome && 'text-fb-yellow')}>{homePercent}%</span>
        <span>{drawPercent}%</span>
        <span className={cn(isFBAway && 'text-fb-yellow')}>{awayPercent}%</span>
      </div>
    </div>
  );
}
