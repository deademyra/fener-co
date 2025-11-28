'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FixturePlayerStats, PlayerMatchStats, TeamScore } from '@/types';
import { cn, shortenName } from '@/lib/utils';
import { FENERBAHCE_TEAM_ID, ROUTES } from '@/lib/constants';

interface PlayerStatsSectionProps {
  players: FixturePlayerStats[];
  homeTeam: TeamScore;
  awayTeam: TeamScore;
  isFenerbahceMatch: boolean;
}

interface PlayerWithTeam extends PlayerMatchStats {
  teamId: number;
  teamLogo: string;
  teamName: string;
}

// Rating rengini belirle
function getRatingColor(rating: number): string {
  if (rating >= 8.0) return 'bg-green-500';
  if (rating >= 7.0) return 'bg-green-600';
  if (rating >= 6.5) return 'bg-yellow-500';
  if (rating >= 6.0) return 'bg-orange-500';
  return 'bg-red-500';
}

type FilterType = 'all' | 'home' | 'away';

export function PlayerStatsSection({ 
  players, 
  homeTeam, 
  awayTeam,
  isFenerbahceMatch 
}: PlayerStatsSectionProps) {
  // Default filter: FB maçı ise FB takımı, değilse home
  const getDefaultFilter = (): FilterType => {
    if (isFenerbahceMatch) {
      if (homeTeam.id === FENERBAHCE_TEAM_ID) return 'home';
      if (awayTeam.id === FENERBAHCE_TEAM_ID) return 'away';
    }
    return 'home';
  };
  
  const [filter, setFilter] = useState<FilterType>(getDefaultFilter());
  
  // Tüm oyuncuları düzleştir ve takım bilgilerini ekle
  let allPlayers: PlayerWithTeam[] = [];
  
  players.forEach(teamPlayers => {
    teamPlayers.players.forEach(player => {
      // Sadece minutes > 0 olanları al
      if (player.statistics[0]?.games?.minutes && player.statistics[0].games.minutes > 0) {
        allPlayers.push({
          ...player,
          teamId: teamPlayers.team.id,
          teamLogo: teamPlayers.team.logo,
          teamName: teamPlayers.team.name
        });
      }
    });
  });
  
  // Filtreleme
  let filteredPlayers = allPlayers;
  if (filter === 'home') {
    filteredPlayers = allPlayers.filter(p => p.teamId === homeTeam.id);
  } else if (filter === 'away') {
    filteredPlayers = allPlayers.filter(p => p.teamId === awayTeam.id);
  }
  
  // Rating'e göre sırala
  filteredPlayers.sort((a, b) => {
    const ratingA = parseFloat(a.statistics[0]?.games?.rating || '0');
    const ratingB = parseFloat(b.statistics[0]?.games?.rating || '0');
    return ratingB - ratingA;
  });
  
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="section-title text-lg">FUTBOLCU İSTATİSTİKLERİ</h3>
          
          {/* Filter */}
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                filter === 'all' 
                  ? 'bg-fb-navy text-fb-yellow' 
                  : 'text-gray-400 hover:text-white'
              )}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilter('home')}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1',
                filter === 'home' 
                  ? 'bg-fb-navy text-fb-yellow' 
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Image src={homeTeam.logo} alt="" width={16} height={16} className="object-contain" />
              {shortenName(homeTeam.name)}
            </button>
            <button
              onClick={() => setFilter('away')}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1',
                filter === 'away' 
                  ? 'bg-fb-navy text-fb-yellow' 
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Image src={awayTeam.logo} alt="" width={16} height={16} className="object-contain" />
              {shortenName(awayTeam.name)}
            </button>
          </div>
        </div>
      </div>
      
      {/* Stats Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50">
            <tr className="text-gray-400 text-xs">
              <th className="px-2 py-3 text-left sticky left-0 bg-gray-800/50 z-10">Oyuncu</th>
              <th className="px-2 py-3 text-center">Puan</th>
              <th className="px-2 py-3 text-center">Dk</th>
              <th className="px-2 py-3 text-center">G</th>
              <th className="px-2 py-3 text-center">A</th>
              <th className="px-2 py-3 text-center">Şİ</th>
              <th className="px-2 py-3 text-center">TŞ</th>
              <th className="px-2 py-3 text-center">TP</th>
              <th className="px-2 py-3 text-center">P%</th>
              <th className="px-2 py-3 text-center">KP</th>
              <th className="px-2 py-3 text-center">Tk</th>
              <th className="px-2 py-3 text-center">İn</th>
              <th className="px-2 py-3 text-center">Gç</th>
              <th className="px-2 py-3 text-center">İM</th>
              <th className="px-2 py-3 text-center">İK</th>
              <th className="px-2 py-3 text-center">ÇD</th>
              <th className="px-2 py-3 text-center">ÇB</th>
              <th className="px-2 py-3 text-center">FY</th>
              <th className="px-2 py-3 text-center">FK</th>
              <th className="px-2 py-3 text-center">🟨</th>
              <th className="px-2 py-3 text-center">🟥</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map((player, index) => {
              const stats = player.statistics[0];
              const rating = parseFloat(stats.games?.rating || '0');
              const isFBPlayer = player.teamId === FENERBAHCE_TEAM_ID;
              
              return (
                <tr 
                  key={player.player.id}
                  className={cn(
                    'border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors',
                    isFBPlayer && 'bg-fb-navy/10'
                  )}
                >
                  {/* Player info */}
                  <td className="px-2 py-2 sticky left-0 bg-gray-900/95 z-10">
                    <Link 
                      href={ROUTES.PLAYER_DETAIL(player.player.id)}
                      className="flex items-center gap-2 min-w-[180px]"
                    >
                      <Image 
                        src={player.teamLogo} 
                        alt="" 
                        width={16} 
                        height={16}
                        className="object-contain"
                      />
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 shrink-0">
                        <Image
                          src={player.player.photo}
                          alt={player.player.name}
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">#{stats.games?.number}</span>
                          <span className={cn(
                            'font-medium truncate',
                            isFBPlayer ? 'text-fb-yellow' : 'text-white'
                          )}>
                            {shortenName(player.player.name)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{stats.games?.position}</span>
                      </div>
                    </Link>
                  </td>
                  
                  {/* Rating */}
                  <td className="px-2 py-2 text-center">
                    {rating > 0 && (
                      <span className={cn(
                        'px-1.5 py-0.5 rounded text-xs font-bold text-white',
                        getRatingColor(rating)
                      )}>
                        {rating.toFixed(1)}
                      </span>
                    )}
                  </td>
                  
                  {/* Minutes */}
                  <td className="px-2 py-2 text-center text-gray-300">{stats.games?.minutes || '-'}</td>
                  
                  {/* Goals */}
                  <td className="px-2 py-2 text-center">
                    <span className={stats.goals?.total ? 'text-green-400 font-medium' : 'text-gray-500'}>
                      {stats.goals?.total || '-'}
                    </span>
                  </td>
                  
                  {/* Assists */}
                  <td className="px-2 py-2 text-center">
                    <span className={stats.goals?.assists ? 'text-blue-400 font-medium' : 'text-gray-500'}>
                      {stats.goals?.assists || '-'}
                    </span>
                  </td>
                  
                  {/* Shots On */}
                  <td className="px-2 py-2 text-center text-gray-300">{stats.shots?.on || '-'}</td>
                  
                  {/* Total Shots */}
                  <td className="px-2 py-2 text-center text-gray-300">{stats.shots?.total || '-'}</td>
                  
                  {/* Total Pass */}
                  <td className="px-2 py-2 text-center text-gray-300">{stats.passes?.total || '-'}</td>
                  
                  {/* Pass Accuracy */}
                  <td className="px-2 py-2 text-center text-gray-300">
                    {stats.passes?.accuracy ? `${stats.passes.accuracy}%` : '-'}
                  </td>
                  
                  {/* Key Passes */}
                  <td className="px-2 py-2 text-center text-gray-300">{stats.passes?.key || '-'}</td>
                  
                  {/* Tackles */}
                  <td className="px-2 py-2 text-center text-gray-300">{stats.tackles?.total || '-'}</td>
                  
                  {/* Interceptions */}
                  <td className="px-2 py-2 text-center text-gray-300">{stats.tackles?.interceptions || '-'}</td>
                  
                  {/* Dribbles Past (opponent dribbled past this player) */}
                  <td className="px-2 py-2 text-center text-gray-300">{stats.dribbles?.past || '-'}</td>
                  
                  {/* Total Duels */}
                  <td className="px-2 py-2 text-center text-gray-300">{stats.duels?.total || '-'}</td>
                  
                  {/* Duels Won */}
                  <td className="px-2 py-2 text-center text-gray-300">{stats.duels?.won || '-'}</td>
                  
                  {/* Dribbles Attempts */}
                  <td className="px-2 py-2 text-center text-gray-300">{stats.dribbles?.attempts || '-'}</td>
                  
                  {/* Dribbles Success */}
                  <td className="px-2 py-2 text-center text-gray-300">{stats.dribbles?.success || '-'}</td>
                  
                  {/* Fouls Committed */}
                  <td className="px-2 py-2 text-center text-gray-300">{stats.fouls?.committed || '-'}</td>
                  
                  {/* Fouls Drawn */}
                  <td className="px-2 py-2 text-center text-gray-300">{stats.fouls?.drawn || '-'}</td>
                  
                  {/* Yellow Cards */}
                  <td className="px-2 py-2 text-center">
                    {stats.cards?.yellow > 0 && (
                      <span className="text-yellow-400 font-medium">{stats.cards.yellow}</span>
                    )}
                  </td>
                  
                  {/* Red Cards */}
                  <td className="px-2 py-2 text-center">
                    {stats.cards?.red > 0 && (
                      <span className="text-red-400 font-medium">{stats.cards.red}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      <div className="p-3 border-t border-gray-800 bg-gray-900/50">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span>G: Gol</span>
          <span>A: Asist</span>
          <span>Şİ: Şut İsabetli</span>
          <span>TŞ: Top. Şut</span>
          <span>TP: Top. Pas</span>
          <span>P%: Pas %</span>
          <span>KP: Kilit Pas</span>
          <span>Tk: Top Kesme</span>
          <span>İn: Müdahale</span>
          <span>Gç: Geçilen</span>
          <span>İM: İkili Müc.</span>
          <span>İK: İkili Kaz.</span>
          <span>ÇD: Çalım Den.</span>
          <span>ÇB: Çalım Baş.</span>
          <span>FY: Faul Yap.</span>
          <span>FK: Faul Kaz.</span>
        </div>
      </div>
    </div>
  );
}
