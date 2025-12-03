'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MatchDetailTabsProps {
  activeTab: string;
  fixtureId: number;
  hasLineups: boolean;
  hasPlayerStats: boolean;
}

const tabs = [
  { id: 'macdetay', label: 'Maç Detay', alwaysShow: true },
  { id: 'kadro-dizilis', label: 'Kadro / Diziliş', requiresLineups: true },
  { id: 'futbolcu-istatistik', label: 'Futbolcu İstatistik', requiresPlayerStats: true },
];

export function MatchDetailTabs({ 
  activeTab, 
  fixtureId, 
  hasLineups, 
  hasPlayerStats 
}: MatchDetailTabsProps) {
  const visibleTabs = tabs.filter(tab => {
    if (tab.alwaysShow) return true;
    if (tab.requiresLineups && !hasLineups) return false;
    if (tab.requiresPlayerStats && !hasPlayerStats) return false;
    return true;
  });
  
  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
        {visibleTabs.map(tab => (
          <Link
            key={tab.id}
            href={`/maclar/${fixtureId}?tab=${tab.id}`}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all text-center',
              activeTab === tab.id
                ? 'bg-yellow-500 text-slate-900'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
