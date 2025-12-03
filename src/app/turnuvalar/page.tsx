// Turnuvalar (Tournaments) Page
// Fenerbahçe Stats - FENER.CO

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  getFenerbahceLeagues,
  hasParticipationInSeason,
  TRACKED_LEAGUES, 
  getFenerbahceStatistics,
  getFenerbahceStanding
} from '@/lib/api/api-football';
import { 
  getCompetitionConfig, 
  formatSeasonDisplay, 
  getCurrentSeason,
  getAvailableSeasons,
  hasMultiplePhases,
  usesLeaguePhase,
  hasGroupStage
} from '@/lib/utils/round-utils';
import { SeasonSelector } from '@/components/tournaments/SeasonSelector';
import { LeagueWithSeasons, Standing } from '@/types/api-football';
import { Trophy, Calendar, TrendingUp, ChevronRight, Users } from 'lucide-react';

// Page metadata
export const metadata = {
  title: 'Turnuvalar | FENER.CO',
  description: 'Fenerbahçe\'nin mücadele ettiği tüm turnuvalar - Süper Lig, Türkiye Kupası, UEFA Şampiyonlar Ligi, Avrupa Ligi',
};

interface TurnuvalarPageProps {
  searchParams: { sezon?: string };
}

// Tournament type badges
function getTournamentTypeBadge(leagueId: number): { text: string; className: string } {
  const config = getCompetitionConfig(leagueId);
  
  if (!config) {
    return { text: 'Lig', className: 'bg-blue-500/20 text-blue-400' };
  }
  
  switch (config.type) {
    case 'league':
      return { text: 'Lig', className: 'bg-blue-500/20 text-blue-400' };
    case 'cup':
      return { text: 'Kupa', className: 'bg-amber-500/20 text-amber-400' };
    case 'uefa':
      return { text: 'UEFA', className: 'bg-purple-500/20 text-purple-400' };
    default:
      return { text: 'Turnuva', className: 'bg-gray-500/20 text-gray-400' };
  }
}

// Format indicator for competition
function getFormatIndicator(leagueId: number): string {
  if (usesLeaguePhase(leagueId)) {
    return 'Lig Aşaması + Eleme';
  }
  if (hasGroupStage(leagueId)) {
    return 'Grup + Eleme';
  }
  if (hasMultiplePhases(leagueId)) {
    return 'Çok Aşamalı';
  }
  return 'Lig Usulü';
}

// Tournament priority for sorting
function getTournamentPriority(leagueId: number): number {
  const priorities: Record<number, number> = {
    [TRACKED_LEAGUES.SUPER_LIG]: 1,
    [TRACKED_LEAGUES.CHAMPIONS_LEAGUE]: 2,
    [TRACKED_LEAGUES.EUROPA_LEAGUE]: 3,
    [TRACKED_LEAGUES.CONFERENCE_LEAGUE]: 4,
    [TRACKED_LEAGUES.TURKISH_CUP]: 5,
  };
  return priorities[leagueId] || 99;
}

// Get league name by ID (fallback for missing leagues)
function getLeagueNameById(leagueId: number): string {
  const names: Record<number, string> = {
    [TRACKED_LEAGUES.SUPER_LIG]: 'Süper Lig',
    [TRACKED_LEAGUES.CHAMPIONS_LEAGUE]: 'UEFA Champions League',
    [TRACKED_LEAGUES.EUROPA_LEAGUE]: 'UEFA Europa League',
    [TRACKED_LEAGUES.CONFERENCE_LEAGUE]: 'UEFA Europa Conference League',
    [TRACKED_LEAGUES.TURKISH_CUP]: 'Türkiye Kupası',
  };
  return names[leagueId] || 'Unknown League';
}

// Interface for league data with stats
interface LeagueWithStats {
  league: LeagueWithSeasons;
  hasParticipation: boolean;
  stats: {
    played: number;
    wins: number;
    draws: number;
    losses: number;
  } | null;
  standing: {
    rank: number;
    points: number;
  } | null;
}

export default async function TurnuvalarPage({ searchParams }: TurnuvalarPageProps) {
  const currentSeason = getCurrentSeason();
  const selectedSeason = searchParams.sezon ? parseInt(searchParams.sezon) : currentSeason;
  
  // Tracked league IDs we want to show
  const trackedLeagueIds = Object.values(TRACKED_LEAGUES);
  
  // Get all leagues Fenerbahçe has participated in (SINGLE API CALL)
  let allFenerbahceLeagues: LeagueWithSeasons[] = [];
  try {
    allFenerbahceLeagues = await getFenerbahceLeagues();
  } catch (error) {
    console.error('Error fetching Fenerbahçe leagues:', error);
  }
  
  // Filter to only tracked leagues and sort by priority
  const trackedLeagueIdsArray = trackedLeagueIds as number[];
  const trackedLeagues = allFenerbahceLeagues
    .filter(league => trackedLeagueIdsArray.includes(league.id))
    .sort((a, b) => getTournamentPriority(a.id) - getTournamentPriority(b.id));
  
  // Add any tracked leagues that FB hasn't participated in (for display purposes)
  const missingLeagueIds = trackedLeagueIdsArray.filter(
    id => !trackedLeagues.some(l => l.id === id)
  );
  
  // Create placeholder entries for missing leagues
  const missingLeagues = missingLeagueIds.map(id => ({
    id,
    name: getLeagueNameById(id),
    type: 'Cup' as const,
    logo: `https://media.api-sports.io/football/leagues/${id}.png`,
    country: { name: 'World', code: '', flag: '' },
    seasons: [] as LeagueWithSeasons['seasons'],
  })) as LeagueWithSeasons[];
  
  const allLeagues = [...trackedLeagues, ...missingLeagues].sort(
    (a, b) => getTournamentPriority(a.id) - getTournamentPriority(b.id)
  );
  
  // Helper function to add delay between API calls
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Fetch stats and standings for each league (only if participated)
  const leaguesWithData: LeagueWithStats[] = [];
  
  for (const league of allLeagues) {
    // Check participation from seasons array (NO API CALL)
    const hasParticipation = hasParticipationInSeason(league, selectedSeason);
    
    // Get team statistics (only if participated)
    let teamStats = null;
    if (hasParticipation) {
      try {
        teamStats = await getFenerbahceStatistics(league.id, selectedSeason);
      } catch (statsError) {
        console.error(`League ${league.id} stats error:`, statsError);
      }
      await delay(100);
    }
    
    // Get standings position (only if participated)
    let standingData = null;
    if (hasParticipation) {
      try {
        standingData = await getFenerbahceStanding(league.id, selectedSeason);
      } catch (standingError) {
        console.error(`League ${league.id} standing error:`, standingError);
      }
      await delay(100);
    }
    
    leaguesWithData.push({
      league,
      hasParticipation,
      stats: teamStats ? {
        played: teamStats.fixtures.played.total,
        wins: teamStats.fixtures.wins.total,
        draws: teamStats.fixtures.draws.total,
        losses: teamStats.fixtures.loses.total,
      } : null,
      standing: standingData ? {
        rank: standingData.rank,
        points: standingData.points,
      } : null,
    });
  }
  
  // Filter to only show leagues where Fenerbahçe participated
  const activeLeagues = leaguesWithData.filter(l => l.hasParticipation);
  const inactiveLeagues = leaguesWithData.filter(l => !l.hasParticipation);
  
  // Get all available seasons across all leagues
  const allSeasons = new Set<number>();
  Object.values(TRACKED_LEAGUES).forEach(leagueId => {
    getAvailableSeasons(leagueId).forEach(s => allSeasons.add(s));
  });
  const availableSeasons = Array.from(allSeasons).sort((a, b) => b - a);
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Turnuvalar</h1>
              <p className="text-slate-400 mt-1">
                Fenerbahçe'nin mücadele ettiği turnuvalar ({formatSeasonDisplay(selectedSeason)})
              </p>
            </div>
            
            {/* Season Selector */}
            <SeasonSelector 
              seasons={availableSeasons}
              selectedSeason={selectedSeason}
              baseUrl="/turnuvalar"
            />
          </div>
        </div>
      </div>
      
      {/* Active Tournament Grid */}
      <div className="container mx-auto px-4 py-8">
        {activeLeagues.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">
              {formatSeasonDisplay(selectedSeason)} sezonunda turnuva bilgisi bulunamadı.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeLeagues.map(({ league, stats, standing }) => {
                const config = getCompetitionConfig(league.id);
                const badge = getTournamentTypeBadge(league.id);
                const formatText = getFormatIndicator(league.id);
                
                return (
                  <Link
                    key={league.id}
                    href={`/turnuvalar/${league.id}?sezon=${selectedSeason}`}
                    className="group relative overflow-hidden bg-slate-800/50 rounded-xl border 
                              border-slate-700/50 hover:border-yellow-500/50
                              transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/10
                              flex flex-col h-full"
                  >
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 to-transparent" />
                    
                    {/* Content - flex-1 to fill available space */}
                    <div className="relative p-6 flex flex-col flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        {/* League Logo */}
                        <div className="w-16 h-16 relative bg-white/5 rounded-lg p-2 
                                        group-hover:bg-white/10 transition-colors">
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
                        
                        {/* Type Badge */}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                          {badge.text}
                        </span>
                      </div>
                      
                      {/* League Name */}
                      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-yellow-400 transition-colors">
                        {config?.nameTr || league.name}
                      </h3>
                      
                      {/* Country */}
                      {league.country && (
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                          {league.country.flag && (
                            <Image
                              src={league.country.flag}
                              alt={league.country.name}
                              width={16}
                              height={12}
                              className="rounded-sm"
                            />
                          )}
                          <span>{league.country.name}</span>
                        </div>
                      )}
                      
                      {/* Stats Section - Always show */}
                      <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-slate-900/50 rounded-lg">
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">{stats?.played ?? '-'}</div>
                          <div className="text-xs text-slate-500">Maç</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-400">{stats?.wins ?? '-'}</div>
                          <div className="text-xs text-slate-500">Galibiyet</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-amber-400">{stats?.draws ?? '-'}</div>
                          <div className="text-xs text-slate-500">Beraberlik</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-400">{stats?.losses ?? '-'}</div>
                          <div className="text-xs text-slate-500">Mağlubiyet</div>
                        </div>
                      </div>
                      
                      {/* Standing Info */}
                      {standing && (
                        <div className="flex items-center gap-3 mb-4 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <TrendingUp className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400 text-sm font-medium">
                            {standing.rank}. sıra • {standing.points} puan
                          </span>
                        </div>
                      )}
                      
                      {/* Format Info */}
                      <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                        <Calendar className="w-4 h-4" />
                        <span>{formatText}</span>
                      </div>
                      
                      {/* Spacer - pushes footer to bottom */}
                      <div className="flex-1" />
                      
                      {/* Footer - Always at bottom */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50 mt-auto">
                        <span className="text-slate-400 text-sm">
                          {formatSeasonDisplay(selectedSeason)}
                        </span>
                        <span className="flex items-center gap-1 text-yellow-400 text-sm font-medium 
                                        group-hover:gap-2 transition-all">
                          Detaylar
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                    
                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/5 to-transparent 
                                    opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </Link>
                );
              })}
            </div>
            
            {/* Inactive Leagues Section */}
            {inactiveLeagues.length > 0 && (
              <div className="mt-12">
                <h2 className="text-lg font-semibold text-slate-400 mb-4">
                  Bu Sezon Mücadele Edilmeyen Turnuvalar
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inactiveLeagues.map(({ league }) => {
                    const config = getCompetitionConfig(league.id);
                    const badge = getTournamentTypeBadge(league.id);
                    
                    return (
                      <div
                        key={league.id}
                        className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30 opacity-60"
                      >
                        <div className="w-10 h-10 relative bg-white/5 rounded-lg p-1 flex-shrink-0">
                          {league.logo ? (
                            <Image 
                              src={league.logo} 
                              alt={league.name} 
                              fill 
                              className="object-contain brightness-0 invert opacity-50" 
                            />
                          ) : (
                            <Trophy className="w-full h-full text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-slate-400 font-medium truncate">
                            {config?.nameTr || league.name}
                          </h4>
                          <p className="text-slate-600 text-sm">
                            {formatSeasonDisplay(selectedSeason)} sezonunda katılım yok
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.className} opacity-50`}>
                          {badge.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Competition Format Legend */}
        <div className="mt-12 p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Turnuva Formatları</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div>
                <p className="text-white font-medium">Lig Usulü</p>
                <p className="text-slate-400 text-sm">Her takım birbirleriyle 2'şer maç yapar</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
              <div>
                <p className="text-white font-medium">Lig Aşaması (Swiss)</p>
                <p className="text-slate-400 text-sm">36 takım, 8 farklı rakip, tek tablo</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
              <div>
                <p className="text-white font-medium">Grup Aşaması</p>
                <p className="text-slate-400 text-sm">Gruplar halinde mücadele</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="text-white font-medium">Eleme Turları</p>
                <p className="text-slate-400 text-sm">Tek maç veya çift maç eleme</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
