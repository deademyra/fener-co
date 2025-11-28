'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MatchCardData } from '@/types';
import { cn, formatMatchDateTime, getStatusText, isLive, isFinished, isScheduled } from '@/lib/utils';
import { FENERBAHCE_TEAM_ID, ROUTES } from '@/lib/constants';

interface MatchCardProps {
  match: MatchCardData;
  showLeague?: boolean;
  showDate?: boolean;
  compact?: boolean;
}

// Fenerbahçe için maç sonucu hesapla
function getFenerbahceResult(match: MatchCardData): 'W' | 'D' | 'L' | null {
  const isFBHome = match.homeTeam.id === FENERBAHCE_TEAM_ID;
  const isFBAway = match.awayTeam.id === FENERBAHCE_TEAM_ID;
  
  if (!isFBHome && !isFBAway) return null;
  if (match.homeScore === null || match.awayScore === null) return null;
  
  const fbScore = isFBHome ? match.homeScore : match.awayScore;
  const opponentScore = isFBHome ? match.awayScore : match.homeScore;
  
  if (fbScore > opponentScore) return 'W';
  if (fbScore < opponentScore) return 'L';
  return 'D';
}

// Sonuç göstergesi component'i
function ResultIndicator({ result }: { result: 'W' | 'D' | 'L' }) {
  const config = {
    W: { label: 'G', bg: 'bg-green-500', text: 'text-white' },
    D: { label: 'B', bg: 'bg-amber-500', text: 'text-white' },
    L: { label: 'M', bg: 'bg-red-500', text: 'text-white' },
  };
  
  const { label, bg, text } = config[result];
  
  return (
    <div className={cn(
      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
      bg, text
    )}>
      {label}
    </div>
  );
}

export function MatchCard({ match, showLeague = true, showDate = true, compact = false }: MatchCardProps) {
  const { date, time } = formatMatchDateTime(match.date);
  const isFBHome = match.homeTeam.id === FENERBAHCE_TEAM_ID;
  const isFBAway = match.awayTeam.id === FENERBAHCE_TEAM_ID;
  const isLiveMatch = isLive(match.status);
  const isFinishedMatch = isFinished(match.status);
  const result = isFinishedMatch ? getFenerbahceResult(match) : null;
  
  return (
    <Link href={ROUTES.MATCH_DETAIL(match.id)}>
      <div
        className={cn(
          'match-card',
          isLiveMatch && 'match-card-live',
          compact && 'p-3'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* League */}
            {showLeague && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Image
                  src={match.league.logo}
                  alt={match.league.name}
                  width={16}
                  height={16}
                  className="object-contain dark-logo-filter"
                />
                <span className="text-xs text-gray-400 truncate max-w-[100px]">
                  {match.league.name}
                </span>
              </div>
            )}
            
            {/* Date - always show for finished matches */}
            {showDate && isFinishedMatch && (
              <span className="text-xs text-gray-500">
                {date}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {isLiveMatch ? (
              <span className="badge badge-live">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1.5 animate-pulse-live" />
                {getStatusText(match.status, match.elapsed)}
              </span>
            ) : isFinishedMatch ? (
              <span className="text-xs text-gray-400">
                {getStatusText(match.status, match.elapsed)}
              </span>
            ) : (
              <div className="text-right">
                <div className="text-xs text-gray-400">{date}</div>
                <div className="text-sm font-medium text-white">{time}</div>
              </div>
            )}
          </div>
        </div>

        {/* Teams & Score */}
        <div className={cn(
          'flex items-center',
          compact ? 'gap-3' : 'gap-4 md:gap-6'
        )}>
          {/* Home Team */}
          <div className={cn(
            'flex-1 flex items-center gap-2 md:gap-3',
            compact ? 'justify-start' : 'justify-end'
          )}>
            {!compact && (
              <span className={cn(
                'text-sm md:text-base font-medium truncate',
                isFBHome ? 'text-fb-yellow' : 'text-white'
              )}>
                {match.homeTeam.name}
              </span>
            )}
            <div className={cn(
              'team-logo shrink-0',
              compact ? 'team-logo-sm' : 'team-logo-md',
              isFBHome && 'ring-2 ring-fb-yellow/50'
            )}>
              <Image
                src={match.homeTeam.logo}
                alt={match.homeTeam.name}
                width={compact ? 24 : 36}
                height={compact ? 24 : 36}
                className="object-contain"
              />
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {isScheduled(match.status) ? (
              <div className="text-center">
                <span className="text-lg text-gray-500">vs</span>
                {showDate && (
                  <div className="text-xs text-fb-yellow mt-0.5">{time}</div>
                )}
              </div>
            ) : (
              <>
                <span className={cn(
                  'font-display text-2xl md:text-3xl',
                  isLiveMatch && 'text-fb-yellow',
                  !isLiveMatch && 'text-white'
                )}>
                  {match.homeScore ?? '-'}
                </span>
                <span className="text-gray-500">:</span>
                <span className={cn(
                  'font-display text-2xl md:text-3xl',
                  isLiveMatch && 'text-fb-yellow',
                  !isLiveMatch && 'text-white'
                )}>
                  {match.awayScore ?? '-'}
                </span>
              </>
            )}
          </div>

          {/* Away Team */}
          <div className={cn(
            'flex-1 flex items-center gap-2 md:gap-3',
            compact ? 'justify-end' : 'justify-start'
          )}>
            <div className={cn(
              'team-logo shrink-0',
              compact ? 'team-logo-sm' : 'team-logo-md',
              isFBAway && 'ring-2 ring-fb-yellow/50'
            )}>
              <Image
                src={match.awayTeam.logo}
                alt={match.awayTeam.name}
                width={compact ? 24 : 36}
                height={compact ? 24 : 36}
                className="object-contain"
              />
            </div>
            {!compact && (
              <span className={cn(
                'text-sm md:text-base font-medium truncate',
                isFBAway ? 'text-fb-yellow' : 'text-white'
              )}>
                {match.awayTeam.name}
              </span>
            )}
          </div>
          
          {/* Result Indicator for Fenerbahçe - Far Right */}
          {result && (
            <div className="ml-2 flex-shrink-0">
              <ResultIndicator result={result} />
            </div>
          )}
        </div>

        {/* Compact team names */}
        {compact && (
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span className={cn(isFBHome && 'text-fb-yellow')}>{match.homeTeam.name}</span>
            <span className={cn(isFBAway && 'text-fb-yellow')}>{match.awayTeam.name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default MatchCard;
