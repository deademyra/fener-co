// Tournament Detail Page
// Fenerbahçe Stats - FENER.CO

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { 
  getLeague, 
  getRounds, 
  getCurrentRound,
  getStandings, 
  getFenerbahceFixtures,
  getGroupedStandings,
  getFixtures,
  getTopScorers,
  getTopAssists,
  getTopYellowCards,
  getTopRedCards,
  TRACKED_LEAGUES
} from '@/lib/api/api-football';
import { 
  getCompetitionConfig, 
  formatSeasonDisplay, 
  getCurrentSeason,
  getAvailableSeasons,
  groupRoundsByCategory,
  getStageCategoryDisplay,
  parseRound,
  usesLeaguePhase,
  hasGroupStage,
  formatRoundDisplay
} from '@/lib/utils/round-utils';
import { SeasonSelector } from '@/components/tournaments/SeasonSelector';
import { StandingsTable } from '@/components/tournaments/StandingsTable';
import { TournamentTabs } from '@/components/tournaments/TournamentTabs';
import { LeagueWithSeasons, Standing, Fixture, StageCategory } from '@/types/api-football';
import { ChevronLeft, Trophy, Calendar, MapPin } from 'lucide-react';

interface TurnuvaDetailPageProps {
  params: { id: string };
  searchParams: { sezon?: string; tab?: string; tur?: string };
}

// Generate metadata
export async function generateMetadata({ params }: TurnuvaDetailPageProps) {
  const leagueId = parseInt(params.id);
  const config = getCompetitionConfig(leagueId);
  
  return {
    title: `${config?.nameTr || 'Turnuva'} | FENER.CO`,
    description: `Fenerbahçe ${config?.nameTr || 'turnuva'} maçları, puan durumu ve istatistikleri`,
  };
}

export default async function TurnuvaDetailPage({ params, searchParams }: TurnuvaDetailPageProps) {
  const leagueId = parseInt(params.id);
  
  // Get league info first - this includes seasons with 'current' flag
  const league = await getLeague(leagueId);
  if (!league) {
    notFound();
  }
  
  const config = getCompetitionConfig(leagueId);
  
  // Get available seasons from API response, sorted newest to oldest
  const apiSeasons = league.seasons
    .map(s => typeof s.year === 'number' ? s.year : parseInt(s.year))
    .sort((a, b) => b - a);
  
  // Find the current season from API (where current: true)
  const currentSeasonFromApi = league.seasons.find(s => s.current === true);
  const currentSeasonYear = currentSeasonFromApi 
    ? (typeof currentSeasonFromApi.year === 'number' ? currentSeasonFromApi.year : parseInt(currentSeasonFromApi.year))
    : apiSeasons[0]; // Fallback to most recent
  
  // Determine selected season - use URL param or current season from API
  let selectedSeason = searchParams.sezon ? parseInt(searchParams.sezon) : currentSeasonYear;
  
  // If selected season is not available, fallback to current or most recent
  if (!apiSeasons.includes(selectedSeason) && apiSeasons.length > 0) {
    selectedSeason = currentSeasonYear || apiSeasons[0];
  }
  
  const selectedTab = searchParams.tab || 'matches';
  const selectedRound = searchParams.tur || null;
  
  // Fetch data in parallel
  const [rounds, currentRound, standingsData, fbFixtures] = await Promise.all([
    getRounds(leagueId, selectedSeason).catch(() => []),
    getCurrentRound(leagueId, selectedSeason).catch(() => null),
    usesLeaguePhase(leagueId) 
      ? getStandings(leagueId, selectedSeason).catch(() => [])
      : hasGroupStage(leagueId)
        ? getGroupedStandings(leagueId, selectedSeason).catch(() => ({}))
        : getStandings(leagueId, selectedSeason).catch(() => []),
    getFenerbahceFixtures(leagueId, selectedSeason).catch(() => []),
  ]);
  
  // Determine the round to display for matches
  const displayRound = selectedRound || currentRound || (rounds.length > 0 ? rounds[rounds.length - 1] : null);
  
  // Fetch fixtures for current round (all matches, not just FB)
  const roundFixtures = displayRound 
    ? await getFixtures(leagueId, selectedSeason, { round: displayRound }).catch(() => [])
    : [];
  
  // Fetch top players data for statistics tab
  const [topScorers, topAssists, topYellowCards, topRedCards] = await Promise.all([
    getTopScorers(leagueId, selectedSeason).catch(() => []),
    getTopAssists(leagueId, selectedSeason).catch(() => []),
    getTopYellowCards(leagueId, selectedSeason).catch(() => []),
    getTopRedCards(leagueId, selectedSeason).catch(() => []),
  ]);
  
  // Group rounds by category
  const groupedRounds = groupRoundsByCategory(rounds, leagueId);
  
  // Determine which standings view to show
  const isLeagueFormat = config?.format === 'league' || usesLeaguePhase(leagueId);
  const isGroupFormat = hasGroupStage(leagueId);
  
  // Get standings array (handle different formats)
  const standingsArray: Standing[] = Array.isArray(standingsData) 
    ? standingsData.flat()
    : Object.values(standingsData as Record<string, Standing[]>).flat();
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <Link 
            href="/turnuvalar"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Tüm Turnuvalar</span>
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* League Info */}
            <div className="flex items-center gap-6">
              {/* Logo */}
              <div className="w-20 h-20 relative bg-white/5 rounded-xl p-2">
                {league.logo ? (
                  <Image
                    src={league.logo}
                    alt={league.name}
                    fill
                    className="object-contain p-1 brightness-0 invert"
                  />
                ) : (
                  <Trophy className="w-full h-full text-slate-400" />
                )}
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {config?.nameTr || league.name}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-slate-400">
                  {league.country && (
                    <div className="flex items-center gap-2">
                      {league.country.flag && (
                        <Image
                          src={league.country.flag}
                          alt={league.country.name}
                          width={20}
                          height={14}
                          className="rounded-sm"
                        />
                      )}
                      <span>{league.country.name}</span>
                    </div>
                  )}
                  <span className="text-slate-600">•</span>
                  <span>{formatSeasonDisplay(selectedSeason)} Sezonu</span>
                </div>
              </div>
            </div>
            
            {/* Season Selector */}
            <SeasonSelector 
              seasons={apiSeasons}
              selectedSeason={selectedSeason}
              baseUrl={`/turnuvalar/${leagueId}`}
            />
          </div>
        </div>
      </div>
      
      {/* Main Content with Tabs */}
      <div className="container mx-auto px-4 py-8">
        <TournamentTabs
          leagueId={leagueId}
          selectedSeason={selectedSeason}
          selectedTab={selectedTab}
          selectedRound={displayRound}
          rounds={rounds}
          groupedRounds={groupedRounds}
          roundFixtures={roundFixtures}
          standingsData={standingsData}
          isGroupFormat={isGroupFormat}
          topScorers={topScorers}
          topAssists={topAssists}
          topYellowCards={topYellowCards}
          topRedCards={topRedCards}
        />
        
        {/* Competition Format Info */}
        {config && selectedTab === 'matches' && (
          <div className="mt-8 p-6 bg-slate-800/30 rounded-xl border border-slate-700/30">
            <h3 className="text-lg font-semibold text-white mb-4">Turnuva Formatı</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Format Type */}
              <div>
                <p className="text-slate-400 text-sm mb-1">Format</p>
                <p className="text-white font-medium">
                  {config.format === 'league' && 'Lig Usulü'}
                  {config.format === 'knockout' && 'Eleme Usulü'}
                  {config.format === 'hybrid' && 'Karma (Grup + Eleme)'}
                  {config.format === 'swiss' && 'Swiss Sistemi (Lig Aşaması + Eleme)'}
                </p>
              </div>
              
              {/* Phases */}
              <div>
                <p className="text-slate-400 text-sm mb-1">Aşamalar</p>
                <div className="flex flex-wrap gap-1">
                  {Array.from(groupedRounds.keys()).map(category => (
                    <span 
                      key={category}
                      className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-300"
                    >
                      {getStageCategoryDisplay(category, 'tr')}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Rounds Played */}
              <div>
                <p className="text-slate-400 text-sm mb-1">Oynanan Turlar</p>
                <p className="text-white font-medium">{rounds.length} tur</p>
              </div>
              
              {/* FB Matches */}
              <div>
                <p className="text-slate-400 text-sm mb-1">FB Maç Sayısı</p>
                <p className="text-white font-medium">{fbFixtures.length} maç</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
