import { Suspense } from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { 
  LiveScoreHero, 
  MatchCard,
  LoadingCard 
} from '@/components';
import { 
  checkFenerbahceLiveMatch, 
  getCachedTodayFixtures,
  fixtureToMatchCard 
} from '@/lib/api';
import { TRACKED_LEAGUE_IDS, TRANSLATIONS, ROUTES } from '@/lib/constants';
import { cn, isLive, formatMatchDateTime } from '@/lib/utils';
import { Fixture } from '@/types';

export const metadata: Metadata = {
  title: 'Canlı Skorlar',
  description: 'Fenerbahçe ve Süper Lig canlı maç skorları',
};

// Revalidate every 15 seconds for live data
export const revalidate = 15;

async function LiveMatchSection() {
  const liveData = await checkFenerbahceLiveMatch();
  
  if (!liveData.hasLiveMatch && liveData.otherTrackedMatches.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="text-6xl mb-4">⚽</div>
        <h2 className="font-display text-2xl text-white mb-2">Şu An Canlı Maç Yok</h2>
        <p className="text-gray-400">
          Takip edilen turnuvalarda devam eden maç bulunmuyor.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Fenerbahçe maçı varsa hero olarak göster */}
      {liveData.fenerbahceMatch && (
        <div>
          <h2 className="section-title mb-4">
            <span className="w-2 h-2 bg-live rounded-full inline-block mr-2 animate-pulse-live" />
            FENERBAHÇE CANLI
          </h2>
          <LiveScoreHero matches={[]} liveMatch={liveData.fenerbahceMatch} />
        </div>
      )}
      
      {/* Diğer canlı maçlar */}
      {liveData.otherTrackedMatches.length > 0 && (
        <div>
          <h2 className="section-title mb-4">DİĞER CANLI MAÇLAR</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveData.otherTrackedMatches.map(fixture => (
              <MatchCard 
                key={fixture.fixture.id}
                match={fixtureToMatchCard(fixture)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

async function TodayMatchesSection() {
  const todayFixtures = await getCachedTodayFixtures();
  
  // Takip edilen liglerdeki maçlar
  const trackedFixtures = todayFixtures.filter(f => 
    TRACKED_LEAGUE_IDS.includes(f.league.id)
  );
  
  // Canlı olmayan, bugünkü maçlar
  const upcomingToday = trackedFixtures.filter(f => 
    !isLive(f.fixture.status.short) && f.fixture.status.short === 'NS'
  ).sort((a, b) => 
    new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
  );
  
  // Bugün biten maçlar
  const finishedToday = trackedFixtures.filter(f => 
    ['FT', 'AET', 'PEN'].includes(f.fixture.status.short)
  ).sort((a, b) => 
    new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
  );
  
  if (upcomingToday.length === 0 && finishedToday.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-6">
      {upcomingToday.length > 0 && (
        <div>
          <h2 className="section-title mb-4">BUGÜN OYNANACAK</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingToday.map(fixture => (
              <MatchCard 
                key={fixture.fixture.id}
                match={fixtureToMatchCard(fixture)}
              />
            ))}
          </div>
        </div>
      )}
      
      {finishedToday.length > 0 && (
        <div>
          <h2 className="section-title mb-4">BUGÜN BİTEN MAÇLAR</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {finishedToday.map(fixture => (
              <MatchCard 
                key={fixture.fixture.id}
                match={fixtureToMatchCard(fixture)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function LivePage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-white mb-2">
            <span className="text-fb-yellow">CANLI</span> SKORLAR
          </h1>
          <p className="text-gray-400">
            Anlık maç sonuçları ve günün maçları
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Her 15 saniyede güncellenir
        </div>
      </div>
      
      {/* Live Matches */}
      <Suspense fallback={<LoadingCard />}>
        <LiveMatchSection />
      </Suspense>
      
      {/* Today's Matches */}
      <Suspense fallback={<LoadingCard />}>
        <TodayMatchesSection />
      </Suspense>
    </div>
  );
}
