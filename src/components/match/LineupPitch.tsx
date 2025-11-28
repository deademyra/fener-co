'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Lineup, LineupPlayer } from '@/types';
import { FENERBAHCE_TEAM_ID, ROUTES } from '@/lib/constants';
import { cn, shortenName } from '@/lib/utils';

interface LineupPitchProps {
  homeLineup: Lineup;
  awayLineup: Lineup;
}

interface PlayerOnPitch {
  player: LineupPlayer['player'];
  row: number;
  col: number;
  totalCols: number;
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
  // "4-3-3" -> [1, 4, 3, 3] (kaleci dahil)
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

// Tek oyuncu gösterimi
function PlayerMarker({ 
  player, 
  isHome, 
  isFenerbahce,
  showPhoto = true
}: { 
  player: LineupPlayer['player']; 
  isHome: boolean;
  isFenerbahce: boolean;
  showPhoto?: boolean;
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

// Yarı saha gösterimi (bir takım için)
function HalfPitch({ 
  lineup, 
  isHome 
}: { 
  lineup: Lineup; 
  isHome: boolean;
}) {
  const isFenerbahce = lineup.team.id === FENERBAHCE_TEAM_ID;
  const playerRows = groupPlayersByRow(lineup.startXI, lineup.formation);
  const formationRows = getFormationRows(lineup.formation);
  const totalRows = formationRows.length;
  
  // Satır sıralaması:
  // Home (sol taraf): Kaleci solda (row 1), forvet sağda (row 4-5) -> normal sıra
  // Away (sağ taraf): Forvet solda, kaleci sağda -> ters sıra
  const rowOrder = isHome 
    ? Array.from({ length: totalRows }, (_, i) => i + 1)  // [1, 2, 3, 4, 5]
    : Array.from({ length: totalRows }, (_, i) => totalRows - i);  // [5, 4, 3, 2, 1]
  
  return (
    <div className="relative flex-1">
      {/* Half pitch - yatay düzen */}
      <div className="relative h-full min-h-[200px] flex">
        {/* Pitch rows - soldan sağa */}
        {rowOrder.map((rowNum, idx) => {
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
                  isHome={isHome}
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

export default function LineupPitch({ homeLineup, awayLineup }: LineupPitchProps) {
  const [activeTab, setActiveTab] = useState<'pitch' | 'list'>('pitch');
  
  // Grid verisi yoksa liste görünümüne geç
  const hasGridData = homeLineup.startXI.some(p => p.player.grid) && 
                      awayLineup.startXI.some(p => p.player.grid);
  
  if (!hasGridData) {
    return null; // Grid verisi yoksa hiçbir şey gösterme
  }
  
  return (
    <div className="card overflow-hidden">
      {/* Header with tabs */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h3 className="section-title text-lg">KADROLAR</h3>
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
      </div>
      
      {activeTab === 'pitch' ? (
        /* Pitch View - Yatay Layout */
        <div className="relative">
          {/* Football pitch background - yatay */}
          <div className="relative bg-gradient-to-r from-green-800 via-green-700 to-green-800 h-[280px] md:h-[320px]">
            {/* Pitch markings - yatay saha */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Center line - dikey */}
              <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-white/30" />
              
              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-28 md:h-28 border-2 border-white/30 rounded-full" />
              
              {/* Left penalty area (home goal) */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-16 md:w-20 h-40 md:h-52 border-2 border-l-0 border-white/30" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 md:w-8 h-20 md:h-24 border-2 border-l-0 border-white/30" />
              
              {/* Right penalty area (away goal) */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 md:w-20 h-40 md:h-52 border-2 border-r-0 border-white/30" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 md:w-8 h-20 md:h-24 border-2 border-r-0 border-white/30" />
            </div>
            
            {/* Team formations - yan yana */}
            <div className="absolute inset-0 flex">
              {/* Home team - sol yarı */}
              <div className="flex-1 relative flex items-center">
                {/* Formasyon etiketi */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded">
                  <Image 
                    src={homeLineup.team.logo} 
                    alt="" 
                    width={16} 
                    height={16}
                    className="object-contain"
                  />
                  <span className="text-xs font-medium text-white">{homeLineup.formation}</span>
                </div>
                <HalfPitch lineup={homeLineup} isHome={true} />
              </div>
              
              {/* Away team - sağ yarı */}
              <div className="flex-1 relative flex items-center">
                {/* Formasyon etiketi */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded">
                  <span className="text-xs font-medium text-fb-yellow">{awayLineup.formation}</span>
                  <Image 
                    src={awayLineup.team.logo} 
                    alt="" 
                    width={16} 
                    height={16}
                    className="object-contain"
                  />
                </div>
                <HalfPitch lineup={awayLineup} isHome={false} />
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
      
      {/* Substitutes */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        <h4 className="text-xs text-gray-500 mb-3">YEDEKLER</h4>
        <div className="grid grid-cols-2 gap-4">
          <SubstitutesList lineup={homeLineup} />
          <SubstitutesList lineup={awayLineup} />
        </div>
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
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
              isFenerbahce ? 'bg-fb-navy text-fb-yellow' : 'bg-gray-700 text-white'
            )}>
              {item.player.number}
            </span>
            <span className="text-xs text-gray-500 w-6">{item.player.pos}</span>
            <span className="text-sm text-white">{shortenName(item.player.name)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Yedekler listesi
function SubstitutesList({ lineup }: { lineup: Lineup }) {
  const isFenerbahce = lineup.team.id === FENERBAHCE_TEAM_ID;
  
  return (
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
  );
}
