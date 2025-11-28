'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FixtureEvent } from '@/types';
import { cn, getEventEmoji, getEventText, shortenName } from '@/lib/utils';
import { FENERBAHCE_TEAM_ID } from '@/lib/constants';

interface TimelineSectionProps {
  events: FixtureEvent[];
  homeTeamId: number;
  awayTeamId: number;
}

// Filtre tipleri
type FilterType = 'all' | 'goal' | 'subst' | 'card';

const filterOptions: { id: FilterType; label: string; icon: string }[] = [
  { id: 'all', label: 'Tümü', icon: '📋' },
  { id: 'goal', label: 'Gol', icon: '⚽' },
  { id: 'subst', label: 'Değişiklik', icon: '🔄' },
  { id: 'card', label: 'Kart', icon: '🟨' },
];

export function TimelineSection({ events, homeTeamId, awayTeamId }: TimelineSectionProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  // Olayları filtrele
  const filteredEvents = events.filter(event => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'goal') return event.type === 'Goal';
    if (activeFilter === 'subst') return event.type === 'subst';
    if (activeFilter === 'card') return event.type === 'Card';
    return true;
  });
  
  // Olayları dakikaya göre ters sırala (son olay en üstte)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const timeA = a.time.elapsed + (a.time.extra || 0);
    const timeB = b.time.elapsed + (b.time.extra || 0);
    return timeB - timeA;
  });
  
  // Her filtre için olay sayısını hesapla
  const getEventCount = (filter: FilterType): number => {
    if (filter === 'all') return events.length;
    if (filter === 'goal') return events.filter(e => e.type === 'Goal').length;
    if (filter === 'subst') return events.filter(e => e.type === 'subst').length;
    if (filter === 'card') return events.filter(e => e.type === 'Card').length;
    return 0;
  };
  
  if (events.length === 0) {
    return (
      <div className="card p-4 flex-1">
        <h3 className="section-title text-lg mb-4">DAKİKA DAKİKA</h3>
        <p className="text-gray-400 text-center py-4">Henüz olay yok</p>
      </div>
    );
  }
  
  return (
    <div className="card p-4 flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title text-lg">DAKİKA DAKİKA</h3>
      </div>
      
      {/* Filter Buttons */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {filterOptions.map(filter => {
          const count = getEventCount(filter.id);
          const isActive = activeFilter === filter.id;
          
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                isActive
                  ? 'bg-fb-navy text-fb-yellow'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                isActive ? 'bg-fb-yellow/20 text-fb-yellow' : 'bg-gray-700 text-gray-400'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Scrollable container */}
      <div className="flex-1 overflow-y-auto max-h-[400px] lg:max-h-[500px] pr-2 custom-scrollbar">
        {sortedEvents.length === 0 ? (
          <p className="text-gray-400 text-center py-4">
            {activeFilter === 'goal' && 'Gol yok'}
            {activeFilter === 'subst' && 'Değişiklik yok'}
            {activeFilter === 'card' && 'Kart yok'}
          </p>
        ) : (
          <div className="space-y-1">
            {sortedEvents.map((event, index) => {
              const isFenerbahce = event.team.id === FENERBAHCE_TEAM_ID;
              const minute = event.time.elapsed + (event.time.extra ? `+${event.time.extra}` : '');
              const emoji = getEventEmoji(event.type, event.detail);
              const eventText = getEventText(event.type, event.detail);
              
              // Gol eventi için özel stil
              const isGoal = event.type === 'Goal' && event.detail !== 'Missed Penalty';
              const isRedCard = event.type === 'Card' && event.detail?.includes('Red');
              
              return (
                <div 
                  key={index}
                  className={cn(
                    'timeline-event',
                    isGoal && isFenerbahce && 'bg-fb-navy/20 rounded-lg',
                    isGoal && !isFenerbahce && 'bg-gray-800/30 rounded-lg',
                    isRedCard && 'bg-red-900/20 rounded-lg'
                  )}
                >
                  {/* Minute */}
                  <div className="timeline-minute">
                    {minute}'
                  </div>
                  
                  {/* Icon */}
                  <div className={cn(
                    'timeline-icon',
                    isGoal && 'scale-125'
                  )}>
                    {emoji}
                  </div>
                  
                  {/* Content */}
                  <div className="timeline-content">
                    <div className="flex items-center gap-2">
                      <Image
                        src={event.team.logo}
                        alt={event.team.name}
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                      <span className={cn(
                        'font-medium',
                        isFenerbahce && 'text-fb-yellow'
                      )}>
                        {shortenName(event.player.name)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-400 mt-0.5">
                      {eventText}
                      {event.type === 'Goal' && event.assist.name && (
                        <span className="text-gray-500"> (Asist: {shortenName(event.assist.name)})</span>
                      )}
                      {event.type === 'subst' && event.assist.name && (
                        <span className="text-gray-500"> ↔ {shortenName(event.assist.name)}</span>
                      )}
                    </p>
                    
                    {event.comments && (
                      <p className="text-xs text-gray-500 mt-1">{event.comments}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
