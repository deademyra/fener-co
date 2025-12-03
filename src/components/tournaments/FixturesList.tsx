// Fixtures List Component
// Fenerbahçe Stats - FENER.CO

import Image from 'next/image';
import Link from 'next/link';
import { Fixture } from '@/types/api-football';
import { formatRoundDisplay, parseRound } from '@/lib/utils/round-utils';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface FixturesListProps {
  fixtures: Fixture[];
  leagueId: number;
  showRound?: boolean;
  groupByRound?: boolean;
}

// Match status display
function getStatusDisplay(status: Fixture['fixture']['status']): {
  text: string;
  className: string;
} {
  switch (status.short) {
    case 'NS':
      return { text: 'Oynanmadı', className: 'text-slate-400' };
    case '1H':
    case '2H':
    case 'HT':
    case 'ET':
    case 'BT':
    case 'P':
    case 'LIVE':
      return { text: `${status.elapsed}'`, className: 'text-green-400 animate-pulse' };
    case 'FT':
      return { text: 'MS', className: 'text-slate-400' };
    case 'AET':
      return { text: 'UZT', className: 'text-slate-400' };
    case 'PEN':
      return { text: 'PEN', className: 'text-slate-400' };
    case 'PST':
      return { text: 'Ertelendi', className: 'text-amber-400' };
    case 'CANC':
      return { text: 'İptal', className: 'text-red-400' };
    case 'ABD':
      return { text: 'Yarıda Kaldı', className: 'text-red-400' };
    case 'TBD':
      return { text: 'TBA', className: 'text-slate-500' };
    default:
      return { text: status.short, className: 'text-slate-400' };
  }
}

// Format date and time
function formatDateTime(dateStr: string): { date: string; time: string } {
  const date = new Date(dateStr);
  
  const dateFormatted = date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  
  const timeFormatted = date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  return { date: dateFormatted, time: timeFormatted };
}

// Check if match is live
function isLive(status: string): boolean {
  return ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(status);
}

// Check if match is finished
function isFinished(status: string): boolean {
  return ['FT', 'AET', 'PEN'].includes(status);
}

// Fenerbahçe team ID
const FB_TEAM_ID = 611;

export function FixturesList({
  fixtures,
  leagueId,
  showRound = true,
  groupByRound = false,
}: FixturesListProps) {
  if (fixtures.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400">
        <p>Maç bulunamadı.</p>
      </div>
    );
  }

  // Sort by date
  const sortedFixtures = [...fixtures].sort(
    (a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
  );

  // Group by round if requested
  if (groupByRound) {
    const grouped = new Map<string, Fixture[]>();
    sortedFixtures.forEach(fixture => {
      const round = fixture.league.round;
      const existing = grouped.get(round) || [];
      existing.push(fixture);
      grouped.set(round, existing);
    });

    return (
      <div className="divide-y divide-slate-700/50">
        {Array.from(grouped.entries()).map(([round, roundFixtures]) => (
          <div key={round}>
            <div className="px-4 py-2 bg-slate-700/30 sticky top-0">
              <span className="text-sm font-medium text-slate-300">
                {formatRoundDisplay(round, leagueId, 'tr')}
              </span>
            </div>
            {roundFixtures.map(fixture => (
              <FixtureRow
                key={fixture.fixture.id}
                fixture={fixture}
                leagueId={leagueId}
                showRound={false}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-700/50">
      {sortedFixtures.map(fixture => (
        <FixtureRow
          key={fixture.fixture.id}
          fixture={fixture}
          leagueId={leagueId}
          showRound={showRound}
        />
      ))}
    </div>
  );
}

// Single fixture row
function FixtureRow({
  fixture,
  leagueId,
  showRound,
}: {
  fixture: Fixture;
  leagueId: number;
  showRound: boolean;
}) {
  const { date, time } = formatDateTime(fixture.fixture.date);
  const status = getStatusDisplay(fixture.fixture.status);
  const matchLive = isLive(fixture.fixture.status.short);
  const matchFinished = isFinished(fixture.fixture.status.short);
  
  // Check if Fenerbahçe won
  const fbIsHome = fixture.teams.home.id === FB_TEAM_ID;
  const fbWon = fbIsHome 
    ? fixture.teams.home.winner === true
    : fixture.teams.away.winner === true;
  const fbLost = fbIsHome
    ? fixture.teams.home.winner === false
    : fixture.teams.away.winner === false;

  return (
    <Link
      href={`/maclar/${fixture.fixture.id}`}
      className={`block px-4 py-4 hover:bg-slate-700/30 transition-colors
                 ${matchLive ? 'bg-green-500/5' : ''}`}
    >
      <div className="flex items-center gap-4">
        {/* Date & Status */}
        <div className="w-24 flex-shrink-0 text-center">
          {!matchFinished && !matchLive ? (
            <>
              <div className="text-white text-sm font-medium">{date}</div>
              <div className="text-slate-400 text-xs">{time}</div>
            </>
          ) : (
            <div className={`text-sm font-medium ${status.className}`}>
              {matchLive && <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse" />}
              {status.text}
            </div>
          )}
        </div>
        
        {/* Match Info */}
        <div className="flex-1 min-w-0">
          {/* Teams */}
          <div className="space-y-2">
            {/* Home Team */}
            <div className={`flex items-center gap-3 ${fbIsHome ? '' : 'opacity-80'}`}>
              <div className="w-6 h-6 relative flex-shrink-0">
                {fixture.teams.home.logo && (
                  <Image
                    src={fixture.teams.home.logo}
                    alt={fixture.teams.home.name}
                    fill
                    className="object-contain"
                  />
                )}
              </div>
              <span className={`flex-1 truncate text-sm 
                              ${fixture.teams.home.id === FB_TEAM_ID ? 'text-yellow-400 font-semibold' : 'text-white'}`}>
                {fixture.teams.home.name}
              </span>
              {(matchFinished || matchLive) && (
                <span className={`font-bold text-lg min-w-[24px] text-right
                                ${fixture.teams.home.winner ? 'text-green-400' : 'text-white'}`}>
                  {fixture.goals.home ?? '-'}
                </span>
              )}
            </div>
            
            {/* Away Team */}
            <div className={`flex items-center gap-3 ${!fbIsHome ? '' : 'opacity-80'}`}>
              <div className="w-6 h-6 relative flex-shrink-0">
                {fixture.teams.away.logo && (
                  <Image
                    src={fixture.teams.away.logo}
                    alt={fixture.teams.away.name}
                    fill
                    className="object-contain"
                  />
                )}
              </div>
              <span className={`flex-1 truncate text-sm 
                              ${fixture.teams.away.id === FB_TEAM_ID ? 'text-yellow-400 font-semibold' : 'text-white'}`}>
                {fixture.teams.away.name}
              </span>
              {(matchFinished || matchLive) && (
                <span className={`font-bold text-lg min-w-[24px] text-right
                                ${fixture.teams.away.winner ? 'text-green-400' : 'text-white'}`}>
                  {fixture.goals.away ?? '-'}
                </span>
              )}
            </div>
          </div>
          
          {/* Round & Venue */}
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            {showRound && (
              <span>{formatRoundDisplay(fixture.league.round, leagueId, 'tr')}</span>
            )}
            {fixture.fixture.venue.name && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {fixture.fixture.venue.name}
              </span>
            )}
          </div>
        </div>
        
        {/* Result Badge for FB */}
        {matchFinished && (
          <div className="flex-shrink-0">
            {fbWon && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded">
                G
              </span>
            )}
            {fbLost && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded">
                M
              </span>
            )}
            {!fbWon && !fbLost && (
              <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded">
                B
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

// Compact fixture card for homepage
export function FixtureCard({ fixture, leagueId }: { fixture: Fixture; leagueId: number }) {
  const { date, time } = formatDateTime(fixture.fixture.date);
  const status = getStatusDisplay(fixture.fixture.status);
  const matchLive = isLive(fixture.fixture.status.short);
  const matchFinished = isFinished(fixture.fixture.status.short);

  return (
    <Link
      href={`/maclar/${fixture.fixture.id}`}
      className={`block p-4 bg-slate-800/50 rounded-lg border border-slate-700/50
                 hover:border-yellow-500/50 transition-all group
                 ${matchLive ? 'border-green-500/50 bg-green-500/5' : ''}`}
    >
      {/* League & Date */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
        <div className="flex items-center gap-2">
          {fixture.league.logo && (
            <Image
              src={fixture.league.logo}
              alt={fixture.league.name}
              width={16}
              height={16}
              className="rounded"
            />
          )}
          <span className="truncate">{fixture.league.name}</span>
        </div>
        <span>{date}</span>
      </div>
      
      {/* Teams & Score */}
      <div className="flex items-center justify-between">
        {/* Home */}
        <div className="flex-1 text-center">
          <div className="w-10 h-10 relative mx-auto mb-2">
            {fixture.teams.home.logo && (
              <Image
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                fill
                className="object-contain"
              />
            )}
          </div>
          <p className={`text-sm truncate ${fixture.teams.home.id === FB_TEAM_ID ? 'text-yellow-400 font-semibold' : 'text-white'}`}>
            {fixture.teams.home.name}
          </p>
        </div>
        
        {/* Score / Time */}
        <div className="px-4 text-center">
          {matchFinished || matchLive ? (
            <div className="text-2xl font-bold text-white">
              {fixture.goals.home} - {fixture.goals.away}
            </div>
          ) : (
            <div className="text-lg font-bold text-white">{time}</div>
          )}
          <div className={`text-xs mt-1 ${status.className}`}>
            {matchLive && <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse" />}
            {status.text}
          </div>
        </div>
        
        {/* Away */}
        <div className="flex-1 text-center">
          <div className="w-10 h-10 relative mx-auto mb-2">
            {fixture.teams.away.logo && (
              <Image
                src={fixture.teams.away.logo}
                alt={fixture.teams.away.name}
                fill
                className="object-contain"
              />
            )}
          </div>
          <p className={`text-sm truncate ${fixture.teams.away.id === FB_TEAM_ID ? 'text-yellow-400 font-semibold' : 'text-white'}`}>
            {fixture.teams.away.name}
          </p>
        </div>
      </div>
    </Link>
  );
}
