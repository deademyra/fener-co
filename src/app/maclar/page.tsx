import { Suspense } from 'react';
import { Metadata } from 'next';
import { FixtureList, LoadingTable } from '@/components';
import { getCachedFenerbahceFixtures } from '@/lib/api';
import { CURRENT_SEASON, TRANSLATIONS } from '@/lib/constants';
import Link from 'next/link';
import Image from 'next/image';
import { cn, formatDate } from '@/lib/utils';
import { Fixture } from '@/types';

export const metadata: Metadata = {
  title: 'Maçlar',
  description: 'Fenerbahçe\'nin tüm maçları, fikstür ve sonuçları',
};

export const revalidate = 300; // 5 minutes

interface MatchesPageProps {
  searchParams: { tab?: string; league?: string };
}

async function MatchesContent({ tab, leagueFilter }: { tab: string; leagueFilter?: string }) {
  const fixtures = await getCachedFenerbahceFixtures(CURRENT_SEASON);
  
  // Tarihe göre sırala
  const sortedFixtures = [...fixtures].sort((a, b) => 
    new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
  );
  
  // League filtresi
  const filteredFixtures = leagueFilter 
    ? sortedFixtures.filter(f => f.league.id === parseInt(leagueFilter))
    : sortedFixtures;
  
  // Tab'a göre filtrele
  let displayFixtures: Fixture[] = [];
  
  if (tab === 'sonuclar') {
    displayFixtures = filteredFixtures
      .filter(f => ['FT', 'AET', 'PEN'].includes(f.fixture.status.short))
      .reverse();
  } else if (tab === 'fikstur') {
    displayFixtures = filteredFixtures
      .filter(f => ['NS', 'TBD'].includes(f.fixture.status.short));
  } else {
    displayFixtures = filteredFixtures;
  }
  
  // Ligleri grupla (filtre için)
  const leagues = [...new Map(fixtures.map(f => [f.league.id, f.league])).values()];
  
  // Ay'a göre grupla
  const groupedByMonth = displayFixtures.reduce((acc, fixture) => {
    const monthKey = formatDate(fixture.fixture.date, 'MMMM yyyy');
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(fixture);
    return acc;
  }, {} as Record<string, Fixture[]>);
  
  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {leagues.map(league => {
          const leagueName = TRANSLATIONS.leagues[league.id as keyof typeof TRANSLATIONS.leagues] || league.name;
          const isActive = leagueFilter === String(league.id);
          
          return (
            <Link
              key={league.id}
              href={`/maclar?tab=${tab}${isActive ? '' : `&league=${league.id}`}`}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors',
                isActive 
                  ? 'bg-fb-navy text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
            >
              <Image src={league.logo} alt="" width={16} height={16} />
              {leagueName}
            </Link>
          );
        })}
        {leagueFilter && (
          <Link
            href={`/maclar?tab=${tab}`}
            className="px-3 py-1.5 rounded-full text-sm bg-red-900/30 text-red-400 hover:bg-red-900/50"
          >
            Filtreyi Temizle ×
          </Link>
        )}
      </div>
      
      {/* Matches grouped by month */}
      {Object.keys(groupedByMonth).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedByMonth).map(([month, monthFixtures]) => (
            <div key={month}>
              <h3 className="text-lg font-display text-gray-400 mb-4 sticky top-16 bg-gray-950/90 backdrop-blur-sm py-2 z-10">
                {month}
              </h3>
              <FixtureList fixtures={monthFixtures} showLeague />
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-gray-400">Bu kriterlere uygun maç bulunamadı</p>
        </div>
      )}
    </div>
  );
}

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const tab = searchParams.tab || 'tumu';
  const leagueFilter = searchParams.league;
  
  const tabs = [
    { id: 'tumu', label: 'Tümü' },
    { id: 'fikstur', label: 'Fikstür' },
    { id: 'sonuclar', label: 'Sonuçlar' },
  ];
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl text-white mb-2">
          <span className="text-fb-yellow">FENERBAHÇE</span> MAÇLARI
        </h1>
        <p className="text-gray-400">
          {CURRENT_SEASON}-{CURRENT_SEASON + 1} Sezonu
        </p>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800">
        {tabs.map(t => (
          <Link
            key={t.id}
            href={`/maclar?tab=${t.id}${leagueFilter ? `&league=${leagueFilter}` : ''}`}
            className={cn(
              'tab',
              tab === t.id && 'tab-active'
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
      
      {/* Content */}
      <Suspense fallback={<LoadingTable rows={10} />}>
        <MatchesContent tab={tab} leagueFilter={leagueFilter} />
      </Suspense>
    </div>
  );
}
