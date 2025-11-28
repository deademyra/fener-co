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
      <div className="flex gap-1 bg-gray-900/80 border border-gray-800 rounded-xl p-1">
        {visibleTabs.map(tab => (
          <Link
            key={tab.id}
            href={`/maclar/${fixtureId}?tab=${tab.id}`}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium text-center rounded-lg transition-all duration-200',
              activeTab === tab.id
                ? 'bg-fb-navy text-fb-yellow shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
