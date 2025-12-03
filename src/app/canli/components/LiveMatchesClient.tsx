'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LiveScoreHero, MatchCard, LoadingCard } from '@/components';
import { ROUTES, TRANSLATIONS } from '@/lib/constants';
import { cn, formatMatchDateTime, getStatusText } from '@/lib/utils';
import { Fixture, MatchCardData } from '@/types';

// Polling interval - 15 saniye
const POLLING_INTERVAL = 15000;

interface LiveDataResponse {
  success: boolean;
  timestamp: string;
  data: {
    hasLiveMatch: boolean;
    fenerbahceMatch: Fixture | null;
    otherLiveMatches: MatchCardData[];
    upcomingToday: MatchCardData[];
    finishedToday: MatchCardData[];
  };
}

// ============================================
// LIVE STATUS INDICATOR
// ============================================
function LiveStatusIndicator({ 
  lastUpdate, 
  isLoading,
  hasError 
}: { 
  lastUpdate: Date | null;
  isLoading: boolean;
  hasError: boolean;
}) {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    if (!lastUpdate) return;
    
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdate.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  return (
    <div className="flex items-center gap-2 text-sm">
      {hasError ? (
        <>
          <span className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-red-400">Bağlantı hatası</span>
        </>
      ) : isLoading ? (
        <>
          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span className="text-yellow-400">Güncelleniyor...</span>
        </>
      ) : (
        <>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-gray-400">
            {secondsAgo < 5 ? 'Az önce güncellendi' : `${secondsAgo}s önce güncellendi`}
          </span>
        </>
      )}
    </div>
  );
}

// ============================================
// FENERBAHÇE LIVE HERO (Client Version)
// ============================================
function FenerbahceLiveHero({ match }: { match: Fixture }) {
  const isFBHome = match.teams.home.id === 611;
  const leagueName = TRANSLATIONS.leagues[match.league.id as keyof typeof TRANSLATIONS.leagues] || match.league.name;
  
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-fb-navy via-slate-800 to-slate-900 p-6 md:p-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Live Badge */}
      <div className="absolute top-4 right-4 z-10">
        <span className="badge badge-live text-sm px-3 py-1">
          <span className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse" />
          CANLI
        </span>
      </div>

      <Link href={ROUTES.MATCH_DETAIL(match.fixture.id)} className="block relative z-10">
        {/* League & Status */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Image
              src={match.league.logo}
              alt={leagueName}
              width={24}
              height={24}
              className="object-contain"
            />
            <span className="text-fb-yellow font-medium">{leagueName}</span>
          </div>
          <p className="text-lg font-bold text-white">
            {getStatusText(match.fixture.status.short, match.fixture.status.elapsed)}
          </p>
        </div>

        {/* Teams & Score */}
        <div className="flex items-center justify-center gap-4 md:gap-8 lg:gap-16 mb-6">
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center">
            <div className={cn(
              'w-20 h-20 md:w-28 md:h-28 rounded-full bg-white/10 p-3 md:p-4 mb-3',
              'hover:scale-105 transition-transform',
              isFBHome && 'ring-2 ring-fb-yellow/30'
            )}>
              <Image
                src={match.teams.home.logo}
                alt={match.teams.home.name}
                width={96}
                height={96}
                className="object-contain w-full h-full"
              />
            </div>
            <h3 className={cn(
              'font-bold text-lg md:text-xl text-center',
              isFBHome ? 'text-fb-yellow' : 'text-white'
            )}>
              {match.teams.home.name}
            </h3>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center shrink-0">
            <div className="flex items-center gap-3 md:gap-4">
              <span className={cn(
                'text-4xl md:text-6xl font-bold',
                isFBHome ? 'text-fb-yellow' : 'text-white'
              )}>
                {match.goals.home ?? 0}
              </span>
              <span className="text-2xl md:text-3xl text-gray-500">-</span>
              <span className={cn(
                'text-4xl md:text-6xl font-bold',
                !isFBHome ? 'text-fb-yellow' : 'text-white'
              )}>
                {match.goals.away ?? 0}
              </span>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center">
            <div className={cn(
              'w-20 h-20 md:w-28 md:h-28 rounded-full bg-white/10 p-3 md:p-4 mb-3',
              'hover:scale-105 transition-transform',
              !isFBHome && 'ring-2 ring-fb-yellow/30'
            )}>
              <Image
                src={match.teams.away.logo}
                alt={match.teams.away.name}
                width={96}
                height={96}
                className="object-contain w-full h-full"
              />
            </div>
            <h3 className={cn(
              'font-bold text-lg md:text-xl text-center',
              !isFBHome ? 'text-fb-yellow' : 'text-white'
            )}>
              {match.teams.away.name}
            </h3>
          </div>
        </div>

        {/* Venue */}
        {match.fixture.venue?.name && (
          <div className="text-center text-sm text-gray-400">
            🏟️ {match.fixture.venue.name}
          </div>
        )}
      </Link>
    </div>
  );
}

// ============================================
// MAIN CLIENT COMPONENT
// ============================================
export default function LiveMatchesClient() {
  const [data, setData] = useState<LiveDataResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchLiveData = useCallback(async () => {
    try {
      const response = await fetch('/api/live', {
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const result: LiveDataResponse = await response.json();
      
      if (result.success) {
        setData(result.data);
        setLastUpdate(new Date());
        setHasError(false);
      } else {
        throw new Error('API returned error');
      }
    } catch (error) {
      console.error('Error fetching live data:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // İlk yükleme ve polling
  useEffect(() => {
    // İlk veriyi hemen çek
    fetchLiveData();

    // Polling başlat
    const interval = setInterval(fetchLiveData, POLLING_INTERVAL);

    // Cleanup
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  // Sayfa görünürlüğüne göre polling'i optimize et
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Sayfa tekrar görünür olduğunda hemen güncelle
        fetchLiveData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchLiveData]);

  // İlk yükleme
  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <LoadingCard />
        <LoadingCard />
      </div>
    );
  }

  // Veri yoksa
  if (!data) {
    return (
      <div className="card p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="font-bold text-2xl text-white mb-2">Veri Yüklenemedi</h2>
        <p className="text-gray-400 mb-4">
          Canlı skor verileri alınamadı.
        </p>
        <button 
          onClick={fetchLiveData}
          className="btn-primary px-6 py-2"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  const { hasLiveMatch, fenerbahceMatch, otherLiveMatches, upcomingToday, finishedToday } = data;

  return (
    <div className="space-y-8">
      {/* Status Indicator */}
      <div className="flex justify-end">
        <LiveStatusIndicator 
          lastUpdate={lastUpdate} 
          isLoading={isLoading} 
          hasError={hasError}
        />
      </div>

      {/* Canlı Maç Yok */}
      {!hasLiveMatch && otherLiveMatches.length === 0 && (
        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">⚽</div>
          <h2 className="font-bold text-2xl text-white mb-2">Şu An Canlı Maç Yok</h2>
          <p className="text-gray-400">
            Takip edilen turnuvalarda devam eden maç bulunmuyor.
          </p>
        </div>
      )}

      {/* Fenerbahçe Canlı Maçı */}
      {fenerbahceMatch && (
        <div>
          <h2 className="section-title mb-4">
            <span className="w-2 h-2 bg-live rounded-full inline-block mr-2 animate-pulse-live" />
            FENERBAHÇE CANLI
          </h2>
          <FenerbahceLiveHero match={fenerbahceMatch} />
        </div>
      )}

      {/* Diğer Canlı Maçlar */}
      {otherLiveMatches.length > 0 && (
        <div>
          <h2 className="section-title mb-4">DİĞER CANLI MAÇLAR</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherLiveMatches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {/* Bugün Oynanacak Maçlar */}
      {upcomingToday.length > 0 && (
        <div>
          <h2 className="section-title mb-4">BUGÜN OYNANACAK</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingToday.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {/* Bugün Biten Maçlar */}
      {finishedToday.length > 0 && (
        <div>
          <h2 className="section-title mb-4">BUGÜN BİTEN MAÇLAR</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {finishedToday.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
