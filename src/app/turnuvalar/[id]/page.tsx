import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  StandingsTable, 
  TopScorersList, 
  FixtureList,
  LoadingTable 
} from '@/components';
import { 
  getCachedStandings, 
  getCachedFixtures, 
  getCachedTopScorers,
  getCachedTopAssists
} from '@/lib/api';
import { TRACKED_LEAGUES, TRANSLATIONS, CURRENT_SEASON, ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface TournamentPageProps {
  params: { id: string };
  searchParams: { tab?: string };
}

export async function generateMetadata({ params }: TournamentPageProps): Promise<Metadata> {
  const leagueId = parseInt(params.id);
  const leagueName = TRANSLATIONS.leagues[leagueId as keyof typeof TRANSLATIONS.leagues];
  
  return {
    title: leagueName || 'Turnuva',
    description: `${leagueName || 'Turnuva'} puan durumu, fikstür ve istatistikleri`,
  };
}

export const revalidate = 3600; // 1 hour

async function StandingsContent({ leagueId }: { leagueId: number }) {
  const standings = await getCachedStandings(leagueId, CURRENT_SEASON);
  
  if (!standings || !standings.league.standings[0]) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-400">Puan durumu bilgisi bulunamadı</p>
      </div>
    );
  }
  
  return (
    <div className="card p-4">
      <StandingsTable standings={standings.league.standings[0]} />
    </div>
  );
}

async function FixturesContent({ leagueId, type }: { leagueId: number; type: 'upcoming' | 'results' }) {
  const fixtures = await getCachedFixtures(leagueId, CURRENT_SEASON);
  
  let filtered = fixtures;
  
  if (type === 'upcoming') {
    filtered = fixtures
      .filter(f => ['NS', 'TBD'].includes(f.fixture.status.short))
      .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());
  } else {
    filtered = fixtures
      .filter(f => ['FT', 'AET', 'PEN'].includes(f.fixture.status.short))
      .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime());
  }
  
  return (
    <FixtureList 
      fixtures={filtered.slice(0, 20)} 
      showLeague={false}
      emptyMessage={type === 'upcoming' ? 'Yaklaşan maç bulunamadı' : 'Sonuç bulunamadı'}
    />
  );
}

async function StatsContent({ leagueId }: { leagueId: number }) {
  const [topScorers, topAssists] = await Promise.all([
    getCachedTopScorers(leagueId, CURRENT_SEASON),
    getCachedTopAssists(leagueId, CURRENT_SEASON),
  ]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <TopScorersList 
        scorers={topScorers} 
        type="goals"
        maxItems={10}
        leagueId={leagueId}
      />
      <TopScorersList 
        scorers={topAssists} 
        type="assists"
        maxItems={10}
        leagueId={leagueId}
      />
    </div>
  );
}

export default async function TournamentDetailPage({ params, searchParams }: TournamentPageProps) {
  const leagueId = parseInt(params.id);
  const tab = searchParams.tab || 'puan-durumu';
  
  const leagueName = TRANSLATIONS.leagues[leagueId as keyof typeof TRANSLATIONS.leagues];
  
  if (!leagueName) {
    notFound();
  }
  
  const standings = await getCachedStandings(leagueId, CURRENT_SEASON);
  
  const tabs = [
    { id: 'puan-durumu', label: 'Puan Durumu' },
    { id: 'fikstur', label: 'Fikstür' },
    { id: 'sonuclar', label: 'Sonuçlar' },
    { id: 'istatistik', label: 'İstatistikler' },
  ];
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {standings?.league.logo && (
          <Image 
            src={standings.league.logo} 
            alt={leagueName} 
            width={64} 
            height={64}
            className="object-contain"
          />
        )}
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-fb-yellow">
            {leagueName}
          </h1>
          <p className="text-gray-400">
            {CURRENT_SEASON}-{CURRENT_SEASON + 1} Sezonu
          </p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800 overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <Link
            key={t.id}
            href={`/turnuvalar/${leagueId}?tab=${t.id}`}
            className={cn(
              'tab whitespace-nowrap',
              tab === t.id && 'tab-active'
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
      
      {/* Content */}
      {tab === 'puan-durumu' && (
        <Suspense fallback={<LoadingTable rows={20} />}>
          <StandingsContent leagueId={leagueId} />
        </Suspense>
      )}
      
      {tab === 'fikstur' && (
        <Suspense fallback={<LoadingTable rows={10} />}>
          <FixturesContent leagueId={leagueId} type="upcoming" />
        </Suspense>
      )}
      
      {tab === 'sonuclar' && (
        <Suspense fallback={<LoadingTable rows={10} />}>
          <FixturesContent leagueId={leagueId} type="results" />
        </Suspense>
      )}
      
      {tab === 'istatistik' && (
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LoadingTable rows={10} />
            <LoadingTable rows={10} />
          </div>
        }>
          <StatsContent leagueId={leagueId} />
        </Suspense>
      )}
    </div>
  );
}
