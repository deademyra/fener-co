'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Lineup, LineupPlayer, FixtureEvent, FixturePlayerStats } from '@/types';
import { FENERBAHCE_TEAM_ID, ROUTES } from '@/lib/constants';
import { cn, shortenName } from '@/lib/utils';

interface LineupSectionProps {
  homeLineup: Lineup;
  awayLineup: Lineup;
  events: FixtureEvent[];
  players?: FixturePlayerStats[]; // fixture.players verisi - fotoğraflar için
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

// Rating rengini belirle
function getRatingColor(rating: number | null): string {
  if (!rating) return 'bg-gray-600';
  if (rating >= 8.0) return 'bg-green-500';
  if (rating >= 7.0) return 'bg-green-600';
  if (rating >= 6.5) return 'bg-yellow-500';
  if (rating >= 6.0) return 'bg-orange-500';
  return 'bg-red-500';
}

// Grid string'ini parse et: "2:3" -> { row: 2, col: 3 }
function parseGrid(grid: string | null): { row: number; col: number } | null {
  if (!grid) return null;
  const parts = grid.split(':');
  if (parts.length !== 2) return null;
  return {
    row: parseInt(parts[0]),
    col: parseInt(parts[1])
  };
}

// Formasyondan satır başına oyuncu sayısını hesapla
function getFormationRows(formation: string): number[] {
  const parts = formation.split('-').map(n => parseInt(n));
  return [1, ...parts]; // Kaleci için 1 ekle
}

interface PlayerOnPitch {
  player: LineupPlayer['player'];
  row: number;
  col: number;
  totalCols: number;
}

// Oyuncuları satırlara göre grupla
function groupPlayersByRow(players: LineupPlayer[], formation: string): Map<number, PlayerOnPitch[]> {
  const rows = new Map<number, PlayerOnPitch[]>();
  const formationRows = getFormationRows(formation);
  
  players.forEach(p => {
    const grid = parseGrid(p.player.grid);
    if (!grid) return;
    
    const totalCols = formationRows[grid.row - 1] || 1;
    
    if (!rows.has(grid.row)) {
      rows.set(grid.row, []);
    }
    
    rows.get(grid.row)!.push({
      player: p.player,
      row: grid.row,
      col: grid.col,
      totalCols
    });
  });
  
  // Her satırı sütuna göre sırala
  rows.forEach((players) => {
    players.sort((a, b) => a.col - b.col);
  });
  
  return rows;
}

// Oyuncu ID'sine göre fotoğraf ve rating bilgisi al
function buildPlayerPhotoMap(players?: FixturePlayerStats[]): Map<number, { photo: string; rating: string | null }> {
  const map = new Map<number, { photo: string; rating: string | null }>();
  
  if (!players) return map;
  
  players.forEach(teamPlayers => {
    teamPlayers.players.forEach(player => {
      map.set(player.player.id, {
        photo: player.player.photo,
        rating: player.statistics[0]?.games?.rating || null
      });
    });
  });
  
  return map;
}

// =============================================
// PLAYER MARKER COMPONENT (with Photo)
// =============================================

function PlayerMarkerWithPhoto({ 
  player, 
  isFenerbahce,
  photo,
  rating
}: { 
  player: LineupPlayer['player']; 
  isFenerbahce: boolean;
  photo?: string;
  rating?: string | null;
}) {
  const shortName = shortenName(player.name);
  const numRating = rating ? parseFloat(rating) : null;
  
  // Takım primary rengi
  const borderColor = isFenerbahce ? 'ring-fb-yellow' : 'ring-blue-500';
  
  // Fotoğraf URL'i - player.photo veya props'tan gelen photo
  const photoUrl = photo || player.photo;
  
  return (
    <Link 
      href={ROUTES.PLAYER_DETAIL(player.id)}
      className="flex flex-col items-center group cursor-pointer"
    >
      {/* Player Photo Circle */}
      <div className={cn(
        'relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden ring-2 transition-transform group-hover:scale-110',
        borderColor
      )}>
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={player.name}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-400">
              {player.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      
      {/* Jersey Number + Rating Row */}
      <div className="flex items-center gap-1 mt-1">
        {/* Jersey Number */}
        <span className={cn(
          'text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded',
          isFenerbahce 
            ? 'bg-fb-navy text-fb-yellow' 
            : 'bg-slate-800 text-white'
        )}>
          {player.number}
        </span>
        
        {/* Rating Badge */}
        {numRating && (
          <span className={cn(
            'text-[9px] md:text-[10px] font-bold px-1 py-0.5 rounded text-white',
            getRatingColor(numRating)
          )}>
            {numRating.toFixed(1)}
          </span>
        )}
      </div>
      
      {/* Player Name */}
      <span className={cn(
        'mt-0.5 text-[9px] md:text-[10px] text-center max-w-[50px] md:max-w-[70px] truncate font-medium',
        isFenerbahce ? 'text-fb-yellow' : 'text-white'
      )}>
        {shortName}
      </span>
    </Link>
  );
}

// =============================================
// HALF PITCH COMPONENTS
// =============================================

// Yarı saha gösterimi - HOME takımı için (soldan sağa: Kaleci -> Forvet)
function HomeHalfPitch({ 
  lineup, 
  playerPhotoMap 
}: { 
  lineup: Lineup; 
  playerPhotoMap: Map<number, { photo: string; rating: string | null }>;
}) {
  const isFenerbahce = lineup.team.id === FENERBAHCE_TEAM_ID;
  const playerRows = groupPlayersByRow(lineup.startXI, lineup.formation);
  const formationRows = getFormationRows(lineup.formation);
  const totalRows = formationRows.length;
  
  // Home için normal sıralama: 1,2,3,4,5 (Kaleci solda)
  const rowOrder = Array.from({ length: totalRows }, (_, i) => i + 1);
  
  return (
    <div className="relative flex-1 h-full">
      <div className="absolute inset-0 flex">
        {rowOrder.map((rowNum) => {
          const players = playerRows.get(rowNum) || [];
          
          return (
            <div 
              key={rowNum}
              className="flex-1 flex flex-col items-center justify-around py-3"
            >
              {players.map(p => {
                const playerData = playerPhotoMap.get(p.player.id);
                return (
                  <PlayerMarkerWithPhoto 
                    key={p.player.id}
                    player={p.player}
                    isFenerbahce={isFenerbahce}
                    photo={playerData?.photo}
                    rating={playerData?.rating}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Yarı saha gösterimi - AWAY takımı için (sağdan sola: Forvet -> Kaleci, sütunlar ters)
function AwayHalfPitch({ 
  lineup, 
  playerPhotoMap 
}: { 
  lineup: Lineup; 
  playerPhotoMap: Map<number, { photo: string; rating: string | null }>;
}) {
  const isFenerbahce = lineup.team.id === FENERBAHCE_TEAM_ID;
  const playerRows = groupPlayersByRow(lineup.startXI, lineup.formation);
  const formationRows = getFormationRows(lineup.formation);
  const totalRows = formationRows.length;
  
  // Away için ters sıralama: 5,4,3,2,1 (Forvet solda, Kaleci sağda)
  const rowOrder = Array.from({ length: totalRows }, (_, i) => totalRows - i);
  
  return (
    <div className="relative flex-1 h-full">
      <div className="absolute inset-0 flex">
        {rowOrder.map((rowNum) => {
          const players = playerRows.get(rowNum) || [];
          // Away takımı için sütunları ters sırala
          const reversedPlayers = [...players].reverse();
          
          return (
            <div 
              key={rowNum}
              className="flex-1 flex flex-col items-center justify-around py-3"
            >
              {reversedPlayers.map(p => {
                const playerData = playerPhotoMap.get(p.player.id);
                return (
                  <PlayerMarkerWithPhoto 
                    key={p.player.id}
                    player={p.player}
                    isFenerbahce={isFenerbahce}
                    photo={playerData?.photo}
                    rating={playerData?.rating}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================
// FOOTBALL PITCH COMPONENT
// =============================================

function FootballPitch({ 
  homeLineup, 
  awayLineup, 
  playerPhotoMap 
}: { 
  homeLineup: Lineup; 
  awayLineup: Lineup; 
  playerPhotoMap: Map<number, { photo: string; rating: string | null }>;
}) {
  return (
    <div className="relative w-full">
      {/* Football pitch background - gerçek oranlar 105x68 */}
      <div 
        className="relative bg-gradient-to-b from-green-700 via-green-600 to-green-700 rounded-lg overflow-hidden"
        style={{ aspectRatio: '105 / 68' }}
      >
        {/* Grass stripes effect */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 10 }).map((_, i) => (
            <div 
              key={i}
              className={cn(
                'absolute top-0 bottom-0',
                i % 2 === 0 ? 'bg-green-800' : 'bg-transparent'
              )}
              style={{ 
                left: `${i * 10}%`, 
                width: '10%' 
              }}
            />
          ))}
        </div>
        
        {/* Pitch markings */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Border */}
          <div className="absolute inset-2 md:inset-3 border-2 border-white/40 rounded-sm" />
          
          {/* Center line - dikey */}
          <div className="absolute top-2 md:top-3 bottom-2 md:bottom-3 left-1/2 w-[2px] bg-white/40" />
          
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 md:w-20 md:h-20 border-2 border-white/40 rounded-full" />
          
          {/* Center spot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/50 rounded-full" />
          
          {/* Left penalty area (home goal) */}
          <div className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-[14%] h-[55%] border-2 border-l-0 border-white/40" />
          <div className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-[6%] h-[25%] border-2 border-l-0 border-white/40" />
          
          {/* Right penalty area (away goal) */}
          <div className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-[14%] h-[55%] border-2 border-r-0 border-white/40" />
          <div className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-[6%] h-[25%] border-2 border-r-0 border-white/40" />
          
          {/* Goals */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-[18%] bg-white/60 rounded-r" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-[18%] bg-white/60 rounded-l" />
        </div>
        
        {/* Formation labels */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded z-10">
          <Image 
            src={homeLineup.team.logo} 
            alt="" 
            width={16} 
            height={16}
            className="object-contain"
          />
          <span className="text-[10px] md:text-xs font-bold text-white">{homeLineup.formation}</span>
        </div>
        
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded z-10">
          <span className="text-[10px] md:text-xs font-bold text-fb-yellow">{awayLineup.formation}</span>
          <Image 
            src={awayLineup.team.logo} 
            alt="" 
            width={16} 
            height={16}
            className="object-contain"
          />
        </div>
        
        {/* Players on pitch */}
        <div className="absolute inset-0 flex">
          {/* Home team - sol yarı */}
          <div className="flex-1 relative">
            <HomeHalfPitch lineup={homeLineup} playerPhotoMap={playerPhotoMap} />
          </div>
          
          {/* Away team - sağ yarı */}
          <div className="flex-1 relative">
            <AwayHalfPitch lineup={awayLineup} playerPhotoMap={playerPhotoMap} />
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// RIGHT COLUMN COMPONENTS
// =============================================

// Head Coaches Box
function CoachesBox({ homeLineup, awayLineup }: { homeLineup: Lineup; awayLineup: Lineup }) {
  const isHomeFB = homeLineup.team.id === FENERBAHCE_TEAM_ID;
  const isAwayFB = awayLineup.team.id === FENERBAHCE_TEAM_ID;
  
  return (
    <div className="card p-4">
      <h4 className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wider">Teknik Direktörler</h4>
      
      <div className="space-y-3">
        {/* Home Coach */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 ring-2 ring-gray-600">
            {homeLineup.coach.photo ? (
              <Image 
                src={homeLineup.coach.photo} 
                alt={homeLineup.coach.name}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-lg font-bold text-gray-400">
                  {homeLineup.coach.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              'font-medium truncate',
              isHomeFB ? 'text-fb-yellow' : 'text-white'
            )}>
              {homeLineup.coach.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Image 
                src={homeLineup.team.logo} 
                alt="" 
                width={14} 
                height={14}
                className="object-contain"
              />
              <span className="text-xs text-gray-400">{homeLineup.team.name}</span>
            </div>
          </div>
        </div>
        
        {/* Away Coach */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 ring-2 ring-gray-600">
            {awayLineup.coach.photo ? (
              <Image 
                src={awayLineup.coach.photo} 
                alt={awayLineup.coach.name}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-lg font-bold text-gray-400">
                  {awayLineup.coach.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              'font-medium truncate',
              isAwayFB ? 'text-fb-yellow' : 'text-white'
            )}>
              {awayLineup.coach.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Image 
                src={awayLineup.team.logo} 
                alt="" 
                width={14} 
                height={14}
                className="object-contain"
              />
              <span className="text-xs text-gray-400">{awayLineup.team.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Substitutes Box
function SubstitutesBox({ 
  homeLineup, 
  awayLineup,
  playerPhotoMap
}: { 
  homeLineup: Lineup; 
  awayLineup: Lineup;
  playerPhotoMap: Map<number, { photo: string; rating: string | null }>;
}) {
  const isHomeFB = homeLineup.team.id === FENERBAHCE_TEAM_ID;
  const isAwayFB = awayLineup.team.id === FENERBAHCE_TEAM_ID;
  
  const renderSubstitutes = (lineup: Lineup, isFenerbahce: boolean) => (
    <div className="space-y-1">
      {lineup.substitutes.slice(0, 9).map((item, i) => {
        const playerData = playerPhotoMap.get(item.player.id);
        return (
          <Link 
            key={i}
            href={ROUTES.PLAYER_DETAIL(item.player.id)}
            className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/10 transition-colors"
          >
            {/* Mini Photo */}
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
              {playerData?.photo ? (
                <Image 
                  src={playerData.photo}
                  alt={item.player.name}
                  width={24}
                  height={24}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[8px] font-bold text-gray-400">
                    {item.player.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <span className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
              isFenerbahce ? 'bg-fb-navy text-fb-yellow' : 'bg-gray-700 text-gray-300'
            )}>
              {item.player.number}
            </span>
            <span className="text-[10px] text-gray-500 w-5 uppercase flex-shrink-0">{item.player.pos}</span>
            <span className={cn(
              'text-xs truncate',
              isFenerbahce ? 'text-fb-yellow/80' : 'text-gray-300'
            )}>
              {shortenName(item.player.name)}
            </span>
          </Link>
        );
      })}
    </div>
  );
  
  return (
    <div className="card p-4">
      <h4 className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wider">Yedek Oyuncular</h4>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Home Substitutes */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-white/10">
            <Image 
              src={homeLineup.team.logo} 
              alt="" 
              width={14} 
              height={14}
              className="object-contain"
            />
            <span className={cn(
              'text-xs font-medium',
              isHomeFB ? 'text-fb-yellow' : 'text-white'
            )}>
              {homeLineup.team.name}
            </span>
          </div>
          {renderSubstitutes(homeLineup, isHomeFB)}
        </div>
        
        {/* Away Substitutes */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-white/10">
            <Image 
              src={awayLineup.team.logo} 
              alt="" 
              width={14} 
              height={14}
              className="object-contain"
            />
            <span className={cn(
              'text-xs font-medium',
              isAwayFB ? 'text-fb-yellow' : 'text-white'
            )}>
              {awayLineup.team.name}
            </span>
          </div>
          {renderSubstitutes(awayLineup, isAwayFB)}
        </div>
      </div>
    </div>
  );
}

// Substitutions Table - Two columns for Home and Away teams
function SubstitutionsTable({ 
  events, 
  homeLineup,
  awayLineup
}: { 
  events: FixtureEvent[]; 
  homeLineup: Lineup;
  awayLineup: Lineup;
}) {
  const substitutions = events.filter(e => e.type === 'subst');
  
  if (substitutions.length === 0) return null;
  
  // Takımlara göre ayır ve dakikaya göre sırala
  const homeSubs = substitutions
    .filter(s => s.team.id === homeLineup.team.id)
    .sort((a, b) => a.time.elapsed - b.time.elapsed);
  
  const awaySubs = substitutions
    .filter(s => s.team.id === awayLineup.team.id)
    .sort((a, b) => a.time.elapsed - b.time.elapsed);
  
  const isHomeFB = homeLineup.team.id === FENERBAHCE_TEAM_ID;
  const isAwayFB = awayLineup.team.id === FENERBAHCE_TEAM_ID;
  
  const renderTeamSubs = (subs: FixtureEvent[], isFenerbahce: boolean) => (
    <div className="space-y-2">
      {subs.map((sub, i) => (
        <div 
          key={i} 
          className={cn(
            'flex items-center gap-2 py-2 px-3 rounded-lg',
            'bg-white/5 border border-white/10/50'
          )}
        >
          {/* Time */}
          <span className="text-xs text-gray-500 font-mono w-8 flex-shrink-0">{sub.time.elapsed}'</span>
          
          {/* In/Out */}
          <div className="flex-1 min-w-0">
            {/* Player In */}
            <div className="flex items-center gap-1.5">
              <span className="text-green-400 text-sm flex-shrink-0">↑</span>
              <span className={cn(
                'text-sm truncate',
                isFenerbahce ? 'text-fb-yellow' : 'text-white'
              )}>
                {shortenName(sub.player.name)}
              </span>
            </div>
            
            {/* Player Out */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-red-400 text-sm flex-shrink-0">↓</span>
              <span className="text-xs text-gray-400 truncate">
                {sub.assist.name ? shortenName(sub.assist.name) : '-'}
              </span>
            </div>
          </div>
        </div>
      ))}
      {subs.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-2">Değişiklik yok</p>
      )}
    </div>
  );
  
  return (
    <div className="card p-4">
      <h4 className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wider">Oyuncu Değişiklikleri</h4>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Home Team Substitutions */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-white/10">
            <Image 
              src={homeLineup.team.logo} 
              alt="" 
              width={14} 
              height={14}
              className="object-contain"
            />
            <span className={cn(
              'text-xs font-medium',
              isHomeFB ? 'text-fb-yellow' : 'text-white'
            )}>
              {homeLineup.team.name}
            </span>
          </div>
          {renderTeamSubs(homeSubs, isHomeFB)}
        </div>
        
        {/* Away Team Substitutions */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-white/10">
            <Image 
              src={awayLineup.team.logo} 
              alt="" 
              width={14} 
              height={14}
              className="object-contain"
            />
            <span className={cn(
              'text-xs font-medium',
              isAwayFB ? 'text-fb-yellow' : 'text-white'
            )}>
              {awayLineup.team.name}
            </span>
          </div>
          {renderTeamSubs(awaySubs, isAwayFB)}
        </div>
      </div>
    </div>
  );
}

// =============================================
// MAIN LINEUP SECTION COMPONENT
// =============================================

export function LineupSection({ homeLineup, awayLineup, events, players }: LineupSectionProps) {
  // Grid verisi kontrolü
  const hasGridData = homeLineup.startXI.some(p => p.player.grid) && 
                      awayLineup.startXI.some(p => p.player.grid);
  
  // Oyuncu fotoğraf ve rating map'i oluştur
  const playerPhotoMap = buildPlayerPhotoMap(players);
  
  if (!hasGridData) {
    // Grid verisi yoksa basit liste görünümü
    return (
      <div className="card p-4">
        <h3 className="section-title text-lg mb-4">KADROLAR</h3>
        <p className="text-gray-400 text-center py-8">
          Kadro diziliş bilgisi mevcut değil
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left Column - Football Pitch + Substitutions (3/5 width on large screens) */}
      <div className="lg:col-span-3 space-y-4">
        {/* Pitch */}
        <div className="card p-4">
          <h3 className="section-title text-lg mb-4">SAHA DİZİLİŞİ</h3>
          <FootballPitch 
            homeLineup={homeLineup} 
            awayLineup={awayLineup} 
            playerPhotoMap={playerPhotoMap}
          />
        </div>
        
        {/* Substitutions - Under the pitch */}
        <SubstitutionsTable 
          events={events} 
          homeLineup={homeLineup}
          awayLineup={awayLineup}
        />
      </div>
      
      {/* Right Column - Info Boxes (2/5 width on large screens) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Box 1: Head Coaches */}
        <CoachesBox homeLineup={homeLineup} awayLineup={awayLineup} />
        
        {/* Box 2: Substitutes */}
        <SubstitutesBox 
          homeLineup={homeLineup} 
          awayLineup={awayLineup} 
          playerPhotoMap={playerPhotoMap}
        />
      </div>
    </div>
  );
}
