'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MatchCardData, FixtureStatus } from '@/types';
import { cn, formatMatchDateTime, getStatusText, isLive, isFinished, isScheduled } from '@/lib/utils';
import { FENERBAHCE_TEAM_ID, ROUTES } from '@/lib/constants';

interface MatchCardProps {
  match: MatchCardData;
  showLeague?: boolean;
  compact?: boolean;
}

export function MatchCard({ match, showLeague = true, compact = false }: MatchCardProps) {
  const { date, time } = formatMatchDateTime(match.date);
  const isFBHome = match.homeTeam.id === FENERBAHCE_TEAM_ID;
  const isFBAway = match.awayTeam.id === FENERBAHCE_TEAM_ID;
  const isLiveMatch = isLive(match.status);
  const isFinishedMatch = isFinished(match.status);
  
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
          {showLeague && (
            <div className="flex items-center gap-2">
              <Image
                src={match.league.logo}
                alt={match.league.name}
                width={16}
                height={16}
                className="object-contain"
              />
              <span className="text-xs text-gray-400 truncate max-w-[120px]">
                {match.league.name}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
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
              <span className="text-lg text-gray-500">vs</span>
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
