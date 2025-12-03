import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getCachedFixtureById, getCachedHeadToHead } from '@/lib/api';
import { getCachedPredictions } from '@/lib/api/predictions';
import { 
  cn, 
  formatMatchDateTime, 
  getStatusText, 
  isLive, 
  isFinished,
  formatGoalScorers,
} from '@/lib/utils';
import { FENERBAHCE_TEAM_ID, TRANSLATIONS } from '@/lib/constants';
import { 
  MatchDetailTabs,
  MatchStatisticsSection,
  TopPlayersSection,
  TimelineSection,
  LineupSection,
  PlayerStatsSection,
  XGDisplay,
  MatchPreview,
  HeadToHeadStats,
} from './components';

const CALLER_PAGE = 'maclar/[id]';

interface MatchDetailPageProps {
  params: { id: string };
  searchParams: { tab?: string };
}

export async function generateMetadata({ params }: MatchDetailPageProps): Promise<Metadata> {
  const fixture = await getCachedFixtureById(parseInt(params.id), CALLER_PAGE);
  
  if (!fixture) {
    return { title: 'Maç Bulunamadı' };
  }
  
  return {
    title: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
    description: `${fixture.teams.home.name} - ${fixture.teams.away.name} maç detayları, istatistikler ve kadro bilgileri`,
  };
}

export const revalidate = 60;

export default async function MatchDetailPage({ params, searchParams }: MatchDetailPageProps) {
  const fixture = await getCachedFixtureById(parseInt(params.id), CALLER_PAGE);
  
  if (!fixture) {
    notFound();
  }
  
  const activeTab = searchParams.tab || 'macdetay';
  const { time, full } = formatMatchDateTime(fixture.fixture.date);
  const isLiveMatch = isLive(fixture.fixture.status.short);
  const isFinishedMatch = isFinished(fixture.fixture.status.short);
  const isPreMatch = !isLiveMatch && !isFinishedMatch;
  const isFBHome = fixture.teams.home.id === FENERBAHCE_TEAM_ID;
  const isFBAway = fixture.teams.away.id === FENERBAHCE_TEAM_ID;
  const isFenerbahceMatch = isFBHome || isFBAway;
  
  const leagueName = TRANSLATIONS.leagues[fixture.league.id as keyof typeof TRANSLATIONS.leagues] 
    || fixture.league.name;
  
  const homeGoals = fixture.events 
    ? formatGoalScorers(fixture.events, fixture.teams.home.id)
    : '';
  const awayGoals = fixture.events
    ? formatGoalScorers(fixture.events, fixture.teams.away.id)
    : '';
  
  // Fetch predictions and H2H data for pre-match only (not for live matches)
  let predictions = null;
  let h2hMatches = null;
  
  if (isPreMatch) {
    // Fetch in parallel
    const [predictionsData, h2hData] = await Promise.all([
      getCachedPredictions(fixture.fixture.id, CALLER_PAGE),
      getCachedHeadToHead(fixture.teams.home.id, fixture.teams.away.id, 10, CALLER_PAGE),
    ]);
    
    predictions = predictionsData;
    h2hMatches = h2hData;
  }
  
  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Match Header */}
      <div className="card p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
        {/* League & Status */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center flex-shrink-0">
              <Image 
                src={fixture.league.logo} 
                alt="" 
                width={24} 
                height={24} 
                className="dark-logo-filter max-h-5 sm:max-h-6 w-auto object-contain"
              />
            </div>
            <span className="text-fb-yellow font-medium text-sm sm:text-base truncate">{leagueName}</span>
            {fixture.league.round && (
              <span className="hidden sm:inline text-gray-500 text-sm">• {fixture.league.round}</span>
            )}
          </div>
          
          {isLiveMatch ? (
            <span className="badge badge-live text-xs sm:text-sm">
              <span className="w-2 h-2 bg-red-400 rounded-full mr-1.5 sm:mr-2 animate-pulse-live" />
              {getStatusText(fixture.fixture.status.short, fixture.fixture.status.elapsed)}
            </span>
          ) : (
            <span className="text-xs sm:text-sm text-gray-400 flex-shrink-0">{full}</span>
          )}
        </div>
        
        {/* Teams & Score */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 md:gap-12 mb-4 sm:mb-6">
          {/* Home */}
          <div className="flex-1 flex flex-col items-center min-w-0">
            <div className={cn(
              'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-white/10 p-2 sm:p-3 mb-2 sm:mb-3 flex-shrink-0',
              isFBHome && 'ring-2 ring-fb-yellow/30'
            )}>
              <Image
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                width={80}
                height={80}
                className="object-contain w-full h-full"
              />
            </div>
            <h2 className={cn(
              'font-display text-sm sm:text-xl md:text-2xl text-center truncate max-w-[100px] sm:max-w-none',
              isFBHome ? 'text-fb-yellow' : 'text-white'
            )}>
              {fixture.teams.home.name}
            </h2>
            {homeGoals && (
              <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2 text-center line-clamp-2">{homeGoals}</p>
            )}
          </div>
          
          {/* Score */}
          <div className="flex flex-col items-center flex-shrink-0">
            {isLiveMatch || isFinishedMatch ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className={cn(
                  'font-display text-3xl sm:text-5xl md:text-6xl',
                  isLiveMatch && 'text-fb-yellow'
                )}>
                  {fixture.goals.home ?? 0}
                </span>
                <span className="text-xl sm:text-3xl text-gray-500">-</span>
                <span className={cn(
                  'font-display text-3xl sm:text-5xl md:text-6xl',
                  isLiveMatch && 'text-fb-yellow'
                )}>
                  {fixture.goals.away ?? 0}
                </span>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-2xl sm:text-4xl font-display text-gray-500">VS</p>
                <p className="text-lg sm:text-xl font-display text-fb-yellow mt-1 sm:mt-2">{time}</p>
              </div>
            )}
            
            {/* Halftime */}
            {fixture.score.halftime.home !== null && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
                İY: {fixture.score.halftime.home} - {fixture.score.halftime.away}
              </p>
            )}
          </div>
          
          {/* Away */}
          <div className="flex-1 flex flex-col items-center min-w-0">
            <div className={cn(
              'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-white/10 p-2 sm:p-3 mb-2 sm:mb-3 flex-shrink-0',
              isFBAway && 'ring-2 ring-fb-yellow/30'
            )}>
              <Image
                src={fixture.teams.away.logo}
                alt={fixture.teams.away.name}
                width={80}
                height={80}
                className="object-contain w-full h-full"
              />
            </div>
            <h2 className={cn(
              'font-display text-sm sm:text-xl md:text-2xl text-center truncate max-w-[100px] sm:max-w-none',
              isFBAway ? 'text-fb-yellow' : 'text-white'
            )}>
              {fixture.teams.away.name}
            </h2>
            {awayGoals && (
              <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2 text-center line-clamp-2">{awayGoals}</p>
            )}
          </div>
        </div>
        
        {/* Venue & Referee */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
          {fixture.fixture.venue.name && (
            <span className="truncate max-w-[200px] sm:max-w-none">🏟️ {fixture.fixture.venue.name}, {fixture.fixture.venue.city}</span>
          )}
          {fixture.fixture.referee && (
            <span className="truncate">👤 {fixture.fixture.referee}</span>
          )}
        </div>
      </div>
      
      {/* Tab Navigation */}
      <MatchDetailTabs 
        activeTab={activeTab} 
        fixtureId={fixture.fixture.id}
        hasLineups={!!fixture.lineups && fixture.lineups.length === 2}
        hasPlayerStats={!!fixture.players && fixture.players.length > 0}
      />
      
      {/* Tab Content */}
      {activeTab === 'macdetay' && (
        <>
          {/* Pre-match: Show Match Preview and H2H */}
          {isPreMatch && (
            <div className="space-y-6 mb-6">
              {/* Match Preview (Önizleme) */}
              {predictions && predictions.teams && (
                <MatchPreview 
                  predictions={predictions}
                  homeTeam={fixture.teams.home}
                  awayTeam={fixture.teams.away}
                />
              )}
              
              {/* Head to Head Stats */}
              {h2hMatches && h2hMatches.length > 0 && (
                <HeadToHeadStats 
                  matches={h2hMatches}
                  homeTeam={fixture.teams.home}
                  awayTeam={fixture.teams.away}
                />
              )}
              
              {/* If no predictions or H2H, show a message */}
              {!predictions?.predictions?.percent && (!h2hMatches || h2hMatches.length === 0) && (
                <div className="card p-8 text-center">
                  <p className="text-gray-400">Maç öncesi veriler henüz yüklenmedi</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Maç istatistikleri, maç başladıktan sonra görüntülenecektir.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Finished Match: Show Statistics and Players */}
          {isFinishedMatch && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6" id="left-column">
                {/* xG Display */}
                {fixture.statistics && fixture.statistics.length === 2 && (
                  <XGDisplay 
                    homeStats={fixture.statistics[0]}
                    awayStats={fixture.statistics[1]}
                    homeTeam={fixture.teams.home}
                    awayTeam={fixture.teams.away}
                  />
                )}
                
                {/* Match Statistics */}
                {fixture.statistics && fixture.statistics.length === 2 && (
                  <MatchStatisticsSection
                    homeStats={fixture.statistics[0]}
                    awayStats={fixture.statistics[1]}
                  />
                )}
              </div>
              
              {/* Right Column */}
              <div className="space-y-6 flex flex-col">
                {/* Top Players */}
                {fixture.players && fixture.players.length > 0 && (
                  <TopPlayersSection
                    players={fixture.players}
                    homeTeamId={fixture.teams.home.id}
                    awayTeamId={fixture.teams.away.id}
                    isFenerbahceMatch={isFenerbahceMatch}
                  />
                )}
                
                {/* Timeline */}
                {fixture.events && fixture.events.length > 0 && (
                  <TimelineSection 
                    events={fixture.events}
                    homeTeamId={fixture.teams.home.id}
                    awayTeamId={fixture.teams.away.id}
                  />
                )}
              </div>
            </div>
          )}
          
          {/* Live Match: Show match data only (no Preview or H2H) */}
          {isLiveMatch && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* xG Display */}
                {fixture.statistics && fixture.statistics.length === 2 && (
                  <XGDisplay 
                    homeStats={fixture.statistics[0]}
                    awayStats={fixture.statistics[1]}
                    homeTeam={fixture.teams.home}
                    awayTeam={fixture.teams.away}
                  />
                )}
                
                {/* Match Statistics */}
                {fixture.statistics && fixture.statistics.length === 2 && (
                  <MatchStatisticsSection
                    homeStats={fixture.statistics[0]}
                    awayStats={fixture.statistics[1]}
                  />
                )}
              </div>
              
              {/* Right Column */}
              <div className="space-y-6">
                {/* Top Players */}
                {fixture.players && fixture.players.length > 0 && (
                  <TopPlayersSection
                    players={fixture.players}
                    homeTeamId={fixture.teams.home.id}
                    awayTeamId={fixture.teams.away.id}
                    isFenerbahceMatch={isFenerbahceMatch}
                  />
                )}
                
                {/* Timeline */}
                {fixture.events && fixture.events.length > 0 && (
                  <TimelineSection 
                    events={fixture.events}
                    homeTeamId={fixture.teams.home.id}
                    awayTeamId={fixture.teams.away.id}
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}
      
      {activeTab === 'kadro-dizilis' && fixture.lineups && fixture.lineups.length === 2 && (
        <LineupSection 
          homeLineup={fixture.lineups[0]} 
          awayLineup={fixture.lineups[1]}
          events={fixture.events || []}
          players={fixture.players}
        />
      )}
      
      {activeTab === 'futbolcu-istatistik' && fixture.players && fixture.players.length > 0 && (
        <PlayerStatsSection
          players={fixture.players}
          homeTeam={fixture.teams.home}
          awayTeam={fixture.teams.away}
          isFenerbahceMatch={isFenerbahceMatch}
        />
      )}
    </div>
  );
}
