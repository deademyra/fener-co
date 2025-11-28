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
    <div className="card p-6 flex flex-col h-full">
      {/* Title with Arrow Navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">SIRADAKİ MAÇLAR</h2>
        {/* Arrow Buttons */}
        <div className="flex items-center gap-1">
          <button 
            onClick={goPrev}
            disabled={currentIndex === 0}
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-full transition-colors',
              currentIndex === 0 
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
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
              'w-8 h-8 flex items-center justify-center rounded-full transition-colors',
              currentIndex === matches.length - 1 
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Image
                src={currentMatch.league.logo}
                alt={leagueName}
                width={24}
                height={24}
                className="object-contain dark:brightness-0 dark:invert max-h-6"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {leagueName}
                {currentMatch.league.round && <span className="text-gray-400"> • {currentMatch.league.round}</span>}
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-900 dark:text-white">{date}</span>
              <span className="text-sm text-fb-yellow font-medium ml-2">{time}</span>
            </div>
          </div>
          
          {/* Main Section - Teams & VS */}
          <div className="flex items-center justify-center gap-4 py-6">
            {/* Home Team */}
            <div className="flex-1 flex items-center justify-end gap-3">
              <span className={cn(
                'text-lg font-semibold text-right',
                currentMatch.teams.home.id === FENERBAHCE_TEAM_ID 
                  ? 'text-fb-navy dark:text-fb-yellow' 
                  : 'text-gray-900 dark:text-white'
              )}>
                {currentMatch.teams.home.name}
              </span>
              <Image
                src={currentMatch.teams.home.logo}
                alt={currentMatch.teams.home.name}
                width={56}
                height={56}
                className="object-contain max-h-14"
              />
            </div>
            
            {/* VS / Time - Saat gri ve küçük */}
            <div className="px-6 text-center">
              <div className="text-xl text-gray-400 dark:text-gray-500">vs</div>
              <div className="text-sm text-gray-400 dark:text-gray-500">{time}</div>
            </div>
            
            {/* Away Team */}
            <div className="flex-1 flex items-center gap-3">
              <Image
                src={currentMatch.teams.away.logo}
                alt={currentMatch.teams.away.name}
                width={56}
                height={56}
                className="object-contain max-h-14"
              />
              <span className={cn(
                'text-lg font-semibold',
                currentMatch.teams.away.id === FENERBAHCE_TEAM_ID 
                  ? 'text-fb-navy dark:text-fb-yellow' 
                  : 'text-gray-900 dark:text-white'
              )}>
                {currentMatch.teams.away.name}
              </span>
            </div>
          </div>
          
          {/* Footer - Venue */}
          {currentMatch.fixture.venue.name && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              🏟️ {currentMatch.fixture.venue.name}{currentMatch.fixture.venue.city && `, ${currentMatch.fixture.venue.city}`}
            </div>
          )}
        </Link>
      </div>
      
      {/* Slider Dots */}
      <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {matches.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              idx === currentIndex 
                ? 'bg-fb-navy dark:bg-fb-yellow' 
                : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
            )}
          />
        ))}
      </div>
    </div>
  );
}
