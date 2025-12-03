// Tournament Standings Page
// Fenerbahçe Stats - FENER.CO

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { 
  getLeague, 
  getStandings,
  getGroupedStandings,
  TRACKED_LEAGUES
} from '@/lib/api/api-football';
import { 
  getCompetitionConfig, 
  formatSeasonDisplay, 
  getCurrentSeason,
  getAvailableSeasons,
  usesLeaguePhase,
  hasGroupStage
} from '@/lib/utils/round-utils';
import { SeasonSelector } from '@/components/tournaments/SeasonSelector';
import { StandingsTable } from '@/components/tournaments/StandingsTable';
import { LeagueWithSeasons, Standing } from '@/types/api-football';
import { ChevronLeft, Trophy } from 'lucide-react';

interface PuanDurumuPageProps {
  params: { id: string };
  searchParams: { sezon?: string };
}

export async function generateMetadata({ params }: PuanDurumuPageProps) {
  const leagueId = parseInt(params.id);
  const config = getCompetitionConfig(leagueId);
  
  return {
    title: `${config?.nameTr || 'Turnuva'} Puan Durumu | FENER.CO`,
    description: `${config?.nameTr || 'Turnuva'} güncel puan durumu tablosu`,
  };
}

export default async function PuanDurumuPage({ params, searchParams }: PuanDurumuPageProps) {
  const leagueId = parseInt(params.id);
  const currentSeason = getCurrentSeason();
  const selectedSeason = searchParams.sezon ? parseInt(searchParams.sezon) : currentSeason;
  
  // Get league info
  const league = await getLeague(leagueId);
  if (!league) {
    notFound();
  }
  
  const config = getCompetitionConfig(leagueId);
  const availableSeasons = config?.seasons || getAvailableSeasons(leagueId);
  
  // Determine format and fetch standings
  const isLeagueFormat = config?.format === 'league' || usesLeaguePhase(leagueId);
  const isGroupFormat = hasGroupStage(leagueId);
  
  let standings: Standing[][] | Record<string, Standing[]>;
  
  if (isGroupFormat && !usesLeaguePhase(leagueId)) {
    standings = await getGroupedStandings(leagueId, selectedSeason).catch(() => ({}));
  } else {
    standings = await getStandings(leagueId, selectedSeason).catch(() => []);
  }
  
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
                  Puan Durumu
                </h1>
                <p className="text-slate-400 mt-1">
                  {config?.nameTr || league.name} • {formatSeasonDisplay(selectedSeason)}
                </p>
              </div>
            </div>
            
            {/* Season Selector */}
            <SeasonSelector 
              seasons={availableSeasons}
              selectedSeason={selectedSeason}
              baseUrl={`/turnuvalar/${leagueId}/puan-durumu`}
            />
          </div>
        </div>
      </div>
      
      {/* Standings */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <StandingsTable
            standings={standings}
            isGroupFormat={isGroupFormat && !usesLeaguePhase(leagueId)}
            highlightTeamId={611}
            compact={false}
          />
        </div>
        
        {/* Format Info */}
        {config && (
          <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Format Bilgisi</h3>
            <p className="text-white">
              {config.format === 'league' && 'Lig usulü - Her takım birbirleriyle 2\'şer maç yapar, toplam puanlara göre sıralanır.'}
              {config.format === 'swiss' && 'Swiss sistemi (Lig Aşaması) - 36 takım, 8 farklı rakiple maç yapar. İlk 8 doğrudan son 16\'ya, 9-24 play-off\'a kalır.'}
              {config.format === 'hybrid' && 'Karma format - Grup aşaması sonrası eleme turları oynanır.'}
              {config.format === 'knockout' && 'Eleme usulü - Direkt eleme formatı.'}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
