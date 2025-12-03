'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { PlayerSeasonStats, Fixture } from '@/types';
import { FENERBAHCE_TEAM_ID } from '@/lib/constants';

// =============================================
// TYPES
// =============================================

interface PlayerMatchStats {
  fixture: Fixture;
  stats: {
    minutes: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    yellowRedCards: number;
    shotsTotal: number;
    shotsOn: number;
    passesTotal: number;
    passesKey: number;
    passAccuracy: number;
    duelsTotal: number;
    duelsWon: number;
    tacklesTotal: number;
    tacklesBlocks: number;
    tacklesInterceptions: number;
    dribblesAttempts: number;
    dribblesSuccess: number;
    dribblesPast: number;
    foulsCommitted: number;
    foulsDrawn: number;
    penaltyWon: number;
    penaltyCommitted: number;
    penaltyScored: number;
    penaltyMissed: number;
    penaltySaved: number;
    rating: number;
    saves?: number;
    goalsConceded?: number;
  } | null;
}

interface SezonOzetiSectionProps {
  stats: PlayerSeasonStats[];
  teamStats: { totalMatches: number; totalGoals: number; totalAssists: number; totalMinutes: number } | null;
  recentMatches: PlayerMatchStats[];
  isGoalkeeper: boolean;
  titleSuffix?: string;
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('tr-TR');
}

function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

function getRatingColor(rating: number): string {
  if (rating >= 8.0) return 'text-green-400';
  if (rating >= 7.0) return 'text-lime-400';
  if (rating >= 6.5) return 'text-yellow-400';
  if (rating >= 6.0) return 'text-orange-400';
  return 'text-gray-400';
}

function getRatingBgClass(rating: number): string {
  if (rating >= 8.0) return 'from-green-500/20 to-green-600/10';
  if (rating >= 7.0) return 'from-lime-500/20 to-lime-600/10';
  if (rating >= 6.5) return 'from-yellow-500/20 to-yellow-600/10';
  if (rating >= 6.0) return 'from-orange-500/20 to-orange-600/10';
  return 'from-gray-500/20 to-gray-600/10';
}

function getRatingBarColor(rating: number): string {
  if (rating >= 8.0) return 'bg-green-400';
  if (rating >= 7.0) return 'bg-lime-400';
  if (rating >= 6.5) return 'bg-yellow-400';
  if (rating >= 6.0) return 'bg-orange-400';
  return 'bg-gray-500';
}

// =============================================
// CIRCULAR PROGRESS COMPONENT
// =============================================

function CircularProgress({ 
  value, 
  max, 
  label,
  size = 80,
  strokeWidth = 6,
  color = 'auto',
}: {
  value: number;
  max: number;
  label: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  // Get color based on percentage
  const getStrokeColor = () => {
    if (color !== 'auto') {
      if (color === 'green') return '#22c55e';
      if (color === 'blue') return '#3b82f6';
      if (color === 'fb-yellow') return '#FCD34D';
      return '#FCD34D';
    }
    if (percentage >= 70) return '#22c55e';
    if (percentage >= 50) return '#84cc16';
    if (percentage >= 30) return '#FCD34D';
    return '#f97316';
  };
  
  const getTextColorClass = () => {
    if (color !== 'auto') {
      if (color === 'green') return 'text-green-400';
      if (color === 'blue') return 'text-blue-400';
      return 'text-fb-yellow';
    }
    if (percentage >= 70) return 'text-green-400';
    if (percentage >= 50) return 'text-lime-400';
    if (percentage >= 30) return 'text-fb-yellow';
    return 'text-orange-400';
  };

  const strokeColor = getStrokeColor();
  const textColorClass = getTextColorClass();

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg className="transform -rotate-90" style={{ width: size, height: size }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-lg font-bold', textColorClass)}>
            {percentage}%
          </span>
        </div>
      </div>
      <span className="text-xs text-gray-400 mt-2 text-center leading-tight">{label}</span>
    </div>
  );
}

// =============================================
// RATING BAR CHART COMPONENT (for Son 5 Maç Formu)
// =============================================

function RatingBarChart({ 
  ratings 
}: { 
  ratings: { rating: number; matchLabel: string }[] 
}) {
  // Fixed Y-axis range from 5 to 10 for better visibility of differences
  const minY = 5;
  const maxY = 10;
  const range = maxY - minY; // 5
  
  // Reverse so oldest is on left, newest on right
  const displayRatings = [...ratings].reverse();
  
  return (
    <div className="flex flex-col w-full">
      <div className="text-xs text-gray-500 mb-3 text-center">Son 5 Maç Formu</div>
      {/* Increased height from h-20 to h-32 for taller bars */}
      <div className="flex items-end justify-center gap-3 h-32 w-full">
        {displayRatings.map((item, idx) => {
          // Calculate height as percentage of range (5-10)
          // 6.6 rating = (6.6-5)/5 = 32% -> should be short
          // 9.0 rating = (9.0-5)/5 = 80% -> should be tall
          const clampedRating = Math.max(minY, Math.min(maxY, item.rating));
          const heightPercent = item.rating > 0 
            ? ((clampedRating - minY) / range) * 100
            : 0;
          
          return (
            <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 max-w-[45px]">
              <span className={cn(
                'text-sm font-bold',
                getRatingColor(item.rating)
              )}>
                {item.rating > 0 ? item.rating.toFixed(1) : '-'}
              </span>
              <div 
                className={cn(
                  'w-full rounded-t transition-all duration-500',
                  getRatingBarColor(item.rating)
                )}
                style={{ 
                  height: `${heightPercent}%`,
                  minHeight: item.rating > 0 ? '4px' : '0px' // Minimal minHeight, let real height show
                }}
              />
              <span className="text-[10px] text-gray-500 truncate w-full text-center">
                {item.matchLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================
// STAT BAR COMPONENT
// =============================================

function StatBar({ 
  label, 
  value, 
  percentage, 
  barColor = 'bg-fb-yellow' 
}: { 
  label: string;
  value: string;
  percentage: number;
  barColor?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-400 text-xs flex-shrink-0 w-28 truncate">{label}</span>
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden min-w-[60px]">
          <div 
            className={cn('h-full rounded-full transition-all duration-500', barColor)}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <span className="text-white text-xs font-medium w-24 text-right whitespace-nowrap">{value}</span>
      </div>
    </div>
  );
}

// =============================================
// ICONS
// =============================================

const ClockIcon = () => (
  <svg className="w-4 h-4 text-fb-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const BoltIcon = () => (
  <svg className="w-4 h-4 text-fb-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-5 h-5 text-fb-yellow" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const TrophyIcon = () => (
  <svg className="w-10 h-10 text-fb-yellow/60" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
);

const StopwatchIcon = () => (
  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 1.5" />
    <path d="M12 5V3" />
    <path d="M10 3h4" />
    <path d="M18.36 7.64l1.42-1.42" />
  </svg>
);

const GloveIcon = () => (
  <svg className="w-4 h-4 text-fb-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
  </svg>
);

// =============================================
// MAIN COMPONENT
// =============================================

export default function SezonOzetiSection({
  stats,
  teamStats,
  recentMatches,
  isGoalkeeper,
  titleSuffix = '',
}: SezonOzetiSectionProps) {
  // Calculate totals from stats
  const totals = useMemo(() => {
    return stats.reduce((acc, st) => ({
      games: acc.games + (st.games.appearences || 0),
      lineups: acc.lineups + (st.games.lineups || 0),
      minutes: acc.minutes + (st.games.minutes || 0),
      goals: acc.goals + (st.goals.total || 0),
      assists: acc.assists + (st.goals.assists || 0),
      saves: acc.saves + (st.goals.saves || 0),
      goalsConceded: acc.goalsConceded + (st.goals.conceded || 0),
      yellowCards: acc.yellowCards + (st.cards.yellow || 0),
      yellowRedCards: acc.yellowRedCards + (st.cards.yellowred || 0),
      redCards: acc.redCards + (st.cards.red || 0),
      shotsTotal: acc.shotsTotal + (st.shots.total || 0),
      shotsOn: acc.shotsOn + (st.shots.on || 0),
      passesTotal: acc.passesTotal + (st.passes.total || 0),
      passesAccuracy: acc.passesAccuracy + (st.passes.accuracy || 0),
      duelsTotal: acc.duelsTotal + (st.duels.total || 0),
      duelsWon: acc.duelsWon + (st.duels.won || 0),
      dribblesAttempts: acc.dribblesAttempts + (st.dribbles.attempts || 0),
      dribblesSuccess: acc.dribblesSuccess + (st.dribbles.success || 0),
      ratingSum: acc.ratingSum + (st.games.rating ? parseFloat(st.games.rating) * (st.games.appearences || 0) : 0),
      ratingCount: acc.ratingCount + (st.games.rating && st.games.appearences ? st.games.appearences : 0),
    }), {
      games: 0, lineups: 0, minutes: 0, goals: 0, assists: 0,
      saves: 0, goalsConceded: 0, yellowCards: 0, yellowRedCards: 0, redCards: 0,
      shotsTotal: 0, shotsOn: 0, passesTotal: 0, passesAccuracy: 0,
      duelsTotal: 0, duelsWon: 0, dribblesAttempts: 0, dribblesSuccess: 0,
      ratingSum: 0, ratingCount: 0
    });
  }, [stats]);

  // Calculate derived values
  const teamTotalMatches = teamStats?.totalMatches || 0;
  const teamTotalMinutes = teamTotalMatches * 90;
  const teamTotalGoals = teamStats?.totalGoals || 0;
  const avgRating = totals.ratingCount > 0 ? totals.ratingSum / totals.ratingCount : 0;
  const totalContributions = totals.goals + totals.assists;
  const minutesPerContribution = totalContributions > 0 ? Math.round(totals.minutes / totalContributions) : 0;
  const goalsPerMatch = totals.games > 0 ? (totals.goals / totals.games).toFixed(2) : '0';
  const assistsPerMatch = totals.games > 0 ? (totals.assists / totals.games).toFixed(2) : '0';
  const savesPerMatch = totals.games > 0 ? (totals.saves / totals.games).toFixed(1) : '0';
  const concededPerMatch = totals.games > 0 ? (totals.goalsConceded / totals.games).toFixed(1) : '0';
  
  // Score contribution percentage (goals + assists) / team total goals
  const scoreContributionPercentage = teamTotalGoals > 0 
    ? calculatePercentage(totalContributions, teamTotalGoals) 
    : 0;
  
  // Calculate percentages
  const gamesPercentage = teamTotalMatches > 0 ? calculatePercentage(totals.games, teamTotalMatches) : 0;
  const lineupsPercentage = teamTotalMatches > 0 ? calculatePercentage(totals.lineups, teamTotalMatches) : 0;
  const minutesPercentage = teamTotalMinutes > 0 ? calculatePercentage(totals.minutes, teamTotalMinutes) : 0;
  
  // Goalkeeper save percentage
  const savePercentage = (totals.saves + totals.goalsConceded) > 0 
    ? calculatePercentage(totals.saves, totals.saves + totals.goalsConceded) 
    : 0;
  
  // Get last 5 match ratings for bar chart
  const last5Ratings = useMemo(() => {
    return recentMatches.slice(0, 5).map((match, idx) => ({
      rating: match.stats?.rating || 0,
      matchLabel: `Maç ${5 - idx}`,
    }));
  }, [recentMatches]);
  
  // Check if we have metrics to show
  const hasCircularMetrics = !isGoalkeeper && (totals.shotsTotal > 0 || totals.duelsTotal > 0 || totals.dribblesAttempts > 0);
  const hasGoalkeeperMetrics = isGoalkeeper && (totals.saves + totals.goalsConceded) > 0;
  const hasRatingChart = last5Ratings.some(r => r.rating > 0);

  return (
    <div className="space-y-4">
      <h3 className="section-title text-lg">SEZON ÖZETİ{titleSuffix}</h3>
      
      {/* Main 3-Column Grid - items-stretch ensures all columns same height */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        {/* Left Column: Maç & Süre */}
        <div className="glass-card p-5 relative overflow-hidden flex flex-col h-full">
          {/* Background Icon */}
          <div className="absolute top-4 right-4 opacity-30">
            <StopwatchIcon />
          </div>
          
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-fb-navy/50 flex items-center justify-center">
              <ClockIcon />
            </div>
            <span className="text-gray-400 text-sm font-medium">Maç & Süre</span>
          </div>
          
          {/* Main Number with Cards inline */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="text-5xl font-bold text-white">{totals.games}</span>
              <span className="text-lg text-gray-400 ml-2">Maç</span>
            </div>
            {/* Cards Section - moved here */}
            <div className="flex items-center gap-4">
              {/* Yellow Cards */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-6 bg-yellow-400 rounded-sm shadow-lg transform rotate-3" />
                <span className="text-xl font-bold text-white">{totals.yellowCards}</span>
                <span className="text-gray-400 text-sm">Sarı</span>
              </div>
              {/* Red Cards */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-6 bg-red-500 rounded-sm shadow-lg transform -rotate-3" />
                <span className="text-xl font-bold text-white">{totals.redCards}</span>
                <span className="text-gray-400 text-sm">Kırmızı</span>
              </div>
            </div>
          </div>
          
          {/* Stat Bars - pushed to bottom with margin-top: auto */}
          <div className="space-y-3 mt-auto">
            <StatBar 
              label="Oynanan Maç" 
              value={`${totals.games} (${gamesPercentage}%)`}
              percentage={gamesPercentage}
              barColor="bg-green-500"
            />
            <StatBar 
              label="İlk 11 Başlangıç" 
              value={`${totals.lineups} (${lineupsPercentage}%)`}
              percentage={lineupsPercentage}
              barColor="bg-fb-yellow"
            />
            <StatBar 
              label="Sezon Dakikası"
              value={`${formatNumber(totals.minutes)}' (${minutesPercentage}%)`}
              percentage={minutesPercentage}
              barColor="bg-blue-500"
            />
          </div>
        </div>
        
        {/* Middle Column: Skor Katkısı + Circular Charts stacked */}
        <div className="flex flex-col gap-4 h-full">
          {/* Box 2: Skor Katkısı or Goalkeeper Stats */}
          <div className="glass-card p-5 flex flex-col flex-1">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-fb-navy/50 flex items-center justify-center">
                {isGoalkeeper ? <GloveIcon /> : <BoltIcon />}
              </div>
              <span className="text-gray-400 text-sm font-medium">
                {isGoalkeeper ? 'Kale Performansı' : 'Skor Katkısı'}
              </span>
              <div className="ml-auto px-2.5 py-1 bg-fb-navy rounded-md">
                <span className="text-fb-yellow text-xs font-bold">
                  TOPLAM: {isGoalkeeper ? totals.saves : totalContributions}
                </span>
              </div>
            </div>
            
            {isGoalkeeper ? (
              <>
                {/* Goalkeeper Stats */}
                <div className="flex items-start gap-6 mb-6">
                  {/* Saves */}
                  <div className="flex-1">
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">KURTARIŞ</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-blue-400">{totals.saves}</span>
                    </div>
                    <div className="text-gray-500 text-sm mt-1">{savesPerMatch} / maç</div>
                  </div>
                  
                  {/* Goals Conceded */}
                  <div className="flex-1">
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">YENİLEN</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-red-400">{totals.goalsConceded}</span>
                    </div>
                    <div className="text-gray-500 text-sm mt-1">{concededPerMatch} / maç</div>
                  </div>
                </div>
                
                {/* Save Percentage - pushed to bottom */}
                <div className="pt-3 border-t border-white/10 mt-auto">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>
                      Kurtarış Yüzdesi: <span className="text-white font-semibold">{savePercentage}%</span>
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Goals and Assists with Contribution Chart */}
                <div className="flex items-start gap-4">
                  {/* Goals */}
                  <div className="flex-1">
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">GOL</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-fb-yellow">{totals.goals}</span>
                    </div>
                    <div className="text-gray-500 text-sm mt-1">{goalsPerMatch} / maç</div>
                  </div>
                  
                  {/* Assists */}
                  <div className="flex-1">
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">ASİST</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-green-400">{totals.assists}</span>
                    </div>
                    <div className="text-gray-500 text-sm mt-1">{assistsPerMatch} / maç</div>
                  </div>
                  
                  {/* Score Contribution Circular Chart */}
                  {teamTotalGoals > 0 && (
                    <div className="flex-shrink-0">
                      <CircularProgress
                        value={totalContributions}
                        max={teamTotalGoals}
                        label="Skor Katkısı"
                        size={70}
                        strokeWidth={5}
                        color="fb-yellow"
                      />
                    </div>
                  )}
                </div>
                
                {/* Contribution Rate - pushed to bottom */}
                <div className="pt-3 mt-auto border-t border-white/10">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    {minutesPerContribution > 0 ? (
                      <span>
                        Her <span className="text-white font-semibold">{minutesPerContribution}</span> dakikada bir skora katkı yapıyor.
                      </span>
                    ) : (
                      <span className="text-gray-500">Skor katkısı bulunamadı.</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Circular Charts - directly under Skor Katkısı, same width */}
          {(hasCircularMetrics || hasGoalkeeperMetrics) && (
            <div className="glass-card p-4">
              <div className="flex justify-center items-center gap-4 sm:gap-6">
                {/* Shot Accuracy */}
                {!isGoalkeeper && totals.shotsTotal > 0 && (
                  <CircularProgress
                    value={totals.shotsOn}
                    max={totals.shotsTotal}
                    label="İsabetli Şut"
                    size={70}
                    strokeWidth={5}
                    color="auto"
                  />
                )}
                
                {/* Duel Win Rate */}
                {!isGoalkeeper && totals.duelsTotal > 0 && (
                  <CircularProgress
                    value={totals.duelsWon}
                    max={totals.duelsTotal}
                    label="İkili Mücadele"
                    size={70}
                    strokeWidth={5}
                    color="auto"
                  />
                )}
                
                {/* Dribble Success */}
                {!isGoalkeeper && totals.dribblesAttempts > 0 && (
                  <CircularProgress
                    value={totals.dribblesSuccess}
                    max={totals.dribblesAttempts}
                    label="Dribling"
                    size={70}
                    strokeWidth={5}
                    color="auto"
                  />
                )}
                
                {/* Goalkeeper: Save Percentage */}
                {isGoalkeeper && (totals.saves + totals.goalsConceded) > 0 && (
                  <CircularProgress
                    value={totals.saves}
                    max={totals.saves + totals.goalsConceded}
                    label="Kurtarış %"
                    size={70}
                    strokeWidth={5}
                    color="green"
                  />
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Right Column: Ortalama Puan */}
        <div className={cn(
          'glass-card p-5 relative overflow-hidden flex flex-col h-full',
          avgRating > 0 && `bg-gradient-to-br ${getRatingBgClass(avgRating)}`
        )}>
          {/* Rating Section */}
          <div className="flex items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-2">
                <StarIcon />
              </div>
              <div className={cn('text-5xl font-bold', getRatingColor(avgRating))}>
                {avgRating > 0 ? avgRating.toFixed(2) : '-'}
              </div>
              <div className="text-gray-400 text-sm uppercase tracking-wider mt-1">Ortalama Puan</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <TrophyIcon />
            </div>
          </div>
          
          {/* Son 5 Maç Formu - no mt-auto, keep it close to rating */}
          {hasRatingChart && (
            <div className="pt-4 mt-4 border-t border-white/10">
              <RatingBarChart ratings={last5Ratings} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
