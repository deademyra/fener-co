'use client';

import Image from 'next/image';
import { FixtureEvent } from '@/types';
import { cn, getEventEmoji, getEventText, shortenName } from '@/lib/utils';
import { FENERBAHCE_TEAM_ID } from '@/lib/constants';

interface TimelineSectionProps {
  events: FixtureEvent[];
  homeTeamId: number;
  awayTeamId: number;
}

export function TimelineSection({ events, homeTeamId, awayTeamId }: TimelineSectionProps) {
  // Olayları dakikaya göre ters sırala (son olay en üstte)
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = a.time.elapsed + (a.time.extra || 0);
    const timeB = b.time.elapsed + (b.time.extra || 0);
    return timeB - timeA;
  });
  
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
      <h3 className="section-title text-lg mb-4">DAKİKA DAKİKA</h3>
      
      {/* Scrollable container - flex-1 yaparak kalan alanı doldurur */}
      <div className="flex-1 overflow-y-auto max-h-[400px] lg:max-h-[500px] pr-2 custom-scrollbar">
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
      </div>
    </div>
  );
}
