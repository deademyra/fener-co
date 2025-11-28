'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FixtureList, LoadingSpinner } from '@/components';
import { cn, formatDate } from '@/lib/utils';
import { Fixture } from '@/types';
import { FENERBAHCE_TEAM_ID, TRANSLATIONS } from '@/lib/constants';

// =============================================
// CONSTANTS
// =============================================

// League priority order for sorting filters
const LEAGUE_PRIORITY_ORDER = [203, 2, 3, 848, 206, 551, 667];

// Tab definitions
const TABS = [
  { id: 'tum-maclar', label: 'Tüm Maçlar' },
  { id: 'oynanan', label: 'Mevcut Sezon Oynanan' },
  { id: 'fikstur', label: 'Mevcut Sezon Fikstür' },
];

// Result filter options
const RESULT_OPTIONS = [
  { id: 'all', label: 'Tümü' },
  { id: 'win', label: 'Galibiyet' },
  { id: 'draw', label: 'Beraberlik' },
  { id: 'loss', label: 'Mağlubiyet' },
];

// Venue filter options
const VENUE_OPTIONS = [
  { id: 'all', label: 'Tümü' },
  { id: 'home', label: 'Ev' },
  { id: 'away', label: 'Deplasman' },
];

// =============================================
// UTILITY FUNCTIONS
// =============================================

// Get Fenerbahçe result from fixture
function getFenerbahceResult(fixture: Fixture): 'win' | 'draw' | 'loss' | null {
  const isFBHome = fixture.teams.home.id === FENERBAHCE_TEAM_ID;
  const isFBAway = fixture.teams.away.id === FENERBAHCE_TEAM_ID;
  
  if (!isFBHome && !isFBAway) return null;
  if (fixture.goals.home === null || fixture.goals.away === null) return null;
  
  const fbScore = isFBHome ? fixture.goals.home : fixture.goals.away;
  const opponentScore = isFBHome ? fixture.goals.away : fixture.goals.home;
  
  if (fbScore > opponentScore) return 'win';
  if (fbScore < opponentScore) return 'loss';
  return 'draw';
}

// Get venue for Fenerbahçe
function getFenerbahceVenue(fixture: Fixture): 'home' | 'away' | null {
  if (fixture.teams.home.id === FENERBAHCE_TEAM_ID) return 'home';
  if (fixture.teams.away.id === FENERBAHCE_TEAM_ID) return 'away';
  return null;
}

// Sort leagues by priority order
function sortLeaguesByPriority(leagues: { id: number; name: string; logo: string }[]) {
  return [...leagues].sort((a, b) => {
    const indexA = LEAGUE_PRIORITY_ORDER.indexOf(a.id);
    const indexB = LEAGUE_PRIORITY_ORDER.indexOf(b.id);
    
    // If both are in priority list, sort by priority
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    // If only a is in priority list, a comes first
    if (indexA !== -1) return -1;
    // If only b is in priority list, b comes first
    if (indexB !== -1) return 1;
    // Otherwise sort alphabetically
    return a.name.localeCompare(b.name);
  });
}

// Get unique months from fixtures (sorted chronologically - oldest to newest)
function getMonthsFromFixtures(fixtures: Fixture[]): string[] {
  const months = new Set<string>();
  fixtures.forEach(f => {
    const monthKey = formatDate(f.fixture.date, 'yyyy-MM'); // For sorting
    months.add(monthKey);
  });
  return Array.from(months).sort(); // Chronological order
}

// Format month key to display label
function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return formatDate(date.toISOString(), 'MMMM yyyy');
}

// Get available seasons from fixtures
function getSeasonsFromFixtures(fixtures: Fixture[]): number[] {
  const seasons = new Set<number>();
  fixtures.forEach(f => {
    seasons.add(f.league.season);
  });
  return Array.from(seasons).sort((a, b) => b - a); // Newest first
}

// =============================================
// FILTER COMPONENTS
// =============================================

interface ToggleFilterProps {
  options: { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}

function ToggleFilter({ options, value, onChange, label }: ToggleFilterProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
        {options.map(option => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-all',
              value === option.id
                ? 'bg-fb-navy text-fb-yellow font-medium'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface SelectFilterProps {
  options: { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  showAllOption?: boolean;
}

function SelectFilter({ options, value, onChange, label, placeholder = 'Seçiniz', showAllOption = true }: SelectFilterProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-fb-yellow/50 focus:border-fb-yellow"
      >
        {showAllOption && <option value="all">{placeholder}</option>}
        {options.map(option => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface LeagueFilterProps {
  leagues: { id: number; name: string; logo: string }[];
  value: string;
  onChange: (value: string) => void;
}

function LeagueFilter({ leagues, value, onChange }: LeagueFilterProps) {
  const sortedLeagues = sortLeaguesByPriority(leagues);
  
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-gray-500 uppercase tracking-wider">Turnuva</span>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onChange('all')}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors',
            value === 'all'
              ? 'bg-fb-navy text-fb-yellow'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          )}
        >
          Tümü
        </button>
        {sortedLeagues.map(league => {
          const leagueName = TRANSLATIONS.leagues[league.id as keyof typeof TRANSLATIONS.leagues] || league.name;
          const isActive = value === String(league.id);
          
          return (
            <button
              key={league.id}
              onClick={() => onChange(isActive ? 'all' : String(league.id))}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors',
                isActive
                  ? 'bg-fb-navy text-fb-yellow'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
            >
              <Image 
                src={league.logo} 
                alt="" 
                width={16} 
                height={16} 
                className="dark-logo-filter"
              />
              {leagueName}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =============================================
// MAIN PAGE COMPONENT
// =============================================

export default function MatchesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // State
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [allFixtures, setAllFixtures] = useState<Fixture[]>([]); // For "Tüm Maçlar" tab - all seasons
  const [loading, setLoading] = useState(true);
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
  
  // Get current season (November onwards = next year's season)
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const defaultSeason = currentMonth >= 8 ? currentYear : currentYear - 1;
  
  // Filter states from URL
  const activeTab = searchParams.get('tab') || 'tum-maclar';
  const leagueFilter = searchParams.get('league') || 'all';
  const seasonFilter = searchParams.get('season') || String(defaultSeason);
  const monthFilter = searchParams.get('month') || 'all';
  const resultFilter = searchParams.get('result') || 'all';
  const venueFilter = searchParams.get('venue') || 'all';
  
  // Update URL with filters
  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === 'all' || value === String(defaultSeason)) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`/maclar?${params.toString()}`, { scroll: false });
  };
  
  // Fetch fixtures
  useEffect(() => {
    async function fetchFixtures() {
      setLoading(true);
      try {
        // Fetch current season fixtures
        const response = await fetch(`/api/fixtures?season=${defaultSeason}`);
        const data = await response.json();
        setFixtures(data.fixtures || []);
        
        // For "Tüm Maçlar" tab, we might need multiple seasons
        // For now, we'll use the same fixtures but allow season filter
        setAllFixtures(data.fixtures || []);
        
        // Get available seasons from team's history
        const seasonsResponse = await fetch(`/api/fixtures/seasons`);
        if (seasonsResponse.ok) {
          const seasonsData = await seasonsResponse.json();
          setAvailableSeasons(seasonsData.seasons || [defaultSeason]);
        } else {
          setAvailableSeasons([defaultSeason]);
        }
      } catch (error) {
        console.error('Failed to fetch fixtures:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchFixtures();
  }, [defaultSeason]);
  
  // Fetch fixtures for selected season (for "Tüm Maçlar" tab)
  useEffect(() => {
    async function fetchSeasonFixtures() {
      if (activeTab !== 'tum-maclar') return;
      if (seasonFilter === String(defaultSeason)) {
        setAllFixtures(fixtures);
        return;
      }
      
      try {
        const response = await fetch(`/api/fixtures?season=${seasonFilter}`);
        const data = await response.json();
        setAllFixtures(data.fixtures || []);
      } catch (error) {
        console.error('Failed to fetch season fixtures:', error);
      }
    }
    
    fetchSeasonFixtures();
  }, [activeTab, seasonFilter, fixtures, defaultSeason]);
  
  // Get unique leagues from fixtures
  const leagues = useMemo(() => {
    const sourceFixtures = activeTab === 'tum-maclar' ? allFixtures : fixtures;
    return [...new Map(sourceFixtures.map(f => [f.league.id, f.league])).values()];
  }, [fixtures, allFixtures, activeTab]);
  
  // Filter and process fixtures based on active tab and filters
  const processedFixtures = useMemo(() => {
    let sourceFixtures = activeTab === 'tum-maclar' ? allFixtures : fixtures;
    
    // Tab-specific filtering
    if (activeTab === 'oynanan') {
      // Only finished matches
      sourceFixtures = sourceFixtures.filter(f => 
        ['FT', 'AET', 'PEN'].includes(f.fixture.status.short)
      );
    } else if (activeTab === 'fikstur') {
      // Only upcoming matches
      sourceFixtures = sourceFixtures.filter(f => 
        ['NS', 'TBD', 'PST'].includes(f.fixture.status.short)
      );
    }
    
    // Apply filters
    let filtered = [...sourceFixtures];
    
    // League filter
    if (leagueFilter !== 'all') {
      filtered = filtered.filter(f => f.league.id === parseInt(leagueFilter));
    }
    
    // Month filter
    if (monthFilter !== 'all') {
      filtered = filtered.filter(f => {
        const monthKey = formatDate(f.fixture.date, 'yyyy-MM');
        return monthKey === monthFilter;
      });
    }
    
    // Result filter (only for finished matches)
    if (resultFilter !== 'all') {
      filtered = filtered.filter(f => {
        const result = getFenerbahceResult(f);
        return result === resultFilter;
      });
    }
    
    // Venue filter
    if (venueFilter !== 'all') {
      filtered = filtered.filter(f => {
        const venue = getFenerbahceVenue(f);
        return venue === venueFilter;
      });
    }
    
    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.fixture.date).getTime();
      const dateB = new Date(b.fixture.date).getTime();
      
      // For results, show newest first
      if (activeTab === 'oynanan') {
        return dateB - dateA;
      }
      // For fixtures and all matches, show oldest first (chronological)
      return dateA - dateB;
    });
    
    return filtered;
  }, [fixtures, allFixtures, activeTab, leagueFilter, monthFilter, resultFilter, venueFilter]);
  
  // Get available months for the month filter
  const availableMonths = useMemo(() => {
    let sourceFixtures = activeTab === 'tum-maclar' ? allFixtures : fixtures;
    
    // Apply tab-specific filtering first
    if (activeTab === 'oynanan') {
      sourceFixtures = sourceFixtures.filter(f => 
        ['FT', 'AET', 'PEN'].includes(f.fixture.status.short)
      );
    } else if (activeTab === 'fikstur') {
      sourceFixtures = sourceFixtures.filter(f => 
        ['NS', 'TBD', 'PST'].includes(f.fixture.status.short)
      );
    }
    
    // Apply league filter if set
    if (leagueFilter !== 'all') {
      sourceFixtures = sourceFixtures.filter(f => f.league.id === parseInt(leagueFilter));
    }
    
    return getMonthsFromFixtures(sourceFixtures);
  }, [fixtures, allFixtures, activeTab, leagueFilter]);
  
  // Group fixtures by month for display
  const groupedByMonth = useMemo(() => {
    return processedFixtures.reduce((acc, fixture) => {
      const monthKey = formatDate(fixture.fixture.date, 'MMMM yyyy');
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(fixture);
      return acc;
    }, {} as Record<string, Fixture[]>);
  }, [processedFixtures]);
  
  // Reset filters when tab changes
  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams();
    params.set('tab', newTab);
    router.push(`/maclar?${params.toString()}`, { scroll: false });
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl text-white mb-2">
          <span className="text-fb-yellow">FENERBAHÇE</span> MAÇLARI
        </h1>
        <p className="text-gray-400">
          {activeTab === 'tum-maclar' 
            ? `${seasonFilter}-${parseInt(seasonFilter) + 1} Sezonu`
            : `${defaultSeason}-${defaultSeason + 1} Sezonu`
          }
        </p>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={cn(
              'tab whitespace-nowrap',
              activeTab === t.id && 'tab-active'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      
      {/* Filters */}
      <div className="card p-4 mb-6 space-y-4">
        {/* League Filter - All tabs */}
        <LeagueFilter
          leagues={leagues}
          value={leagueFilter}
          onChange={(value) => updateFilters({ league: value })}
        />
        
        {/* Tab-specific filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Season Filter - Only for "Tüm Maçlar" tab */}
          {activeTab === 'tum-maclar' && (
            <SelectFilter
              label="Sezon"
              options={availableSeasons.map(s => ({ 
                id: String(s), 
                label: `${s}-${s + 1}` 
              }))}
              value={seasonFilter}
              onChange={(value) => updateFilters({ season: value })}
              showAllOption={false}
            />
          )}
          
          {/* Month Filter - All tabs */}
          <SelectFilter
            label="Ay"
            options={availableMonths.map(m => ({ 
              id: m, 
              label: formatMonthLabel(m) 
            }))}
            value={monthFilter}
            onChange={(value) => updateFilters({ month: value })}
            placeholder="Tüm Aylar"
          />
          
          {/* Result Filter - Only for tabs with finished matches */}
          {(activeTab === 'tum-maclar' || activeTab === 'oynanan') && (
            <ToggleFilter
              label="Sonuç"
              options={RESULT_OPTIONS}
              value={resultFilter}
              onChange={(value) => updateFilters({ result: value })}
            />
          )}
          
          {/* Venue Filter - All tabs */}
          <ToggleFilter
            label="Ev/Deplasman"
            options={VENUE_OPTIONS}
            value={venueFilter}
            onChange={(value) => updateFilters({ venue: value })}
          />
        </div>
        
        {/* Clear Filters */}
        {(leagueFilter !== 'all' || monthFilter !== 'all' || resultFilter !== 'all' || venueFilter !== 'all' || (activeTab === 'tum-maclar' && seasonFilter !== String(defaultSeason))) && (
          <button
            onClick={() => handleTabChange(activeTab)}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Filtreleri Temizle ×
          </button>
        )}
      </div>
      
      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : Object.keys(groupedByMonth).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedByMonth).map(([month, monthFixtures]) => (
            <div key={month}>
              <h3 className="text-lg font-display text-gray-400 mb-4 sticky top-16 bg-gray-950/90 backdrop-blur-sm py-2 z-10">
                {month}
                <span className="text-sm text-gray-600 ml-2">({monthFixtures.length} maç)</span>
              </h3>
              <FixtureList fixtures={monthFixtures} showLeague showDate />
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-gray-400">Bu kriterlere uygun maç bulunamadı</p>
        </div>
      )}
      
      {/* Stats Summary */}
      {!loading && processedFixtures.length > 0 && (
        <div className="mt-8 card p-4">
          <div className="flex flex-wrap gap-6 justify-center text-sm">
            <div className="text-center">
              <span className="text-2xl font-display text-white">{processedFixtures.length}</span>
              <p className="text-gray-500">Toplam Maç</p>
            </div>
            {(activeTab === 'tum-maclar' || activeTab === 'oynanan') && (
              <>
                <div className="text-center">
                  <span className="text-2xl font-display text-green-500">
                    {processedFixtures.filter(f => getFenerbahceResult(f) === 'win').length}
                  </span>
                  <p className="text-gray-500">Galibiyet</p>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-display text-amber-500">
                    {processedFixtures.filter(f => getFenerbahceResult(f) === 'draw').length}
                  </span>
                  <p className="text-gray-500">Beraberlik</p>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-display text-red-500">
                    {processedFixtures.filter(f => getFenerbahceResult(f) === 'loss').length}
                  </span>
                  <p className="text-gray-500">Mağlubiyet</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
