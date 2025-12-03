// Tournament Fixtures Page
// Fenerbahçe Stats - FENER.CO

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { 
  getLeague, 
  getRounds,
  getFenerbahceFixtures,
  TRACKED_LEAGUES
} from '@/lib/api/api-football';
import { 
  getCompetitionConfig, 
  formatSeasonDisplay, 
  getCurrentSeason,
  getAvailableSeasons,
  groupRoundsByCategory,
  formatRoundDisplay
} from '@/lib/utils/round-utils';
import { SeasonSelector } from '@/components/tournaments/SeasonSelector';
import { FixturesList } from '@/components/tournaments/FixturesList';
import { RoundTabsDropdown } from '@/components/tournaments/RoundTabs';
import { Fixture } from '@/types/api-football';
import { ChevronLeft, Trophy, Calendar, Filter } from 'lucide-react';

interface FiksturPageProps {
  params: { id: string };
  searchParams: { sezon?: string; tur?: string };
}

export async function generateMetadata({ params }: FiksturPageProps) {
  const leagueId = parseInt(params.id);
  const config = getCompetitionConfig(leagueId);
  
  return {
    title: `${config?.nameTr || 'Turnuva'} Fikstür | FENER.CO`,
    description: `Fenerbahçe ${config?.nameTr || 'turnuva'} fikstürü ve maç programı`,
  };
}

export default async function FiksturPage({ params, searchParams }: FiksturPageProps) {
  const leagueId = parseInt(params.id);
  const currentSeason = getCurrentSeason();
  const selectedSeason = searchParams.sezon ? parseInt(searchParams.sezon) : currentSeason;
  const selectedRound = searchParams.tur || null;
  
  // Get league info
  const league = await getLeague(leagueId);
  if (!league) {
    notFound();
  }
  
  const config = getCompetitionConfig(leagueId);
  const availableSeasons = config?.seasons || getAvailableSeasons(leagueId);
  
  // Fetch data
  const [rounds, allFixtures] = await Promise.all([
    getRounds(leagueId, selectedSeason).catch(() => []),
    getFenerbahceFixtures(leagueId, selectedSeason).catch(() => []),
  ]);
  
  // Filter fixtures by selected round
  const fixtures = selectedRound
    ? allFixtures.filter(f => f.league.round === selectedRound)
    : allFixtures;
  
  // Group rounds by category
  const groupedRounds = groupRoundsByCategory(rounds, leagueId);
  
  // Separate upcoming and past fixtures
  const now = new Date();
  const upcomingFixtures = fixtures.filter(f => new Date(f.fixture.date) > now);
  const pastFixtures = fixtures.filter(f => new Date(f.fixture.date) <= now);
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <Link 
            href={`/turnuvalar/${leagueId}?sezon=${selectedSeason}`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{config?.nameTr || league.name}</span>
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Title */}
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 relative bg-white/10 rounded-xl p-2">
                {league.logo ? (
                  <Image
                    src={league.logo}
                    alt={league.name}
                    fill
                    className="object-contain p-1"
                  />
                ) : (
                  <Trophy className="w-full h-full text-slate-400" />
                )}
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Fenerbahçe Fikstürü
                </h1>
                <p className="text-slate-400 mt-1">
                  {config?.nameTr || league.name} • {formatSeasonDisplay(selectedSeason)}
                </p>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Round Filter */}
              {groupedRounds.size > 0 && (
                <RoundTabsDropdown
                  groupedRounds={groupedRounds}
                  leagueId={leagueId}
                  selectedRound={selectedRound}
                  baseUrl={`/turnuvalar/${leagueId}/fikstur?sezon=${selectedSeason}`}
                />
              )}
              
              {/* Season Selector */}
              <SeasonSelector 
                seasons={availableSeasons}
                selectedSeason={selectedSeason}
                baseUrl={`/turnuvalar/${leagueId}/fikstur`}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Fixtures */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Fixtures */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-semibold text-white">Gelecek Maçlar</h2>
              </div>
              <span className="text-sm text-slate-400">{upcomingFixtures.length} maç</span>
            </div>
            
            {upcomingFixtures.length > 0 ? (
              <FixturesList
                fixtures={upcomingFixtures}
                leagueId={leagueId}
                showRound={!selectedRound}
              />
            ) : (
              <div className="p-6 text-center text-slate-400">
                <p>Gelecek maç bulunamadı.</p>
              </div>
            )}
          </div>
          
          {/* Past Fixtures */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-semibold text-white">Oynanan Maçlar</h2>
              </div>
              <span className="text-sm text-slate-400">{pastFixtures.length} maç</span>
            </div>
            
            {pastFixtures.length > 0 ? (
              <FixturesList
                fixtures={pastFixtures.reverse()} // Most recent first
                leagueId={leagueId}
                showRound={!selectedRound}
              />
            ) : (
              <div className="p-6 text-center text-slate-400">
                <p>Henüz oynanan maç yok.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Summary Stats */}
        {pastFixtures.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const FB_ID = 611;
              let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
              
              pastFixtures.forEach(f => {
                const isHome = f.teams.home.id === FB_ID;
                const fbGoals = isHome ? (f.goals.home || 0) : (f.goals.away || 0);
                const oppGoals = isHome ? (f.goals.away || 0) : (f.goals.home || 0);
                
                goalsFor += fbGoals;
                goalsAgainst += oppGoals;
                
                if (fbGoals > oppGoals) wins++;
                else if (fbGoals < oppGoals) losses++;
                else draws++;
              });
              
              return (
                <>
                  <StatCard label="Galibiyet" value={wins} color="text-green-400" />
                  <StatCard label="Beraberlik" value={draws} color="text-amber-400" />
                  <StatCard label="Mağlubiyet" value={losses} color="text-red-400" />
                  <StatCard label="Gol Farkı" value={`${goalsFor}-${goalsAgainst}`} color="text-white" />
                </>
              );
            })()}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-slate-400 text-sm mt-1">{label}</p>
    </div>
  );
}
