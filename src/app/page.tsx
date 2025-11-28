import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  StandingsTable, 
  LoadingCard,
  LoadingTable,
  UpcomingMatchesSlider
} from '@/components';
import { 
  getCachedFenerbahceFixtures,
  getCachedSquad,
  getCachedPlayerStatistics,
  getCachedPlayerStatisticsWithInfo,
  getCachedStandings,
  getCachedTeamStatistics
} from '@/lib/api';
import { TRACKED_LEAGUES, CURRENT_SEASON, FENERBAHCE_TEAM_ID, ROUTES, TRANSLATIONS } from '@/lib/constants';
import { Fixture, Standing, PlayerWithStats } from '@/types';
import { formatMatchDateTime, cn, getStatusText, parseForm } from '@/lib/utils';

export const revalidate = 60;

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Maç sonucunu hesapla (W/D/L)
function getMatchResult(fixture: Fixture): 'W' | 'D' | 'L' | null {
  if (fixture.goals.home === null || fixture.goals.away === null) return null;
  
  const isFBHome = fixture.teams.home.id === FENERBAHCE_TEAM_ID;
  const fbGoals = isFBHome ? fixture.goals.home : fixture.goals.away;
  const oppGoals = isFBHome ? fixture.goals.away : fixture.goals.home;
  
  if (fbGoals > oppGoals) return 'W';
  if (fbGoals < oppGoals) return 'L';
  return 'D';
}

// Maç tooltip bilgisi (rakip + skor)
function getMatchTooltip(fixture: Fixture): string {
  const isFBHome = fixture.teams.home.id === FENERBAHCE_TEAM_ID;
  const opponent = isFBHome ? fixture.teams.away : fixture.teams.home;
  return `${opponent.name} ${fixture.goals.home}-${fixture.goals.away}`;
}

// Canlı maç mı kontrol et
function isLiveMatch(status: string): boolean {
  return ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P'].includes(status);
}

// ============================================
// FORM ICON COMPONENT
// ============================================

function FormIcon({ 
  result, 
  matchInfo 
}: { 
  result: 'W' | 'D' | 'L'; 
  matchInfo?: string;
}) {
  const colorClasses = {
    W: 'bg-green-500 text-white',
    D: 'bg-amber-500 text-white',
    L: 'bg-red-500 text-white'
  };
  const labels = { W: 'G', D: 'B', L: 'M' };
  
  return (
    <span 
      className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold cursor-default',
        colorClasses[result]
      )}
      title={matchInfo}
    >
      {labels[result]}
    </span>
  );
}

// ============================================
// MATCH CARD COMPONENTS
// ============================================

// Geçmiş Maç Kartı - Büyük Format
function PastMatchCardLarge({ fixture }: { fixture: Fixture }) {
  const { date, time } = formatMatchDateTime(fixture.fixture.date);
  const leagueName = TRANSLATIONS.leagues[fixture.league.id as keyof typeof TRANSLATIONS.leagues] || fixture.league.name;
  
  // Gol atanları bul
  const homeGoals = fixture.events?.filter(e => e.type === 'Goal' && e.team.id === fixture.teams.home.id) || [];
  const awayGoals = fixture.events?.filter(e => e.type === 'Goal' && e.team.id === fixture.teams.away.id) || [];
  
  return (
    <Link href={ROUTES.MATCH_DETAIL(fixture.fixture.id)} className="block">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Image
            src={fixture.league.logo}
            alt={leagueName}
            width={24}
            height={24}
            className="object-contain dark:brightness-0 dark:invert"
          />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {leagueName}
            {fixture.league.round && <span className="text-gray-400"> • {fixture.league.round}</span>}
          </span>
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-900 dark:text-white">{date}</span>
          <span className="text-sm text-fb-yellow font-medium ml-2">{time}</span>
        </div>
      </div>
      
      {/* Main Section - Teams & Score */}
      <div className="flex items-center justify-center gap-4 py-4">
        {/* Home Team */}
        <div className="flex-1 flex items-center justify-end gap-3">
          <span className={cn(
            'text-lg font-semibold text-right',
            fixture.teams.home.id === FENERBAHCE_TEAM_ID 
              ? 'text-fb-navy dark:text-fb-yellow' 
              : 'text-gray-900 dark:text-white'
          )}>
            {fixture.teams.home.name}
          </span>
          <Image
            src={fixture.teams.home.logo}
            alt={fixture.teams.home.name}
            width={48}
            height={48}
            className="object-contain"
          />
        </div>
        
        {/* Score */}
        <div className="px-6">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {fixture.goals.home} - {fixture.goals.away}
          </span>
        </div>
        
        {/* Away Team */}
        <div className="flex-1 flex items-center gap-3">
          <Image
            src={fixture.teams.away.logo}
            alt={fixture.teams.away.name}
            width={48}
            height={48}
            className="object-contain"
          />
          <span className={cn(
            'text-lg font-semibold',
            fixture.teams.away.id === FENERBAHCE_TEAM_ID 
              ? 'text-fb-navy dark:text-fb-yellow' 
              : 'text-gray-900 dark:text-white'
          )}>
            {fixture.teams.away.name}
          </span>
        </div>
      </div>
      
      {/* Scorers */}
      {(homeGoals.length > 0 || awayGoals.length > 0) && (
        <div className="flex justify-center gap-8 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <div className="text-right">
            {homeGoals.map((g, i) => (
              <span key={i}>⚽ {g.player.name} {g.time.elapsed}' </span>
            ))}
          </div>
          <div className="text-left">
            {awayGoals.map((g, i) => (
              <span key={i}>{g.player.name} {g.time.elapsed}' ⚽ </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Footer - Venue */}
      {fixture.fixture.venue.name && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          🏟️ {fixture.fixture.venue.name}{fixture.fixture.venue.city && `, ${fixture.fixture.venue.city}`}
        </div>
      )}
    </Link>
  );
}

// Geçmiş Maç Kartı - Küçük Format (Venue yok, skor center-aligned, Round yok)
function PastMatchCardSmall({ fixture }: { fixture: Fixture }) {
  const { date, time } = formatMatchDateTime(fixture.fixture.date);
  const leagueName = TRANSLATIONS.leagues[fixture.league.id as keyof typeof TRANSLATIONS.leagues] || fixture.league.name;
  
  return (
    <Link 
      href={ROUTES.MATCH_DETAIL(fixture.fixture.id)} 
      className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      {/* Header - Round bilgisi yok */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Image
            src={fixture.league.logo}
            alt={leagueName}
            width={16}
            height={16}
            className="object-contain dark:brightness-0 dark:invert max-h-4"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {leagueName}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">{date}, {time}</span>
      </div>
      
      {/* Main Section - Fixed width columns for alignment */}
      <div className="flex items-center">
        {/* Home Team - Right aligned */}
        <div className="flex-1 flex items-center justify-end gap-2">
          <span className={cn(
            'text-sm font-medium truncate',
            fixture.teams.home.id === FENERBAHCE_TEAM_ID 
              ? 'text-fb-navy dark:text-fb-yellow' 
              : 'text-gray-900 dark:text-white'
          )}>
            {fixture.teams.home.name}
          </span>
          <Image
            src={fixture.teams.home.logo}
            alt={fixture.teams.home.name}
            width={24}
            height={24}
            className="object-contain flex-shrink-0 max-h-6"
          />
        </div>
        
        {/* Score - Center aligned, fixed width */}
        <div className="w-16 text-center flex-shrink-0">
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {fixture.goals.home} - {fixture.goals.away}
          </span>
        </div>
        
        {/* Away Team - Left aligned */}
        <div className="flex-1 flex items-center gap-2">
          <Image
            src={fixture.teams.away.logo}
            alt={fixture.teams.away.name}
            width={24}
            height={24}
            className="object-contain flex-shrink-0 max-h-6"
          />
          <span className={cn(
            'text-sm font-medium truncate',
            fixture.teams.away.id === FENERBAHCE_TEAM_ID 
              ? 'text-fb-navy dark:text-fb-yellow' 
              : 'text-gray-900 dark:text-white'
          )}>
            {fixture.teams.away.name}
          </span>
        </div>
      </div>
    </Link>
  );
}

// Gelecek Maç Kartı - Büyük Format
function FutureMatchCardLarge({ fixture }: { fixture: Fixture }) {
  const { date, time } = formatMatchDateTime(fixture.fixture.date);
  const leagueName = TRANSLATIONS.leagues[fixture.league.id as keyof typeof TRANSLATIONS.leagues] || fixture.league.name;
  
  return (
    <Link href={ROUTES.MATCH_DETAIL(fixture.fixture.id)} className="block">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Image
            src={fixture.league.logo}
            alt={leagueName}
            width={24}
            height={24}
            className="object-contain dark:brightness-0 dark:invert"
          />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {leagueName}
            {fixture.league.round && <span className="text-gray-400"> • {fixture.league.round}</span>}
          </span>
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-900 dark:text-white">{date}</span>
          <span className="text-sm text-fb-yellow font-medium ml-2">{time}</span>
        </div>
      </div>
      
      {/* Main Section - Teams & VS */}
      <div className="flex items-center justify-center gap-4 py-4">
        {/* Home Team */}
        <div className="flex-1 flex items-center justify-end gap-3">
          <span className={cn(
            'text-lg font-semibold text-right',
            fixture.teams.home.id === FENERBAHCE_TEAM_ID 
              ? 'text-fb-navy dark:text-fb-yellow' 
              : 'text-gray-900 dark:text-white'
          )}>
            {fixture.teams.home.name}
          </span>
          <Image
            src={fixture.teams.home.logo}
            alt={fixture.teams.home.name}
            width={48}
            height={48}
            className="object-contain"
          />
        </div>
        
        {/* VS / Time - Saat gri ve küçük */}
        <div className="px-6 text-center">
          <div className="text-lg text-gray-400 dark:text-gray-500">vs</div>
          <div className="text-sm text-gray-400 dark:text-gray-500">{time}</div>
        </div>
        
        {/* Away Team */}
        <div className="flex-1 flex items-center gap-3">
          <Image
            src={fixture.teams.away.logo}
            alt={fixture.teams.away.name}
            width={48}
            height={48}
            className="object-contain"
          />
          <span className={cn(
            'text-lg font-semibold',
            fixture.teams.away.id === FENERBAHCE_TEAM_ID 
              ? 'text-fb-navy dark:text-fb-yellow' 
              : 'text-gray-900 dark:text-white'
          )}>
            {fixture.teams.away.name}
          </span>
        </div>
      </div>
      
      {/* Footer - Venue */}
      {fixture.fixture.venue.name && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          🏟️ {fixture.fixture.venue.name}{fixture.fixture.venue.city && `, ${fixture.fixture.venue.city}`}
        </div>
      )}
    </Link>
  );
}

// Gelecek Maç Kartı - Küçük Format (Venue yok, vs center-aligned, Round yok)
function FutureMatchCardSmall({ fixture }: { fixture: Fixture }) {
  const { date, time } = formatMatchDateTime(fixture.fixture.date);
  const leagueName = TRANSLATIONS.leagues[fixture.league.id as keyof typeof TRANSLATIONS.leagues] || fixture.league.name;
  
  return (
    <Link 
      href={ROUTES.MATCH_DETAIL(fixture.fixture.id)} 
      className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      {/* Header - Round bilgisi yok */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Image
            src={fixture.league.logo}
            alt={leagueName}
            width={16}
            height={16}
            className="object-contain dark:brightness-0 dark:invert max-h-4"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {leagueName}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">{date}, {time}</span>
      </div>
      
      {/* Main Section - Fixed width columns for alignment */}
      <div className="flex items-center">
        {/* Home Team - Right aligned */}
        <div className="flex-1 flex items-center justify-end gap-2">
          <span className={cn(
            'text-sm font-medium truncate',
            fixture.teams.home.id === FENERBAHCE_TEAM_ID 
              ? 'text-fb-navy dark:text-fb-yellow' 
              : 'text-gray-900 dark:text-white'
          )}>
            {fixture.teams.home.name}
          </span>
          <Image
            src={fixture.teams.home.logo}
            alt={fixture.teams.home.name}
            width={24}
            height={24}
            className="object-contain flex-shrink-0 max-h-6"
          />
        </div>
        
        {/* VS - Center aligned, fixed width */}
        <div className="w-16 text-center flex-shrink-0">
          <span className="text-sm text-gray-400 dark:text-gray-500">vs</span>
        </div>
        
        {/* Away Team - Left aligned */}
        <div className="flex-1 flex items-center gap-2">
          <Image
            src={fixture.teams.away.logo}
            alt={fixture.teams.away.name}
            width={24}
            height={24}
            className="object-contain flex-shrink-0 max-h-6"
          />
          <span className={cn(
            'text-sm font-medium truncate',
            fixture.teams.away.id === FENERBAHCE_TEAM_ID 
              ? 'text-fb-navy dark:text-fb-yellow' 
              : 'text-gray-900 dark:text-white'
          )}>
            {fixture.teams.away.name}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ============================================
// HERO SECTION COMPONENTS
// ============================================

// Son Maç Hero Card (Anasayfa Sol)
async function LastMatchHero() {
  const fixtures = await getCachedFenerbahceFixtures(CURRENT_SEASON);
  
  // Son 10 tamamlanmış maç
  const completedMatches = fixtures
    .filter(f => ['FT', 'AET', 'PEN'].includes(f.fixture.status.short))
    .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
    .slice(0, 10);
  
  const lastMatch = completedMatches[0];
  
  // Form verisi (tooltip ile)
  const formData = completedMatches.map(m => ({
    result: getMatchResult(m),
    tooltip: getMatchTooltip(m)
  })).filter(f => f.result !== null) as { result: 'W' | 'D' | 'L'; tooltip: string }[];
  
  if (!lastMatch) {
    return (
      <div className="card p-6">
        <p className="text-gray-500 text-center">Son maç bulunamadı</p>
      </div>
    );
  }
  
  return (
    <div className="card p-6 flex flex-col h-full">
      {/* Title */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">SON MAÇ</h2>
      
      {/* Match Card */}
      <div className="flex-1">
        <PastMatchCardLarge fixture={lastMatch} />
      </div>
      
      {/* Form - Bottom aligned */}
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Son 10 Maç</span>
          <div className="flex gap-1">
            {formData.slice().reverse().map((item, idx) => (
              <FormIcon key={idx} result={item.result} matchInfo={item.tooltip} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sıradaki Maçlar Hero Card (Anasayfa Sağ) - Server'dan data alıp Client'a geç
async function UpcomingMatchesHero() {
  const fixtures = await getCachedFenerbahceFixtures(CURRENT_SEASON);
  
  // Gelecek 5 maç
  const upcomingMatches = fixtures
    .filter(f => ['NS', 'TBD'].includes(f.fixture.status.short))
    .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
    .slice(0, 5);
  
  if (upcomingMatches.length === 0) {
    return (
      <div className="card p-6 h-full">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">SIRADAKİ MAÇLAR</h2>
        <p className="text-gray-500 text-center py-8">Yaklaşan maç bulunamadı</p>
      </div>
    );
  }
  
  return <UpcomingMatchesSlider matches={upcomingMatches} />;
}

// ============================================
// HERO ALT SECTION (3 Columns)
// ============================================

async function HeroAltSection() {
  const [fixtures, standingsData] = await Promise.all([
    getCachedFenerbahceFixtures(CURRENT_SEASON),
    getCachedStandings(TRACKED_LEAGUES.SUPER_LIG)
  ]);
  
  // Son 5 maç
  const lastMatches = fixtures
    .filter(f => ['FT', 'AET', 'PEN'].includes(f.fixture.status.short))
    .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
    .slice(0, 5);
  
  // Gelecek 5 maç
  const upcomingMatches = fixtures
    .filter(f => ['NS', 'TBD'].includes(f.fixture.status.short))
    .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
    .slice(0, 5);
  
  const standings = standingsData?.league?.standings?.[0] || [];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      {/* Puan Durumu */}
      <div className="card p-4 flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">PUAN DURUMU</h3>
        <div className="flex-1">
          <StandingsTableCompact standings={standings} />
        </div>
        <Link 
          href={`/turnuvalar/${TRACKED_LEAGUES.SUPER_LIG}`}
          className="block text-center text-sm text-fb-navy dark:text-fb-yellow hover:underline mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          Tam Tablo →
        </Link>
      </div>
      
      {/* Son Maçlar */}
      <div className="card p-4 flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">SON MAÇLAR</h3>
        <div className="flex-1 space-y-1">
          {lastMatches.map(fixture => (
            <PastMatchCardSmall key={fixture.fixture.id} fixture={fixture} />
          ))}
        </div>
        <Link 
          href="/maclar?tab=sonuclar"
          className="block text-center text-sm text-fb-navy dark:text-fb-yellow hover:underline mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          Tüm Sonuçlar →
        </Link>
      </div>
      
      {/* Gelecek Maçlar */}
      <div className="card p-4 flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">GELECEK MAÇLAR</h3>
        <div className="flex-1 space-y-1">
          {upcomingMatches.map(fixture => (
            <FutureMatchCardSmall key={fixture.fixture.id} fixture={fixture} />
          ))}
        </div>
        <Link 
          href="/maclar?tab=fikstur"
          className="block text-center text-sm text-fb-navy dark:text-fb-yellow hover:underline mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          Tüm Fikstür →
        </Link>
      </div>
    </div>
  );
}

// Compact Standings Table
function StandingsTableCompact({ standings }: { standings: Standing[] }) {
  const displayStandings = standings.slice(0, 9);
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 w-6">#</th>
            <th className="text-left py-2">Takım</th>
            <th className="text-center py-2 w-8">O</th>
            <th className="text-center py-2 w-8">P</th>
          </tr>
        </thead>
        <tbody>
          {displayStandings.map((team) => {
            const isFB = team.team.id === FENERBAHCE_TEAM_ID;
            return (
              <tr 
                key={team.team.id}
                className={cn(
                  'border-b border-gray-100 dark:border-gray-800',
                  isFB && 'bg-fb-navy/5 dark:bg-fb-yellow/10'
                )}
              >
                <td className="py-2">
                  <span className={cn(
                    'text-xs font-medium',
                    team.rank <= 4 && 'text-green-600',
                    team.rank > standings.length - 3 && 'text-red-600'
                  )}>
                    {team.rank}
                  </span>
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <Image
                      src={team.team.logo}
                      alt={team.team.name}
                      width={20}
                      height={20}
                      className="object-contain max-h-5"
                    />
                    <span className={cn(
                      'text-sm truncate max-w-[120px]',
                      isFB && 'font-bold text-fb-navy dark:text-fb-yellow'
                    )}>
                      {team.team.name}
                    </span>
                  </div>
                </td>
                <td className="text-center py-2 text-gray-500 dark:text-gray-400">
                  {team.all.played}
                </td>
                <td className="text-center py-2 font-bold">
                  {team.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// SIMPLE STATS SECTION
// ============================================

async function SimpleStatsSection() {
  const teamStats = await getCachedTeamStatistics(
    FENERBAHCE_TEAM_ID,
    TRACKED_LEAGUES.SUPER_LIG,
    CURRENT_SEASON
  );
  
  if (!teamStats) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">FENERBAHÇE SEZON ÖZETİ</h2>
        <p className="text-gray-500 text-center py-8">İstatistik verisi yüklenemedi</p>
      </div>
    );
  }
  
  const { fixtures, goals, clean_sheet, failed_to_score, cards } = teamStats;
  
  const totalMatches = fixtures.played.total;
  const wins = fixtures.wins.total;
  const draws = fixtures.draws.total;
  const losses = fixtures.loses.total;
  const goalsFor = goals.for.total.total;
  const goalsAgainst = goals.against.total.total;
  
  // Kartları hesapla
  const yellowCards = Object.values(cards.yellow).reduce((sum, period) => sum + (period?.total || 0), 0);
  const redCards = Object.values(cards.red).reduce((sum, period) => sum + (period?.total || 0), 0);
  
  // Gol dakikaları
  const goalMinutes = {
    '0-15': goals.for.minute['0-15']?.total || 0,
    '16-30': goals.for.minute['16-30']?.total || 0,
    '31-45': goals.for.minute['31-45']?.total || 0,
    '46-60': goals.for.minute['46-60']?.total || 0,
    '61-75': goals.for.minute['61-75']?.total || 0,
    '76-90': goals.for.minute['76-90']?.total || 0,
  };
  
  const maxGoals = Math.max(...Object.values(goalMinutes), 1);
  
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">FENERBAHÇE SEZON ÖZETİ</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Süper Lig {CURRENT_SEASON}-{String(CURRENT_SEASON + 1).slice(-2)}
        </span>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatBox label="Maç" value={totalMatches} />
        <StatBox label="Galibiyet" value={wins} color="green" />
        <StatBox label="Beraberlik" value={draws} color="amber" />
        <StatBox label="Mağlubiyet" value={losses} color="red" />
      </div>
      
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatBox label="Atılan Gol" value={goalsFor} subLabel={`ort. ${goals.for.average.total}`} color="green" />
        <StatBox label="Yenen Gol" value={goalsAgainst} subLabel={`ort. ${goals.against.average.total}`} color="red" />
        <StatBox label="Clean Sheet" value={clean_sheet.total} color="blue" />
        <StatBox label="Gol Atamayan" value={failed_to_score.total} />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatBox label="Sarı Kart" value={yellowCards} color="amber" />
        <StatBox label="Kırmızı Kart" value={redCards} color="red" />
      </div>
      
      {/* Goal Distribution Chart */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Gol Atılan Dakikalar</h3>
        <div className="flex items-end gap-2 h-20">
          {Object.entries(goalMinutes).map(([period, count]) => (
            <div key={period} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-fb-navy dark:bg-fb-yellow rounded-t transition-all"
                style={{ height: `${(count / maxGoals) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{period}</span>
              <span className="text-xs font-medium text-gray-900 dark:text-white">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBox({ 
  label, 
  value, 
  subLabel,
  color 
}: { 
  label: string; 
  value: number; 
  subLabel?: string;
  color?: 'green' | 'red' | 'amber' | 'blue';
}) {
  const colorClasses = {
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    amber: 'text-amber-600 dark:text-amber-400',
    blue: 'text-blue-600 dark:text-blue-400',
  };
  
  return (
    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className={cn('text-2xl font-bold', color ? colorClasses[color] : 'text-gray-900 dark:text-white')}>
        {value}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      {subLabel && <div className="text-xs text-gray-400 dark:text-gray-500">{subLabel}</div>}
    </div>
  );
}

// ============================================
// PLAYER STATS SECTION (Rate limit dostu versiyon)
// ============================================

interface PlayerSeasonStat {
  player: { id: number; name: string; photo: string };
  games: number;
  lineups: number;
  minutes: number;
  goals: number;
  assists: number;
  rating: number;
}

// Akıllı batch işlem - cache varsa hızlı paralel, yoksa rate limit dostu batch
async function fetchPlayerStatsBatched(playerIds: number[], batchSize: number = 5): Promise<Map<number, PlayerSeasonStat | null>> {
  const results = new Map<number, PlayerSeasonStat | null>();
  const startTime = Date.now();
  
  // Önce ilk oyuncuyu kontrol et - cache'de mi?
  const firstCheck = await getCachedPlayerStatisticsWithInfo(playerIds[0], CURRENT_SEASON);
  const allCached = firstCheck.fromCache;
  
  if (allCached) {
    // Cache'de veri var, tüm istekleri paralel yap (hızlı)
    console.log('[PlayerStats] Cache hit - parallel fetch');
    
    const allPromises = playerIds.map(async (playerId) => {
      try {
        const stats = await getCachedPlayerStatistics(playerId, CURRENT_SEASON);
        return processPlayerStats(playerId, stats);
      } catch {
        return { playerId, stat: null };
      }
    });
    
    const allResults = await Promise.all(allPromises);
    allResults.forEach(({ playerId, stat }) => {
      results.set(playerId, stat);
    });
  } else {
    // Cache boş, batch halinde rate limit dostu şekilde çek
    console.log('[PlayerStats] Cache miss - batched fetch with delays');
    
    // İlk sonucu ekle
    results.set(playerIds[0], processPlayerStats(playerIds[0], firstCheck.data).stat);
    
    // Geri kalanları batch halinde çek
    for (let i = 1; i < playerIds.length; i += batchSize) {
      const batch = playerIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (playerId) => {
        try {
          const stats = await getCachedPlayerStatistics(playerId, CURRENT_SEASON);
          return processPlayerStats(playerId, stats);
        } catch {
          return { playerId, stat: null };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ playerId, stat }) => {
        results.set(playerId, stat);
      });
      
      // Son batch değilse, rate limit için bekle
      if (i + batchSize < playerIds.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  const elapsed = Date.now() - startTime;
  console.log(`[PlayerStats] Fetched ${playerIds.length} players in ${elapsed}ms (cached: ${allCached})`);
  
  return results;
}

// Oyuncu istatistiklerini işle
function processPlayerStats(playerId: number, stats: PlayerWithStats[] | null): { playerId: number; stat: PlayerSeasonStat | null } {
  if (!stats || stats.length === 0) return { playerId, stat: null };
  
  // Sadece Fenerbahçe ve resmi turnuva istatistiklerini al
  const fbStats = stats.filter(s => 
    s.statistics.some(st => 
      st.team.id === FENERBAHCE_TEAM_ID && 
      [203, 206, 2, 3, 848].includes(st.league.id)
    )
  );
  
  if (fbStats.length === 0) return { playerId, stat: null };
  
  let totalGames = 0;
  let totalLineups = 0;
  let totalMinutes = 0;
  let totalGoals = 0;
  let totalAssists = 0;
  let ratingSum = 0;
  let ratingCount = 0;
  
  fbStats.forEach(ps => {
    ps.statistics.forEach(st => {
      if (st.team.id === FENERBAHCE_TEAM_ID && [203, 206, 2, 3, 848].includes(st.league.id)) {
        totalGames += st.games.appearances || 0;
        totalLineups += st.games.lineups || 0;
        totalMinutes += st.games.minutes || 0;
        totalGoals += st.goals.total || 0;
        totalAssists += st.goals.assists || 0;
        if (st.games.rating) {
          ratingSum += parseFloat(st.games.rating);
          ratingCount++;
        }
      }
    });
  });
  
  return {
    playerId,
    stat: {
      player: fbStats[0].player,
      games: totalGames,
      lineups: totalLineups,
      minutes: totalMinutes,
      goals: totalGoals,
      assists: totalAssists,
      rating: ratingCount > 0 ? ratingSum / ratingCount : 0
    } as PlayerSeasonStat
  };
}

async function PlayerStatsSection() {
  try {
    const squadData = await getCachedSquad(FENERBAHCE_TEAM_ID, CURRENT_SEASON);
    
    // Squad API'den gelen veri { team: {...}, players: [...] } formatında
    const squad = squadData?.players || [];
    
    if (!squad || squad.length === 0) {
      return (
        <div className="card p-6">
          <p className="text-gray-500 text-center">Kadro verisi bulunamadı</p>
        </div>
      );
    }
    
    // Sadece ilk 20 oyuncu için istatistik çek (rate limit dostu)
    const playerIds = squad.slice(0, 20).map(p => p.id);
    const statsMap = await fetchPlayerStatsBatched(playerIds, 5);
    
    const allPlayerStats = Array.from(statsMap.values()).filter(Boolean) as PlayerSeasonStat[];
    
    if (allPlayerStats.length === 0) {
      return (
        <div className="card p-6">
          <p className="text-gray-500 text-center">Oyuncu istatistikleri yüklenemedi</p>
        </div>
      );
    }
    
    // Sıralamalar
    const byGames = [...allPlayerStats].sort((a, b) => b.games - a.games).slice(0, 5);
    const byMinutes = [...allPlayerStats].sort((a, b) => b.minutes - a.minutes).slice(0, 5);
    const byGoals = [...allPlayerStats].filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 5);
    const byAssists = [...allPlayerStats].filter(p => p.assists > 0).sort((a, b) => b.assists - a.assists).slice(0, 5);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlayerStatList title="Sezon Maç Sayısı" players={byGames} statKey="games" />
        <PlayerStatList title="Sezon Dakika" players={byMinutes} statKey="minutes" />
        <PlayerStatList title="Sezon Golü" players={byGoals} statKey="goals" />
        <PlayerStatList title="Sezon Asisti" players={byAssists} statKey="assists" />
      </div>
    );
  } catch (error) {
    console.error('PlayerStatsSection error:', error);
    return (
      <div className="card p-6">
        <p className="text-gray-500 text-center">İstatistikler yüklenirken hata oluştu</p>
      </div>
    );
  }
}

function PlayerStatList({ 
  title, 
  players, 
  statKey 
}: { 
  title: string; 
  players: PlayerSeasonStat[]; 
  statKey: 'games' | 'minutes' | 'goals' | 'assists';
}) {
  if (!players || players.length === 0) {
    return (
      <div className="card p-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
        <p className="text-sm text-gray-500 text-center py-4">Veri bulunamadı</p>
      </div>
    );
  }
  
  return (
    <div className="card p-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {players.map((p, idx) => (
          <Link 
            key={p.player.id}
            href={ROUTES.PLAYER_DETAIL(p.player.id)}
            className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg p-2 -mx-2 transition-colors"
          >
            <span className="w-6 text-center text-sm font-medium text-gray-500">{idx + 1}</span>
            <Image
              src={p.player.photo}
              alt={p.player.name}
              width={36}
              height={36}
              className="rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate block">
                {p.player.name}
              </span>
              {statKey === 'games' && (
                <span className="text-xs text-gray-500">İlk 11: {p.lineups}</span>
              )}
            </div>
            <span className="text-sm font-bold text-fb-navy dark:text-fb-yellow">
              {p[statKey]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Hero Section - 2 Columns, Equal Height */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <Suspense fallback={<LoadingCard />}>
          <LastMatchHero />
        </Suspense>
        <Suspense fallback={<LoadingCard />}>
          <UpcomingMatchesHero />
        </Suspense>
      </div>
      
      {/* Hero Alt Section - 3 Columns, Equal Height */}
      <Suspense fallback={<LoadingTable rows={5} />}>
        <HeroAltSection />
      </Suspense>
      
      {/* Simple Stats */}
      <Suspense fallback={<LoadingCard />}>
        <SimpleStatsSection />
      </Suspense>
      
      {/* Player Stats - 2x2 Grid */}
      <Suspense fallback={<LoadingTable rows={5} />}>
        <PlayerStatsSection />
      </Suspense>
    </div>
  );
}
