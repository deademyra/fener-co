// Tournament Tabs Component
// Fenerbahçe Stats - FENER.CO

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Fixture, Standing, RoundInfo, StageCategory } from '@/types/api-football';
import { TopPlayer } from '@/lib/api/api-football';
import { formatRoundDisplay, getStageCategoryDisplay } from '@/lib/utils/round-utils';
import { Calendar, Trophy, BarChart3, ChevronLeft, ChevronRight, ChevronDown, MapPin, Target, Footprints, AlertTriangle } from 'lucide-react';

const FB_TEAM_ID = 611;

interface TournamentTabsProps {
  leagueId: number;
  selectedSeason: number;
  selectedTab: string;
  selectedRound: string | null;
  rounds: string[];
  groupedRounds: Map<StageCategory, RoundInfo[]>;
  roundFixtures: Fixture[];
  standingsData: Standing[][] | Record<string, Standing[]>;
  isGroupFormat: boolean;
  topScorers: TopPlayer[];
  topAssists: TopPlayer[];
  topYellowCards: TopPlayer[];
  topRedCards: TopPlayer[];
}

const TABS = [
  { id: 'matches', label: 'Maçlar', icon: Calendar },
  { id: 'standings', label: 'Puan Durumu', icon: Trophy },
  { id: 'statistics', label: 'İstatistikler', icon: BarChart3 },
];

export function TournamentTabs({
  leagueId, selectedSeason, selectedTab, selectedRound, rounds, groupedRounds,
  roundFixtures, standingsData, isGroupFormat, topScorers, topAssists, topYellowCards, topRedCards,
}: TournamentTabsProps) {
  const router = useRouter();
  const [isRoundDropdownOpen, setIsRoundDropdownOpen] = useState(false);
  
  const currentRoundIndex = selectedRound ? rounds.indexOf(selectedRound) : -1;
  const hasPrevRound = currentRoundIndex > 0;
  const hasNextRound = currentRoundIndex < rounds.length - 1 && currentRoundIndex >= 0;
  
  const navigateToTab = (tab: string) => {
    const params = new URLSearchParams();
    params.set('sezon', selectedSeason.toString());
    params.set('tab', tab);
    if (selectedRound && tab === 'matches') params.set('tur', selectedRound);
    router.push(`/turnuvalar/${leagueId}?${params.toString()}`);
  };
  
  const navigateToRound = (round: string) => {
    const params = new URLSearchParams();
    params.set('sezon', selectedSeason.toString());
    params.set('tab', 'matches');
    params.set('tur', round);
    router.push(`/turnuvalar/${leagueId}?${params.toString()}`);
    setIsRoundDropdownOpen(false);
  };
  
  return (
    <div className="space-y-6">
      {/* Tab Headers */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigateToTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all flex-1 justify-center
                ${isActive ? 'bg-yellow-500 text-slate-900' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Tab Content */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        {selectedTab === 'matches' && (
          <MatchesTab
            leagueId={leagueId}
            selectedRound={selectedRound}
            rounds={rounds}
            groupedRounds={groupedRounds}
            fixtures={roundFixtures}
            hasPrevRound={hasPrevRound}
            hasNextRound={hasNextRound}
            goToPrevRound={() => hasPrevRound && navigateToRound(rounds[currentRoundIndex - 1])}
            goToNextRound={() => hasNextRound && navigateToRound(rounds[currentRoundIndex + 1])}
            navigateToRound={navigateToRound}
            isRoundDropdownOpen={isRoundDropdownOpen}
            setIsRoundDropdownOpen={setIsRoundDropdownOpen}
          />
        )}
        {selectedTab === 'standings' && <StandingsTab standings={standingsData} isGroupFormat={isGroupFormat} />}
        {selectedTab === 'statistics' && (
          <StatisticsTab topScorers={topScorers} topAssists={topAssists} topYellowCards={topYellowCards} topRedCards={topRedCards} />
        )}
      </div>
    </div>
  );
}

// ============================================
// Matches Tab
// ============================================
interface MatchesTabProps {
  leagueId: number;
  selectedRound: string | null;
  rounds: string[];
  groupedRounds: Map<StageCategory, RoundInfo[]>;
  fixtures: Fixture[];
  hasPrevRound: boolean;
  hasNextRound: boolean;
  goToPrevRound: () => void;
  goToNextRound: () => void;
  navigateToRound: (round: string) => void;
  isRoundDropdownOpen: boolean;
  setIsRoundDropdownOpen: (open: boolean) => void;
}

function MatchesTab({ leagueId, selectedRound, groupedRounds, fixtures, hasPrevRound, hasNextRound, goToPrevRound, goToNextRound, navigateToRound, isRoundDropdownOpen, setIsRoundDropdownOpen }: MatchesTabProps) {
  const categoryOrder: StageCategory[] = ['qualifying', 'league_phase', 'group_stage', 'knockout', 'final'];
  
  return (
    <div>
      {/* Round Navigation */}
      <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between gap-4">
        <button onClick={goToPrevRound} disabled={!hasPrevRound}
          className={`p-2 rounded-lg transition-colors ${hasPrevRound ? 'bg-slate-700/50 hover:bg-slate-600/50 text-white' : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'}`}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="relative flex-1 max-w-xs">
          <button onClick={() => setIsRoundDropdownOpen(!isRoundDropdownOpen)}
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-white transition-colors">
            <span className="font-medium truncate">
              {selectedRound ? formatRoundDisplay(selectedRound, leagueId, 'tr') : 'Tur Seçin'}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isRoundDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isRoundDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
              {categoryOrder.map(category => {
                const categoryRounds = groupedRounds.get(category);
                if (!categoryRounds || categoryRounds.length === 0) return null;
                return (
                  <div key={category}>
                    <div className="px-4 py-2 bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase">
                      {getStageCategoryDisplay(category, 'tr')}
                    </div>
                    {categoryRounds.map(round => (
                      <button key={round.round} onClick={() => navigateToRound(round.round)}
                        className={`w-full px-4 py-2.5 text-left hover:bg-slate-700/50 transition-colors
                          ${selectedRound === round.round ? 'bg-yellow-500/10 text-yellow-400' : 'text-white'}`}>
                        {round.displayNameTr}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <button onClick={goToNextRound} disabled={!hasNextRound}
          className={`p-2 rounded-lg transition-colors ${hasNextRound ? 'bg-slate-700/50 hover:bg-slate-600/50 text-white' : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'}`}>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      
      {/* Fixtures List */}
      <div className="py-2">
        {fixtures.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Bu turda maç bulunamadı.</p>
          </div>
        ) : (
          fixtures.sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
            .map(fixture => <FixtureRow key={fixture.fixture.id} fixture={fixture} />)
        )}
      </div>
    </div>
  );
}

function FixtureRow({ fixture }: { fixture: Fixture }) {
  const date = new Date(fixture.fixture.date);
  const dateStr = date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
  const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const isLive = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(fixture.fixture.status.short);
  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.fixture.status.short);
  const isFBHome = fixture.teams.home.id === FB_TEAM_ID;
  const isFBAway = fixture.teams.away.id === FB_TEAM_ID;
  const isFBMatch = isFBHome || isFBAway;
  
  // Calculate Fenerbahçe result
  let result: 'W' | 'D' | 'L' | null = null;
  if (isFinished && isFBMatch && fixture.goals.home !== null && fixture.goals.away !== null) {
    const fbScore = isFBHome ? fixture.goals.home : fixture.goals.away;
    const opponentScore = isFBHome ? fixture.goals.away : fixture.goals.home;
    if (fbScore > opponentScore) result = 'W';
    else if (fbScore < opponentScore) result = 'L';
    else result = 'D';
  }
  
  const resultConfig = {
    W: { label: 'G', bg: 'bg-green-500' },
    D: { label: 'B', bg: 'bg-amber-500' },
    L: { label: 'M', bg: 'bg-red-500' },
  };
  
  return (
    <Link 
      href={`/maclar/${fixture.fixture.id}`}
      className="block"
    >
      <div className={`match-card mx-4 my-2 ${isLive ? 'match-card-live' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* League */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-4 h-4 relative">
                {fixture.league.logo && (
                  <Image
                    src={fixture.league.logo}
                    alt={fixture.league.name}
                    fill
                    className="object-contain dark-logo-filter"
                  />
                )}
              </div>
              <span className="text-xs text-gray-400 truncate max-w-[100px]">
                {fixture.league.name}
              </span>
            </div>
            
            {/* Date for finished matches */}
            {isFinished && (
              <span className="text-xs text-gray-500">{dateStr}</span>
            )}
          </div>
          
          {/* Status/Time */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isLive ? (
              <span className="badge badge-live">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1.5 animate-pulse" />
                {fixture.fixture.status.elapsed}'
              </span>
            ) : isFinished ? (
              <span className="text-xs text-gray-400">Bitti</span>
            ) : (
              <div className="text-right">
                <div className="text-xs text-gray-400">{dateStr}</div>
                <div className="text-sm font-medium text-white">{timeStr}</div>
              </div>
            )}
          </div>
        </div>

        {/* Teams & Score */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Home Team */}
          <div className="flex-1 flex items-center gap-2 md:gap-3 justify-end">
            <span className={`text-sm md:text-base font-medium truncate ${isFBHome ? 'text-fb-yellow' : 'text-white'}`}>
              {fixture.teams.home.name}
            </span>
            <div className={`team-logo team-logo-md shrink-0 ${isFBHome ? 'ring-2 ring-fb-yellow/50' : ''}`}>
              {fixture.teams.home.logo && (
                <Image
                  src={fixture.teams.home.logo}
                  alt={fixture.teams.home.name}
                  width={36}
                  height={36}
                  className="object-contain"
                />
              )}
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {!isFinished && !isLive ? (
              <div className="text-center">
                <span className="text-lg text-gray-500">vs</span>
                <div className="text-xs text-fb-yellow mt-0.5">{timeStr}</div>
              </div>
            ) : (
              <>
                <span className={`font-bold text-2xl md:text-3xl ${isLive ? 'text-fb-yellow' : 'text-white'}`}>
                  {fixture.goals.home ?? '-'}
                </span>
                <span className="text-gray-500">:</span>
                <span className={`font-bold text-2xl md:text-3xl ${isLive ? 'text-fb-yellow' : 'text-white'}`}>
                  {fixture.goals.away ?? '-'}
                </span>
              </>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 flex items-center gap-2 md:gap-3 justify-start">
            <div className={`team-logo team-logo-md shrink-0 ${isFBAway ? 'ring-2 ring-fb-yellow/50' : ''}`}>
              {fixture.teams.away.logo && (
                <Image
                  src={fixture.teams.away.logo}
                  alt={fixture.teams.away.name}
                  width={36}
                  height={36}
                  className="object-contain"
                />
              )}
            </div>
            <span className={`text-sm md:text-base font-medium truncate ${isFBAway ? 'text-fb-yellow' : 'text-white'}`}>
              {fixture.teams.away.name}
            </span>
          </div>
          
          {/* Result Indicator */}
          {result && (
            <div className="ml-2 flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${resultConfig[result].bg}`}>
                {resultConfig[result].label}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ============================================
// Standings Tab
// ============================================
function StandingsTab({ standings, isGroupFormat }: { standings: Standing[][] | Record<string, Standing[]>; isGroupFormat: boolean }) {
  const standingsArray: Array<{ groupName: string; teams: Standing[] }> = Array.isArray(standings)
    ? standings.map((group, index) => ({ groupName: group[0]?.group || `Grup ${index + 1}`, teams: group }))
    : Object.entries(standings).map(([groupName, teams]) => ({ groupName, teams }));

  if (standingsArray.length === 0 || standingsArray.every(g => g.teams.length === 0)) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Puan durumu henüz yayınlanmadı.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-700/50">
      {standingsArray.map(({ groupName, teams }) => (
        <div key={groupName}>
          {isGroupFormat && standingsArray.length > 1 && (
            <div className="px-6 py-3 bg-slate-700/30">
              <h3 className="text-sm font-semibold text-white">{groupName}</h3>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="text-slate-400 text-xs uppercase border-b border-slate-700/50 bg-slate-900/30">
                  <th className="w-[5%] min-w-[40px] px-2 md:px-4 py-3 text-left">#</th>
                  <th className="w-auto px-2 md:px-4 py-3 text-left">Takım</th>
                  <th className="w-[8%] min-w-[40px] px-1 md:px-3 py-3 text-center">O</th>
                  <th className="w-[8%] min-w-[40px] px-1 md:px-3 py-3 text-center">G</th>
                  <th className="w-[8%] min-w-[40px] px-1 md:px-3 py-3 text-center">B</th>
                  <th className="w-[8%] min-w-[40px] px-1 md:px-3 py-3 text-center">M</th>
                  <th className="w-[8%] min-w-[45px] px-1 md:px-3 py-3 text-center">A</th>
                  <th className="w-[8%] min-w-[40px] px-1 md:px-3 py-3 text-center">P</th>
                  <th className="w-[15%] min-w-[100px] px-2 md:px-3 py-3 text-center hidden md:table-cell">Form</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => {
                  const isFB = team.team.id === FB_TEAM_ID;
                  const posStyle = getPositionStyle(team.description);
                  return (
                    <tr key={team.team.id}
                      className={`border-b border-slate-700/30 transition-colors
                        ${isFB ? 'bg-yellow-500/10 border-l-4 border-l-yellow-500' : 'hover:bg-slate-700/30'}
                        ${posStyle}`}>
                      <td className="px-2 md:px-4 py-3"><span className={`font-medium ${isFB ? 'text-yellow-400' : 'text-white'}`}>{team.rank}</span></td>
                      <td className="px-2 md:px-4 py-3">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 relative flex-shrink-0">
                            {team.team.logo && <Image src={team.team.logo} alt={team.team.name} fill className="object-contain" />}
                          </div>
                          <span className={`truncate ${isFB ? 'text-yellow-400 font-semibold' : 'text-white'}`}>{team.team.name}</span>
                        </div>
                      </td>
                      <td className="px-1 md:px-3 py-3 text-center text-slate-300">{team.all.played}</td>
                      <td className="px-1 md:px-3 py-3 text-center text-green-400">{team.all.win}</td>
                      <td className="px-1 md:px-3 py-3 text-center text-amber-400">{team.all.draw}</td>
                      <td className="px-1 md:px-3 py-3 text-center text-red-400">{team.all.lose}</td>
                      <td className="px-1 md:px-3 py-3 text-center text-slate-300">
                        <span className={team.goalsDiff > 0 ? 'text-green-400' : team.goalsDiff < 0 ? 'text-red-400' : ''}>
                          {team.goalsDiff > 0 ? '+' : ''}{team.goalsDiff}
                        </span>
                      </td>
                      <td className="px-1 md:px-3 py-3 text-center"><span className={`font-bold ${isFB ? 'text-yellow-400' : 'text-white'}`}>{team.points}</span></td>
                      <td className="px-2 md:px-3 py-3 hidden md:table-cell"><FormIndicator form={team.form} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      {!isGroupFormat && (
        <div className="px-6 py-4 bg-slate-900/30">
          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-sm" /><span>Şampiyonlar Ligi</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-orange-500 rounded-sm" /><span>Avrupa Ligi</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-sm" /><span>Konferans Ligi</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded-sm" /><span>Küme Düşme</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormIndicator({ form }: { form: string | null }) {
  if (!form) return null;
  // En eskiden en yeniye sıralama için .reverse() eklendi
  return (
    <div className="flex gap-1 justify-center">
      {form.split('').slice(-5).reverse().map((r, i) => {
        const bg = r === 'W' ? 'bg-green-500' : r === 'D' ? 'bg-amber-500' : r === 'L' ? 'bg-red-500' : 'bg-slate-600';
        const txt = r === 'W' ? 'G' : r === 'D' ? 'B' : r === 'L' ? 'M' : '-';
        return <span key={i} className={`w-5 h-5 rounded-full ${bg} flex items-center justify-center text-xs text-white font-medium`}>{txt}</span>;
      })}
    </div>
  );
}

function getPositionStyle(description: string | null): string {
  if (!description) return '';
  const d = description.toLowerCase();
  if (d.includes('champions league')) return 'border-l-4 border-l-blue-500';
  if (d.includes('europa league')) return 'border-l-4 border-l-orange-500';
  if (d.includes('conference')) return 'border-l-4 border-l-green-500';
  if (d.includes('relegation')) return 'border-l-4 border-l-red-500';
  return '';
}

// ============================================
// Statistics Tab
// ============================================
function StatisticsTab({ topScorers, topAssists, topYellowCards, topRedCards }: { topScorers: TopPlayer[]; topAssists: TopPlayer[]; topYellowCards: TopPlayer[]; topRedCards: TopPlayer[] }) {
  const [activeTab, setActiveTab] = useState<'scorers' | 'assists' | 'yellows' | 'reds'>('scorers');
  
  const tabs = [
    { id: 'scorers' as const, label: 'Gol Krallığı', icon: Target, data: topScorers || [] },
    { id: 'assists' as const, label: 'Asist Krallığı', icon: Footprints, data: topAssists || [] },
    { id: 'yellows' as const, label: 'Sarı Kart', icon: AlertTriangle, data: topYellowCards || [], iconColor: 'text-yellow-400' },
    { id: 'reds' as const, label: 'Kırmızı Kart', icon: AlertTriangle, data: topRedCards || [], iconColor: 'text-red-400' },
  ];
  
  const activeData = tabs.find(t => t.id === activeTab)?.data || [];
  
  return (
    <div>
      <div className="flex border-b border-slate-700/50 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap
                ${activeTab === tab.id ? 'border-b-2 border-yellow-500 text-yellow-400 bg-yellow-500/5' : 'text-slate-400 hover:text-white hover:bg-slate-700/30'}`}>
              <Icon className={`w-4 h-4 ${tab.iconColor || ''}`} />
              <span>{tab.label}</span>
              {tab.data.length > 0 && <span className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">{tab.data.length}</span>}
            </button>
          );
        })}
      </div>
      
      {activeData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="text-slate-400 text-xs uppercase border-b border-slate-700/50 bg-slate-900/30">
                <th className="w-[5%] min-w-[40px] px-2 md:px-4 py-3 text-left">#</th>
                <th className="w-[8%] min-w-[40px] px-2 md:px-4 py-3 text-left">Takım</th>
                <th className="w-auto px-2 md:px-4 py-3 text-left">Oyuncu</th>
                <th className="w-[12%] min-w-[50px] px-2 md:px-4 py-3 text-center">Maç</th>
                <th className="w-[12%] min-w-[50px] px-2 md:px-4 py-3 text-center font-bold">
                  {activeTab === 'scorers' ? 'Gol' : activeTab === 'assists' ? 'Asist' : activeTab === 'yellows' ? 'Sarı' : 'Kırmızı'}
                </th>
                <th className="w-[12%] min-w-[60px] px-2 md:px-4 py-3 text-center">Dk/Başına</th>
              </tr>
            </thead>
            <tbody>
              {activeData.slice(0, 20).map((player, index) => {
                const stats = player.statistics[0];
                if (!stats) return null;
                const appearances = stats.games.appearences || 0;
                const minutes = stats.games.minutes || 0;
                let mainStat = 0;
                if (activeTab === 'scorers') mainStat = stats.goals.total || 0;
                if (activeTab === 'assists') mainStat = stats.goals.assists || 0;
                if (activeTab === 'yellows') mainStat = stats.cards.yellow || 0;
                if (activeTab === 'reds') mainStat = stats.cards.red || 0;
                const minsPerStat = mainStat > 0 ? Math.round(minutes / mainStat) : '-';
                const isFB = stats.team.id === FB_TEAM_ID;
                const statColor = activeTab === 'scorers' || activeTab === 'assists' ? 'text-green-400' : activeTab === 'yellows' ? 'text-yellow-400' : 'text-red-400';
                
                return (
                  <tr key={player.player.id} className={`border-b border-slate-700/30 transition-colors ${isFB ? 'bg-yellow-500/10' : 'hover:bg-slate-700/30'}`}>
                    <td className="px-2 md:px-4 py-3"><span className={`font-medium ${index < 3 ? 'text-yellow-400' : 'text-slate-400'}`}>{index + 1}</span></td>
                    <td className="px-2 md:px-4 py-3">
                      <div className="w-5 h-5 md:w-6 md:h-6 relative flex-shrink-0">
                        {stats.team.logo && <Image src={stats.team.logo} alt={stats.team.name} fill className="object-contain" />}
                      </div>
                    </td>
                    <td className="px-2 md:px-4 py-3">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-7 h-7 md:w-8 md:h-8 relative rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                          {player.player.photo && <Image src={player.player.photo} alt={player.player.name} fill className="object-cover" />}
                        </div>
                        <span className={`truncate ${isFB ? 'text-yellow-400 font-semibold' : 'text-white'}`}>{player.player.name}</span>
                      </div>
                    </td>
                    <td className="px-2 md:px-4 py-3 text-center text-slate-300">{appearances}</td>
                    <td className="px-2 md:px-4 py-3 text-center"><span className={`font-bold text-lg ${statColor}`}>{mainStat}</span></td>
                    <td className="px-2 md:px-4 py-3 text-center text-slate-400">{minsPerStat}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>İstatistik verisi bulunamadı.</p>
        </div>
      )}
    </div>
  );
}
