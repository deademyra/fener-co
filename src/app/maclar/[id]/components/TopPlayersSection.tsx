'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FixturePlayerStats, PlayerMatchStats } from '@/types';
import { cn, formatRating, shortenName } from '@/lib/utils';
import { FENERBAHCE_TEAM_ID, ROUTES } from '@/lib/constants';

interface TopPlayersSectionProps {
  players: FixturePlayerStats[];
  homeTeamId: number;
  awayTeamId: number;
  isFenerbahceMatch: boolean;
}

interface PlayerWithTeam extends PlayerMatchStats {
  teamId: number;
  teamLogo: string;
}

// Rating rengini belirle
function getRatingColor(rating: number): string {
  if (rating >= 8.0) return 'bg-green-500';
  if (rating >= 7.0) return 'bg-green-600';
  if (rating >= 6.5) return 'bg-yellow-500';
  if (rating >= 6.0) return 'bg-orange-500';
  return 'bg-red-500';
}

export function TopPlayersSection({ 
  players, 
  homeTeamId, 
  awayTeamId, 
  isFenerbahceMatch 
}: TopPlayersSectionProps) {
  // Tüm oyuncuları düzleştir ve takım bilgilerini ekle
  let allPlayers: PlayerWithTeam[] = [];
  
  players.forEach(teamPlayers => {
    teamPlayers.players.forEach(player => {
      if (player.statistics[0]?.games?.minutes && player.statistics[0].games.minutes > 0) {
        allPlayers.push({
          ...player,
          teamId: teamPlayers.team.id,
          teamLogo: teamPlayers.team.logo
        });
      }
    });
  });
  
  // Fenerbahçe maçı ise sadece FB oyuncularını filtrele
  if (isFenerbahceMatch) {
    allPlayers = allPlayers.filter(p => p.teamId === FENERBAHCE_TEAM_ID);
  }
  
  // Rating'e göre sırala ve top 3'ü al
  const topPlayers = allPlayers
    .filter(p => p.statistics[0]?.games?.rating)
    .sort((a, b) => {
      const ratingA = parseFloat(a.statistics[0].games.rating || '0');
      const ratingB = parseFloat(b.statistics[0].games.rating || '0');
      return ratingB - ratingA;
    })
    .slice(0, 3);
  
  if (topPlayers.length === 0) {
    return (
      <div className="card p-4">
        <h3 className="section-title text-lg mb-4">ÖNE ÇIKAN OYUNCULAR</h3>
        <p className="text-gray-400 text-center py-4">Oyuncu verisi bulunamadı</p>
      </div>
    );
  }
  
  return (
    <div className="card p-4">
      <h3 className="section-title text-lg mb-4">ÖNE ÇIKAN OYUNCULAR</h3>
      
      <div className="space-y-3">
        {topPlayers.map((player, index) => {
          const stats = player.statistics[0];
          const rating = parseFloat(stats.games.rating || '0');
          const isFBPlayer = player.teamId === FENERBAHCE_TEAM_ID;
          
          return (
            <Link
              key={player.player.id}
              href={ROUTES.PLAYER_DETAIL(player.player.id)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-all',
                'hover:bg-gray-800/50',
                index === 0 && 'bg-gradient-to-r from-fb-navy/30 to-transparent border border-fb-navy/30'
              )}
            >
              {/* Rank */}
              <span className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                index === 0 ? 'bg-fb-yellow text-fb-navy' : 'bg-gray-700 text-gray-300'
              )}>
                {index + 1}
              </span>
              
              {/* Team Logo */}
              <Image
                src={player.teamLogo}
                alt=""
                width={24}
                height={24}
                className="object-contain"
              />
              
              {/* Player Photo */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
                <Image
                  src={player.player.photo}
                  alt={player.player.name}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              </div>
              
              {/* Player Name */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-medium truncate',
                  isFBPlayer ? 'text-fb-yellow' : 'text-white'
                )}>
                  {shortenName(player.player.name)}
                </p>
              </div>
              
              {/* Rating */}
              <div className={cn(
                'px-2 py-1 rounded text-xs font-bold text-white',
                getRatingColor(rating)
              )}>
                {rating.toFixed(1)}
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span title="Dakika">{stats.games.minutes || 0}'</span>
                {(stats.goals.total || 0) > 0 && (
                  <span className="text-green-400" title="Gol">
                    ⚽ {stats.goals.total}
                  </span>
                )}
                {(stats.goals.assists || 0) > 0 && (
                  <span className="text-blue-400" title="Asist">
                    🅰️ {stats.goals.assists}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
