import { Suspense } from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { TopScorersList, StandingsTable, LoadingTable } from '@/components';
import { 
  getCachedStandings, 
  getCachedTopScorers, 
  getCachedTopAssists,
  getCachedFenerbahceFixtures
} from '@/lib/api';
import { TRACKED_LEAGUES, TRANSLATIONS, CURRENT_SEASON, FENERBAHCE_TEAM_ID } from '@/lib/constants';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'İstatistikler',
  description: 'Fenerbahçe ve Süper Lig istatistikleri',
};

export const revalidate = 3600; // 1 hour

const CALLER_PAGE = 'istatistik';

async function FenerbahceStatsSection() {
  const fixtures = await getCachedFenerbahceFixtures(CURRENT_SEASON, CALLER_PAGE);
  
  // Biten maçlar
  const finishedMatches = fixtures.filter(f => 
    ['FT', 'AET', 'PEN'].includes(f.fixture.status.short)
  );
  
  // İstatistikleri hesapla
  let wins = 0, draws = 0, losses = 0;
  let goalsFor = 0, goalsAgainst = 0;
  let homeWins = 0, awayWins = 0;
  let cleanSheets = 0;
  
  finishedMatches.forEach(match => {
    const isFBHome = match.teams.home.id === FENERBAHCE_TEAM_ID;
    const fbGoals = isFBHome ? match.goals.home! : match.goals.away!;
    const oppGoals = isFBHome ? match.goals.away! : match.goals.home!;
    
    goalsFor += fbGoals;
    goalsAgainst += oppGoals;
    
    if (oppGoals === 0) cleanSheets++;
    
    if (fbGoals > oppGoals) {
      wins++;
      if (isFBHome) homeWins++;
      else awayWins++;
    } else if (fbGoals === oppGoals) {
      draws++;
    } else {
      losses++;
    }
  });
  
  const points = wins * 3 + draws;
  const avgGoalsFor = finishedMatches.length > 0 ? (goalsFor / finishedMatches.length).toFixed(1) : '0';
  const avgGoalsAgainst = finishedMatches.length > 0 ? (goalsAgainst / finishedMatches.length).toFixed(1) : '0';
  
  return (
    <div className="card p-6">
      <h2 className="section-title text-xl mb-6">FENERBAHÇE SEZON ÖZETİ</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/10 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-fb-yellow">{finishedMatches.length}</p>
          <p className="text-xs text-gray-500">Maç</p>
        </div>
        <div className="bg-white/10 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">{points}</p>
          <p className="text-xs text-gray-500">Puan</p>
        </div>
        <div className="bg-white/10 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{wins}</p>
          <p className="text-xs text-gray-500">Galibiyet</p>
        </div>
        <div className="bg-white/10 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-fb-yellow">{goalsFor}</p>
          <p className="text-xs text-gray-500">Atılan Gol</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-400">{draws}</p>
          <p className="text-xs text-gray-500">Beraberlik</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-red-400">{losses}</p>
          <p className="text-xs text-gray-500">Mağlubiyet</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-red-400">{goalsAgainst}</p>
          <p className="text-xs text-gray-500">Yenen Gol</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-green-400">{cleanSheets}</p>
          <p className="text-xs text-gray-500">Gol Yemeden</p>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">Gol Ortalaması</p>
            <p className="text-lg font-bold text-fb-yellow">{avgGoalsFor}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Yenilen Gol Ort.</p>
            <p className="text-lg font-bold text-gray-400">{avgGoalsAgainst}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">İç Saha Galibiyet</p>
            <p className="text-lg font-bold text-green-400">{homeWins}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Deplasman Galibiyet</p>
            <p className="text-lg font-bold text-green-400">{awayWins}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

async function LeagueStatsSection() {
  const [standings, topScorers, topAssists] = await Promise.all([
    getCachedStandings(TRACKED_LEAGUES.SUPER_LIG, CURRENT_SEASON, CALLER_PAGE),
    getCachedTopScorers(TRACKED_LEAGUES.SUPER_LIG, CURRENT_SEASON, CALLER_PAGE),
    getCachedTopAssists(TRACKED_LEAGUES.SUPER_LIG, CURRENT_SEASON, CALLER_PAGE),
  ]);
  
  return (
    <div className="space-y-6">
      <h2 className="section-title text-xl">SÜPER LİG İSTATİSTİKLERİ</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopScorersList 
          scorers={topScorers} 
          type="goals"
          maxItems={10}
          leagueId={TRACKED_LEAGUES.SUPER_LIG}
        />
        <TopScorersList 
          scorers={topAssists} 
          type="assists"
          maxItems={10}
          leagueId={TRACKED_LEAGUES.SUPER_LIG}
        />
      </div>
      
      {standings && (
        <div className="card p-4">
          <h3 className="section-title text-lg mb-4">PUAN DURUMU</h3>
          <StandingsTable 
            standings={standings.league.standings[0] || []} 
            leagueId={TRACKED_LEAGUES.SUPER_LIG}
          />
        </div>
      )}
    </div>
  );
}

export default async function StatisticsPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-bold text-3xl md:text-4xl text-white mb-2">
          <span className="text-fb-yellow">İSTATİSTİKLER</span>
        </h1>
        <p className="text-gray-400">
          {CURRENT_SEASON}-{CURRENT_SEASON + 1} Sezonu detaylı istatistikleri
        </p>
      </div>
      
      {/* Fenerbahçe Stats */}
      <Suspense fallback={<LoadingTable rows={4} />}>
        <FenerbahceStatsSection />
      </Suspense>
      
      {/* League Stats */}
      <Suspense fallback={<LoadingTable rows={10} />}>
        <LeagueStatsSection />
      </Suspense>
    </div>
  );
}
