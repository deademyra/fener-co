// Kadro (Squad) Page
// Fenerbahçe Stats - FENER.CO

import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { getCachedSquad, getCachedCoach } from '@/lib/api';
import { FENERBAHCE_TEAM_ID, ROUTES } from '@/lib/constants';
import { SquadPlayer, Coach } from '@/types';
import { Users, ChevronRight, User, Shield, Target, Crosshair } from 'lucide-react';

// Page metadata
export const metadata: Metadata = {
  title: 'Kadro | FENER.CO',
  description: 'Fenerbahçe A Takım Kadrosu - Oyuncular, Teknik Direktör ve Pozisyonlar',
};

const CALLER_PAGE = 'kadro';

// Position configuration
// Kaleci: Yeşil, Defans: Beyaz, Ortasaha: Sarı, Forvet: Lacivert
const POSITION_CONFIG = {
  Goalkeeper: {
    label: 'Kaleciler',
    icon: Shield,
    color: 'green',
    bgClass: 'bg-green-500/10 border-green-500/30',
    textClass: 'text-green-400',
    badgeClass: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  Defender: {
    label: 'Defans',
    icon: Shield,
    color: 'white',
    bgClass: 'bg-white/10 border-white/20',
    textClass: 'text-white',
    badgeClass: 'bg-white/20 text-white border-white/30',
  },
  Midfielder: {
    label: 'Orta Saha',
    icon: Target,
    color: 'yellow',
    bgClass: 'bg-yellow-500/10 border-yellow-500/30',
    textClass: 'text-yellow-400',
    badgeClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  Attacker: {
    label: 'Forvet',
    icon: Crosshair,
    color: 'blue',
    bgClass: 'bg-blue-900/30 border-blue-800/50',
    textClass: 'text-blue-300',
    badgeClass: 'bg-blue-900/30 text-blue-300 border-blue-800/50',
  },
};

type PositionKey = keyof typeof POSITION_CONFIG;

// Order of positions
const POSITION_ORDER: PositionKey[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];

// Coach Card Component
function CoachSection({ coach }: { coach: Coach }) {
  return (
    <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 rounded-xl border border-slate-700/50 p-4 sm:p-6 mb-6 sm:mb-8">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <User className="w-5 h-5 text-yellow-400" />
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Teknik Direktör
        </h2>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
        {/* Coach Photo */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-700 ring-2 ring-yellow-500/30">
            <Image
              src={coach.photo}
              alt={coach.name}
              width={96}
              height={96}
              className="object-cover w-full h-full"
            />
          </div>
        </div>

        {/* Coach Info */}
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{coach.name}</h3>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-slate-500">🌍</span>
              <span>{coach.nationality}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-slate-500">🎂</span>
              <span>{coach.age} yaş</span>
            </div>
            {coach.career && coach.career.length > 0 && coach.career[0]?.start && (
              <div className="flex items-center gap-2 text-yellow-400">
                <span className="text-slate-500">📅</span>
                <span className="text-xs sm:text-sm">Görev başlangıcı: {coach.career[0].start}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Player Card Component
function PlayerCard({ player }: { player: SquadPlayer }) {
  // Nationality to flag URL mapping (using flagcdn.com)
  const getNationalityFlag = (nationality?: string) => {
    if (!nationality) return null;
    
    // Common nationality to country code mapping
    const countryCodeMap: Record<string, string> = {
      'Turkey': 'tr',
      'Türkiye': 'tr',
      'Brazil': 'br',
      'Argentina': 'ar',
      'France': 'fr',
      'Germany': 'de',
      'Spain': 'es',
      'Italy': 'it',
      'Portugal': 'pt',
      'England': 'gb-eng',
      'Netherlands': 'nl',
      'Belgium': 'be',
      'Croatia': 'hr',
      'Serbia': 'rs',
      'Bosnia and Herzegovina': 'ba',
      'Bosnia-Herzegovina': 'ba',
      'Morocco': 'ma',
      'Senegal': 'sn',
      'Nigeria': 'ng',
      'Ghana': 'gh',
      'Cameroon': 'cm',
      'Ivory Coast': 'ci',
      'Egypt': 'eg',
      'Algeria': 'dz',
      'Tunisia': 'tn',
      'South Korea': 'kr',
      'Japan': 'jp',
      'USA': 'us',
      'Mexico': 'mx',
      'Colombia': 'co',
      'Uruguay': 'uy',
      'Chile': 'cl',
      'Peru': 'pe',
      'Ecuador': 'ec',
      'Venezuela': 've',
      'Paraguay': 'py',
      'Poland': 'pl',
      'Czech Republic': 'cz',
      'Austria': 'at',
      'Switzerland': 'ch',
      'Denmark': 'dk',
      'Sweden': 'se',
      'Norway': 'no',
      'Finland': 'fi',
      'Greece': 'gr',
      'Ukraine': 'ua',
      'Russia': 'ru',
      'Slovenia': 'si',
      'Slovakia': 'sk',
      'Hungary': 'hu',
      'Romania': 'ro',
      'Bulgaria': 'bg',
      'North Macedonia': 'mk',
      'Albania': 'al',
      'Kosovo': 'xk',
      'Montenegro': 'me',
      'Ireland': 'ie',
      'Scotland': 'gb-sct',
      'Wales': 'gb-wls',
      'Australia': 'au',
      'Canada': 'ca',
      'Iran': 'ir',
      'Saudi Arabia': 'sa',
      'Qatar': 'qa',
      'DR Congo': 'cd',
      'Congo DR': 'cd',
      'Mali': 'ml',
      'Burkina Faso': 'bf',
      'Guinea': 'gn',
    };
    
    const code = countryCodeMap[nationality];
    if (code) {
      return `https://flagcdn.com/24x18/${code}.png`;
    }
    return null;
  };
  
  const flagUrl = getNationalityFlag(player.nationality);
  
  return (
    <Link href={ROUTES.PLAYER_DETAIL(player.id)} className="group">
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4
                      hover:bg-slate-800/80 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/5
                      transition-all duration-300">
        <div className="flex items-center gap-4">
          {/* Player Photo with Number */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-700 ring-2 ring-slate-600
                            group-hover:ring-yellow-500/50 transition-all">
              <Image
                src={player.photo}
                alt={player.name}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            </div>
            {player.number && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-slate-900 border border-slate-600
                              flex items-center justify-center text-sm font-bold text-white
                              group-hover:bg-yellow-500 group-hover:text-slate-900 group-hover:border-yellow-500 transition-all">
                {player.number}
              </div>
            )}
          </div>
          
          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate group-hover:text-yellow-400 transition-colors">
              {player.name}
            </h4>
            <div className="flex items-center gap-2 mt-1.5">
              {/* Nationality Flag */}
              {flagUrl && (
                <Image
                  src={flagUrl}
                  alt="nationality"
                  width={20}
                  height={15}
                  className="rounded-sm"
                />
              )}
              <span className="text-xs text-slate-500">{player.age} yaş</span>
            </div>
          </div>
          
          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-yellow-400 transition-colors" />
        </div>
      </div>
    </Link>
  );
}

// Position Section Component
function PositionSection({ position, players }: { position: PositionKey; players: SquadPlayer[] }) {
  const config = POSITION_CONFIG[position];
  const Icon = config.icon;
  
  if (players.length === 0) return null;
  
  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className={`flex items-center gap-3 mb-4 p-3 rounded-lg border ${config.bgClass}`}>
        <Icon className={`w-5 h-5 ${config.textClass}`} />
        <h3 className="text-lg font-bold text-white">{config.label}</h3>
        <span className="px-2 py-0.5 rounded-full bg-slate-800/50 text-sm text-slate-400">
          {players.length} oyuncu
        </span>
      </div>
      
      {/* Players Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}

// Main Page Component
export default async function KadroPage() {
  // Fetch squad data (server-side)
  let squad: SquadPlayer[] = [];
  let coach: Coach | null = null;
  
  try {
    const squadData = await getCachedSquad(FENERBAHCE_TEAM_ID, CALLER_PAGE);
    squad = squadData?.players || [];
  } catch (error) {
    console.error('Error fetching squad:', error);
  }
  
  try {
    coach = await getCachedCoach(FENERBAHCE_TEAM_ID, CALLER_PAGE);
  } catch (error) {
    console.error('Error fetching coach:', error);
  }
  
  // Group players by position
  const groupedPlayers: Record<PositionKey, SquadPlayer[]> = {
    Goalkeeper: [],
    Defender: [],
    Midfielder: [],
    Attacker: [],
  };
  
  squad.forEach((player) => {
    const position = player.position as PositionKey;
    if (groupedPlayers[position]) {
      groupedPlayers[position].push(player);
    }
  });
  
  // Sort each group by jersey number
  Object.keys(groupedPlayers).forEach((position) => {
    groupedPlayers[position as PositionKey].sort((a, b) => {
      // Players with numbers come first, sorted by number
      if (a.number && b.number) return a.number - b.number;
      if (a.number && !b.number) return -1;
      if (!a.number && b.number) return 1;
      // Then alphabetically by name
      return a.name.localeCompare(b.name);
    });
  });
  
  // Calculate totals
  const totalPlayers = squad.length;
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                <span className="text-yellow-400">Fenerbahçe</span> Kadrosu
              </h1>
              <p className="text-slate-400 mt-1">
                2024-25 Sezonu A Takım Kadrosu
              </p>
            </div>
            
            {/* Squad Summary */}
            <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <Users className="w-5 h-5 text-yellow-400" />
              <div className="text-sm">
                <span className="font-bold text-white text-lg">{totalPlayers}</span>
                <span className="text-slate-400 ml-2">Oyuncu</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Coach Section */}
        {coach && <CoachSection coach={coach} />}
        
        {/* No Squad Data */}
        {squad.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">Kadro bilgisi yüklenemedi</p>
            <p className="text-slate-500 text-sm mt-2">Lütfen daha sonra tekrar deneyin</p>
          </div>
        ) : (
          <>
            {/* Position Sections */}
            {POSITION_ORDER.map((position) => (
              <PositionSection
                key={position}
                position={position}
                players={groupedPlayers[position]}
              />
            ))}
            
            {/* Squad Statistics */}
            <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Kadro Özeti</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="text-center p-3 sm:p-4 bg-slate-900/50 rounded-lg col-span-2 sm:col-span-1">
                  <div className="text-xl sm:text-2xl font-bold text-yellow-400">{totalPlayers}</div>
                  <div className="text-xs sm:text-sm text-slate-400 mt-1">Toplam Oyuncu</div>
                </div>
                {POSITION_ORDER.map((position) => {
                  const config = POSITION_CONFIG[position];
                  return (
                    <div key={position} className="text-center p-3 sm:p-4 bg-slate-900/50 rounded-lg">
                      <div className={`text-xl sm:text-2xl font-bold ${config.textClass}`}>
                        {groupedPlayers[position].length}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-400 mt-1">{config.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
