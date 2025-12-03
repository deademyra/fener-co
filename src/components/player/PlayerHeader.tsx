'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Calendar, Ruler, Weight, MapPin } from 'lucide-react';
import { Player, PlayerSeasonStats } from '@/types';
import { cn, formatDate } from '@/lib/utils';

// =============================================
// TYPES
// =============================================

interface PlayerHeaderProps {
  player: Player;
  stats?: PlayerSeasonStats[];
  jerseyNumber?: number | string | null;
  teamLogo?: string;
}

// =============================================
// POSITION MAPPING (English -> Turkish)
// =============================================

const POSITION_MAP: Record<string, string> = {
  'Goalkeeper': 'KALECİ',
  'Defender': 'DEFANS',
  'Midfielder': 'ORTA SAHA',
  'Attacker': 'FORVET',
  'G': 'KALECİ',
  'D': 'DEFANS',
  'M': 'ORTA SAHA',
  'F': 'FORVET',
};

// Country flag mapping
const COUNTRY_FLAGS: Record<string, string> = {
  'Turkey': 'tr',
  'Türkiye': 'tr',
  'Morocco': 'ma',
  'Portugal': 'pt',
  'Brazil': 'br',
  'Argentina': 'ar',
  'France': 'fr',
  'Germany': 'de',
  'Spain': 'es',
  'England': 'gb-eng',
  'Italy': 'it',
  'Netherlands': 'nl',
  'Belgium': 'be',
  'Croatia': 'hr',
  'Serbia': 'rs',
  'Bosnia and Herzegovina': 'ba',
  'Poland': 'pl',
  'Czech Republic': 'cz',
  'Czechia': 'cz',
  'Slovakia': 'sk',
  'Slovenia': 'si',
  'Austria': 'at',
  'Switzerland': 'ch',
  'Denmark': 'dk',
  'Sweden': 'se',
  'Norway': 'no',
  'Finland': 'fi',
  'Greece': 'gr',
  'Ukraine': 'ua',
  'Russia': 'ru',
  'Japan': 'jp',
  'South Korea': 'kr',
  'Korea Republic': 'kr',
  'USA': 'us',
  'United States': 'us',
  'Mexico': 'mx',
  'Colombia': 'co',
  'Uruguay': 'uy',
  'Chile': 'cl',
  'Nigeria': 'ng',
  'Ghana': 'gh',
  'Senegal': 'sn',
  'Cameroon': 'cm',
  'Egypt': 'eg',
  'Algeria': 'dz',
  'Tunisia': 'tn',
  'South Africa': 'za',
  'Australia': 'au',
  'Canada': 'ca',
  'Iran': 'ir',
  'Saudi Arabia': 'sa',
  'Albania': 'al',
  'Kosovo': 'xk',
  'North Macedonia': 'mk',
  'Montenegro': 'me',
  'Iceland': 'is',
  'Ireland': 'ie',
  'Scotland': 'gb-sct',
  'Wales': 'gb-wls',
};

// =============================================
// HELPER FUNCTIONS
// =============================================

function getPositionTurkish(position: string): string {
  return POSITION_MAP[position] || position.toUpperCase();
}

function parseHeight(height: string | null | undefined): string {
  if (!height) return '-';
  // Handle formats like "188 cm" or just "188"
  const match = height.match(/(\d+)/);
  return match ? match[1] : '-';
}

function parseWeight(weight: string | null | undefined): string {
  if (!weight) return '-';
  // Handle formats like "73 kg" or just "73"
  const match = weight.match(/(\d+)/);
  return match ? match[1] : '-';
}

function calculateAge(birthDate: string | undefined): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function getFirstName(player: Player): string {
  // Use firstname if available, otherwise parse from name
  if (player.firstname) return player.firstname;
  const parts = player.name.trim().split(' ');
  return parts[0] || '';
}

function getLastName(player: Player): string {
  // Use lastname if available, otherwise parse from name
  if (player.lastname) return player.lastname;
  const parts = player.name.trim().split(' ');
  return parts.slice(1).join(' ') || parts[0] || '';
}

function getFlagUrl(nationality: string): string {
  const code = COUNTRY_FLAGS[nationality] || 'xx';
  return `https://media.api-sports.io/flags/${code}.svg`;
}

// =============================================
// DEFAULT PLAYER IMAGE
// =============================================

const DEFAULT_PLAYER_IMAGE = 'https://media.api-sports.io/football/players/0.png';
const FENERBAHCE_LOGO = 'https://media.api-sports.io/football/teams/611.png';

// =============================================
// COMPONENT
// =============================================

export default function PlayerHeader({ 
  player, 
  stats = [],
  jerseyNumber,
  teamLogo = FENERBAHCE_LOGO,
}: PlayerHeaderProps) {
  const [imageError, setImageError] = useState(false);
  
  // Extract data
  const firstName = getFirstName(player);
  const lastName = getLastName(player);
  const position = stats[0]?.games?.position || 'Attacker';
  const number = jerseyNumber || stats[0]?.games?.number || '?';
  const age = player.age || calculateAge(player.birth?.date);
  const height = parseHeight(player.height);
  const weight = parseWeight(player.weight);
  const birthDate = player.birth?.date;
  const birthPlace = player.birth?.place;
  const nationality = player.nationality || '';

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Background with jersey number watermark */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/90 backdrop-blur-sm" />
      
      {/* Jersey number watermark */}
      <div 
        className="absolute right-0 top-1/2 -translate-y-1/2 text-[20rem] font-black text-white/[0.03] leading-none pointer-events-none select-none"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {number}
      </div>
      
      {/* Content */}
      <div className="relative z-10 p-6 lg:p-8 lg:pr-6">
        <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-8">
          
          {/* Left Section: Photo + Name */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6 flex-1">
            
            {/* Player Photo with Badge */}
            <div className="relative flex-shrink-0">
              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-fb-navy via-fb-navy-light to-fb-navy opacity-60 blur-xl scale-110" />
              
              {/* Photo Container */}
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40">
                {/* Circular Border with Gradient */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-fb-navy-light via-fb-navy to-fb-navy-dark p-[3px]">
                  <div className="w-full h-full rounded-full bg-slate-800/90 overflow-hidden">
                    <Image
                      src={imageError ? DEFAULT_PLAYER_IMAGE : player.photo}
                      alt={player.name}
                      width={160}
                      height={160}
                      className="w-full h-full object-cover object-top"
                      onError={() => setImageError(true)}
                      priority
                    />
                  </div>
                </div>
                
                {/* Badge: Jersey Number + Team Logo */}
                <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5">
                  {/* Team Logo */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900 border-2 border-fb-navy flex items-center justify-center overflow-hidden shadow-lg">
                    <Image
                      src={teamLogo}
                      alt="Team"
                      width={28}
                      height={28}
                      className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                    />
                  </div>
                  
                  {/* Jersey Number */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 -ml-2 rounded-full bg-gradient-to-br from-fb-navy to-fb-navy-dark flex items-center justify-center shadow-lg border-2 border-fb-navy-light">
                    <span className="text-fb-yellow font-bold text-sm sm:text-base">{number}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Name & Position */}
            <div className="text-center sm:text-left">
              {/* Position Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-white/10 mb-3">
                {/* Pulsing Status Dot */}
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-xs font-semibold tracking-wider text-gray-300">
                  {getPositionTurkish(position)}
                </span>
              </div>
              
              {/* First Name */}
              <p className="text-lg sm:text-xl text-gray-400 font-light tracking-wide mb-0.5">
                {firstName}
              </p>
              
              {/* Last Name - Massive with Gradient */}
              <h1 
                className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight"
                style={{
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #94A3B8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {lastName}
              </h1>
              
              {/* Nationality & Birth Place */}
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 text-sm text-gray-400">
                {nationality && (
                  <div className="flex items-center gap-1.5">
                    <Image
                      src={getFlagUrl(nationality)}
                      alt={nationality}
                      width={20}
                      height={15}
                      className="rounded-sm object-cover"
                    />
                    <span>{nationality}</span>
                  </div>
                )}
                {birthPlace && (
                  <>
                    <span className="text-gray-600">•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-500" />
                      <span>{birthPlace}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Section: Stats Panel - aligned to right edge */}
          <div className="flex-shrink-0 w-full lg:w-auto">
            <div className="glass-card bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-5 lg:min-w-[280px]">
              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                
                {/* Age */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-gray-500 mb-1.5">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wide">Yaş</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    {age ?? '-'}
                  </p>
                  {birthDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(birthDate, 'd MMMM yyyy')}
                    </p>
                  )}
                </div>
                
                {/* Height */}
                <div className="text-center relative">
                  {/* Subtle dividers for larger screens */}
                  <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-px bg-white/10" />
                  <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-px bg-white/10" />
                  
                  <div className="flex items-center justify-center gap-1.5 text-gray-500 mb-1.5">
                    <Ruler className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wide">Boy</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    {height}
                    <span className="text-sm sm:text-base font-normal text-gray-400 ml-0.5">cm</span>
                  </p>
                </div>
                
                {/* Weight */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-gray-500 mb-1.5">
                    <Weight className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wide">Kilo</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    {weight}
                    <span className="text-sm sm:text-base font-normal text-gray-400 ml-0.5">kg</span>
                  </p>
                </div>
                
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
