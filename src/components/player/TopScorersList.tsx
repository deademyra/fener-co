'use client';

import Image from 'next/image';
import Link from 'next/link';
import { TopScorer } from '@/types';
import { cn, shortenName } from '@/lib/utils';
import { FENERBAHCE_TEAM_ID, ROUTES } from '@/lib/constants';

interface TopScorersListProps {
  scorers: TopScorer[];
  title?: string;
  type?: 'goals' | 'assists';
  maxItems?: number;
  showViewAll?: boolean;
  leagueId?: number;
}

export function TopScorersList({
  scorers,
  title,
  type = 'goals',
  maxItems = 5,
  showViewAll = false,
  leagueId
}: TopScorersListProps) {
  const displayScorers = scorers.slice(0, maxItems);
  
  const getValue = (scorer: TopScorer): number => {
    const stats = scorer.statistics[0];
    if (!stats) return 0;
    return type === 'goals' 
      ? (stats.goals.total || 0)
      : (stats.goals.assists || 0);
  };
  
  const defaultTitle = type === 'goals' ? 'GOL KRALLIĞI' : 'ASİST KRALLIĞI';
  
  return (
    <div className="card p-4">
      <div className="section-header mb-3">
        <h3 className="section-title text-lg">{title || defaultTitle}</h3>
        {showViewAll && leagueId && (
          <Link 
            href={`${ROUTES.TOURNAMENT_DETAIL(leagueId)}/istatistik`}
            className="text-xs text-fb-yellow hover:text-fb-yellow-light"
          >
            Tümü →
          </Link>
        )}
      </div>
      
      <div className="space-y-2">
        {displayScorers.map((scorer, index) => {
          const stats = scorer.statistics[0];
          const isFenerbahce = stats?.team.id === FENERBAHCE_TEAM_ID;
          const value = getValue(scorer);
          
          return (
            <Link 
              key={scorer.player.id}
              href={ROUTES.PLAYER_DETAIL(scorer.player.id)}
            >
              <div className={cn(
                'flex items-center gap-3 p-2 rounded-lg transition-colors',
                'hover:bg-gray-800/50',
                isFenerbahce && 'bg-fb-navy/20'
              )}>
                {/* Rank */}
                <span className={cn(
                  'w-6 text-center font-display text-lg',
                  index === 0 && 'text-fb-gold',
                  index === 1 && 'text-gray-400',
                  index === 2 && 'text-amber-700',
                  index > 2 && 'text-gray-500'
                )}>
                  {index + 1}
                </span>
                
                {/* Player Photo */}
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-800 shrink-0">
                  <Image
                    src={scorer.player.photo}
                    alt={scorer.player.name}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-medium text-sm truncate',
                    isFenerbahce && 'text-fb-yellow'
                  )}>
                    {shortenName(scorer.player.name)}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {stats && (
                      <Image
                        src={stats.team.logo}
                        alt={stats.team.name}
                        width={14}
                        height={14}
                        className="object-contain"
                      />
                    )}
                    <span className="text-xs text-gray-500 truncate">
                      {stats?.team.name}
                    </span>
                  </div>
                </div>
                
                {/* Value */}
                <div className="text-right">
                  <span className={cn(
                    'font-display text-xl',
                    isFenerbahce ? 'text-fb-yellow' : 'text-white'
                  )}>
                    {value}
                  </span>
                  <p className="text-xs text-gray-500">
                    {stats?.games.appearances || 0} maç
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default TopScorersList;
