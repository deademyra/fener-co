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
      
      {/* Table Header - for alignment reference */}
      <div className="hidden sm:flex items-center gap-2 px-3 pb-2 border-b border-white/10 mb-2">
        <div className="flex-1" /> {/* Spacer for player info */}
        <div className="flex items-center justify-end gap-2">
          <span className="text-[10px] text-gray-500 uppercase w-10 text-right">Puan</span>
          <span className="text-[10px] text-gray-500 uppercase w-10 text-right">Dk</span>
          <span className="text-[10px] text-gray-500 uppercase w-8 text-right">Gol</span>
          <span className="text-[10px] text-gray-500 uppercase w-8 text-right">Ast</span>
        </div>
      </div>
      
      <div className="space-y-2">
        {topPlayers.map((player, index) => {
          const stats = player.statistics[0];
          const rating = parseFloat(stats.games.rating || '0');
          const isFBPlayer = player.teamId === FENERBAHCE_TEAM_ID;
          const goals = stats.goals.total || 0;
          const assists = stats.goals.assists || 0;
          const minutes = stats.games.minutes || 0;
          
          return (
            <Link
              key={player.player.id}
              href={ROUTES.PLAYER_DETAIL(player.player.id)}
              className={cn(
                'flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all',
                'hover:bg-white/10',
                index === 0 && 'bg-gradient-to-r from-fb-navy/30 to-transparent border border-fb-navy/30'
              )}
            >
              {/* Left side: Rank + Team Logo + Photo + Name */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                {/* Rank */}
                <span className={cn(
                  'w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0',
                  index === 0 ? 'bg-fb-yellow text-fb-navy' : 'bg-gray-700 text-gray-300'
                )}>
                  {index + 1}
                </span>
                
                {/* Team Logo */}
                <Image
                  src={player.teamLogo}
                  alt=""
                  width={20}
                  height={20}
                  className="object-contain flex-shrink-0 hidden sm:block"
                />
                
                {/* Player Photo */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                  <Image
                    src={player.player.photo}
                    alt={player.player.name}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                </div>
                
                {/* Player Name */}
                <p className={cn(
                  'font-medium truncate text-sm',
                  isFBPlayer ? 'text-fb-yellow' : 'text-white'
                )}>
                  {shortenName(player.player.name)}
                </p>
              </div>
              
              {/* Right side: Stats - Fixed width columns for alignment */}
              <div className="flex items-center justify-end gap-2 flex-shrink-0">
                {/* Rating */}
                <div className={cn(
                  'w-10 h-6 rounded flex items-center justify-center text-xs font-bold text-white',
                  getRatingColor(rating)
                )}>
                  {rating.toFixed(1)}
                </div>
                
                {/* Minutes */}
                <div className="w-10 text-right">
                  <span className="text-xs sm:text-sm text-gray-400 font-mono">
                    {minutes}'
                  </span>
                </div>
                
                {/* Goals */}
                <div className="w-8 text-right">
                  {goals > 0 ? (
                    <span className="text-xs sm:text-sm text-green-400 font-medium">
                      ⚽ {goals}
                    </span>
                  ) : (
                    <span className="text-xs sm:text-sm text-gray-600">-</span>
                  )}
                </div>
                
                {/* Assists */}
                <div className="w-8 text-right">
                  {assists > 0 ? (
                    <span className="text-xs sm:text-sm text-blue-400 font-medium">
                      🅰️ {assists}
                    </span>
                  ) : (
                    <span className="text-xs sm:text-sm text-gray-600">-</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
