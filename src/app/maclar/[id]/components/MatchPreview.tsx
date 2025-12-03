'use client';

import Image from 'next/image';
import { TeamScore } from '@/types';
import { Prediction, PredictionTeam } from '@/types/prediction';
import { cn } from '@/lib/utils';
import { FENERBAHCE_TEAM_ID } from '@/lib/constants';

interface MatchPreviewProps {
  predictions: Prediction;
  homeTeam: TeamScore;
  awayTeam: TeamScore;
}

// =============================================
// LAST 5 MATCH PERFORMANCE
// =============================================

function Last5Performance({ 
  team, 
  teamData, 
  isFenerbahce,
  isHome 
}: { 
  team: TeamScore; 
  teamData: PredictionTeam; 
  isFenerbahce: boolean;
  isHome: boolean;
}) {
  const last5 = teamData.last_5;
  const leagueForm = teamData.league?.form || '';
  
  // Check if league.form is in letter format (like "WWLDW") or percentage format
  const isLetterFormat = /^[WDL]+$/i.test(leagueForm);
  // Get LAST 5 characters (not first 5) for recent form
  const formLetters = isLetterFormat ? leagueForm.toUpperCase().split('').slice(-5) : [];
  
  const getFormColor = (letter: string) => {
    switch (letter) {
      case 'W': return 'bg-green-500';
      case 'D': return 'bg-yellow-500';
      case 'L': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getFormLabel = (letter: string) => {
    switch (letter) {
      case 'W': return 'G';  // Galibiyet
      case 'D': return 'B';  // Beraberlik
      case 'L': return 'M';  // Mağlubiyet
      default: return letter;
    }
  };
  
  return (
    <div className={cn(
      'flex-1 p-4 rounded-xl',
      isFenerbahce ? 'bg-fb-navy/30 border border-fb-yellow/20' : 'bg-white/5 border border-white/10'
    )}>
      {/* Team Header with Form Icons */}
      <div className={cn(
        'flex items-center gap-2 mb-4 pb-3 border-b',
        isFenerbahce ? 'border-fb-yellow/20' : 'border-white/10'
      )}>
        <Image
          src={team.logo}
          alt={team.name}
          width={28}
          height={28}
          className="object-contain"
        />
        <span className={cn(
          'font-semibold',
          isFenerbahce ? 'text-fb-yellow' : 'text-white'
        )}>
          {team.name}
        </span>
        
        {/* Form Icons - Right aligned */}
        <div className="flex items-center gap-1 ml-auto">
          {isLetterFormat && formLetters.length > 0 ? (
            formLetters.map((letter, i) => (
              <span
                key={i}
                className={cn(
                  'w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white',
                  getFormColor(letter)
                )}
              >
                {getFormLabel(letter)}
              </span>
            ))
          ) : (
            <span className={cn(
              'text-sm font-semibold',
              isFenerbahce ? 'text-fb-yellow' : 'text-white'
            )}>
              Form: {last5.form}
            </span>
          )}
        </div>
      </div>
      
      {/* Stats Grid - 3x2 layout, center aligned */}
      <div className="grid grid-cols-3 gap-3">
        {/* Row 1: Hücum - Attığı Gol - Maç Başı Attığı Gol */}
        
        {/* Attack Rating */}
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <span className="text-xs text-gray-500 block mb-2">Hücum</span>
          <span className={cn(
            'text-xl font-bold',
            isFenerbahce ? 'text-fb-yellow' : 'text-white'
          )}>
            {last5.att}
          </span>
        </div>
        
        {/* Goals Scored */}
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <span className="text-xs text-gray-500 block mb-2">Attığı Gol</span>
          <span className={cn(
            'text-xl font-bold',
            isFenerbahce ? 'text-fb-yellow' : 'text-white'
          )}>
            {last5.goals.for.total}
          </span>
        </div>
        
        {/* Goals Scored Per Game */}
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <span className="text-xs text-gray-500 block mb-2">Maç Başı</span>
          <span className={cn(
            'text-xl font-bold',
            isFenerbahce ? 'text-fb-yellow' : 'text-white'
          )}>
            {last5.goals.for.average}
          </span>
        </div>
        
        {/* Row 2: Defans - Yediği Gol - Maç Başı Yediği Gol */}
        
        {/* Defense Rating */}
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <span className="text-xs text-gray-500 block mb-2">Defans</span>
          <span className={cn(
            'text-xl font-bold',
            isFenerbahce ? 'text-fb-yellow' : 'text-white'
          )}>
            {last5.def}
          </span>
        </div>
        
        {/* Goals Conceded */}
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <span className="text-xs text-gray-500 block mb-2">Yediği Gol</span>
          <span className={cn(
            'text-xl font-bold',
            isFenerbahce ? 'text-fb-yellow' : 'text-white'
          )}>
            {last5.goals.against.total}
          </span>
        </div>
        
        {/* Goals Conceded Per Game */}
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <span className="text-xs text-gray-500 block mb-2">Maç Başı</span>
          <span className={cn(
            'text-xl font-bold',
            isFenerbahce ? 'text-fb-yellow' : 'text-white'
          )}>
            {last5.goals.against.average}
          </span>
        </div>
      </div>
    </div>
  );
}

// =============================================
// COMPARISON BAR CHART
// =============================================

interface ComparisonRowProps {
  label: string;
  homeValue: string;
  awayValue: string;
  homeColor: string;
  awayColor: string;
}

function ComparisonRow({ label, homeValue, awayValue, homeColor, awayColor }: ComparisonRowProps) {
  const homePercent = parseInt(homeValue.replace('%', '')) || 0;
  const awayPercent = parseInt(awayValue.replace('%', '')) || 0;
  
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-400">{homePercent}%</span>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <span className="text-xs text-gray-400">{awayPercent}%</span>
      </div>
      <div className="flex h-6 rounded-lg overflow-hidden">
        <div 
          className={cn('flex items-center justify-end pr-2 text-xs font-bold text-white transition-all duration-500', homeColor)}
          style={{ width: `${homePercent}%` }}
        >
          {homePercent > 15 && homePercent}
        </div>
        <div 
          className={cn('flex items-center justify-start pl-2 text-xs font-bold text-white transition-all duration-500', awayColor)}
          style={{ width: `${awayPercent}%` }}
        >
          {awayPercent > 15 && awayPercent}
        </div>
      </div>
    </div>
  );
}

function ComparisonSection({ 
  comparison, 
  isFBHome, 
  isFBAway 
}: { 
  comparison: Prediction['comparison']; 
  isFBHome: boolean;
  isFBAway: boolean;
}) {
  const homeColor = isFBHome ? 'bg-fb-navy' : 'bg-blue-600';
  const awayColor = isFBAway ? 'bg-fb-navy' : 'bg-red-600';
  
  // Form added as first row
  const rows = [
    { key: 'form', label: 'Form' },
    { key: 'att', label: 'Hücum' },
    { key: 'def', label: 'Defans' },
    { key: 'poisson_distribution', label: 'İstatistiksel Beklenti' },
    { key: 'h2h', label: 'Karşı Karşıya' },
    { key: 'goals', label: 'Goller' },
    { key: 'total', label: 'Genel Değerlendirme' },
  ] as const;
  
  return (
    <div className="card p-4">
      <h4 className="text-sm text-gray-400 font-medium mb-4 uppercase tracking-wider">Karşılaştırma</h4>
      
      {rows.map(({ key, label }) => (
        <ComparisonRow
          key={key}
          label={label}
          homeValue={comparison[key].home}
          awayValue={comparison[key].away}
          homeColor={homeColor}
          awayColor={awayColor}
        />
      ))}
    </div>
  );
}

// =============================================
// GOAL MINUTES DISTRIBUTION
// =============================================

function GoalMinutesChart({ 
  team, 
  teamData, 
  isFenerbahce 
}: { 
  team: TeamScore; 
  teamData: PredictionTeam; 
  isFenerbahce: boolean;
}) {
  const minuteData = teamData.league.goals;
  
  // Dakika grupları (API formatı: "0-15", "16-30", vb.)
  const timeGroups = ['0-15', '16-30', '31-45', '46-60', '61-75', '76-90', '91-105', '106-120'];
  
  // Sadece veri olan grupları göster
  const activeGroups = timeGroups.filter(group => {
    const forData = minuteData.for.minute[group];
    const againstData = minuteData.against.minute[group];
    return (forData?.total !== null && forData?.total !== undefined) || 
           (againstData?.total !== null && againstData?.total !== undefined);
  });
  
  if (activeGroups.length === 0) {
    return null;
  }
  
  // Maksimum değeri bul (bar yüksekliği için)
  let maxValue = 0;
  activeGroups.forEach(group => {
    const forTotal = minuteData.for.minute[group]?.total || 0;
    const againstTotal = minuteData.against.minute[group]?.total || 0;
    maxValue = Math.max(maxValue, forTotal, againstTotal);
  });
  
  if (maxValue === 0) maxValue = 1; // Sıfıra bölme hatası önle
  
  return (
    <div className={cn(
      'flex-1 p-4 rounded-xl',
      isFenerbahce ? 'bg-fb-navy/30 border border-fb-yellow/20' : 'bg-white/5 border border-white/10'
    )}>
      {/* Team Header */}
      <div className={cn(
        'flex items-center gap-2 mb-4 pb-3 border-b',
        isFenerbahce ? 'border-fb-yellow/20' : 'border-white/10'
      )}>
        <Image
          src={team.logo}
          alt={team.name}
          width={24}
          height={24}
          className="object-contain"
        />
        <span className={cn(
          'text-sm font-semibold',
          isFenerbahce ? 'text-fb-yellow' : 'text-white'
        )}>
          {team.name}
        </span>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-500"></span>
          <span className="text-xs text-gray-400">Attığı</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-500"></span>
          <span className="text-xs text-gray-400">Yediği</span>
        </div>
      </div>
      
      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-2 h-32">
        {activeGroups.map(group => {
          const forTotal = minuteData.for.minute[group]?.total || 0;
          const againstTotal = minuteData.against.minute[group]?.total || 0;
          const forHeight = (forTotal / maxValue) * 100;
          const againstHeight = (againstTotal / maxValue) * 100;
          
          return (
            <div key={group} className="flex-1 flex flex-col items-center">
              {/* Bars Container */}
              <div className="flex items-end gap-0.5 h-24 w-full justify-center">
                {/* Goals For (Green) */}
                <div 
                  className="w-3 bg-green-500 rounded-t transition-all duration-300 relative group"
                  style={{ height: `${Math.max(forHeight, forTotal > 0 ? 10 : 0)}%` }}
                >
                  {forTotal > 0 && (
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-green-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {forTotal}
                    </span>
                  )}
                </div>
                
                {/* Goals Against (Red) */}
                <div 
                  className="w-3 bg-red-500 rounded-t transition-all duration-300 relative group"
                  style={{ height: `${Math.max(againstHeight, againstTotal > 0 ? 10 : 0)}%` }}
                >
                  {againstTotal > 0 && (
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-red-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {againstTotal}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Time Label */}
              <span className="text-[9px] text-gray-500 mt-2 whitespace-nowrap">
                {group.replace('-', "'")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================
// MAIN COMPONENT
// =============================================

export function MatchPreview({ predictions, homeTeam, awayTeam }: MatchPreviewProps) {
  const isFBHome = homeTeam.id === FENERBAHCE_TEAM_ID;
  const isFBAway = awayTeam.id === FENERBAHCE_TEAM_ID;
  
  const homeTeamData = predictions.teams.home;
  const awayTeamData = predictions.teams.away;
  
  return (
    <div className="card p-4 md:p-6">
      <h3 className="section-title text-lg mb-6">ÖNİZLEME</h3>
      
      {/* Section 1: Son 5 Maç Performansı */}
      <div className="mb-8">
        <h4 className="text-sm text-gray-400 font-medium mb-4 uppercase tracking-wider">Son 5 Maç Performansı</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Last5Performance 
            team={homeTeam} 
            teamData={homeTeamData} 
            isFenerbahce={isFBHome}
            isHome={true}
          />
          <Last5Performance 
            team={awayTeam} 
            teamData={awayTeamData} 
            isFenerbahce={isFBAway}
            isHome={false}
          />
        </div>
      </div>
      
      {/* Section 2: Karşılaştırma */}
      <div className="mb-8">
        <ComparisonSection 
          comparison={predictions.comparison}
          isFBHome={isFBHome}
          isFBAway={isFBAway}
        />
      </div>
      
      {/* Section 3: Gol Dakikaları */}
      <div>
        <h4 className="text-sm text-gray-400 font-medium mb-4 uppercase tracking-wider">Gol Dakikaları</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GoalMinutesChart 
            team={homeTeam} 
            teamData={homeTeamData} 
            isFenerbahce={isFBHome}
          />
          <GoalMinutesChart 
            team={awayTeam} 
            teamData={awayTeamData} 
            isFenerbahce={isFBAway}
          />
        </div>
      </div>
    </div>
  );
}
