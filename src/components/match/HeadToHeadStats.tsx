'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Fixture, TeamScore } from '@/types';
import { cn, formatMatchDateTime } from '@/lib/utils';
import { FENERBAHCE_TEAM_ID, ROUTES } from '@/lib/constants';

interface HeadToHeadStatsProps {
  matches: Fixture[];
  homeTeam: TeamScore;
  awayTeam: TeamScore;
}

export function HeadToHeadStats({ matches, homeTeam, awayTeam }: HeadToHeadStatsProps) {
  if (!matches || matches.length === 0) {
    return (
      <div className="card p-4">
        <h3 className="section-title text-lg mb-4">KARŞI KARŞIYA İSTATİSTİKLERİ</h3>
        <p className="text-gray-400 text-center py-4">Karşılaşma verisi bulunamadı</p>
      </div>
    );
  }
  
  // Calculate wins and draws
  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;
  
  matches.forEach(match => {
    const homeGoals = match.goals.home ?? 0;
    const awayGoals = match.goals.away ?? 0;
    
    // Determine which team is "home" in this H2H context
    const isCurrentHomeTeamHome = match.teams.home.id === homeTeam.id;
    
    if (homeGoals === awayGoals) {
      draws++;
    } else if (homeGoals > awayGoals) {
      // Match home team won
      if (isCurrentHomeTeamHome) {
        homeWins++;
      } else {
        awayWins++;
      }
    } else {
      // Match away team won
      if (isCurrentHomeTeamHome) {
        awayWins++;
      } else {
        homeWins++;
      }
    }
  });
  
  const isFBHome = homeTeam.id === FENERBAHCE_TEAM_ID;
  const isFBAway = awayTeam.id === FENERBAHCE_TEAM_ID;
  
  return (
    <div className="card p-4">
      <h3 className="section-title text-lg mb-4">KARŞI KARŞIYA İSTATİSTİKLERİ</h3>
      <p className="text-xs text-gray-500 mb-4">Son {matches.length} maç</p>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Home Team Wins */}
        <div className={cn(
          'rounded-lg p-4 text-center',
          isFBHome ? 'bg-fb-navy/30 border border-fb-navy/50' : 'bg-gray-800/50'
        )}>
          <div className="flex justify-center mb-2">
            <Image
              src={homeTeam.logo}
              alt={homeTeam.name}
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <p className={cn(
            'text-3xl font-bold',
            isFBHome ? 'text-fb-yellow' : 'text-white'
          )}>
            {homeWins}
          </p>
          <p className="text-xs text-gray-400 mt-1">Galibiyet</p>
        </div>
        
        {/* Draws */}
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="flex justify-center mb-2 h-8 items-center">
            <span className="text-2xl">⚖️</span>
          </div>
          <p className="text-3xl font-bold text-gray-400">{draws}</p>
          <p className="text-xs text-gray-400 mt-1">Beraberlik</p>
        </div>
        
        {/* Away Team Wins */}
        <div className={cn(
          'rounded-lg p-4 text-center',
          isFBAway ? 'bg-fb-navy/30 border border-fb-navy/50' : 'bg-gray-800/50'
        )}>
          <div className="flex justify-center mb-2">
            <Image
              src={awayTeam.logo}
              alt={awayTeam.name}
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <p className={cn(
            'text-3xl font-bold',
            isFBAway ? 'text-fb-yellow' : 'text-white'
          )}>
            {awayWins}
          </p>
          <p className="text-xs text-gray-400 mt-1">Galibiyet</p>
        </div>
      </div>
      
      {/* Recent Matches List */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500 uppercase mb-2">Son Karşılaşmalar</p>
        {matches.slice(0, 5).map(match => {
          const { date } = formatMatchDateTime(match.fixture.date);
          const homeGoals = match.goals.home ?? 0;
          const awayGoals = match.goals.away ?? 0;
          
          // Determine winner
          let resultIcon = '⚖️'; // Draw
          let resultClass = 'text-gray-400';
          
          const isFBInThisMatch = match.teams.home.id === FENERBAHCE_TEAM_ID || match.teams.away.id === FENERBAHCE_TEAM_ID;
          const isFBHomeInMatch = match.teams.home.id === FENERBAHCE_TEAM_ID;
          
          if (homeGoals !== awayGoals) {
            const fbWon = isFBInThisMatch && (
              (isFBHomeInMatch && homeGoals > awayGoals) ||
              (!isFBHomeInMatch && awayGoals > homeGoals)
            );
            
            if (isFBInThisMatch) {
              resultIcon = fbWon ? '✅' : '❌';
              resultClass = fbWon ? 'text-green-400' : 'text-red-400';
            }
          }
          
          return (
            <Link
              key={match.fixture.id}
              href={ROUTES.MATCH_DETAIL(match.fixture.id)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              {/* Date */}
              <span className="text-xs text-gray-500 w-20 shrink-0">{date}</span>
              
              {/* Home Team */}
              <div className="flex items-center gap-1 flex-1 justify-end min-w-0">
                <span className={cn(
                  'text-sm truncate',
                  match.teams.home.id === FENERBAHCE_TEAM_ID ? 'text-fb-yellow' : 'text-white'
                )}>
                  {match.teams.home.name}
                </span>
                <Image
                  src={match.teams.home.logo}
                  alt=""
                  width={16}
                  height={16}
                  className="object-contain shrink-0"
                />
              </div>
              
              {/* Score */}
              <div className="flex items-center gap-1 px-2 shrink-0">
                <span className="text-sm font-bold w-4 text-right">{homeGoals}</span>
                <span className="text-gray-500">-</span>
                <span className="text-sm font-bold w-4">{awayGoals}</span>
              </div>
              
              {/* Away Team */}
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <Image
                  src={match.teams.away.logo}
                  alt=""
                  width={16}
                  height={16}
                  className="object-contain shrink-0"
                />
                <span className={cn(
                  'text-sm truncate',
                  match.teams.away.id === FENERBAHCE_TEAM_ID ? 'text-fb-yellow' : 'text-white'
                )}>
                  {match.teams.away.name}
                </span>
              </div>
              
              {/* Result Icon (only for FB matches) */}
              {isFBInThisMatch && (
                <span className={cn('text-sm shrink-0', resultClass)}>
                  {resultIcon}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
