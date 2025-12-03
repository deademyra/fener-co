// Round Tabs Component
// Fenerbahçe Stats - FENER.CO

'use client';

import { useRouter } from 'next/navigation';
import { RoundInfo, StageCategory } from '@/types/api-football';
import { getStageCategoryDisplay } from '@/lib/utils/round-utils';
import { ChevronRight } from 'lucide-react';

interface RoundTabsProps {
  groupedRounds: Map<StageCategory, RoundInfo[]>;
  leagueId: number;
  selectedRound: string | null;
  baseUrl: string;
}

// Category order for display
const CATEGORY_ORDER: StageCategory[] = [
  'qualifying',
  'league_phase',
  'group_stage',
  'knockout',
  'final'
];

// Category colors
const CATEGORY_COLORS: Record<StageCategory, string> = {
  qualifying: 'from-slate-600 to-slate-700',
  league_phase: 'from-blue-600 to-blue-700',
  group_stage: 'from-purple-600 to-purple-700',
  knockout: 'from-amber-600 to-amber-700',
  final: 'from-yellow-500 to-yellow-600',
};

const CATEGORY_ACTIVE_COLORS: Record<StageCategory, string> = {
  qualifying: 'bg-slate-500/20 border-slate-500 text-slate-300',
  league_phase: 'bg-blue-500/20 border-blue-500 text-blue-300',
  group_stage: 'bg-purple-500/20 border-purple-500 text-purple-300',
  knockout: 'bg-amber-500/20 border-amber-500 text-amber-300',
  final: 'bg-yellow-500/20 border-yellow-500 text-yellow-300',
};

export function RoundTabs({
  groupedRounds,
  leagueId,
  selectedRound,
  baseUrl,
}: RoundTabsProps) {
  const router = useRouter();
  
  // Get sorted categories
  const sortedCategories = CATEGORY_ORDER.filter(cat => groupedRounds.has(cat));
  
  // Determine selected category
  const selectedCategory = selectedRound 
    ? Array.from(groupedRounds.entries()).find(
        ([_, rounds]) => rounds.some(r => r.round === selectedRound)
      )?.[0] || null
    : null;

  const handleCategoryClick = (category: StageCategory) => {
    const rounds = groupedRounds.get(category);
    if (rounds && rounds.length > 0) {
      const firstRound = rounds[0].round;
      router.push(`${baseUrl}&tur=${encodeURIComponent(firstRound)}`);
    }
  };

  const handleRoundClick = (round: string) => {
    router.push(`${baseUrl}&tur=${encodeURIComponent(round)}`);
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {sortedCategories.map(category => {
          const rounds = groupedRounds.get(category) || [];
          const isActive = selectedCategory === category;
          
          return (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`px-4 py-2 rounded-lg border transition-all text-sm font-medium
                         ${isActive 
                           ? CATEGORY_ACTIVE_COLORS[category]
                           : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50 hover:text-white'
                         }`}
            >
              {getStageCategoryDisplay(category, 'tr')}
              <span className="ml-2 text-xs opacity-60">({rounds.length})</span>
            </button>
          );
        })}
      </div>
      
      {/* Round Pills (for selected category) */}
      {selectedCategory && (
        <div className="flex flex-wrap gap-2 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
          {groupedRounds.get(selectedCategory)?.map(round => (
            <button
              key={round.round}
              onClick={() => handleRoundClick(round.round)}
              className={`px-3 py-1.5 rounded-md text-sm transition-all
                         ${selectedRound === round.round
                           ? 'bg-yellow-500 text-slate-900 font-medium'
                           : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                         }`}
            >
              {round.displayNameTr}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Horizontal scrollable version
export function RoundTabsScrollable({
  groupedRounds,
  leagueId,
  selectedRound,
  baseUrl,
}: RoundTabsProps) {
  const router = useRouter();
  
  // Flatten all rounds
  const allRounds: RoundInfo[] = [];
  CATEGORY_ORDER.forEach(category => {
    const rounds = groupedRounds.get(category);
    if (rounds) {
      allRounds.push(...rounds);
    }
  });

  const handleRoundClick = (round: string) => {
    router.push(`${baseUrl}&tur=${encodeURIComponent(round)}`);
  };

  return (
    <div className="relative">
      {/* Gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />
      
      {/* Scrollable container */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 p-4">
          {allRounds.map(round => (
            <button
              key={round.round}
              onClick={() => handleRoundClick(round.round)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm transition-all flex-shrink-0
                         ${selectedRound === round.round
                           ? 'bg-yellow-500 text-slate-900 font-medium'
                           : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                         }`}
            >
              {round.displayNameTr}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Compact dropdown version
export function RoundTabsDropdown({
  groupedRounds,
  leagueId,
  selectedRound,
  baseUrl,
}: RoundTabsProps) {
  const router = useRouter();
  
  // Flatten all rounds with category info
  const allRoundsWithCategory: Array<{ round: RoundInfo; category: StageCategory }> = [];
  CATEGORY_ORDER.forEach(category => {
    const rounds = groupedRounds.get(category);
    if (rounds) {
      rounds.forEach(round => {
        allRoundsWithCategory.push({ round, category });
      });
    }
  });

  const handleChange = (round: string) => {
    router.push(`${baseUrl}&tur=${encodeURIComponent(round)}`);
  };

  const selectedRoundInfo = allRoundsWithCategory.find(r => r.round.round === selectedRound);

  return (
    <div className="relative">
      <select
        value={selectedRound || ''}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full md:w-auto px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                   text-white appearance-none cursor-pointer pr-10
                   focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
      >
        {CATEGORY_ORDER.map(category => {
          const rounds = groupedRounds.get(category);
          if (!rounds || rounds.length === 0) return null;
          
          return (
            <optgroup key={category} label={getStageCategoryDisplay(category, 'tr')}>
              {rounds.map(round => (
                <option key={round.round} value={round.round}>
                  {round.displayNameTr}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
      
      {/* Custom arrow */}
      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
    </div>
  );
}
