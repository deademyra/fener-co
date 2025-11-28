'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Lineup, LineupPlayer, FixtureEvent } from '@/types';
import { FENERBAHCE_TEAM_ID, ROUTES } from '@/lib/constants';
import { cn, shortenName } from '@/lib/utils';

interface LineupSectionProps {
  homeLineup: Lineup;
  awayLineup: Lineup;
  events: FixtureEvent[];
}

// Rating rengini belirle
function getRatingColor(rating: number | null): string {
  if (!rating) return 'bg-gray-600';
  if (rating >= 8.0) return 'bg-green-500';
  if (rating >= 7.0) return 'bg-green-600';
  if (rating >= 6.5) return 'bg-yellow-500';
  if (rating >= 6.0) return 'bg-orange-500';
  return 'bg-red-500';
}

// Rating badge component
function RatingBadge({ rating }: { rating: string | null }) {
  if (!rating) return null;
  const numRating = parseFloat(rating);
  
  return (
    <span className={cn(
      'absolute -top-1 -right-1 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center text-white',
      getRatingColor(numRating)
    )}>
      {numRating.toFixed(1)}
    </span>
  );
}

interface PlayerOnPitch {
  player: LineupPlayer['player'];
  row: number;
  col: number;
  totalCols: number;
  rating?: string | null;
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
  rows.forEach((players, row) => {
    players.sort((a, b) => a.col - b.col);
  });
  
  return rows;
}

// Tek oyuncu gösterimi - saha üzerinde
function PlayerMarker({ 
  player, 
  isHome, 
  isFenerbahce,
  rating
}: { 
  player: LineupPlayer['player']; 
  isHome: boolean;
  isFenerbahce: boolean;
  rating?: string | null;
}) {
  const shortName = shortenName(player.name);
  
  return (
    <Link 
      href={ROUTES.PLAYER_DETAIL(player.id)}
      className="flex flex-col items-center group cursor-pointer"
    >
      {/* Player circle */}
      <div className={cn(
        'relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm font-bold transition-transform group-hover:scale-110',
        isHome 
          ? isFenerbahce 
            ? 'bg-fb-navy text-fb-yellow ring-2 ring-fb-yellow/50' 
            : 'bg-blue-600 text-white'
          : isFenerbahce
            ? 'bg-fb-yellow text-fb-navy ring-2 ring-fb-navy/50'
            : 'bg-red-600 text-white'
      )}>
        {player.number}
        <RatingBadge rating={rating || null} />
      </div>
      
      {/* Player name */}
      <span className={cn(
        'mt-1 text-[10px] md:text-xs text-center max-w-[60px] md:max-w-[80px] truncate',
        isFenerbahce ? 'text-fb-yellow' : 'text-white'
      )}>
        {shortName}
      </span>
    </Link>
  );
}

// Yarı saha gösterimi - HOME takımı için (soldan sağa: Kaleci -> Forvet)
function HomeHalfPitch({ lineup }: { lineup: Lineup }) {
  const isFenerbahce = lineup.team.id === FENERBAHCE_TEAM_ID;
  const playerRows = groupPlayersByRow(lineup.startXI, lineup.formation);
  const formationRows = getFormationRows(lineup.formation);
  const totalRows = formationRows.length;
  
  // Home için normal sıralama: 1,2,3,4,5 (Kaleci solda)
  const rowOrder = Array.from({ length: totalRows }, (_, i) => i + 1);
  
  return (
    <div className="relative flex-1">
      <div className="relative h-full min-h-[200px] flex">
        {rowOrder.map((rowNum) => {
          const players = playerRows.get(rowNum) || [];
          
          return (
            <div 
              key={rowNum}
              className="flex-1 flex flex-col items-center justify-around py-2"
            >
              {players.map(p => (
                <PlayerMarker 
                  key={p.player.id}
                  player={p.player}
                  isHome={true}
                  isFenerbahce={isFenerbahce}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Yarı saha gösterimi - AWAY takımı için (sağdan sola: Forvet -> Kaleci, sütunlar ters)
function AwayHalfPitch({ lineup }: { lineup: Lineup }) {
  const isFenerbahce = lineup.team.id === FENERBAHCE_TEAM_ID;
  const playerRows = groupPlayersByRow(lineup.startXI, lineup.formation);
  const formationRows = getFormationRows(lineup.formation);
  const totalRows = formationRows.length;
  
  // Away için ters sıralama: 5,4,3,2,1 (Forvet solda, Kaleci sağda)
  const rowOrder = Array.from({ length: totalRows }, (_, i) => totalRows - i);
  
  return (
    <div className="relative flex-1">
      <div className="relative h-full min-h-[200px] flex">
        {rowOrder.map((rowNum) => {
          const players = playerRows.get(rowNum) || [];
          // Away takımı için sütunları ters sırala (düzeltme)
          const reversedPlayers = [...players].reverse();
          
          return (
            <div 
              key={rowNum}
              className="flex-1 flex flex-col items-center justify-around py-2"
            >
              {reversedPlayers.map(p => (
                <PlayerMarker 
                  key={p.player.id}
                  player={p.player}
                  isHome={false}
                  isFenerbahce={isFenerbahce}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Liste görünümü için lineup
function LineupList({ lineup }: { lineup: Lineup }) {
  const isFenerbahce = lineup.team.id === FENERBAHCE_TEAM_ID;
  
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Image src={lineup.team.logo} alt="" width={20} height={20} />
        <span className={cn('text-sm font-medium', isFenerbahce && 'text-fb-yellow')}>
          {lineup.team.name}
        </span>
        <span className="text-xs text-gray-500">({lineup.formation})</span>
      </div>
      <div className="space-y-1">
        {lineup.startXI.map((item, i) => (
          <Link 
            key={i}
            href={ROUTES.PLAYER_DETAIL(item.player.id)}
            className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-800/50 transition-colors"
          >
            <span className={cn(
              'relative w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
              isFenerbahce ? 'bg-fb-navy text-fb-yellow' : 'bg-gray-700 text-white'
            )}>
              {item.player.number}
            </span>
            <span className="text-xs text-gray-500 w-6">{item.player.pos}</span>
            <span className="text-sm text-white flex-1">{shortenName(item.player.name)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Yedekler listesi + Coach
function SubstitutesWithCoach({ lineup }: { lineup: Lineup }) {
  const isFenerbahce = lineup.team.id === FENERBAHCE_TEAM_ID;
  
  return (
    <div>
      {/* Coach */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
          <Image 
            src={lineup.coach.photo} 
            alt={lineup.coach.name}
            width={32}
            height={32}
            className="object-cover w-full h-full"
          />
        </div>
        <div>
          <p className="text-xs text-gray-400">Teknik Direktör</p>
          <p className={cn(
            'text-sm font-medium',
            isFenerbahce && 'text-fb-yellow'
          )}>
            {lineup.coach.name}
          </p>
        </div>
      </div>
      
      {/* Substitutes */}
      <div className="space-y-1">
        {lineup.substitutes.slice(0, 9).map((item, i) => (
          <Link 
            key={i}
            href={ROUTES.PLAYER_DETAIL(item.player.id)}
            className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-800/50 transition-colors text-gray-400"
          >
            <span className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
              isFenerbahce ? 'bg-fb-navy/50 text-fb-yellow/70' : 'bg-gray-800 text-gray-400'
            )}>
              {item.player.number}
            </span>
            <span className="text-[10px] w-5">{item.player.pos}</span>
            <span className="text-xs">{shortenName(item.player.name)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Girenler/Çıkanlar tablosu
function SubstitutionsTable({ events, homeTeamId, awayTeamId }: { events: FixtureEvent[]; homeTeamId: number; awayTeamId: number }) {
  const substitutions = events.filter(e => e.type === 'subst');
  
  if (substitutions.length === 0) return null;
  
  // Takımlara göre ayır
  const homeSubs = substitutions.filter(s => s.team.id === homeTeamId);
  const awaySubs = substitutions.filter(s => s.team.id === awayTeamId);
  
  const renderSubs = (subs: FixtureEvent[], teamId: number) => {
    const isFenerbahce = teamId === FENERBAHCE_TEAM_ID;
    
    return subs.map((sub, i) => (
      <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-800/50 last:border-0">
        <span className="text-xs text-gray-500 w-10">{sub.time.elapsed}'</span>
        <div className="flex items-center gap-1 flex-1">
          <span className="text-green-400 text-xs">↑</span>
          <span className={cn(
            'text-sm',
            isFenerbahce && 'text-fb-yellow'
          )}>
            {shortenName(sub.player.name)}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-1">
          <span className="text-red-400 text-xs">↓</span>
          <span className="text-sm text-gray-400">
            {sub.assist.name ? shortenName(sub.assist.name) : '-'}
          </span>
        </div>
      </div>
    ));
  };
  
  return (
    <div className="card p-4 mt-6">
      <h3 className="section-title text-lg mb-4">GİRENLER / ÇIKANLAR</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {homeSubs.length > 0 && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Ev Sahibi</p>
            {renderSubs(homeSubs, homeTeamId)}
          </div>
        )}
        {awaySubs.length > 0 && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Deplasman</p>
            {renderSubs(awaySubs, awayTeamId)}
          </div>
        )}
      </div>
    </div>
  );
}

export function LineupSection({ homeLineup, awayLineup, events }: LineupSectionProps) {
  const [activeTab, setActiveTab] = useState<'pitch' | 'list'>('pitch');
  
  // Grid verisi yoksa liste görünümüne geç
  const hasGridData = homeLineup.startXI.some(p => p.player.grid) && 
                      awayLineup.startXI.some(p => p.player.grid);
  
  return (
    <div>
      <div className="card overflow-hidden">
        {/* Header with tabs */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="section-title text-lg">KADROLAR</h3>
          {hasGridData && (
            <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('pitch')}
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  activeTab === 'pitch' 
                    ? 'bg-fb-navy text-fb-yellow' 
                    : 'text-gray-400 hover:text-white'
                )}
              >
                Saha
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  activeTab === 'list' 
                    ? 'bg-fb-navy text-fb-yellow' 
                    : 'text-gray-400 hover:text-white'
                )}
              >
                Liste
              </button>
            </div>
          )}
        </div>
        
        {activeTab === 'pitch' && hasGridData ? (
          /* Pitch View - Yatay Layout */
          <div className="relative">
            {/* Football pitch background - gerçek oranlar 105x68 -> aspect ratio yaklaşık 1.54:1 */}
            <div 
              className="relative bg-gradient-to-r from-green-800 via-green-700 to-green-800"
              style={{ aspectRatio: '105 / 68' }}
            >
              {/* Pitch markings - yatay saha */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Border */}
                <div className="absolute inset-2 md:inset-4 border-2 border-white/30 rounded-sm" />
                
                {/* Center line - dikey */}
                <div className="absolute top-2 md:top-4 bottom-2 md:bottom-4 left-1/2 w-[2px] bg-white/30" />
                
                {/* Center circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-24 md:h-24 border-2 border-white/30 rounded-full" />
                
                {/* Center spot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/40 rounded-full" />
                
                {/* Left penalty area (home goal) */}
                <div className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-[12%] h-[60%] border-2 border-l-0 border-white/30" />
                <div className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-[5%] h-[30%] border-2 border-l-0 border-white/30" />
                
                {/* Right penalty area (away goal) */}
                <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-[12%] h-[60%] border-2 border-r-0 border-white/30" />
                <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-[5%] h-[30%] border-2 border-r-0 border-white/30" />
                
                {/* Goal areas */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-[20%] bg-white/50" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-[20%] bg-white/50" />
              </div>
              
              {/* Team formations - yan yana */}
              <div className="absolute inset-0 flex">
                {/* Home team - sol yarı */}
                <div className="flex-1 relative flex items-center">
                  {/* Formasyon etiketi */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded z-10">
                    <Image 
                      src={homeLineup.team.logo} 
                      alt="" 
                      width={16} 
                      height={16}
                      className="object-contain"
                    />
                    <span className="text-xs font-medium text-white">{homeLineup.formation}</span>
                  </div>
                  <HomeHalfPitch lineup={homeLineup} />
                </div>
                
                {/* Away team - sağ yarı */}
                <div className="flex-1 relative flex items-center">
                  {/* Formasyon etiketi */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded z-10">
                    <span className="text-xs font-medium text-fb-yellow">{awayLineup.formation}</span>
                    <Image 
                      src={awayLineup.team.logo} 
                      alt="" 
                      width={16} 
                      height={16}
                      className="object-contain"
                    />
                  </div>
                  <AwayHalfPitch lineup={awayLineup} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <LineupList lineup={homeLineup} />
              <LineupList lineup={awayLineup} />
            </div>
          </div>
        )}
        
        {/* Substitutes with Coach */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <h4 className="text-xs text-gray-500 mb-3">YEDEKLER</h4>
          <div className="grid grid-cols-2 gap-4">
            <SubstitutesWithCoach lineup={homeLineup} />
            <SubstitutesWithCoach lineup={awayLineup} />
          </div>
        </div>
      </div>
      
      {/* Substitutions Table */}
      <SubstitutionsTable 
        events={events} 
        homeTeamId={homeLineup.team.id} 
        awayTeamId={awayLineup.team.id} 
      />
    </div>
  );
}
