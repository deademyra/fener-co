import { Suspense } from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { LoadingCard } from '@/components';
import { getCachedStandings } from '@/lib/api';
import { TRACKED_LEAGUES, TRANSLATIONS, CURRENT_SEASON, ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Turnuvalar',
  description: 'Fenerbahçe\'nin katıldığı turnuvalar ve puan durumları',
};

export const revalidate = 3600; // 1 hour

interface TournamentCardProps {
  leagueId: number;
  name: string;
}

async function TournamentCard({ leagueId, name }: TournamentCardProps) {
  const standings = await getCachedStandings(leagueId, CURRENT_SEASON);
  
  // FB'nin sıralamasını bul
  const fbStanding = standings?.league.standings[0]?.find(s => s.team.id === 611);
  
  return (
    <Link href={ROUTES.TOURNAMENT_DETAIL(leagueId)}>
      <div className="card card-hover p-6 group">
        <div className="flex items-start justify-between mb-4">
          {standings?.league.logo && (
            <Image 
              src={standings.league.logo} 
              alt={name} 
              width={48} 
              height={48}
              className="object-contain"
            />
          )}
          <span className="text-xs text-gray-500">{CURRENT_SEASON}-{CURRENT_SEASON + 1}</span>
        </div>
        
        <h3 className="font-bold text-xl text-white group-hover:text-fb-yellow transition-colors mb-2">
          {name}
        </h3>
        
        {fbStanding && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Fenerbahçe Sıralaması</span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-2xl text-fb-yellow">
                  #{fbStanding.rank}
                </span>
                <span className="text-sm text-gray-500">
                  {fbStanding.points} puan
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-2 text-sm text-gray-500">
              <span className="text-green-400">{fbStanding.all.win}G</span>
              <span className="text-gray-400">{fbStanding.all.draw}B</span>
              <span className="text-red-400">{fbStanding.all.lose}M</span>
            </div>
          </div>
        )}
        
        {!fbStanding && (
          <p className="text-sm text-gray-500 mt-4">
            Puan durumu bilgisi bulunamadı
          </p>
        )}
      </div>
    </Link>
  );
}

export default async function TournamentsPage() {
  const tournaments = [
    { id: TRACKED_LEAGUES.SUPER_LIG, name: TRANSLATIONS.leagues[TRACKED_LEAGUES.SUPER_LIG] },
    { id: TRACKED_LEAGUES.TURKIYE_KUPASI, name: TRANSLATIONS.leagues[TRACKED_LEAGUES.TURKIYE_KUPASI] },
    { id: TRACKED_LEAGUES.UEFA_EUROPA_LEAGUE, name: TRANSLATIONS.leagues[TRACKED_LEAGUES.UEFA_EUROPA_LEAGUE] },
    { id: TRACKED_LEAGUES.UEFA_CHAMPIONS_LEAGUE, name: TRANSLATIONS.leagues[TRACKED_LEAGUES.UEFA_CHAMPIONS_LEAGUE] },
    { id: TRACKED_LEAGUES.UEFA_CONFERENCE_LEAGUE, name: TRANSLATIONS.leagues[TRACKED_LEAGUES.UEFA_CONFERENCE_LEAGUE] },
  ];
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-bold text-3xl md:text-4xl text-white mb-2">
          <span className="text-fb-yellow">TURNUVALAR</span>
        </h1>
        <p className="text-gray-400">
          Fenerbahçe'nin katıldığı tüm turnuvalar
        </p>
      </div>
      
      {/* Tournament Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map(tournament => (
          <Suspense key={tournament.id} fallback={<LoadingCard />}>
            <TournamentCard leagueId={tournament.id} name={tournament.name} />
          </Suspense>
        ))}
      </div>
    </div>
  );
}
