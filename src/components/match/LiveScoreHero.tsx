'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Fixture } from '@/types';
import { cn, formatMatchDateTime, getStatusText, formatGoalScorers, isLive } from '@/lib/utils';
import { FENERBAHCE_TEAM_ID, ROUTES, TRANSLATIONS } from '@/lib/constants';

interface LiveScoreHeroProps {
  matches: Fixture[];
  liveMatch?: Fixture | null;
}

export function LiveScoreHero({ matches, liveMatch }: LiveScoreHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Canlı maç varsa onu göster, yoksa upcoming maçları göster
  const displayMatches = liveMatch ? [liveMatch, ...matches.filter(m => m.fixture.id !== liveMatch.fixture.id).slice(0, 4)] : matches.slice(0, 5);
  
  if (displayMatches.length === 0) {
    return (
      <div className="hero-gradient rounded-2xl p-6 md:p-8 text-center">
        <p className="text-gray-400">Yaklaşan maç bilgisi bulunamadı</p>
      </div>
    );
  }
  
  const currentMatch = displayMatches[currentIndex];
  const isLiveMatch = liveMatch && currentIndex === 0 && isLive(liveMatch.fixture.status.short);
  const { date, time, full } = formatMatchDateTime(currentMatch.fixture.date);
  const isFBHome = currentMatch.teams.home.id === FENERBAHCE_TEAM_ID;
  
  const homeGoals = currentMatch.events 
    ? formatGoalScorers(currentMatch.events, currentMatch.teams.home.id)
    : '';
  const awayGoals = currentMatch.events
    ? formatGoalScorers(currentMatch.events, currentMatch.teams.away.id)
    : '';
  
  const leagueName = TRANSLATIONS.leagues[currentMatch.league.id as keyof typeof TRANSLATIONS.leagues] 
    || currentMatch.league.name;
  
  const goToPrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : displayMatches.length - 1));
  };
  
  const goToNext = () => {
    setCurrentIndex(prev => (prev < displayMatches.length - 1 ? prev + 1 : 0));
  };
  
  return (
    <div className={cn(
      'hero-gradient rounded-2xl p-6 md:p-8 relative overflow-hidden',
      'transition-all duration-300'
    )}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-pitch-pattern bg-repeat" style={{ backgroundSize: '20px 20px' }} />
      </div>
      
      {/* Navigation Arrows */}
      {displayMatches.length > 1 && (
        <>
          <button 
            onClick={goToPrevious}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-gray-900/80 hover:bg-gray-800 rounded-full flex items-center justify-center transition-colors"
            aria-label="Önceki maç"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={goToNext}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-gray-900/80 hover:bg-gray-800 rounded-full flex items-center justify-center transition-colors"
            aria-label="Sonraki maç"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      
      {/* Match Counter Dots */}
      {displayMatches.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {displayMatches.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                idx === currentIndex ? 'bg-fb-yellow w-6' : 'bg-gray-500 hover:bg-gray-400'
              )}
              aria-label={`Maç ${idx + 1}`}
            />
          ))}
        </div>
      )}
      
      {/* Live indicator */}
      {isLiveMatch && (
        <div className="absolute top-4 right-4 z-10">
          <span className="badge badge-live text-sm px-3 py-1">
            <span className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse-live" />
            CANLI
          </span>
        </div>
      )}
      
      {/* Content */}
      <Link href={ROUTES.MATCH_DETAIL(currentMatch.fixture.id)}>
        <div className="relative z-10 cursor-pointer group">
          {/* League & Date */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Image
                src={currentMatch.league.logo}
                alt={currentMatch.league.name}
                width={24}
                height={24}
                className="object-contain"
              />
              <span className="text-fb-yellow font-medium">{leagueName}</span>
            </div>
            {!isLiveMatch && (
              <p className="text-sm text-gray-400">{full}</p>
            )}
            {isLiveMatch && currentMatch.fixture.status.elapsed && (
              <p className="text-lg font-display text-white">
                {getStatusText(currentMatch.fixture.status.short, currentMatch.fixture.status.elapsed)}
              </p>
            )}
          </div>
          
          {/* Teams & Score */}
          <div className="flex items-center justify-center gap-4 md:gap-8 lg:gap-16 mb-6 px-12 md:px-16">
            {/* Home Team */}
            <div className="flex-1 flex flex-col items-center">
              <div className={cn(
                'w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-white/10 p-3 md:p-4 mb-3',
                'group-hover:scale-105 transition-transform',
                isFBHome && 'ring-2 ring-fb-yellow/30'
              )}>
                <Image
                  src={currentMatch.teams.home.logo}
                  alt={currentMatch.teams.home.name}
                  width={96}
                  height={96}
                  className="object-contain w-full h-full"
                />
              </div>
              <h3 className={cn(
                'font-display text-lg md:text-xl lg:text-2xl text-center',
                isFBHome ? 'text-fb-yellow' : 'text-white'
              )}>
                {currentMatch.teams.home.name}
              </h3>
              {homeGoals && (
                <p className="text-xs text-gray-400 mt-1 text-center max-w-[150px]">
                  {homeGoals}
                </p>
              )}
            </div>
            
            {/* Score */}
            <div className="flex flex-col items-center shrink-0">
              {isLiveMatch || currentMatch.goals.home !== null ? (
                <div className="flex items-center gap-2 md:gap-4">
                  <span className={cn(
                    'font-display text-4xl md:text-5xl lg:text-6xl',
                    isLiveMatch && 'text-fb-yellow'
                  )}>
                    {currentMatch.goals.home ?? 0}
                  </span>
                  <span className="text-2xl md:text-3xl text-gray-500">-</span>
                  <span className={cn(
                    'font-display text-4xl md:text-5xl lg:text-6xl',
                    isLiveMatch && 'text-fb-yellow'
                  )}>
                    {currentMatch.goals.away ?? 0}
                  </span>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-3xl md:text-4xl font-display text-gray-500">VS</p>
                  <p className="text-xl md:text-2xl font-display text-fb-yellow mt-2">{time}</p>
                </div>
              )}
              
              {currentMatch.score.halftime.home !== null && (
                <p className="text-sm text-gray-500 mt-2">
                  İY: {currentMatch.score.halftime.home} - {currentMatch.score.halftime.away}
                </p>
              )}
            </div>
            
            {/* Away Team */}
            <div className="flex-1 flex flex-col items-center">
              <div className={cn(
                'w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-white/10 p-3 md:p-4 mb-3',
                'group-hover:scale-105 transition-transform',
                !isFBHome && currentMatch.teams.away.id === FENERBAHCE_TEAM_ID && 'ring-2 ring-fb-yellow/30'
              )}>
                <Image
                  src={currentMatch.teams.away.logo}
                  alt={currentMatch.teams.away.name}
                  width={96}
                  height={96}
                  className="object-contain w-full h-full"
                />
              </div>
              <h3 className={cn(
                'font-display text-lg md:text-xl lg:text-2xl text-center',
                currentMatch.teams.away.id === FENERBAHCE_TEAM_ID ? 'text-fb-yellow' : 'text-white'
              )}>
                {currentMatch.teams.away.name}
              </h3>
              {awayGoals && (
                <p className="text-xs text-gray-400 mt-1 text-center max-w-[150px]">
                  {awayGoals}
                </p>
              )}
            </div>
          </div>
          
          {/* Venue */}
          {currentMatch.fixture.venue.name && (
            <p className="text-center text-sm text-gray-500 mb-6">
              🏟️ {currentMatch.fixture.venue.name}, {currentMatch.fixture.venue.city}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}

export default LiveScoreHero;
