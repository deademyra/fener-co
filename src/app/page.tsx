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

const CALLER_PAGE = 'anasayfa';

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
      <div className="flex items-center justify-between mb-3 md:mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-5 w-5 md:h-6 md:w-6 flex items-center justify-center flex-shrink-0">
            <Image
              src={fixture.league.logo}
              alt={leagueName}
              width={24}
              height={24}
              className="object-contain dark-logo-filter max-h-5 md:max-h-6 w-auto"
            />
          </div>
          <span className="text-xs md:text-sm text-slate-300 truncate">
            {leagueName}
            <span className="hidden sm:inline text-slate-400">
              {fixture.league.round && ` • ${fixture.league.round}`}
            </span>
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-xs md:text-sm text-white">{date}</span>
          <span className="text-xs md:text-sm text-yellow-400 font-medium ml-1 md:ml-2">{time}</span>
        </div>
      </div>
      
      {/* Main Section - Teams & Score */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 py-3 md:py-4">
        {/* Home Team */}
        <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3 min-w-0">
          <span className={cn(
            'text-sm sm:text-base md:text-lg font-semibold text-right truncate max-w-[80px] sm:max-w-[120px] md:max-w-none',
            fixture.teams.home.id === FENERBAHCE_TEAM_ID 
              ? 'text-yellow-400' 
              : 'text-white'
          )}>
            {fixture.teams.home.name}
          </span>
          <Image
            src={fixture.teams.home.logo}
            alt={fixture.teams.home.name}
            width={48}
            height={48}
            className="object-contain w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
          />
        </div>
        
        {/* Score */}
        <div className="px-2 sm:px-4 md:px-6 flex-shrink-0">
          <span className="text-2xl sm:text-3xl font-bold text-white whitespace-nowrap">
            {fixture.goals.home} - {fixture.goals.away}
          </span>
        </div>
        
        {/* Away Team */}
        <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
          <Image
            src={fixture.teams.away.logo}
            alt={fixture.teams.away.name}
            width={48}
            height={48}
            className="object-contain w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
          />
          <span className={cn(
            'text-sm sm:text-base md:text-lg font-semibold truncate max-w-[80px] sm:max-w-[120px] md:max-w-none',
            fixture.teams.away.id === FENERBAHCE_TEAM_ID 
              ? 'text-yellow-400' 
              : 'text-white'
          )}>
            {fixture.teams.away.name}
          </span>
        </div>
      </div>
      
      {/* Scorers - Hidden on very small screens */}
      {(homeGoals.length > 0 || awayGoals.length > 0) && (
        <div className="hidden sm:flex justify-center gap-4 md:gap-8 text-xs md:text-sm text-slate-400 mb-3">
          <div className="text-right max-w-[45%] truncate">
            {homeGoals.map((g, i) => (
              <span key={i}>⚽ {g.player.name} {g.time.elapsed}' </span>
            ))}
          </div>
          <div className="text-left max-w-[45%] truncate">
            {awayGoals.map((g, i) => (
              <span key={i}>{g.player.name} {g.time.elapsed}' ⚽ </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Footer - Venue - Hidden on small screens */}
      {fixture.fixture.venue.name && (
        <div className="hidden sm:block text-center text-xs md:text-sm text-slate-400 truncate">
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
      className="block p-3 rounded-lg hover:bg-white/5 transition-colors"
    >
      {/* Header - Round bilgisi yok */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 flex items-center justify-center flex-shrink-0">
            <Image
              src={fixture.league.logo}
              alt={leagueName}
              width={16}
              height={16}
              className="object-contain dark-logo-filter max-h-4 w-auto"
            />
          </div>
          <span className="text-xs text-slate-500">
            {leagueName}
          </span>
        </div>
        <span className="text-xs text-slate-500">{date}, {time}</span>
      </div>
      
      {/* Main Section - Fixed width columns for alignment */}
      <div className="flex items-center">
        {/* Home Team - Right aligned */}
        <div className="flex-1 flex items-center justify-end gap-2">
          <span className={cn(
            'text-sm font-medium truncate',
            fixture.teams.home.id === FENERBAHCE_TEAM_ID 
              ? 'text-yellow-400' 
              : 'text-white'
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
          <span className="text-sm font-bold text-white">
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
              ? 'text-yellow-400' 
              : 'text-white'
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
      <div className="flex items-center justify-between mb-3 md:mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-5 w-5 md:h-6 md:w-6 flex items-center justify-center flex-shrink-0">
            <Image
              src={fixture.league.logo}
              alt={leagueName}
              width={24}
              height={24}
              className="object-contain dark-logo-filter max-h-5 md:max-h-6 w-auto"
            />
          </div>
          <span className="text-xs md:text-sm text-slate-300 truncate">
            {leagueName}
            <span className="hidden sm:inline text-slate-400">
              {fixture.league.round && ` • ${fixture.league.round}`}
            </span>
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-xs md:text-sm text-white">{date}</span>
          <span className="text-xs md:text-sm text-yellow-400 font-medium ml-1 md:ml-2">{time}</span>
        </div>
      </div>
      
      {/* Main Section - Teams & VS */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 py-3 md:py-4">
        {/* Home Team */}
        <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3 min-w-0">
          <span className={cn(
            'text-sm sm:text-base md:text-lg font-semibold text-right truncate max-w-[80px] sm:max-w-[120px] md:max-w-none',
            fixture.teams.home.id === FENERBAHCE_TEAM_ID 
              ? 'text-yellow-400' 
              : 'text-white'
          )}>
            {fixture.teams.home.name}
          </span>
          <Image
            src={fixture.teams.home.logo}
            alt={fixture.teams.home.name}
            width={48}
            height={48}
            className="object-contain w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
          />
        </div>
        
        {/* VS / Time - Saat gri ve küçük */}
        <div className="px-2 sm:px-4 md:px-6 text-center flex-shrink-0">
          <div className="text-base md:text-lg text-slate-500">vs</div>
          <div className="text-xs md:text-sm text-slate-500">{time}</div>
        </div>
        
        {/* Away Team */}
        <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
          <Image
            src={fixture.teams.away.logo}
            alt={fixture.teams.away.name}
            width={48}
            height={48}
            className="object-contain w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
          />
          <span className={cn(
            'text-sm sm:text-base md:text-lg font-semibold truncate max-w-[80px] sm:max-w-[120px] md:max-w-none',
            fixture.teams.away.id === FENERBAHCE_TEAM_ID 
              ? 'text-yellow-400' 
              : 'text-white'
          )}>
            {fixture.teams.away.name}
          </span>
        </div>
      </div>
      
      {/* Footer - Venue - Hidden on small screens */}
      {fixture.fixture.venue.name && (
        <div className="hidden sm:block text-center text-xs md:text-sm text-slate-400 truncate">
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
      className="block p-3 rounded-lg hover:bg-white/5 transition-colors"
    >
      {/* Header - Round bilgisi yok */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 flex items-center justify-center flex-shrink-0">
            <Image
              src={fixture.league.logo}
              alt={leagueName}
              width={16}
              height={16}
              className="object-contain dark-logo-filter max-h-4 w-auto"
            />
          </div>
          <span className="text-xs text-slate-500">
            {leagueName}
          </span>
        </div>
        <span className="text-xs text-slate-500">{date}, {time}</span>
      </div>
      
      {/* Main Section - Fixed width columns for alignment */}
      <div className="flex items-center">
        {/* Home Team - Right aligned */}
        <div className="flex-1 flex items-center justify-end gap-2">
          <span className={cn(
            'text-sm font-medium truncate',
            fixture.teams.home.id === FENERBAHCE_TEAM_ID 
              ? 'text-yellow-400' 
              : 'text-white'
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
          <span className="text-sm text-slate-500">vs</span>
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
              ? 'text-yellow-400' 
              : 'text-white'
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
  const fixtures = await getCachedFenerbahceFixtures(CURRENT_SEASON, CALLER_PAGE);
  
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
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <p className="text-slate-400 text-center">Son maç bulunamadı</p>
      </div>
    );
  }
  
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 flex flex-col h-full">
      {/* Title */}
      <h2 className="text-lg font-bold text-white mb-4">SON MAÇ</h2>
      
      {/* Match Card */}
      <div className="flex-1">
        <PastMatchCardLarge fixture={lastMatch} />
      </div>
      
      {/* Form - Bottom aligned */}
      <div className="mt-auto pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Son 10 Maç</span>
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
  const fixtures = await getCachedFenerbahceFixtures(CURRENT_SEASON, CALLER_PAGE);
  
  // Gelecek 5 maç
  const upcomingMatches = fixtures
    .filter(f => ['NS', 'TBD'].includes(f.fixture.status.short))
    .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
    .slice(0, 5);
  
  if (upcomingMatches.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 h-full">
        <h2 className="text-lg font-bold text-white mb-4">SIRADAKİ MAÇLAR</h2>
        <p className="text-slate-400 text-center py-8">Yaklaşan maç bulunamadı</p>
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
    getCachedFenerbahceFixtures(CURRENT_SEASON, CALLER_PAGE),
    getCachedStandings(TRACKED_LEAGUES.SUPER_LIG, CURRENT_SEASON, CALLER_PAGE)
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
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 flex flex-col">
        <h3 className="text-lg font-bold text-white mb-4">PUAN DURUMU</h3>
        <div className="flex-1">
          <StandingsTableCompact standings={standings} />
        </div>
        <Link 
          href={`/turnuvalar/${TRACKED_LEAGUES.SUPER_LIG}`}
          className="block text-center text-sm text-yellow-400 hover:text-yellow-300 hover:underline mt-4 pt-4 border-t border-slate-700/50 transition-colors"
        >
          Tam Tablo →
        </Link>
      </div>
      
      {/* Son Maçlar */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 flex flex-col">
        <h3 className="text-lg font-bold text-white mb-4">SON MAÇLAR</h3>
        <div className="flex-1 space-y-1">
          {lastMatches.map(fixture => (
            <PastMatchCardSmall key={fixture.fixture.id} fixture={fixture} />
          ))}
        </div>
        <Link 
          href="/maclar?tab=sonuclar"
          className="block text-center text-sm text-yellow-400 hover:text-yellow-300 hover:underline mt-4 pt-4 border-t border-slate-700/50 transition-colors"
        >
          Tüm Sonuçlar →
        </Link>
      </div>
      
      {/* Gelecek Maçlar */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 flex flex-col">
        <h3 className="text-lg font-bold text-white mb-4">GELECEK MAÇLAR</h3>
        <div className="flex-1 space-y-1">
          {upcomingMatches.map(fixture => (
            <FutureMatchCardSmall key={fixture.fixture.id} fixture={fixture} />
          ))}
        </div>
        <Link 
          href="/maclar?tab=fikstur"
          className="block text-center text-sm text-yellow-400 hover:text-yellow-300 hover:underline mt-4 pt-4 border-t border-slate-700/50 transition-colors"
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
          <tr className="text-xs text-slate-400 border-b border-slate-700/50">
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
                  'border-b border-slate-700/30',
                  isFB && 'bg-yellow-500/10'
                )}
              >
                <td className="py-2">
                  <span className={cn(
                    'text-xs font-medium',
                    team.rank <= 4 && 'text-green-400',
                    team.rank > standings.length - 3 && 'text-red-400',
                    team.rank > 4 && team.rank <= standings.length - 3 && 'text-slate-400'
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
                      isFB ? 'font-bold text-yellow-400' : 'text-white'
                    )}>
                      {team.team.name}
                    </span>
                  </div>
                </td>
                <td className="text-center py-2 text-slate-400">
                  {team.all.played}
                </td>
                <td className="text-center py-2 font-bold text-white">
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

import { getAnnouncement, CONTENT_TYPE_LABELS } from '@/lib/announcement';

// Announcement Placeholder Component
async function AnnouncementPlaceholder() {
  // Get announcement content directly from the module
  const announcementData = getAnnouncement();
  const announcementHtml = announcementData.html || `
    <div class="text-center">
      <div class="text-yellow-400 text-4xl mb-3">📢</div>
      <h3 class="text-white font-bold text-lg mb-2">İçerik Alanı</h3>
      <p class="text-slate-400 text-sm">
        Bu alana reklam, duyuru veya özel içerik ekleyebilirsiniz.
      </p>
      <p class="text-slate-500 text-xs mt-3">
        Admin panelinden düzenleyin
      </p>
    </div>
  `;
  
  // Get title based on content type
  const getTitle = () => {
    if (!announcementData.showTitle) return null;
    if (announcementData.contentType === 'ozel' && announcementData.customTitle) {
      return announcementData.customTitle;
    }
    if (announcementData.contentType === 'none') return null;
    return CONTENT_TYPE_LABELS[announcementData.contentType];
  };
  
  // Get badge text
  const getBadge = () => {
    if (!announcementData.showBadge) return null;
    if (announcementData.contentType === 'none') return null;
    if (announcementData.contentType === 'ozel' && announcementData.customTitle) {
      return announcementData.customTitle;
    }
    return CONTENT_TYPE_LABELS[announcementData.contentType];
  };
  
  const title = getTitle();
  const badge = getBadge();
  
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 h-full flex flex-col">
      {/* Only show header if title or badge is visible */}
      {(title || badge) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-lg font-bold text-white">{title.toUpperCase()}</h2>}
          {!title && <div />}
          {badge && (
            <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">
              {badge}
            </span>
          )}
        </div>
      )}
      <div 
        className="flex-1 flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: announcementHtml }}
      />
    </div>
  );
}

async function SimpleStatsSection() {
  const teamStats = await getCachedTeamStatistics(
    FENERBAHCE_TEAM_ID,
    TRACKED_LEAGUES.SUPER_LIG,
    CURRENT_SEASON,
    CALLER_PAGE
  );
  
  if (!teamStats) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-bold text-white mb-4">FENERBAHÇE SEZON ÖZETİ</h2>
          <p className="text-slate-400 text-center py-8">İstatistik verisi yüklenemedi</p>
        </div>
        <div className="lg:col-span-1">
          <AnnouncementPlaceholder />
        </div>
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Stats Section - 2/3 width */}
      <div className="lg:col-span-2 bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">FENERBAHÇE SEZON ÖZETİ</h2>
          <span className="text-sm text-slate-400">
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
        <div className="border-t border-slate-700/50 pt-4">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Gol Atılan Dakikalar</h3>
          <div className="flex items-end gap-2 h-20">
            {Object.entries(goalMinutes).map(([period, count]) => (
              <div key={period} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-yellow-500 rounded-t transition-all"
                  style={{ height: `${(count / maxGoals) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
                />
                <span className="text-xs text-slate-500 mt-1">{period}</span>
                <span className="text-xs font-medium text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Announcement Section - 1/3 width */}
      <div className="lg:col-span-1">
        <AnnouncementPlaceholder />
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
    green: 'text-green-400',
    red: 'text-red-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
  };
  
  return (
    <div className="text-center p-3 bg-slate-900/50 rounded-lg">
      <div className={cn('text-2xl font-bold', color ? colorClasses[color] : 'text-white')}>
        {value}
      </div>
      <div className="text-xs text-slate-400">{label}</div>
      {subLabel && <div className="text-xs text-slate-500">{subLabel}</div>}
    </div>
  );
}

// ============================================
// PLAYER STATS SECTION (Enhanced - All Squad Players)
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
  
  if (playerIds.length === 0) return results;
  
  // Önce ilk oyuncuyu kontrol et - cache'de mi?
  const firstCheck = await getCachedPlayerStatisticsWithInfo(playerIds[0], CURRENT_SEASON, CALLER_PAGE);
  const allCached = firstCheck.fromCache;
  
  if (allCached) {
    // Cache'de veri var, tüm istekleri paralel yap (hızlı)
    console.log('[PlayerStats] Cache hit - parallel fetch');
    
    const allPromises = playerIds.map(async (playerId) => {
      try {
        const stats = await getCachedPlayerStatistics(playerId, CURRENT_SEASON, CALLER_PAGE);
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
          const stats = await getCachedPlayerStatistics(playerId, CURRENT_SEASON, CALLER_PAGE);
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
        await new Promise(resolve => setTimeout(resolve, 1500));
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
  
  // Sadece Fenerbahçe ve resmi turnuva istatistiklerini al (milli takım ve hazırlık hariç)
  const officialLeagueIds = [203, 206, 2, 3, 848]; // Süper Lig, Türkiye Kupası, CL, EL, ECL
  
  const fbStats = stats.filter(s => 
    s.statistics.some(st => 
      st.team.id === FENERBAHCE_TEAM_ID && 
      officialLeagueIds.includes(st.league.id)
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
      if (st.team.id === FENERBAHCE_TEAM_ID && officialLeagueIds.includes(st.league.id)) {
        totalGames += st.games.appearences || 0;
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
    const squadData = await getCachedSquad(FENERBAHCE_TEAM_ID, CALLER_PAGE);
    
    // Squad API'den gelen veri { team: {...}, players: [...] } formatında
    const squad = squadData?.players || [];
    
    if (!squad || squad.length === 0) {
      return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <p className="text-slate-400 text-center">Kadro verisi bulunamadı</p>
        </div>
      );
    }
    
    // TÜM oyuncular için istatistik çek (daha büyük batch size ile)
    const playerIds = squad.map(p => p.id);
    const statsMap = await fetchPlayerStatsBatched(playerIds, 8);
    
    const allPlayerStats = Array.from(statsMap.values()).filter(Boolean) as PlayerSeasonStat[];
    
    if (allPlayerStats.length === 0) {
      return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <p className="text-slate-400 text-center">Oyuncu istatistikleri yüklenemedi</p>
        </div>
      );
    }
    
    // Sıralamalar - Golcüler ve asistçiler için 0'dan büyük olanları filtrele
    const byGames = [...allPlayerStats].sort((a, b) => b.games - a.games).slice(0, 5);
    const byMinutes = [...allPlayerStats].sort((a, b) => b.minutes - a.minutes).slice(0, 5);
    const byGoals = [...allPlayerStats]
      .filter(p => p.goals > 0)
      .sort((a, b) => {
        // Önce gol sayısına göre, eşitse dakikaya göre sırala
        if (b.goals !== a.goals) return b.goals - a.goals;
        return a.minutes - b.minutes; // Daha az dakikada atan üstte
      })
      .slice(0, 5);
    const byAssists = [...allPlayerStats]
      .filter(p => p.assists > 0)
      .sort((a, b) => {
        if (b.assists !== a.assists) return b.assists - a.assists;
        return a.minutes - b.minutes;
      })
      .slice(0, 5);
    
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
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <p className="text-slate-400 text-center">İstatistikler yüklenirken hata oluştu</p>
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
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
        <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
        <p className="text-sm text-slate-500 text-center py-4">Veri bulunamadı</p>
      </div>
    );
  }
  
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {players.map((p, idx) => (
          <Link 
            key={p.player.id}
            href={ROUTES.PLAYER_DETAIL(p.player.id)}
            className="flex items-center gap-3 hover:bg-white/5 rounded-lg p-2 -mx-2 transition-colors group"
          >
            <span className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold',
              idx === 0 && 'bg-yellow-500/20 text-yellow-400',
              idx === 1 && 'bg-slate-500/20 text-slate-300',
              idx === 2 && 'bg-amber-700/20 text-amber-600',
              idx > 2 && 'bg-slate-700/50 text-slate-400'
            )}>
              {idx + 1}
            </span>
            <Image
              src={p.player.photo}
              alt={p.player.name}
              width={36}
              height={36}
              className="rounded-full object-cover ring-2 ring-slate-600 group-hover:ring-yellow-500/50 transition-all"
            />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-white truncate block group-hover:text-yellow-400 transition-colors">
                {p.player.name}
              </span>
              {statKey === 'games' && (
                <span className="text-xs text-slate-500">İlk 11: {p.lineups}</span>
              )}
              {statKey === 'minutes' && (
                <span className="text-xs text-slate-500">{p.games} maç</span>
              )}
              {(statKey === 'goals' || statKey === 'assists') && (
                <span className="text-xs text-slate-500">{p.minutes} dk</span>
              )}
            </div>
            <span className="text-lg font-bold text-yellow-400">
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
    <main className="min-h-screen">
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
    </main>
  );
}
