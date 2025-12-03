// Tournament Card Component
// Fenerbahçe Stats - FENER.CO

import Link from 'next/link';
import Image from 'next/image';
import { LeagueWithSeasons, CompetitionConfig } from '@/types/api-football';
import { formatSeasonDisplay } from '@/lib/utils/round-utils';
import { Trophy, Calendar, Users, ChevronRight } from 'lucide-react';

interface TournamentCardProps {
  league: LeagueWithSeasons;
  config?: CompetitionConfig;
  season: number;
  badge: { text: string; className: string };
  formatText: string;
  hasSelectedSeason: boolean;
}

export function TournamentCard({
  league,
  config,
  season,
  badge,
  formatText,
  hasSelectedSeason,
}: TournamentCardProps) {
  const href = hasSelectedSeason 
    ? `/turnuvalar/${league.id}?sezon=${season}`
    : `/turnuvalar/${league.id}`;

  return (
    <Link
      href={href}
      className={`group relative overflow-hidden bg-slate-800/50 rounded-xl border 
                  transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10
                  ${hasSelectedSeason 
                    ? 'border-slate-700/50 hover:border-yellow-500/50' 
                    : 'border-slate-700/30 opacity-60 hover:opacity-80'}`}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 to-transparent" />
      
      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          {/* League Logo */}
          <div className="w-16 h-16 relative bg-white/10 rounded-lg p-2 
                          group-hover:bg-white/20 transition-colors">
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
          
          {/* Type Badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
            {badge.text}
          </span>
        </div>
        
        {/* League Name */}
        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-yellow-400 transition-colors">
          {config?.nameTr || league.name}
        </h3>
        
        {/* Country */}
        {league.country && (
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
            {league.country.flag && (
              <Image
                src={league.country.flag}
                alt={league.country.name}
                width={16}
                height={12}
                className="rounded-sm"
              />
            )}
            <span>{league.country.name}</span>
          </div>
        )}
        
        {/* Format Info */}
        <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
          <Calendar className="w-4 h-4" />
          <span>{formatText}</span>
        </div>
        
        {/* Season Status */}
        {!hasSelectedSeason && (
          <div className="mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-amber-400 text-sm">
              {formatSeasonDisplay(season)} sezonunda Fenerbahçe bu turnuvada mücadele etmedi.
            </p>
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
          <span className="text-slate-400 text-sm">
            {hasSelectedSeason ? formatSeasonDisplay(season) : 'Tüm sezonlar'}
          </span>
          <span className="flex items-center gap-1 text-yellow-400 text-sm font-medium 
                          group-hover:gap-2 transition-all">
            Detaylar
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>
      
      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/5 to-transparent 
                      opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </Link>
  );
}

// Compact version for list views
export function TournamentCardCompact({
  league,
  config,
  season,
  badge,
}: Omit<TournamentCardProps, 'formatText' | 'hasSelectedSeason'>) {
  return (
    <Link
      href={`/turnuvalar/${league.id}?sezon=${season}`}
      className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50
                 hover:border-yellow-500/50 transition-all group"
    >
      {/* Logo */}
      <div className="w-10 h-10 relative bg-white/10 rounded-lg p-1 flex-shrink-0">
        {league.logo ? (
          <Image src={league.logo} alt={league.name} fill className="object-contain" />
        ) : (
          <Trophy className="w-full h-full text-slate-400" />
        )}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-medium truncate group-hover:text-yellow-400 transition-colors">
          {config?.nameTr || league.name}
        </h4>
        <p className="text-slate-400 text-sm">{formatSeasonDisplay(season)}</p>
      </div>
      
      {/* Badge */}
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>
        {badge.text}
      </span>
      
      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-yellow-400 transition-colors" />
    </Link>
  );
}
