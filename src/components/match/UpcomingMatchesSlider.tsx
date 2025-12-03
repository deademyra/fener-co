'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Fixture } from '@/types';
import { FENERBAHCE_TEAM_ID, ROUTES, TRANSLATIONS } from '@/lib/constants';
import { formatMatchDateTime, cn } from '@/lib/utils';

interface UpcomingMatchesSliderProps {
  matches: Fixture[];
}

export default function UpcomingMatchesSlider({ matches }: UpcomingMatchesSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const goNext = () => {
    if (currentIndex < matches.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const currentMatch = matches[currentIndex];
  const { date, time } = formatMatchDateTime(currentMatch.fixture.date);
  const leagueName = TRANSLATIONS.leagues[currentMatch.league.id as keyof typeof TRANSLATIONS.leagues] || currentMatch.league.name;
  
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 sm:p-6 flex flex-col h-full">
      {/* Title with Arrow Navigation */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-bold text-white">SIRADAKİ MAÇLAR</h2>
        {/* Arrow Buttons */}
        <div className="flex items-center gap-1">
          <button 
            onClick={goPrev}
            disabled={currentIndex === 0}
            className={cn(
              'w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-colors',
              currentIndex === 0 
                ? 'text-slate-600 cursor-not-allowed' 
                : 'text-slate-400 hover:bg-slate-700 active:bg-slate-600'
            )}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={goNext}
            disabled={currentIndex === matches.length - 1}
            className={cn(
              'w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-colors',
              currentIndex === matches.length - 1 
                ? 'text-slate-600 cursor-not-allowed' 
                : 'text-slate-400 hover:bg-slate-700 active:bg-slate-600'
            )}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Current Match Card - Large Format */}
      <div className="flex-1">
        <Link href={ROUTES.MATCH_DETAIL(currentMatch.fixture.id)} className="block">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center flex-shrink-0">
                <Image
                  src={currentMatch.league.logo}
                  alt={leagueName}
                  width={24}
                  height={24}
                  className="object-contain dark-logo-filter max-h-5 sm:max-h-6 w-auto"
                />
              </div>
              <span className="text-xs sm:text-sm text-slate-300 truncate">
                {leagueName}
                <span className="hidden sm:inline text-slate-400">
                  {currentMatch.league.round && ` • ${currentMatch.league.round}`}
                </span>
              </span>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-xs sm:text-sm text-white">{date}</span>
              <span className="text-xs sm:text-sm text-yellow-400 font-medium ml-1 sm:ml-2">{time}</span>
            </div>
          </div>
          
          {/* Main Section - Teams & VS */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 py-4 sm:py-6">
            {/* Home Team */}
            <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3 min-w-0">
              <span className={cn(
                'text-sm sm:text-base md:text-lg font-semibold text-right truncate max-w-[70px] sm:max-w-[100px] md:max-w-none',
                currentMatch.teams.home.id === FENERBAHCE_TEAM_ID 
                  ? 'text-yellow-400' 
                  : 'text-white'
              )}>
                {currentMatch.teams.home.name}
              </span>
              <Image
                src={currentMatch.teams.home.logo}
                alt={currentMatch.teams.home.name}
                width={56}
                height={56}
                className="object-contain w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex-shrink-0"
              />
            </div>
            
            {/* VS / Time */}
            <div className="px-2 sm:px-4 md:px-6 text-center flex-shrink-0">
              <div className="text-lg sm:text-xl text-slate-500">vs</div>
              <div className="text-xs sm:text-sm text-slate-500">{time}</div>
            </div>
            
            {/* Away Team */}
            <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
              <Image
                src={currentMatch.teams.away.logo}
                alt={currentMatch.teams.away.name}
                width={56}
                height={56}
                className="object-contain w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex-shrink-0"
              />
              <span className={cn(
                'text-sm sm:text-base md:text-lg font-semibold truncate max-w-[70px] sm:max-w-[100px] md:max-w-none',
                currentMatch.teams.away.id === FENERBAHCE_TEAM_ID 
                  ? 'text-yellow-400' 
                  : 'text-white'
              )}>
                {currentMatch.teams.away.name}
              </span>
            </div>
          </div>
          
          {/* Footer - Venue - Hidden on small screens */}
          {currentMatch.fixture.venue.name && (
            <div className="hidden sm:block text-center text-xs sm:text-sm text-slate-400 truncate">
              🏟️ {currentMatch.fixture.venue.name}{currentMatch.fixture.venue.city && `, ${currentMatch.fixture.venue.city}`}
            </div>
          )}
        </Link>
      </div>
      
      {/* Slider Dots */}
      <div className="flex justify-center gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-700/50">
        {matches.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={cn(
              'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors',
              idx === currentIndex 
                ? 'bg-yellow-400' 
                : 'bg-slate-600 hover:bg-slate-500'
            )}
          />
        ))}
      </div>
    </div>
  );
}
