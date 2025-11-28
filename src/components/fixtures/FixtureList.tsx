'use client';

import { Fixture } from '@/types';
import { MatchCard } from '@/components/match/MatchCard';
import { fixtureToMatchCard } from '@/lib/api/services';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

interface FixtureListProps {
  fixtures: Fixture[];
  title?: string;
  showViewAll?: boolean;
  viewAllLink?: string;
  compact?: boolean;
  maxItems?: number;
  showLeague?: boolean;
  showDate?: boolean;
  emptyMessage?: string;
}

export function FixtureList({
  fixtures,
  title,
  showViewAll = false,
  viewAllLink,
  compact = false,
  maxItems,
  showLeague = true,
  showDate = true,
  emptyMessage = 'Maç bulunamadı'
}: FixtureListProps) {
  const displayFixtures = maxItems ? fixtures.slice(0, maxItems) : fixtures;
  
  if (displayFixtures.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-gray-400">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div>
      {title && (
        <div className="section-header">
          <h2 className="section-title">{title}</h2>
          {showViewAll && viewAllLink && (
            <Link 
              href={viewAllLink}
              className="text-sm text-fb-yellow hover:text-fb-yellow-light transition-colors"
            >
              Tümünü gör →
            </Link>
          )}
        </div>
      )}
      
      <div className={cn(
        'grid gap-3',
        compact ? 'grid-cols-1' : 'grid-cols-1'
      )}>
        {displayFixtures.map((fixture) => (
          <MatchCard
            key={fixture.fixture.id}
            match={fixtureToMatchCard(fixture)}
            showLeague={showLeague}
            showDate={showDate}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

export function UpcomingFixtures({ fixtures, maxItems = 5 }: { fixtures: Fixture[]; maxItems?: number }) {
  return (
    <FixtureList
      fixtures={fixtures}
      title="YAKIN FİKSTÜR"
      showViewAll
      viewAllLink={ROUTES.MATCHES}
      maxItems={maxItems}
      showDate={true}
      emptyMessage="Yaklaşan maç bulunamadı"
    />
  );
}

export function RecentResults({ fixtures, maxItems = 5 }: { fixtures: Fixture[]; maxItems?: number }) {
  return (
    <FixtureList
      fixtures={fixtures}
      title="SON SONUÇLAR"
      showViewAll
      viewAllLink={`${ROUTES.MATCHES}?tab=oynanan`}
      maxItems={maxItems}
      showDate={true}
      emptyMessage="Sonuç bulunamadı"
    />
  );
}

export default FixtureList;
