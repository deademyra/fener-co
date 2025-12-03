'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SquadPlayer } from '@/types';
import { cn, getPositionFull } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

// Note: ROUTES.PLAYER_DETAIL now points to /futbolcu/{id}

interface PlayerCardProps {
  player: SquadPlayer;
  showStats?: boolean;
}

export function PlayerCard({ player, showStats = false }: PlayerCardProps) {
  const positionColors: Record<string, string> = {
    Goalkeeper: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Defender: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Midfielder: 'bg-green-500/20 text-green-400 border-green-500/30',
    Attacker: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  
  const positionColor = positionColors[player.position] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  
  return (
    <Link href={ROUTES.PLAYER_DETAIL(player.id)}>
      <div className="glass-card-interactive p-4 group">
        <div className="flex items-start gap-4">
          {/* Photo */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-800 ring-2 ring-gray-700 group-hover:ring-fb-navy transition-all">
              <Image
                src={player.photo}
                alt={player.name}
                width={64}
                height={64}
                className="object-cover"
              />
            </div>
            {player.number && (
              <span className="absolute -bottom-1 -right-1 w-7 h-7 bg-fb-navy rounded-full flex items-center justify-center text-sm font-bold text-white">
                {player.number}
              </span>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate group-hover:text-fb-yellow transition-colors">
              {player.name}
            </h3>
            <span className={cn(
              'inline-block mt-1 px-2 py-0.5 text-xs rounded-full border',
              positionColor
            )}>
              {getPositionFull(player.position)}
            </span>
            <p className="text-sm text-gray-500 mt-1">
              {player.age} yaş
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function PlayerGrid({ players }: { players: SquadPlayer[] }) {
  // Pozisyona göre grupla
  const grouped = {
    Goalkeeper: players.filter(p => p.position === 'Goalkeeper'),
    Defender: players.filter(p => p.position === 'Defender'),
    Midfielder: players.filter(p => p.position === 'Midfielder'),
    Attacker: players.filter(p => p.position === 'Attacker'),
  };
  
  const positionLabels: Record<string, string> = {
    Goalkeeper: 'KALECİLER',
    Defender: 'DEFANS',
    Midfielder: 'ORTA SAHA',
    Attacker: 'FORVET',
  };
  
  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([position, posPlayers]) => (
        posPlayers.length > 0 && (
          <div key={position}>
            <h3 className="section-title text-lg mb-4">{positionLabels[position]}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {posPlayers.map(player => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}

export default PlayerCard;
