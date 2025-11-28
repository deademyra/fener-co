import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getCachedPlayer, getCachedFenerbahceFixtures } from '@/lib/api';
import { FENERBAHCE_TEAM_ID, TRACKED_LEAGUE_IDS, TRANSLATIONS, CURRENT_SEASON, ROUTES } from '@/lib/constants';
import { cn, formatMatchDateTime } from '@/lib/utils';
import { LoadingSpinner } from '@/components';

interface PlayerDetailPageProps {
  params: { id: string };
  searchParams: { season?: string; league?: string };
}

export const revalidate = 3600; // 1 saat

export default async function PlayerDetailPage({ params, searchParams }: PlayerDetailPageProps) {
  const playerId = parseInt(params.id);
  const selectedSeason = searchParams.season ? parseInt(searchParams.season) : CURRENT_SEASON;
  const selectedLeague = searchParams.league || 'all';
  
  const playerData = await getCachedPlayer(playerId, selectedSeason);
  
  if (!playerData) {
    notFound();
  }
  
  const player = playerData.player;
  
  // Sadece Fenerbahçe ve takip edilen liglerdeki istatistikleri filtrele
  const fbStats = playerData.statistics.filter(st => 
    st.team.id === FENERBAHCE_TEAM_ID && 
    TRACKED_LEAGUE_IDS.includes(st.league.id)
  );
  
  // Seçili turnuvaya göre filtrele
  const filteredStats = selectedLeague === 'all' 
    ? fbStats 
    : fbStats.filter(st => st.league.id === Number(selectedLeague));
  
  // Toplam istatistikler
  const totals = filteredStats.reduce((acc, st) => ({
    games: acc.games + (st.games.appearances || 0),
    lineups: acc.lineups + (st.games.lineups || 0),
    minutes: acc.minutes + (st.games.minutes || 0),
    goals: acc.goals + (st.goals.total || 0),
    assists: acc.assists + (st.goals.assists || 0),
    shotsTotal: acc.shotsTotal + (st.shots.total || 0),
    shotsOn: acc.shotsOn + (st.shots.on || 0),
    passesTotal: acc.passesTotal + (st.passes.total || 0),
    passesKey: acc.passesKey + (st.passes.key || 0),
    tacklesTotal: acc.tacklesTotal + (st.tackles.total || 0),
    blocks: acc.blocks + (st.tackles.blocks || 0),
    interceptions: acc.interceptions + (st.tackles.interceptions || 0),
    duelsTotal: acc.duelsTotal + (st.duels.total || 0),
    duelsWon: acc.duelsWon + (st.duels.won || 0),
    dribblesAttempts: acc.dribblesAttempts + (st.dribbles.attempts || 0),
    dribblesSuccess: acc.dribblesSuccess + (st.dribbles.success || 0),
    foulsDrawn: acc.foulsDrawn + (st.fouls.drawn || 0),
    foulsCommitted: acc.foulsCommitted + (st.fouls.committed || 0),
    yellowCards: acc.yellowCards + (st.cards.yellow || 0),
    redCards: acc.redCards + (st.cards.red || 0),
    ratingSum: acc.ratingSum + (st.games.rating ? parseFloat(st.games.rating) : 0),
    ratingCount: acc.ratingCount + (st.games.rating ? 1 : 0),
  }), {
    games: 0, lineups: 0, minutes: 0, goals: 0, assists: 0,
    shotsTotal: 0, shotsOn: 0, passesTotal: 0, passesKey: 0,
    tacklesTotal: 0, blocks: 0, interceptions: 0, duelsTotal: 0, duelsWon: 0,
    dribblesAttempts: 0, dribblesSuccess: 0, foulsDrawn: 0, foulsCommitted: 0,
    yellowCards: 0, redCards: 0, ratingSum: 0, ratingCount: 0
  });
  
  const avgRating = totals.ratingCount > 0 ? totals.ratingSum / totals.ratingCount : 0;
  const maxPossibleMinutes = totals.games * 90;
  const minutesPercentage = maxPossibleMinutes > 0 ? (totals.minutes / maxPossibleMinutes) * 100 : 0;
  
  // Unique leagues for filter
  const uniqueLeagues = [...new Map(fbStats.map(st => [st.league.id, st.league])).values()];
  
  // Mevcut sezonlar (basit liste - gerçekte API'den çekilmeli)
  const availableSeasons = [2025, 2024, 2023, 2022, 2021];
  
  // Fenerbahçe maçları
  const allFixtures = await getCachedFenerbahceFixtures(selectedSeason);
  const finishedFixtures = allFixtures
    .filter(f => ['FT', 'AET', 'PEN'].includes(f.fixture.status.short))
    .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
    .slice(0, 10);
  
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Player Header */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <Image
              src={player.photo}
              alt={player.name}
              width={150}
              height={150}
              className="rounded-xl"
            />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl md:text-4xl text-white mb-2">
              {player.name}
            </h1>
            <p className="text-fb-yellow text-lg mb-4">
              {filteredStats[0]?.games.position || 'Oyuncu'}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Yaş</span>
                <p className="text-white">{player.age}</p>
              </div>
              <div>
                <span className="text-gray-500">Milliyet</span>
                <p className="text-white">{player.nationality}</p>
              </div>
              <div>
                <span className="text-gray-500">Boy</span>
                <p className="text-white">{player.height || '-'}</p>
              </div>
              <div>
                <span className="text-gray-500">Kilo</span>
                <p className="text-white">{player.weight || '-'}</p>
              </div>
            </div>
          </div>
          
          {/* Season Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-500">Sezon</label>
            <div className="flex flex-wrap gap-2">
              {availableSeasons.map(season => (
                <Link
                  key={season}
                  href={`${ROUTES.PLAYER_DETAIL(playerId)}?season=${season}&league=${selectedLeague}`}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-colors',
                    selectedSeason === season
                      ? 'bg-fb-yellow text-fb-navy font-medium'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  )}
                >
                  {season}-{(season + 1).toString().slice(-2)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Cards with Visualizations */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Maç */}
        <div className="card p-4 text-center">
          <p className="text-3xl font-display text-fb-yellow">{totals.games}</p>
          <p className="text-sm text-gray-400 mb-2">Maç</p>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-fb-yellow h-2 rounded-full" 
              style={{ width: `${totals.games > 0 ? (totals.lineups / totals.games) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">İlk 11: {totals.lineups}</p>
        </div>
        
        {/* Dakika */}
        <div className="card p-4 text-center">
          <p className="text-3xl font-display text-fb-yellow">{totals.minutes}'</p>
          <p className="text-sm text-gray-400 mb-2">Dakika</p>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${Math.min(minutesPercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">%{minutesPercentage.toFixed(0)} oynama</p>
        </div>
        
        {/* Gol */}
        <div className="card p-4 text-center">
          <p className="text-3xl font-display text-fb-yellow">{totals.goals}</p>
          <p className="text-sm text-gray-400 mb-2">Gol</p>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${totals.goals > 0 ? Math.min((totals.goals / 20) * 100, 100) : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {totals.goals > 0 && totals.minutes > 0 ? `Her ${Math.round(totals.minutes / totals.goals)}' bir gol` : '-'}
          </p>
        </div>
        
        {/* Asist */}
        <div className="card p-4 text-center">
          <p className="text-3xl font-display text-fb-yellow">{totals.assists}</p>
          <p className="text-sm text-gray-400 mb-2">Asist</p>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full" 
              style={{ width: `${totals.assists > 0 ? Math.min((totals.assists / 15) * 100, 100) : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {totals.assists > 0 && totals.minutes > 0 ? `Her ${Math.round(totals.minutes / totals.assists)}' bir asist` : '-'}
          </p>
        </div>
        
        {/* Rating */}
        <div className="card p-4 text-center">
          <p className="text-3xl font-display text-fb-yellow">{avgRating.toFixed(1)}</p>
          <p className="text-sm text-gray-400 mb-2">Rating</p>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full",
                avgRating >= 7 ? 'bg-green-500' : avgRating >= 6 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              style={{ width: `${(avgRating / 10) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{totals.ratingCount} maç ortalaması</p>
        </div>
      </div>
      
      {/* Tournament Filter */}
      {uniqueLeagues.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`${ROUTES.PLAYER_DETAIL(playerId)}?season=${selectedSeason}&league=all`}
            className={cn(
              'px-4 py-2 rounded-lg text-sm transition-colors',
              selectedLeague === 'all' 
                ? 'bg-fb-yellow text-fb-navy font-medium' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            )}
          >
            Tümü
          </Link>
          {uniqueLeagues.map(league => (
            <Link
              key={league.id}
              href={`${ROUTES.PLAYER_DETAIL(playerId)}?season=${selectedSeason}&league=${league.id}`}
              className={cn(
                'px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2',
                selectedLeague === league.id.toString()
                  ? 'bg-fb-yellow text-fb-navy font-medium' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
            >
              <Image src={league.logo} alt="" width={16} height={16} />
              {TRANSLATIONS.leagues[league.id as keyof typeof TRANSLATIONS.leagues] || league.name}
            </Link>
          ))}
        </div>
      )}
      
      {/* Detailed Stats Table */}
      {filteredStats.length > 0 && (
        <div className="card p-4">
          <h3 className="section-title text-lg mb-4">DETAYLI İSTATİSTİKLER</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="pb-3">Turnuva</th>
                  <th className="pb-3 text-center">Maç</th>
                  <th className="pb-3 text-center">Gol</th>
                  <th className="pb-3 text-center">Asist</th>
                  <th className="pb-3 text-center">Sarı</th>
                  <th className="pb-3 text-center">Kırmızı</th>
                  <th className="pb-3 text-center">Şut (İsabet%)</th>
                  <th className="pb-3 text-center">İkili M. (Kazanma%)</th>
                  <th className="pb-3 text-center">Rating</th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.map((st, idx) => {
                  const shotsTotal = st.shots.total || 0;
                  const shotsOn = st.shots.on || 0;
                  const duelsTotal = st.duels.total || 0;
                  const duelsWon = st.duels.won || 0;
                  const shotAccuracy = shotsTotal > 0 ? ((shotsOn / shotsTotal) * 100).toFixed(0) : '-';
                  const duelWinRate = duelsTotal > 0 ? ((duelsWon / duelsTotal) * 100).toFixed(0) : '-';
                  return (
                    <tr key={idx} className="border-b border-gray-800/50">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Image src={st.league.logo} alt="" width={20} height={20} />
                          {TRANSLATIONS.leagues[st.league.id as keyof typeof TRANSLATIONS.leagues] || st.league.name}
                        </div>
                      </td>
                      <td className="py-3 text-center">{st.games.appearances || 0}</td>
                      <td className="py-3 text-center text-fb-yellow">{st.goals.total || 0}</td>
                      <td className="py-3 text-center">{st.goals.assists || 0}</td>
                      <td className="py-3 text-center text-yellow-500">{st.cards.yellow || 0}</td>
                      <td className="py-3 text-center text-red-500">{st.cards.red || 0}</td>
                      <td className="py-3 text-center">
                        {st.shots.total || 0}/{st.shots.on || 0} ({shotAccuracy}%)
                      </td>
                      <td className="py-3 text-center">
                        {st.duels.total || 0}/{st.duels.won || 0} ({duelWinRate}%)
                      </td>
                      <td className="py-3 text-center">
                        <span className={cn(
                          'font-medium',
                          parseFloat(st.games.rating || '0') >= 7 ? 'text-green-500' : 
                          parseFloat(st.games.rating || '0') >= 6 ? 'text-yellow-500' : 'text-gray-400'
                        )}>
                          {st.games.rating || '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {/* Toplam satırı */}
                {filteredStats.length > 1 && (
                  <tr className="font-medium bg-gray-800/30">
                    <td className="py-3">Toplam</td>
                    <td className="py-3 text-center">{totals.games}</td>
                    <td className="py-3 text-center text-fb-yellow">{totals.goals}</td>
                    <td className="py-3 text-center">{totals.assists}</td>
                    <td className="py-3 text-center text-yellow-500">{totals.yellowCards}</td>
                    <td className="py-3 text-center text-red-500">{totals.redCards}</td>
                    <td className="py-3 text-center">
                      {totals.shotsTotal}/{totals.shotsOn} ({totals.shotsTotal > 0 ? ((totals.shotsOn / totals.shotsTotal) * 100).toFixed(0) : '-'}%)
                    </td>
                    <td className="py-3 text-center">
                      {totals.duelsTotal}/{totals.duelsWon} ({totals.duelsTotal > 0 ? ((totals.duelsWon / totals.duelsTotal) * 100).toFixed(0) : '-'}%)
                    </td>
                    <td className="py-3 text-center text-fb-yellow">{avgRating.toFixed(1)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Son 10 Maç */}
      <div className="card p-4">
        <h3 className="section-title text-lg mb-4">SON 10 MAÇ</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="pb-3">Tarih</th>
                <th className="pb-3">Maç</th>
                <th className="pb-3 text-center">Skor</th>
              </tr>
            </thead>
            <tbody>
              {finishedFixtures.map((fixture) => {
                const { date } = formatMatchDateTime(fixture.fixture.date);
                const isFBHome = fixture.teams.home.id === FENERBAHCE_TEAM_ID;
                const opponent = isFBHome ? fixture.teams.away : fixture.teams.home;
                const fbWon = isFBHome 
                  ? (fixture.goals.home || 0) > (fixture.goals.away || 0)
                  : (fixture.goals.away || 0) > (fixture.goals.home || 0);
                const fbLost = isFBHome 
                  ? (fixture.goals.home || 0) < (fixture.goals.away || 0)
                  : (fixture.goals.away || 0) < (fixture.goals.home || 0);
                
                return (
                  <tr key={fixture.fixture.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-3 text-gray-400">{date}</td>
                    <td className="py-3">
                      <Link 
                        href={ROUTES.MATCH_DETAIL(fixture.fixture.id)}
                        className="flex items-center gap-2 hover:text-fb-yellow"
                      >
                        <span className="text-gray-500">{isFBHome ? 'vs' : '@'}</span>
                        <Image src={opponent.logo} alt="" width={20} height={20} />
                        {opponent.name}
                      </Link>
                    </td>
                    <td className="py-3 text-center font-display">
                      <span className={cn(
                        fbWon && 'text-green-500',
                        fbLost && 'text-red-500'
                      )}>
                        {fixture.goals.home} - {fixture.goals.away}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {finishedFixtures.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500">
                    Bu sezon için maç verisi bulunamadı
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* No Stats Message */}
      {filteredStats.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-gray-400 mb-4">Bu sezon için Fenerbahçe istatistiği bulunamadı.</p>
          <p className="text-sm text-gray-500">Farklı bir sezon seçmeyi deneyin.</p>
        </div>
      )}
    </div>
  );
}
